// src/hooks/useProjectCustomFields.ts

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { ISettingsCustomField } from '../db';
import { useActiveProject } from './useActiveProject';

export const useProjectCustomFields = () => {
  const activeProjectId = useActiveProject();

  // Get the full active project object
  const activeProject = useLiveQuery(
    () => (activeProjectId ? db.projects.get(activeProjectId) : undefined),
    [activeProjectId]
  );

  // Return the custom fields from that project
  const customFields: ISettingsCustomField[] =
    activeProject?.customFields || [];
  const loading = activeProject === undefined;

  return { customFields, loading, activeProjectId };
};