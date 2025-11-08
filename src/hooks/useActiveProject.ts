// src/hooks/useActiveProject.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const useActiveProject = () => {
  // Get the settings document
  const settings = useLiveQuery(() => db.settings.get(1), []);
  
  // Return the activeProjectId, or null if settings aren't loaded
  return settings?.activeProjectId || null;
};