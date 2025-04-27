
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ParkingSpot } from '@/lib/types';

interface ParkingMapProps {
  spots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  onSpotClick: (spot: ParkingSpot) => void;
}

const ParkingMap = ({ spots, selectedSpot, onSpotClick }: ParkingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = React.useState<string>('');

  useEffect(() => {
    if (!mapContainer.current || !spots.length) return;

    const initializeMap = () => {
      if (!mapboxToken) return;
      
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [55.2708, 25.2048], // Dubai coordinates
        zoom: 17,
        pitch: 45
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add markers for each parking spot
      spots.forEach((spot) => {
        const el = document.createElement('div');
        el.className = `w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
          !spot.isAvailable
            ? 'bg-spoton-booked'
            : selectedSpot?.id === spot.id
            ? 'bg-spoton-primary'
            : 'bg-spoton-accent hover:bg-spoton-hover'
        }`;
        el.textContent = spot.spot_number.toString();
        el.style.color = 'white';
        el.style.fontWeight = 'bold';

        el.addEventListener('click', () => {
          if (spot.isAvailable) {
            onSpotClick(spot);
          }
        });

        new mapboxgl.Marker(el)
          .setLngLat([55.2708 + (spot.spot_number * 0.0001), 25.2048])
          .addTo(map.current!);
      });
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, [spots, selectedSpot, mapboxToken]);

  return (
    <div className="space-y-4">
      {!mapboxToken && (
        <div className="p-4 bg-yellow-50 rounded-md">
          <label className="block text-sm font-medium mb-2">
            Please enter your Mapbox public token to view the map:
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            onChange={(e) => setMapboxToken(e.target.value)}
            placeholder="Enter Mapbox public token"
          />
          <p className="text-xs text-gray-500 mt-1">
            Visit mapbox.com to get your public token
          </p>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className={`w-full ${mapboxToken ? 'h-[400px]' : 'h-0'} rounded-lg`} 
      />
    </div>
  );
};

export default ParkingMap;
