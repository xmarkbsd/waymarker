// Quick test to demonstrate the text report format

import { generateTextReport } from './src/services/textReportGenerator';
import { db } from './src/db';

export async function testTextReportFormat() {
  // Create a test project with sample observations
  const projectId = await db.projects.add({
    name: 'Ranger Field Survey',
    createdAt: new Date(),
    customFields: [
      { id: 'species', label: 'Tree Species', type: 'autocomplete', options: ['Oak', 'Maple', 'Pine', 'Birch'] },
      { id: 'health', label: 'Health Status', type: 'text' },
      { id: 'notes', label: 'Additional Notes', type: 'text' },
    ],
  });

  // Add sample observations
  await db.observations.add({
    projectId,
    createdAt: new Date('2025-11-20T09:30:00'),
    geometry: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10.5,
      accuracy: 5.2,
    },
    coreFields: {
      name: 'Oak Tree - South Ridge',
      notes: 'Large oak with excellent crown structure.\nEstimated age: 50-60 years.\nMinor leaf damage observed.',
    },
    customFieldValues: {
      species: 'Oak',
      health: 'Good',
      notes: 'Monitor for pest activity',
    },
  });

  await db.observations.add({
    projectId,
    createdAt: new Date('2025-11-20T11:15:00'),
    geometry: {
      latitude: 40.7150,
      longitude: -74.0080,
      altitude: 15.0,
      accuracy: 4.8,
    },
    coreFields: {
      name: 'Maple Grove - North Trail',
      notes: 'Group of 3 maple trees. Fall colors were exceptional this year.',
    },
    customFieldValues: {
      species: 'Maple',
      health: 'Excellent',
      notes: '',
    },
  });

  const report = await generateTextReport(projectId);
  console.log('=== TEXT REPORT OUTPUT ===\n');
  console.log(report);
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTextReportFormat().catch(console.error);
}
