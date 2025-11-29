// src/pages/components/OfflineTileLayer.tsx

import { useMap } from 'react-leaflet';
import { db } from '../../db';
import L from 'leaflet';
import { useEffect } from 'react';

// Create a custom TileLayer class that supports offline tiles
const OfflineTileLayer = L.TileLayer.extend({
  createTile: function (coords: L.Coords, done: L.DoneCallback) {
    const tile = document.createElement('img');
    tile.alt = '';

    const tileId = `${coords.z}-${coords.x}-${coords.y}`;
    const onlineUrl = L.TileLayer.prototype.getTileUrl.call(this, coords);

    db.mapTiles
      .get(tileId)
      .then((storedTile) => {
        if (storedTile) {
          tile.src = URL.createObjectURL(storedTile.data);
          done(undefined, tile);
        } else {
          tile.src = onlineUrl;
          done(undefined, tile);
        }
      })
      .catch((error) => {
        console.error('Error fetching tile from DB:', error);
        tile.src = onlineUrl;
        done(error, tile);
      });

    return tile;
  },
});

// Create a React wrapper component
export const CustomOfflineTileLayer = () => {
  const parentMap = useMap();

  useEffect(() => {
    // Create and add the OSM tile layer as default
    const osmLayer = new (OfflineTileLayer as any)(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
      }
    );

    osmLayer.addTo(parentMap);

    // Cleanup
    return () => {
      osmLayer.remove();
    };
  }, [parentMap]);

  return null;
};