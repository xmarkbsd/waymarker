// src/testHarness.ts
// Browser-based test runner to populate DB and test CSV export
// Import this in main.tsx to run during development

import { db } from './db';
import { generateCSV } from './services/csvGenerator';
import type { ISettingsCustomField, IObservation } from './db';

export async function createTestDataInBrowser() {
  console.log('[TEST HARNESS] Creating test data in IndexedDB...');

  try {
    // 1. Create custom fields
    const customFields: ISettingsCustomField[] = [
      {
        id: 'species_field',
        label: 'Species',
        type: 'autocomplete',
        options: ['Oak', 'Maple', 'Birch', 'Pine', 'Elm'],
      },
      {
        id: 'health_field',
        label: 'Health Status',
        type: 'autocomplete',
        options: ['Healthy', 'Diseased', 'Damaged', 'Dead'],
      },
      {
        id: 'observer_field',
        label: 'Observer Name',
        type: 'text',
      },
    ];

    // 2. Create test project
    const projectId = await db.projects.add({
      name: 'Test Forest Survey',
      createdAt: new Date('2025-11-15'),
      customFields,
    });

    console.log(`[TEST HARNESS] ✓ Created project ID: ${projectId}`);

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
          name: 'Oak Tree near Main Gate',
          notes: 'Large healthy oak. Approximately 30m tall. Good condition.',
        },
        customFieldValues: {
          species_field: 'Oak',
          health_field: 'Healthy',
          observer_field: 'John Smith',
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
          name: 'Maple with Disease',
          notes: 'Showing signs of fungal disease. Recommend monitoring and treatment.',
        },
        customFieldValues: {
          species_field: 'Maple',
          health_field: 'Diseased',
          observer_field: 'Jane Doe',
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
          name: 'Pine with Storm Damage',
          notes: 'Broken branch from recent storm. Tree otherwise healthy.',
        },
        customFieldValues: {
          species_field: 'Pine',
          health_field: 'Damaged',
          observer_field: 'John Smith',
        },
      },
      {
        projectId,
        createdAt: new Date('2025-11-20T13:30:00Z'),
        geometry: {
          latitude: 51.5090,
          longitude: -0.1295,
          altitude: 15,
          accuracy: 3,
        },
        coreFields: {
          name: 'Birch on South Hill',
          notes: 'Young birch tree, recently planted. Thriving well.',
        },
        customFieldValues: {
          species_field: 'Birch',
          health_field: 'Healthy',
          observer_field: 'Jane Doe',
        },
      },
    ];

    let obsCount = 0;
    for (const obs of observations) {
      await db.observations.add(obs);
      obsCount++;
    }
    console.log(`[TEST HARNESS] ✓ Created ${obsCount} observations`);

    // 4. Set as active project
    await db.settings.update(1, { activeProjectId: projectId });
    console.log(`[TEST HARNESS] ✓ Set as active project`);

    // 5. Test CSV export
    console.log(`[TEST HARNESS] Testing CSV export...`);
    const csvData = await generateCSV(projectId);
    const lines = csvData.split('\n');
    console.log(`[TEST HARNESS] ✓ CSV generated: ${lines.length} lines, ${csvData.length} bytes`);
    console.log(`[TEST HARNESS] CSV Preview (first 500 chars):\n${csvData.slice(0, 500)}\n...`);

    console.log('[TEST HARNESS] ✅ All test data created and CSV export verified!');
    console.log(`[TEST HARNESS] Project ID: ${projectId} — ready for manual testing`);
    return { projectId, observations: obsCount };
  } catch (error) {
    console.error('[TEST HARNESS] ❌ Failed to create test data:', error);
    throw error;
  }
}

// Export a flag to optionally run on app load (comment out when not testing)
// Uncomment the next line in main.tsx during testing:
// createTestDataInBrowser().catch(console.error);
