"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center" style={{ height: '400px' }}>
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
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

const Map: React.FC<MapProps> = (props) => {
  return <DynamicMap {...props} />;
};

export default Map;