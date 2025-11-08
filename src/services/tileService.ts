// src/services/tileService.ts

import { db } from '../db';
import type { IMapTile } from '../db';
import type { LatLngBounds } from 'leaflet';

// --- Tile Math Utilities ---

/**
 * Converts Lng to tile X coordinate
 */
const long2tile = (lon: number, zoom: number): number => {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
};

/**
 * Converts Lat to tile Y coordinate
 */
const lat2tile = (lat: number, zoom: number): number => {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
};

// --- Tile Fetching Service ---

const TILE_URL_TEMPLATE =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SUBDOMAINS = ['a', 'b', 'c'];

/**
 * Fetches a single tile and returns it as a Blob.
 */
const fetchTile = async (
  z: number,
  x: number,
  y: number
): Promise<Blob | null> => {
  const subdomain = SUBDOMAINS[Math.floor(Math.random() * SUBDOMAINS.length)];
  const url = TILE_URL_TEMPLATE.replace('{s}', subdomain)
    .replace('{z}', z.toString())
    .replace('{x}', x.toString())
    .replace('{y}', y.toString());

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      console.error(`Failed to fetch tile ${z}/${x}/${y}: ${response.statusText}`);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.error(`Error fetching tile ${z}/${x}/${y}:`, error);
    return null;
  }
};

/**
 * Main function to download all tiles within a given bounds and zoom range.
 * @param bounds The Leaflet LatLngBounds of the visible map area.
 * @param minZoom The minimum zoom level to download.
 * @param maxZoom The maximum zoom level to download.
 * @param onProgress A callback to report progress.
 */
export const downloadTiles = async (
  bounds: LatLngBounds,
  minZoom: number,
  maxZoom: number,
  onProgress: (progress: string) => void
) => {
  const tilesToFetch: { z: number; x: number; y: number }[] = [];

  // 1. Calculate all tile coordinates
  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = long2tile(bounds.getWest(), z);
    const maxX = long2tile(bounds.getEast(), z);
    const minY = lat2tile(bounds.getNorth(), z);
    const maxY = lat2tile(bounds.getSouth(), z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tilesToFetch.push({ z, x, y });
      }
    }
  }

  // 2. Fetch and save tiles
  onProgress(`Found ${tilesToFetch.length} tiles to download...`);
  let downloadedCount = 0;
  let failedCount = 0;

  for (const tile of tilesToFetch) {
    const { z, x, y } = tile;
    const tileId = `${z}-${x}-${y}`;

    // Check if tile already exists in DB
    const existing = await db.mapTiles.get(tileId);
    if (existing) {
      downloadedCount++;
      continue; // Skip if already downloaded
    }

    // Fetch the tile
    const tileBlob = await fetchTile(z, x, y);

    if (tileBlob && tileBlob.size > 0) {
      // Save to DB
      const newTile: IMapTile = {
        id: tileId,
        data: tileBlob,
        timestamp: Date.now(),
      };
      await db.mapTiles.put(newTile);
      downloadedCount++;
    } else {
      failedCount++;
    }

    // Report progress
    onProgress(
      `Downloading... ${downloadedCount}/${tilesToFetch.length} (Failed: ${failedCount})`
    );
  }

  onProgress(`Download complete. ${downloadedCount} tiles saved.`);
};

/**
 * Deletes all saved map tiles from the database.
 */
export const clearOfflineTiles = async () => {
  await db.mapTiles.clear();
};