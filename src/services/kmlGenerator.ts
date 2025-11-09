// src/services/kmlGenerator.ts

import { db } from '../db';
import type { IProject, IObservation, ITracklogPoint } from '../db';
import type { IPhotoReference } from '../pages/components/PhotoReferenceInput';
import Dexie from 'dexie'; // 1. IMPORT Dexie

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
const createObservationPlacemark = (
  obs: IObservation,
  project: IProject
): string => {
  let extendedData = '';

  const fieldLabelMap = new Map<string, string>();
  project.customFields.forEach((field) => {
    fieldLabelMap.set(field.id, field.label);
  });

  for (const [fieldId, value] of Object.entries(obs.customFieldValues)) {
    const label = fieldLabelMap.get(fieldId);
    if (!label) continue; 

    let valueToSave: string;

    if (value && typeof value === 'object' && value.name) {
      valueToSave = (value as IPhotoReference).name;
    } else {
      // Handle null/undefined values gracefully
      valueToSave = value === null || value === undefined ? '' : String(value);
    }
    
    extendedData += `
      <Data name="${escapeXml(label)}">
        <value>${escapeXml(valueToSave)}</value>
      </Data>`;
  }

  extendedData += `
    <Data name="Notes">
      <value>${escapeXml(obs.coreFields.notes)}</value>
    </Data>`;

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
export const generateKML = async (projectId: number): Promise<string> => {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('Project not found');

  const observations = await db.observations
    .where('projectId')
    .equals(projectId)
    .toArray();

  // 2. FIX: Use the compound index to query and sort tracklog
  const tracklog = await db.tracklog
    .where('[projectId+timestamp]')
    .between(
      [projectId, Dexie.minKey],
      [projectId, Dexie.maxKey]
    )
    .toArray();

  const obsPlacemarks = observations
    .map((obs) => createObservationPlacemark(obs, project))
    .join('');
  const trackPlacemark = createTracklogPlacemark(tracklog);

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(project.name)}</name>
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