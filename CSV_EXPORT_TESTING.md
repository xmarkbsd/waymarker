# CSV Export Testing Guide

## Quick Start

### Enable Test Data
1. Open `src/main.tsx`
2. Uncomment these lines:
   ```typescript
   import { createTestDataInBrowser } from './testHarness';
   createTestDataInBrowser().catch(console.error);
   ```
3. Save the file — the app will reload and populate test data in IndexedDB
4. Check your browser console (F12 → Console) for messages like:
   ```
   [TEST HARNESS] ✓ Created project ID: 1
   [TEST HARNESS] ✓ Created 4 observations
   [TEST HARNESS] ✅ All test data created and CSV export verified!
   ```

### Test CSV Export
1. Navigate to the app (http://localhost:5173)
2. You should see "Test Forest Survey" project is active (bottom navigation shows a project)
3. Open the menu (⋮ at top-right)
4. Click **Export CSV Only**
5. A file `waymarker_export_YYYY-MM-DD_HH-MM.csv` will download

### Verify CSV Output
Open the downloaded CSV in a text editor or spreadsheet app. You should see:

**Header row:**
```
id,createdAt,latitude,longitude,altitude,accuracy,name,notes,Species,Health Status,Observer Name
```

**Data rows** (4 observations):
```
1,2025-11-20T10:30:00.000Z,51.5074,-0.1278,10,5,"Oak Tree near Main Gate","Large healthy oak. Approximately 30m tall. Good condition.",Oak,Healthy,John Smith
2,2025-11-20T11:15:00.000Z,51.508,-0.1285,12,4,"Maple with Disease","Showing signs of fungal disease. Recommend monitoring and treatment.",Maple,Diseased,Jane Doe
...
```

### Test Other Export Formats
While you're at it, also verify:
- **Export KML Only** — should download a .kml file
- **Export Zip Bundle...** — should download a .zip file (no photos in test data, so just KML)

---

## Test Data Details

The test harness creates:

- **Project:** "Test Forest Survey" (ID: 1)
- **Custom Fields:**
  - `Species` (autocomplete: Oak, Maple, Birch, Pine, Elm)
  - `Health Status` (autocomplete: Healthy, Diseased, Damaged, Dead)
  - `Observer Name` (text field)

- **4 Sample Observations:**
  1. Oak Tree (Healthy)
  2. Maple (Diseased)
  3. Pine (Damaged)
  4. Birch (Healthy)

Each observation has realistic GPS coordinates, timestamps, and custom field values.

---

## Files Added/Modified

- `src/testHarness.ts` — Browser-based test data generator
- `src/main.tsx` — Import hook (commented out by default)
- `scripts/createTestData.ts` — Node.js version (not integrated into build)
- `scripts/testCsvExport.ts` — Automated test runner (not integrated)

---

## Cleanup

When done testing:
1. Comment out the import in `src/main.tsx`
2. Open DevTools (F12) → Application → IndexedDB → WaymarkerDB
3. Delete the "Test Forest Survey" project if you want a clean slate

Or just create a new project in the UI and use that.

---

## Next Steps

If everything looks good:
1. Run the CSV export and verify the output
2. Test KML and Zip exports as well
3. Try creating your own custom fields and observations
4. Let me know if you want to adjust CSV formatting, column order, or add/remove columns
