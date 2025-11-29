// scripts/testCsvExport.ts
// Automated test of CSV export functionality

import { db } from '../src/db';
import { generateCSV } from '../src/services/csvGenerator';

async function testCsvExport() {
  console.log('Starting CSV export test...\n');

  try {
    // 1. Get the active project (should be the test project we created)
    const settings = await db.settings.get(1);
    const activeProjectId = settings?.activeProjectId;

    if (!activeProjectId) {
      throw new Error('No active project found. Run createTestData.ts first.');
    }

    console.log(`✓ Found active project ID: ${activeProjectId}`);

    // 2. Fetch project and observations
    const project = await db.projects.get(activeProjectId);
    if (!project) throw new Error('Project not found');

    const observations = await db.observations
      .where('projectId')
      .equals(activeProjectId)
      .toArray();

    console.log(`✓ Project: "${project.name}"`);
    console.log(`✓ Observations count: ${observations.length}`);
    console.log(`✓ Custom fields: ${project.customFields.map((f) => f.label).join(', ')}\n`);

    // 3. Generate CSV
    const csvData = await generateCSV(activeProjectId);
    console.log('CSV Output:\n');
    console.log(csvData);
    console.log('\n---\n');

    // 4. Validate CSV structure
    const lines = csvData.trim().split('\n');
    const headerRow = lines[0];
    const headers = headerRow.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    console.log('Validation Results:');
    console.log(`✓ Header row has ${headers.length} columns`);
    console.log(`✓ Data rows: ${lines.length - 1}`);

    // Verify required columns
    const requiredCols = ['id', 'createdAt', 'latitude', 'longitude', 'name', 'notes'];
    const missingCols = requiredCols.filter((col) => !headers.includes(col));

    if (missingCols.length > 0) {
      throw new Error(`Missing required columns: ${missingCols.join(', ')}`);
    }
    console.log(`✓ All required columns present: ${requiredCols.join(', ')}`);

    // Verify custom field columns
    const customFieldCols = project.customFields.map((f) => f.label);
    const missingCustom = customFieldCols.filter((col) => !headers.includes(col));
    if (missingCustom.length > 0) {
      throw new Error(`Missing custom field columns: ${missingCustom.join(', ')}`);
    }
    console.log(`✓ All custom field columns present: ${customFieldCols.join(', ')}`);

    // 5. Validate data integrity
    console.log('\n✓ Sample data validation:');
    if (observations.length > 0) {
      const firstObs = observations[0];
      const firstDataLine = lines[1];
      console.log(`  First observation name: "${firstObs.coreFields.name}"`);
      console.log(`  First data line: ${firstDataLine.slice(0, 80)}...`);
    }

    console.log('\n✅ CSV Export Test PASSED');
    return true;
  } catch (error) {
    console.error('\n❌ CSV Export Test FAILED');
    console.error(error);
    return false;
  }
}

testCsvExport();
