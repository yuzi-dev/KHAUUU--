import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom restaurant marker
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User location marker
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    description?: string;
    type?: 'restaurant' | 'user';
  }>;
  className?: string;
  height?: string;
}

const MapComponent: React.FC<MapProps> = ({ center, zoom = 13, markers = [], className = "", height = "400px" }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapKey, setMapKey] = useState(() => Math.random().toString(36).substring(2, 11));
  
  // Generate a new key when center changes to force re-initialization
  useEffect(() => {
    setMapKey(Math.random().toString(36).substring(2, 11));
  }, [center[0], center[1]]);

  // Cleanup function to properly remove map instance
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapKey]);

  const MapContainerComponent = MapContainer as any;
  const TileComponent = TileLayer as any;
  const MarkerComponent = Marker as any;
  
  return (
    <div 
      ref={containerRef}
      className={`rounded-lg overflow-hidden shadow-lg ${className}`} 
      style={{ height }}
    >
      <MapContainerComponent
        key={mapKey}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={(mapInstance: L.Map) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileComponent
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {markers.map((marker, index) => (
          <MarkerComponent
            key={`${mapKey}-marker-${index}`}
            position={marker.position}
            icon={marker.type === 'user' ? userIcon : restaurantIcon}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold text-sm mb-1">{marker.title}</h4>
                {marker.description && (
                  <p className="text-xs text-gray-600">{marker.description}</p>
                )}
              </div>
            </Popup>
          </MarkerComponent>
        ))}
      </MapContainerComponent>
    </div>
  );
};

export default MapComponent;