"use client";
import { useState, useEffect, useRef } from "react";
import "./LocationModal.css";

const DELIVERY_CENTER = {
  lat: 26.4201563,
  lng: 80.3600507
};

const DELIVERY_RADIUS_KM = 7;

export default function LocationModal({ isOpen, onClose, onLocationSet }) {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const mapRef = useRef(null);

  // Calculate real driving distance using Google Distance Matrix API
  const calculateRealDistance = (lat, lng, callback) => {
    if (!window.google || !window.google.maps) {
      callback(null, "Google Maps not loaded");
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [new window.google.maps.LatLng(lat, lng)],
      destinations: [new window.google.maps.LatLng(DELIVERY_CENTER.lat, DELIVERY_CENTER.lng)],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
        const element = response.rows[0].elements[0];
        const distanceKm = element.distance.value / 1000;
        const durationText = element.duration.text;
        const durationMinutes = Math.round(element.duration.value / 60);
        
        // Add 25 minutes for food preparation time
        const totalDurationMinutes = durationMinutes + 25;
        const totalDurationText = `${totalDurationMinutes} mins (${durationText} drive + 25 mins prep)`;
        
        callback({
          distance: distanceKm.toFixed(2),
          duration: totalDurationText,
          durationMinutes: totalDurationMinutes,
          available: distanceKm <= DELIVERY_RADIUS_KM
        }, null);
      } else {
        callback(null, "Unable to calculate distance");
      }
    });
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapOptions = {
      zoom: 12,
      center: DELIVERY_CENTER,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // Add delivery center marker
    const deliveryMarker = new window.google.maps.Marker({
      position: DELIVERY_CENTER,
      map: newMap,
      title: "The Quisine - Shyam Nagar, Kanpur (208013)",
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="15" fill="#124f31" stroke="white" stroke-width="4"/>
            <circle cx="20" cy="20" r="6" fill="white"/>
            <text x="20" y="24" text-anchor="middle" fill="white" font-size="8" font-weight="bold">🏪</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40)
      }
    });

    // Add info window for delivery center
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; font-family: Arial, sans-serif; min-width: 220px;">
          <h4 style="margin: 0 0 8px 0; color: #124f31; font-size: 16px;">🏪 The Quisine</h4>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #333; font-weight: 500;">
            Cloud Kitchen and Caterers in Kanpur
          </p>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
            📍 Shyam Nagar, Kanpur - 208013<br>
            📍 ${DELIVERY_CENTER.lat}, ${DELIVERY_CENTER.lng}
          </p>
          <p style="margin: 0; font-size: 12px; color: #666;">
            🚚 Delivery Radius: ${DELIVERY_RADIUS_KM} km<br>
            📍 <a href="https://maps.google.com/?q=${DELIVERY_CENTER.lat},${DELIVERY_CENTER.lng}" target="_blank" style="color: #124f31;">View on Google Maps</a>
          </p>
        </div>
      `
    });

    deliveryMarker.addListener('click', () => {
      infoWindow.open(newMap, deliveryMarker);
    });
  };

  // Set location on map and check delivery availability
  const setLocationOnMap = (location) => {
    setUserLocation(location);
    setLocationError("");
    
    if (map) {
      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Add new marker for user location
      const newMarker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.address,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="10" fill="#4285F4" stroke="white" stroke-width="3"/>
              <circle cx="15" cy="15" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      setMarker(newMarker);
      
      // Center map on user location
      map.panTo({ lat: location.lat, lng: location.lng });
      
      // Check delivery availability
      setDeliveryStatus({ loading: true, isAvailable: null, distance: null });
      
      calculateRealDistance(location.lat, location.lng, (result, error) => {
        if (error) {
          setDeliveryStatus({ 
            loading: false, 
            isAvailable: false, 
            distance: null,
            duration: null,
            error: error 
          });
        } else {
          setDeliveryStatus({ 
            loading: false, 
            isAvailable: result.available, 
            distance: result.distance,
            duration: result.duration,
            durationMinutes: result.durationMinutes
          });
        }
      });
    }
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError("");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Use Google Geocoding to get address from coordinates
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === "OK" && results[0]) {
                const location = {
                  lat: latitude,
                  lng: longitude,
                  address: results[0].formatted_address
                };
                setLocationOnMap(location);
              } else {
                const location = {
                  lat: latitude,
                  lng: longitude,
                  address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                };
                setLocationOnMap(location);
              }
              setIsLoadingLocation(false);
            }
          );
        } else {
          const location = {
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          };
          setLocationOnMap(location);
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const handleConfirmLocation = () => {
    if (userLocation && deliveryStatus && !deliveryStatus.loading) {
      // Set the user's location
      onLocationSet({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: userLocation.address,
        isWithinDeliveryRadius: deliveryStatus.isAvailable,
        distance: deliveryStatus.distance
      });
      
      // Save to localStorage for persistence
      localStorage.setItem('userLocation', JSON.stringify({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: userLocation.address,
        timestamp: Date.now()
      }));
      
      onClose();
    }
  };

  // Load Google Maps script
  useEffect(() => {
    if (isOpen && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    } else if (isOpen && window.google) {
      // Small delay to ensure DOM is ready
      setTimeout(initializeMap, 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUserLocation(null);
      setLocationError("");
      setDeliveryStatus(null);
      setMap(null);
      setMarker(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal">
        {/* Modal Header */}
        <div className="location-modal-header">
          <h2>📍 Set Your Delivery Location</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Error Display */}
        {locationError && (
          <div className="error-message">
            ⚠️ {locationError}
          </div>
        )}

        {/* Location Status */}
        {deliveryStatus && !deliveryStatus.loading && (
          <div className={`delivery-status ${deliveryStatus.isAvailable ? 'available' : 'unavailable'}`}>
            {deliveryStatus.isAvailable ? (
              <span>✅ Great! We deliver to your area (Distance: {deliveryStatus.distance} km)</span>
            ) : (
              <span>❌ Sorry, we don't deliver to this area yet (Distance: {deliveryStatus.distance} km from our kitchen)</span>
            )}
          </div>
        )}

        {deliveryStatus && deliveryStatus.loading && (
          <div className="delivery-status loading">
            🔄 Checking delivery availability...
          </div>
        )}

        <div className="location-modal-content">
          {/* Current Location Section */}
          <div className="location-section">
            <h3>📱 Use Current Location</h3>
            <p>We'll use your device's GPS to detect your exact location</p>
            <button 
              className="current-location-btn" 
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? "🔄 Getting Location..." : "📍 Use My Current Location"}
            </button>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <h3>🗺️ Location Map</h3>
            <div className="map-container">
              <div ref={mapRef} className="map" style={{ height: "300px", width: "100%" }}></div>
            </div>
            {userLocation && (
              <div className="selected-location">
                <p><strong>Selected Location:</strong></p>
                <p>📍 {userLocation.address}</p>
                <p>🌍 {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="location-modal-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="confirm-btn"
            onClick={handleConfirmLocation}
            disabled={!userLocation || !deliveryStatus || deliveryStatus.loading}
          >
            {deliveryStatus?.loading ? "Calculating..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
