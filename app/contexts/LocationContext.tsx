"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  distance?: number;
  timestamp?: number;
}

interface LocationContextType {
  userLocation: LocationData | null;
  deliveryAvailable: boolean | null;
  setUserLocation: (location: LocationData | null) => void;
  setDeliveryAvailable: (available: boolean | null) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<LocationData | null>(null);
  const [deliveryAvailable, setDeliveryAvailableState] = useState<boolean | null>(null);

  useEffect(() => {
    // Load location from localStorage on mount
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        // Check if location is not too old (24 hours)
        const isRecent = (Date.now() - locationData.timestamp) < 24 * 60 * 60 * 1000;
        if (isRecent) {
          setUserLocationState(locationData);
          setDeliveryAvailableState(locationData.isWithinDeliveryRadius);
        }
      } catch (error) {
        console.error("Error parsing saved location:", error);
      }
    }
  }, []);

  const setUserLocation = (location: LocationData | null) => {
    setUserLocationState(location);
    if (location) {
      // Save to localStorage with timestamp
      const locationWithTimestamp = {
        ...location,
        timestamp: Date.now()
      };
      localStorage.setItem('userLocation', JSON.stringify(locationWithTimestamp));
    }
  };

  const setDeliveryAvailable = (available: boolean | null) => {
    setDeliveryAvailableState(available);
    if (available !== null && userLocation) {
      // Update localStorage with delivery status
      const locationWithTimestamp = {
        ...userLocation,
        isWithinDeliveryRadius: available,
        timestamp: Date.now()
      };
      localStorage.setItem('userLocation', JSON.stringify(locationWithTimestamp));
    }
  };

  const clearLocation = () => {
    setUserLocationState(null);
    setDeliveryAvailableState(null);
    localStorage.removeItem('userLocation');
  };

  return (
    <LocationContext.Provider value={{
      userLocation,
      deliveryAvailable,
      setUserLocation,
      setDeliveryAvailable,
      clearLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
