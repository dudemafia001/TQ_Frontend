"use client";
import { useState, useEffect } from "react";
import "./LocationModal.css";

const DELIVERY_CENTER = {
  lat: 26.4201327,
  lng: 80.2802241
};

const DELIVERY_RADIUS_KM = 7;

export default function LocationModalSimple({ isOpen, onClose, onLocationSet }) {
  const [userLocation, setUserLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Check if delivery is available for given coordinates
  const checkDeliveryAvailability = (lat, lng) => {
    const distance = calculateDistance(
      DELIVERY_CENTER.lat, 
      DELIVERY_CENTER.lng, 
      lat, 
      lng
    );
    return {
      available: distance <= DELIVERY_RADIUS_KM,
      distance: distance.toFixed(2)
    };
  };

  // Set location and check delivery availability
  const setLocationData = (location) => {
    setUserLocation(location);
    setLocationError("");
    
    // Check delivery availability
    const deliveryCheck = checkDeliveryAvailability(location.lat, location.lng);
    setDeliveryStatus(deliveryCheck);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
        };

        setLocationData(location);
        setIsLoadingLocation(false);
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

  // Handle manual address (simplified - using sample coordinates for testing)
  const handleManualAddressSubmit = (e) => {
    e.preventDefault();
    if (!manualAddress.trim()) return;

    setIsLoadingLocation(true);
    setLocationError("");

    // Simulate geocoding with some sample locations near your delivery center
    const sampleLocations = {
      "kanpur": { lat: 26.4499, lng: 80.3319 },
      "lucknow": { lat: 26.8467, lng: 80.9462 },
      "delhi": { lat: 28.6139, lng: 77.2090 },
      "mumbai": { lat: 19.0760, lng: 72.8777 }
    };

    // Find closest match or use default coordinates for testing
    const searchTerm = manualAddress.toLowerCase();
    let location = null;

    for (const [city, coords] of Object.entries(sampleLocations)) {
      if (searchTerm.includes(city)) {
        location = {
          lat: coords.lat,
          lng: coords.lng,
          address: manualAddress
        };
        break;
      }
    }

    if (!location) {
      // Default to Kanpur area for testing
      location = {
        lat: 26.4499 + (Math.random() - 0.5) * 0.1, // Random nearby location
        lng: 80.3319 + (Math.random() - 0.5) * 0.1,
        address: manualAddress
      };
    }

    setTimeout(() => {
      setLocationData(location);
      setIsLoadingLocation(false);
    }, 1000); // Simulate API delay
  };

  // Confirm location and close modal
  const handleConfirmLocation = () => {
    if (userLocation && deliveryStatus) {
      onLocationSet({
        location: userLocation,
        deliveryAvailable: deliveryStatus.available,
        distance: deliveryStatus.distance
      });
      onClose();
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUserLocation(null);
      setManualAddress("");
      setLocationError("");
      setDeliveryStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal">
        <div className="location-modal-header">
          <h2>Set Your Delivery Location</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="location-modal-content">
          {/* Current Location Section */}
          <div className="location-section">
            <h3>Use Current Location</h3>
            <button 
              className={`current-location-btn ${isLoadingLocation ? 'loading' : ''}`}
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <>
                  <div className="spinner"></div>
                  Getting Location...
                </>
              ) : (
                <>
                  📍 Use My Current Location
                </>
              )}
            </button>
          </div>

          {/* Manual Address Section */}
          <div className="location-section">
            <h3>Or Enter Address Manually</h3>
            <form onSubmit={handleManualAddressSubmit}>
              <input
                type="text"
                className="address-input"
                placeholder="Enter city (try: Kanpur, Lucknow, Delhi, Mumbai)..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
              <button 
                type="submit" 
                className="search-address-btn"
                disabled={!manualAddress.trim() || isLoadingLocation}
              >
                🔍 Search Address
              </button>
            </form>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Note: This is a demo version. Enter any city name to test delivery availability.
            </p>
          </div>

          {/* Error Message */}
          {locationError && (
            <div className="error-message">
              ⚠️ {locationError}
            </div>
          )}

          {/* Simple Map Placeholder */}
          <div className="map-container">
            <div className="map-placeholder">
              <div className="map-info">
                <h4>🗺️ Delivery Area Map</h4>
                <p><strong>Delivery Center:</strong> Kanpur (26.42°N, 80.28°E)</p>
                <p><strong>Delivery Radius:</strong> 7 kilometers</p>
                {userLocation && (
                  <p><strong>Your Location:</strong> {userLocation.address}</p>
                )}
                <div className="map-legend">
                  <div className="legend-item">
                    <span className="legend-dot delivery-center"></span>
                    <span>Delivery Center</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot delivery-area"></span>
                    <span>7km Delivery Area</span>
                  </div>
                  {userLocation && (
                    <div className="legend-item">
                      <span className="legend-dot user-location"></span>
                      <span>Your Location</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location Result */}
          {userLocation && (
            <div className="location-result">
              <div className="selected-location">
                <h4>Selected Location:</h4>
                <p>{userLocation.address}</p>
              </div>

              {deliveryStatus && (
                <div className={`delivery-status ${deliveryStatus.available ? 'available' : 'unavailable'}`}>
                  {deliveryStatus.available ? (
                    <div className="delivery-available">
                      <span className="status-icon">✅</span>
                      <div>
                        <strong>Delivery Available!</strong>
                        <p>Distance: {deliveryStatus.distance} km from our kitchen</p>
                      </div>
                    </div>
                  ) : (
                    <div className="delivery-unavailable">
                      <span className="status-icon">❌</span>
                      <div>
                        <strong>Delivery Not Available</strong>
                        <p>Distance: {deliveryStatus.distance} km (We deliver within {DELIVERY_RADIUS_KM} km only)</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
            disabled={!userLocation || !deliveryStatus}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
