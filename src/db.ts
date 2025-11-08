// src/db.ts

import Dexie from 'dexie';
import type { Table, Transaction } from 'dexie';

// --- INTERFACES ---

export interface ICoreFields {
  name: string;
  notes: string;
}

export interface IGeometry {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
}

export interface ICustomFieldValues {
  [key: string]: any;
}

export interface ISettingsCustomField {
  id: string;
  label: string;
  type:
    | 'text'
    | 'photo_reference'
    | 'autocomplete'
    | 'number'
    | 'date'
    | 'boolean';
  options?: string[];
}

export interface IProject {
  id?: number;
  name: string;
  createdAt: Date;
  customFields: ISettingsCustomField[];
}

export interface IObservation {
  id?: number;
  projectId: number;
  createdAt: Date;
  geometry: IGeometry;
  coreFields: ICoreFields;
  customFieldValues: ICustomFieldValues;
}

export interface ITracklogPoint {
  id?: number;
  projectId: number;
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface IProjectTemplate {
  id?: number;
  name: string;
  customFields: ISettingsCustomField[];
}

/**
 * NEW: Interface for a single map tile
 */
export interface IMapTile {
  id?: string; // Will be 'z-x-y'
  data: Blob; // The image data
  timestamp: number; // When it was saved
}

export interface ISettings {
  id?: number;
  activeProjectId: number | null;
}

// --- DATABASE CLASS ---

export class WaymarkerDB extends Dexie {
  projects!: Table<IProject, number>;
  observations!: Table<IObservation, number>;
  tracklog!: Table<ITracklogPoint, number>;
  settings!: Table<ISettings, number>;
  templates!: Table<IProjectTemplate, number>;
  mapTiles!: Table<IMapTile, string>; // NEW table

  constructor() {
    super('WaymarkerDB');
    
    // Define all versions
    this.version(1).stores({
      observations: '++id, createdAt',
      tracklog: '++id, timestamp',
      settings: 'id',
    });

    this.version(2)
      .stores({
        projects: '++id, createdAt',
        observations: '++id, projectId, createdAt',
        tracklog: '++id, projectId, timestamp',
        settings: 'id',
      })
      .upgrade(this.migrateToV2);

    this.version(3).stores({
      observations: '++id, [projectId+createdAt]',
      tracklog: '++id, [projectId+timestamp]',
      projects: '++id, createdAt',
      settings: 'id',
    });
    
    this.version(4).stores({
      templates: '++id, name',
      observations: '++id, [projectId+createdAt]',
      tracklog: '++id, [projectId+timestamp]',
      projects: '++id, createdAt',
      settings: 'id',
    });

    this.version(5).stores({
      templates: '++id, name',
      projects: '++id, createdAt',
      settings: 'id',
      observations: '++id, [projectId+createdAt]',
      tracklog: '++id, [projectId+timestamp]',
    }).upgrade(this.migrateToV5);

    // --- Version 6 (Offline Map Tiles) ---
    this.version(6).stores({
      mapTiles: '&id, timestamp', // NEW table, 'id' is 'z-x-y'
      // Re-definitions
      templates: '++id, name',
      projects: '++id, createdAt',
      settings: 'id',
      observations: '++id, [projectId+createdAt]',
      tracklog: '++id, [projectId+timestamp]',
    });
    // No .upgrade() needed, just adding a new table

    this.on('populate', this.populate);
  }

  // --- MIGRATION FUNCTIONS ---

  migrateToV2 = async (tx: Transaction) => {
    const defaultProjectId = await tx.table('projects').add({
      name: 'Default Project',
      createdAt: new Date(),
    });
    await tx
      .table('observations')
      .toCollection()
      .modify({ projectId: defaultProjectId });
    await tx
      .table('tracklog')
      .toCollection()
      .modify({ projectId: defaultProjectId });
    await tx.table('settings').update(1, {
      activeProjectId: defaultProjectId,
    });
  };

  migrateToV5 = async (tx: Transaction) => {
    const settings = await tx.table('settings').get(1);
    const oldCustomFields = settings.customFields || [];
    await tx
      .table('projects')
      .toCollection()
      .modify({
        customFields: oldCustomFields,
      });
    await tx.table('settings').update(1, {
      customFields: undefined,
    });
  };

  // --- POPULATE FUNCTION ---

  populate = async () => {
    try {
      const defaultProjectId = await this.projects.add({
        name: 'Default Project',
        createdAt: new Date(),
        customFields: [],
      });
      await this.settings.add({
        id: 1,
        activeProjectId: defaultProjectId,
      });
    } catch (error) {
      console.error('Failed to populate database:', error);
    }
  };
}

export const db = new WaymarkerDB();