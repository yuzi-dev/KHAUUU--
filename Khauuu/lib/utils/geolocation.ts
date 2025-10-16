export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Get current user location using browser geolocation API
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Format distance for display
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Mock restaurant coordinates - in a real app, this would come from a database
const restaurantCoordinates: Record<string, Coordinates> = {
  "1": { latitude: 27.7172, longitude: 85.3240 }, // Himalayan Delights
  "2": { latitude: 27.7089, longitude: 85.3206 }, // Momo Palace
  "3": { latitude: 27.7056, longitude: 85.3177 }, // Heritage Kitchen
  "4": { latitude: 27.7145, longitude: 85.3158 }, // Yak & Yeti
  "5": { latitude: 27.7201, longitude: 85.3289 }, // Thakali Kitchen
  "6": { latitude: 27.7098, longitude: 85.3134 }, // Newari Ghar
};

// Get restaurant coordinates by ID
export const getRestaurantCoordinates = (restaurantId: string): Coordinates | null => {
  return restaurantCoordinates[restaurantId] || null;
};