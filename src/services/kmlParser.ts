// src/services/kmlParser.ts

import { db } from '../db';
import type {
  IObservation,
  ITracklogPoint,
  ISettingsCustomField,
  // IProject, // <-- Removed unused import
} from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses KML <coordinates> string into geometry.
 */
const parseCoordinates = (coordsStr: string): IObservation['geometry'] => {
  const parts = coordsStr.trim().split(',');
  return {
    longitude: parseFloat(parts[0] || '0'),
    latitude: parseFloat(parts[1] || '0'),
    altitude: parts[2] ? parseFloat(parts[2]) : null,
    accuracy: 0,
  };
};

/**
 * Parses <ExtendedData> into core fields and custom fields.
 */
const parseExtendedData = (
  placemark: Element,
  settingsMap: Map<string, ISettingsCustomField>
): {
  coreFields: IObservation['coreFields'];
  customFieldValues: IObservation['customFieldValues'];
} => {
  const dataElements = Array.from(placemark.getElementsByTagName('Data'));
  const coreFields: IObservation['coreFields'] = { name: '', notes: '' };
  const customFieldValues: IObservation['customFieldValues'] = {};

  coreFields.name =
    placemark.getElementsByTagName('name')[0]?.textContent ||
    'Untitled Observation';

  for (const data of dataElements) {
    const name = data.getAttribute('name');
    const value = data.getElementsByTagName('value')[0]?.textContent || '';

    if (!name) continue;

    if (name === 'Notes') {
      coreFields.notes = value;
      continue;
    }

    let field = settingsMap.get(name);
    
    if (!field) {
      field = {
        id: uuidv4(),
        label: name,
        type: 'text',
      };
      settingsMap.set(name, field);
    }

    customFieldValues[field.id] = value;
  }

  return { coreFields, customFieldValues };
};

/**
 * Parses KML <Placemark> for a tracklog
 */
const parseTracklog = (
  placemark: Element,
  activeProjectId: number
): ITracklogPoint[] => {
  const coordsStr =
    placemark.getElementsByTagName('coordinates')[0]?.textContent || '';
  
  const points: ITracklogPoint[] = [];
  const coordsPairs = coordsStr.trim().split(/\s+/);

  for (const pair of coordsPairs) {
    const parts = pair.split(',');
    if (parts.length >= 2) {
      points.push({
        projectId: activeProjectId,
        longitude: parseFloat(parts[0]),
        latitude: parseFloat(parts[1]),
        timestamp: Date.now(),
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
  kmlText: string,
  activeProjectId: number
): Promise<{ obsCount: number; trackCount: number }> => {
  const parser = new DOMParser();
  const kml = parser.parseFromString(kmlText, 'application/xml');

  const placemarks = Array.from(kml.getElementsByTagName('Placemark'));
  const newObservations: IObservation[] = [];
  let newTracklogPoints: ITracklogPoint[] = [];

  const project = await db.projects.get(activeProjectId);
  if (!project) throw new Error('Active project not found.');

  const settingsMap = new Map<string, ISettingsCustomField>();
  project.customFields.forEach((field: ISettingsCustomField) => {
    settingsMap.set(field.label, field);
  });

  for (const placemark of placemarks) {
    const lineString = placemark.getElementsByTagName('LineString')[0];
    if (lineString) {
      newTracklogPoints.push(...parseTracklog(placemark, activeProjectId));
      continue;
    }

    const point = placemark.getElementsByTagName('Point')[0];
    if (point) {
      const coordsStr =
        point.getElementsByTagName('coordinates')[0]?.textContent || '';
      
      const { coreFields, customFieldValues } = parseExtendedData(
        placemark,
        settingsMap
      );
      
      newObservations.push({
        projectId: activeProjectId,
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
    db.projects,
    db.observations,
    db.tracklog,
    async () => {
      const newCustomFields = Array.from(settingsMap.values());
      await db.projects.update(activeProjectId, { customFields: newCustomFields });

      await db.observations.bulkAdd(newObservations);
      await db.tracklog.bulkAdd(newTracklogPoints);
    }
  );

  return {
    obsCount: newObservations.length,
    trackCount: newTracklogPoints.length,
  };
};