// src/services/textReportGenerator.ts

import { db } from '../db';
import type { IPhotoReference } from '../pages/components/PhotoReferenceInput';

/**
 * Generate a formatted text report suitable for ranger field reports.
 * Includes project summary, observation details, and custom field values.
 */
export const generateTextReport = async (projectId: number): Promise<string> => {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error('Project not found');

  const observations = await db.observations
    .where('projectId')
    .equals(projectId)
    .toArray();

  // Sort observations by date
  observations.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const lines: string[] = [];

  // Header
  lines.push('═'.repeat(70));
  lines.push('FIELD SURVEY REPORT');
  lines.push('═'.repeat(70));
  lines.push('');

  // Project Summary
  lines.push('PROJECT INFORMATION');
  lines.push('─'.repeat(70));
  lines.push(`Project: ${project.name}`);
  lines.push(`Created: ${project.createdAt.toLocaleString()}`);
  lines.push(`Date Generated: ${new Date().toLocaleString()}`);
  lines.push(`Total Observations: ${observations.length}`);
  lines.push('');

  // Custom Fields Summary
  if (project.customFields.length > 0) {
    lines.push('CUSTOM FIELDS:');
    project.customFields.forEach((field) => {
      lines.push(`  • ${field.label}`);
    });
    lines.push('');
  }

  // Observations
  lines.push('OBSERVATIONS');
  lines.push('═'.repeat(70));
  lines.push('');

  observations.forEach((obs, index) => {
    lines.push(`OBSERVATION #${index + 1}`);
    lines.push('─'.repeat(70));

    // Date/Time
    const dateStr = obs.createdAt.toLocaleString();
    lines.push(`Date/Time: ${dateStr}`);
    lines.push('');

    // Location
    lines.push('LOCATION:');
    if (obs.geometry.latitude !== null && obs.geometry.longitude !== null) {
      lines.push(`  Latitude:  ${obs.geometry.latitude.toFixed(6)}`);
      lines.push(`  Longitude: ${obs.geometry.longitude.toFixed(6)}`);
    } else {
      lines.push('  [No GPS coordinates recorded]');
    }
    if (obs.geometry.altitude !== null) {
      lines.push(`  Altitude:  ${obs.geometry.altitude.toFixed(1)} m`);
    }
    if (obs.geometry.accuracy !== null) {
      lines.push(`  Accuracy:  ±${obs.geometry.accuracy.toFixed(1)} m`);
    }
    lines.push('');

    // Core Fields
    lines.push('OBSERVATION DETAILS:');
    if (obs.coreFields.name) {
      lines.push(`  Name/Title: ${obs.coreFields.name}`);
    }
    if (obs.coreFields.notes) {
      lines.push(`  Notes:`);
      // Indent notes lines for readability
      obs.coreFields.notes.split('\n').forEach((line) => {
        lines.push(`    ${line}`);
      });
    }
    lines.push('');

    // Custom Fields
    if (project.customFields.length > 0) {
      const hasCustomValues = project.customFields.some(
        (field) => obs.customFieldValues[field.id] !== undefined && obs.customFieldValues[field.id] !== null
      );
      if (hasCustomValues) {
        lines.push('CUSTOM FIELD VALUES:');
        project.customFields.forEach((field) => {
          const value = obs.customFieldValues[field.id];
          let displayValue = '';
          if (value && typeof value === 'object' && (value as IPhotoReference).name) {
            displayValue = (value as IPhotoReference).name;
          } else if (value !== undefined && value !== null) {
            displayValue = String(value);
          }
          if (displayValue) {
            lines.push(`  ${field.label}: ${displayValue}`);
          }
        });
        lines.push('');
      }
    }

    lines.push('');
  });

  // Footer
  lines.push('═'.repeat(70));
  lines.push('End of Report');
  lines.push('═'.repeat(70));

  return lines.join('\n');
};
