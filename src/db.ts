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

export interface IProject {
  id?: number;
  name: string;
  createdAt: Date;
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

export interface ISettingsCustomField {
  id: string;
  label: string;
  // FIX: Added new advanced field types
  type:
    | 'text'
    | 'photo_reference'
    | 'autocomplete'
    | 'number'
    | 'date'
    | 'boolean';
  options?: string[];
}

export interface ISettings {
  id?: number;
  activeProjectId: number | null;
  customFields: ISettingsCustomField[];
}

// --- DATABASE CLASS ---

export class WaymarkerDB extends Dexie {
  projects!: Table<IProject, number>;
  observations!: Table<IObservation, number>;
  tracklog!: Table<ITracklogPoint, number>;
  settings!: Table<ISettings, number>;

  constructor() {
    super('WaymarkerDB');
    
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

    this.on('populate', this.populateV2);
  }

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

  populateV2 = async () => {
    try {
      const defaultProjectId = await this.projects.add({
        name: 'Default Project',
        createdAt: new Date(),
      });
      await this.settings.add({
        id: 1,
        customFields: [],
        activeProjectId: defaultProjectId,
      });
    } catch (error) {
      console.error('Failed to populate database:', error);
    }
  };
}

export const db = new WaymarkerDB();