// src/services/csvGenerator.ts

import { db } from '../db';
import type { IPhotoReference } from '../pages/components/PhotoReferenceInput';

const escapeCsv = (value: string): string => {
  if (value == null) return '';
  // Escape double quotes by doubling them, and wrap field in quotes if it contains comma, quote or newline
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
};

export const generateCSV = async (projectId: number): Promise<string> => {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('Project not found');

  const observations = await db.observations
    .where('projectId')
    .equals(projectId)
    .toArray();

  // Header columns: core fields + custom fields
  const headers = [
    'id',
    'createdAt',
    'latitude',
    'longitude',
    'altitude',
    'accuracy',
    'name',
    'notes',
  ];

  const customFieldLabels = project.customFields.map((f) => f.label);
  const customFieldIds = project.customFields.map((f) => f.id);

  const allHeaders = headers.concat(customFieldLabels);

  const rows: string[] = [];
  rows.push(allHeaders.map((h) => escapeCsv(h)).join(','));

  for (const obs of observations) {
    const row: string[] = [];
    row.push(obs.id !== undefined ? String(obs.id) : '');
    row.push(obs.createdAt.toISOString());
    row.push(obs.geometry.latitude?.toString() ?? '');
    row.push(obs.geometry.longitude?.toString() ?? '');
    row.push(obs.geometry.altitude !== null ? String(obs.geometry.altitude) : '');
    row.push(obs.geometry.accuracy !== null ? String(obs.geometry.accuracy) : '');
    row.push(escapeCsv(obs.coreFields.name ?? ''));
    row.push(escapeCsv(obs.coreFields.notes ?? ''));

    // Custom fields in project order
    for (const fieldId of customFieldIds) {
      const value = obs.customFieldValues[fieldId];
      let out = '';
      if (value && typeof value === 'object' && (value as IPhotoReference).name) {
        out = (value as IPhotoReference).name;
      } else if (value !== undefined && value !== null) {
        out = String(value);
      } else {
        out = '';
      }
      row.push(escapeCsv(out));
    }

    rows.push(row.join(','));
  }

  return rows.join('\n');
};
