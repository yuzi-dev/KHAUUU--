import { useState, useEffect } from 'react';
import { getCurrentLocation, Coordinates } from '@/lib/utils/geolocation';

interface UseGeolocationReturn {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coords = await getCurrentLocation();
      setCoordinates(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      // Fallback to Kathmandu coordinates if geolocation fails
      setCoordinates({ latitude: 27.7172, longitude: 85.3240 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    coordinates,
    loading,
    error,
    refetch: fetchLocation,
  };
}