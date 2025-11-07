// src/db.ts

import Dexie from 'dexie';
import type { Table } from 'dexie';

// ... (Keep all existing interfaces: ICoreFields, IGeometry, etc.)

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

export interface IObservation {
  id?: number;
  createdAt: Date;
  geometry: IGeometry;
  coreFields: ICoreFields;
  customFieldValues: ICustomFieldValues;
}

export interface ITracklogPoint {
  id?: number;
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ISettingsCustomField {
  id: string;
  label: string;
  type: 'text' | 'photo_reference' | 'autocomplete';
  options?: string[];
}

export interface ISettings {
  id?: number; // Should always be 1
  customFields: ISettingsCustomField[];
}

export class WaymarkerDB extends Dexie {
  observations!: Table<IObservation, number>;
  tracklog!: Table<ITracklogPoint, number>;
  settings!: Table<ISettings, number>;

  constructor() {
    super('WaymarkerDB');
    this.version(1).stores({
      observations: '++id, createdAt',
      tracklog: '++id, timestamp',
      settings: 'id', // 'id' is the primary key
    });

    // **NEW CODE**: This event hook runs when the DB is
    // created for the first time.
    this.on('populate', this.populate);
  }

  // **NEW FUNCTION**: Populates the DB with default data
  populate = async () => {
    try {
      // Add a default settings object.
      // We use a known 'id: 1' to make it a singleton
      // document we can always fetch.
      await this.settings.add({
        id: 1,
        customFields: [], // Start with an empty list
      });
    } catch (error) {
      console.error('Failed to populate database:', error);
    }
  };
}

export const db = new WaymarkerDB();