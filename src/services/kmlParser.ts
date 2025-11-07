// src/services/kmlParser.ts

import { db } from '../db';
import type { IObservation, ITracklogPoint, ISettingsCustomField } from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses KML <coordinates> string into geometry.
 * Format: lon,lat,alt
 */
const parseCoordinates = (coordsStr: string): IObservation['geometry'] => {
  const parts = coordsStr.trim().split(',');
  return {
    longitude: parseFloat(parts[0] || '0'),
    latitude: parseFloat(parts[1] || '0'),
    altitude: parts[2] ? parseFloat(parts[2]) : null,
    accuracy: 0, // KML doesn't store accuracy, so we default to 0
  };
};

/**
 * Parses <ExtendedData> into core fields and custom fields.
 * This implements the "Flexible Approach" (Option 2).
 */
const parseExtendedData = (
  placemark: Element,
  // We pass in the settingsMap to modify it directly
  settingsMap: Map<string, ISettingsCustomField>
): {
  coreFields: IObservation['coreFields'];
  customFieldValues: IObservation['customFieldValues'];
} => {
  const dataElements = Array.from(placemark.getElementsByTagName('Data'));
  const coreFields: IObservation['coreFields'] = { name: '', notes: '' };
  const customFieldValues: IObservation['customFieldValues'] = {};

  // Get observation name from the <name> tag
  coreFields.name =
    placemark.getElementsByTagName('name')[0]?.textContent ||
    'Untitled Observation';

  for (const data of dataElements) {
    const name = data.getAttribute('name');
    const value = data.getElementsByTagName('value')[0]?.textContent || '';

    if (!name) continue;

    // Check if this is a Core Field we exported
    if (name === 'Notes') {
      coreFields.notes = value;
      continue;
    }

    // --- This is the Flexible Import Logic ---
    let field = settingsMap.get(name);
    
    // If the field does NOT exist, create it
    if (!field) {
      field = {
        id: uuidv4(),
        label: name, // Use the KML 'name' as the new label
        type: 'text', // Default all imported fields to 'text'
      };
      settingsMap.set(name, field); // Add to map to be saved later
    }

    // Add the value to the observation
    customFieldValues[field.id] = value;
  }

  return { coreFields, customFieldValues };
};

/**
 * Parses KML <Placemark> for a tracklog
 */
const parseTracklog = (placemark: Element): ITracklogPoint[] => {
  const coordsStr =
    placemark.getElementsByTagName('coordinates')[0]?.textContent || '';
  
  const points: ITracklogPoint[] = [];
  const coordsPairs = coordsStr.trim().split(/\s+/); // Split by space

  for (const pair of coordsPairs) {
    const parts = pair.split(',');
    if (parts.length >= 2) {
      points.push({
        longitude: parseFloat(parts[0]),
        latitude: parseFloat(parts[1]),
        timestamp: Date.now(), // KML tracks don't have timestamps per-point
        accuracy: 0,
      });
    }
  }
  return points;
};

/**
 * Main import function
 */
export const parseKML = async (
  kmlText: string
): Promise<{ obsCount: number; trackCount: number }> => {
  const parser = new DOMParser();
  const kml = parser.parseFromString(kmlText, 'application/xml');

  const placemarks = Array.from(kml.getElementsByTagName('Placemark'));
  const newObservations: IObservation[] = [];
  let newTracklogPoints: ITracklogPoint[] = [];

  // Get current settings
  const settings = await db.settings.get(1);
  if (!settings) throw new Error('Settings not initialized.');

  // Create a map of existing fields by LABEL
  const settingsMap = new Map<string, ISettingsCustomField>();
  settings.customFields.forEach((field) => {
    settingsMap.set(field.label, field);
  });

  for (const placemark of placemarks) {
    // Check if it's a Tracklog (LineString)
    const lineString = placemark.getElementsByTagName('LineString')[0];
    if (lineString) {
      newTracklogPoints.push(...parseTracklog(placemark));
      continue;
    }

    // Check if it's an Observation (Point)
    const point = placemark.getElementsByTagName('Point')[0];
    if (point) {
      const coordsStr =
        point.getElementsByTagName('coordinates')[0]?.textContent || '';
      
      const { coreFields, customFieldValues } = parseExtendedData(
        placemark,
        settingsMap
      );
      
      newObservations.push({
        geometry: parseCoordinates(coordsStr),
        coreFields,
        customFieldValues,
        createdAt:
          new Date(
            placemark.getElementsByTagName('timestamp')[0]?.textContent ||
              Date.now()
          ),
      });
    }
  }

  // --- Save Everything in a Transaction ---
  await db.transaction(
    'rw',
    db.settings,
    db.observations,
    db.tracklog,
    async () => {
      // 1. Save any new/updated settings
      const newCustomFields = Array.from(settingsMap.values());
      await db.settings.update(1, { customFields: newCustomFields });

      // 2. Save new observations
      await db.observations.bulkAdd(newObservations);
      
      // 3. Save new tracklog points
      await db.tracklog.bulkAdd(newTracklogPoints);
    }
  );

  return {
    obsCount: newObservations.length,
    trackCount: newTracklogPoints.length,
  };
};