// scripts/createTestData.ts
// Quick test script to populate sample data for manual testing

import { db } from '../src/db';
import type { ISettingsCustomField, IObservation, IProject } from '../src/db';

async function createTestData() {
  console.log('Creating test data...');

  // 1. Create custom fields
  const customFields: ISettingsCustomField[] = [
    {
      id: 'field_1',
      label: 'Species',
      type: 'autocomplete',
      options: ['Oak', 'Maple', 'Birch', 'Pine'],
    },
    {
      id: 'field_2',
      label: 'Health Status',
      type: 'autocomplete',
      options: ['Healthy', 'Diseased', 'Damaged', 'Dead'],
    },
    {
      id: 'field_3',
      label: 'Observer Name',
      type: 'text',
    },
  ];

  // 2. Create a project
  const projectId = await db.projects.add({
    name: 'Test Forest Survey',
    createdAt: new Date(),
    customFields: customFields,
  });

  console.log(`Created project with ID: ${projectId}`);

  // 3. Create sample observations
  const observations: IObservation[] = [
    {
      projectId,
      createdAt: new Date('2025-11-20T10:30:00Z'),
      geometry: {
        latitude: 51.5074,
        longitude: -0.1278,
        altitude: 10,
        accuracy: 5,
      },
      coreFields: {
        name: 'Oak Tree 1',
        notes: 'Large healthy oak near the main path. Approximately 30m tall.',
      },
      customFieldValues: {
        field_1: 'Oak',
        field_2: 'Healthy',
        field_3: 'John Smith',
      },
    },
    {
      projectId,
      createdAt: new Date('2025-11-20T11:15:00Z'),
      geometry: {
        latitude: 51.5080,
        longitude: -0.1285,
        altitude: 12,
        accuracy: 4,
      },
      coreFields: {
        name: 'Maple Tree 2',
        notes: 'Maple showing signs of disease. Recommend monitoring.',
      },
      customFieldValues: {
        field_1: 'Maple',
        field_2: 'Diseased',
        field_3: 'Jane Doe',
      },
    },
    {
      projectId,
      createdAt: new Date('2025-11-20T12:00:00Z'),
      geometry: {
        latitude: 51.5085,
        longitude: -0.1290,
        altitude: 8,
        accuracy: 6,
      },
      coreFields: {
        name: 'Pine Tree 3',
        notes: 'Pine tree with broken branch. Storm damage from last week.',
      },
      customFieldValues: {
        field_1: 'Pine',
        field_2: 'Damaged',
        field_3: 'John Smith',
      },
    },
  ];

  for (const obs of observations) {
    const obsId = await db.observations.add(obs);
    console.log(`Created observation with ID: ${obsId}`);
  }

  // 4. Set as active project
  await db.settings.update(1, { activeProjectId: projectId });
  console.log('Set as active project');

  console.log('✓ Test data created successfully!');
  console.log(`Project ID: ${projectId} — use this in your tests`);
}

createTestData().catch(console.error);
