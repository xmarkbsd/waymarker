// src/hooks/useSettings.ts

import { useLiveQuery } from 'dexie-react-hooks';
import type { ISettingsCustomField } from '../db';
import { db } from '../db'; // Import the db instance

export const useSettings = () => {
  // Use useLiveQuery to automatically get updates from the 'settings' table.
  // We fetch the document with id: 1, which we created in the populate step.
  const settings = useLiveQuery(() => db.settings.get(1), []);

  // Derive the fields and loading state from the live query result
  const customFields: ISettingsCustomField[] = settings?.customFields || [];
  const loading = settings === undefined; // 'undefined' means the query hasn't run yet

  return { customFields, loading };
};