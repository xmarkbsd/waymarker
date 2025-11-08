// src/pages/components/OfflineTileLayer.tsx

import { useMap } from 'react-leaflet';
import { db } from '../../db';
import L from 'leaflet';
import { useEffect } from 'react';

// Create a custom TileLayer class
const OfflineTileLayer = L.TileLayer.extend({
  createTile: function (coords: L.Coords, done: L.DoneCallback) {
    const tile = document.createElement('img');
    tile.alt = ''; // Important for accessibility

    const tileId = `${coords.z}-${coords.x}-${coords.y}`;
    const onlineUrl = L.TileLayer.prototype.getTileUrl.call(this, coords);

    db.mapTiles
      .get(tileId)
      .then((storedTile) => {
        if (storedTile) {
          // Found in DB: Create a URL for the Blob
          tile.src = URL.createObjectURL(storedTile.data);
          done(undefined, tile);
        } else {
          // Not in DB: Fall back to online URL
          tile.src = onlineUrl;
          done(undefined, tile);
        }
      })
      .catch((error) => {
        console.error('Error fetching tile from DB:', error);
        tile.src = onlineUrl; // Fall back on error
        done(error, tile);
      });

    return tile;
  },
});

// Create a React wrapper component
export const CustomOfflineTileLayer = () => {
  const map = (L.TileLayer as any).offlineLayer
    ? ((L.TileLayer as any).offlineLayer() as L.TileLayer)
    : new (OfflineTileLayer as any)(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: ['a', 'b', 'c'],
        },
      );

  // We use useEffect to add the layer, as React-Leaflet v3/v4
  // has trouble with custom extended L.TileLayer classes.
  // This is a stable workaround.
  const parentMap = useMap();
  useEffect(() => {
    map.addTo(parentMap);

    // Cleanup
    return () => {
      map.remove();
    };
  }, [map, parentMap]);

  // This component doesn't render any JSX itself
  return null;
};