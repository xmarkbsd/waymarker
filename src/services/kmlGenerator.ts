// src/services/kmlGenerator.ts

import { db } from '../db';
import type { IObservation, ITracklogPoint } from '../db';

/**
 * Escapes special XML characters
 */
const escapeXml = (unsafe: string): string => {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

/**
 * Generates the KML <Placemark> for a single observation
 */
const createObservationPlacemark = (obs: IObservation): string => {
  let extendedData = '';

  // Add all custom fields to ExtendedData
  for (const [key, value] of Object.entries(obs.customFieldValues)) {
    // We need to fetch the *label* for the key
    // NOTE: This is a simplification. For a true export, we should
    // fetch settings and use the field *label* (e.g., "Species")
    // instead of the *id* (e.g., "field_2").
    // For now, we use the key and assume the importer (Option 2)
    // will handle it.
    extendedData += `
      <Data name="${escapeXml(key)}">
        <value>${escapeXml(String(value))}</value>
      </Data>`;
  }

  // Add core fields to ExtendedData as well for easy import
  extendedData += `
    <Data name="Notes">
      <value>${escapeXml(obs.coreFields.notes)}</value>
    </Data>`;

  // FIX: Changed 'const' to 'let' to allow modification
  let coords = `${obs.geometry.longitude},${obs.geometry.latitude}`;
  if (obs.geometry.altitude !== null) {
    coords += `,${obs.geometry.altitude}`;
  }

  return `
    <Placemark>
      <name>${escapeXml(obs.coreFields.name)}</name>
      <timestamp>${obs.createdAt.toISOString()}</timestamp>
      <ExtendedData>${extendedData}
      </ExtendedData>
      <Point>
        <coordinates>${coords}</coordinates>
      </Point>
    </Placemark>
  `;
};

/**
 * Generates the KML <Placemark> for the tracklog
 */
const createTracklogPlacemark = (track: ITracklogPoint[]): string => {
  if (track.length === 0) return '';

  // Format: lon,lat,alt lon,lat,alt ...
  const coordinates = track
    .map((p) => `${p.longitude},${p.latitude}`)
    .join(' ');

  return `
    <Placemark>
      <name>Tracklog</name>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
  `;
};

/**
 * Main export function
 */
export const generateKML = async (): Promise<string> => {
  const observations = await db.observations.toArray();
  const tracklog = await db.tracklog.orderBy('timestamp').toArray();

  const obsPlacemarks = observations.map(createObservationPlacemark).join('');
  const trackPlacemark = createTracklogPlacemark(tracklog);

  // KML Document Wrapper
  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Waymarker Export</name>
    <Folder>
      <name>Observations</name>
      ${obsPlacemarks}
    </Folder>
    <Folder>
      <name>Tracklog</name>
      ${trackPlacemark}
    </Folder>
  </Document>
</kml>
`;

  return kmlContent;
};