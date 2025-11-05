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
      callback(null);
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: [{ lat: DELIVERY_CENTER.lat, lng: DELIVERY_CENTER.lng }],
      destinations: [{ lat: lat, lng: lng }],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
        const element = response.rows[0].elements[0];
        const distanceInKm = element.distance.value / 1000; // Convert meters to km
        const durationText = element.duration.text;
        const durationMinutes = Math.round(element.duration.value / 60);
        
        // Add 25 minutes for food preparation time
        const totalDurationMinutes = durationMinutes + 25;
        const totalDurationText = `${totalDurationMinutes} mins (${durationText} drive + 25 mins prep)`;
        
        callback({
          distance: distanceInKm.toFixed(2),
          duration: totalDurationText,
          available: distanceInKm <= DELIVERY_RADIUS_KM
        });
      } else {
        // Fallback to straight-line distance if Distance Matrix fails
        const straightDistance = calculateStraightLineDistance(
          DELIVERY_CENTER.lat, 
          DELIVERY_CENTER.lng, 
          lat, 
          lng
        );
        
        callback({
          distance: straightDistance.toFixed(2),
          duration: "Unknown",
          available: straightDistance <= DELIVERY_RADIUS_KM,
          fallback: true
        });
      }
    });
  };

  // Fallback: Calculate straight-line distance using Haversine formula
  const calculateStraightLineDistance = (lat1, lng1, lat2, lng2) => {
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

  // Check if delivery is available for given coordinates using real driving distance
  const checkDeliveryAvailability = (lat, lng) => {
    setDeliveryStatus({ loading: true });
    
    calculateRealDistance(lat, lng, (result) => {
      if (result) {
        setDeliveryStatus({
          available: result.available,
          distance: result.distance,
          duration: result.duration,
          fallback: result.fallback || false,
          loading: false
        });
      } else {
        setDeliveryStatus({
          available: false,
          distance: "Unknown",
          duration: "Unknown",
          error: true,
          loading: false
        });
      }
    });
  };

  // Initialize Google Map
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

      // Add new marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: "Your Location",
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="10" fill="#dd9933" stroke="white" stroke-width="3"/>
              <circle cx="15" cy="15" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });
      
      setMarker(newMarker);
      map.panTo({ lat: location.lat, lng: location.lng });
    }

    // Check delivery availability with real driving distance
    checkDeliveryAvailability(location.lat, location.lng);
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
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current Location"
        };

        // Try to get address from coordinates using reverse geocoding
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          try {
            const result = await new Promise((resolve, reject) => {
              geocoder.geocode(
                { location: { lat: location.lat, lng: location.lng } },
                (results, status) => {
                  if (status === "OK" && results[0]) {
                    resolve(results[0]);
                  } else {
                    reject(status);
                  }
                }
              );
            });
            location.address = result.formatted_address;
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
          }
        }

        setLocationOnMap(location);
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
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          selectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
          handleManualAddressSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  // Handle manual address geocoding (for when user types and presses enter without selecting suggestion)
  const handleManualAddressSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoadingLocation(true);
    setLocationError("");
    setShowSuggestions(false);

    if (!window.google || !window.google.maps) {
      setLocationError("Google Maps not loaded");
      setIsLoadingLocation(false);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { 
            address: searchInput,
            componentRestrictions: { country: "IN" }
          },
          (results, status) => {
            if (status === "OK" && results[0]) {
              resolve(results[0]);
            } else {
              reject(status);
            }
          }
        );
      });

      const location = {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        address: result.formatted_address
      };

      setLocationOnMap(location);
    } catch (error) {
      setLocationError("Address not found. Please try a different address.");
    }
    
    setIsLoadingLocation(false);
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
      setSearchInput("");
      setLocationError("");
      setDeliveryStatus(null);
      setMap(null);
      setMarker(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      // Clear any pending search timeout
      clearTimeout(window.searchTimeout);
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
              <div className="search-input-container">
                <input
                  ref={autocompleteRef}
                  type="text"
                  className="address-input"
                  placeholder="Search any address, area, or landmark in India..."
                  value={searchInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow for clicks
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  className="search-address-btn"
                  disabled={!searchInput.trim() || isLoadingLocation}
                >
                  🔍 Search
                </button>
                
                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id}
                        className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                        onClick={() => selectSuggestion(suggestion)}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-content">
                          <div className="suggestion-main">
                            {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                          </div>
                          <div className="suggestion-secondary">
                            {suggestion.structured_formatting?.secondary_text || 
                             suggestion.description.split(',').slice(1).join(',').trim()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Error Message */}
          {locationError && (
            <div className="error-message">
              ⚠️ {locationError}
            </div>
          )}

          {/* Map */}
          <div className="map-container">
            <div ref={mapRef} className="map"></div>
          </div>

          {/* Location Result */}
          {userLocation && (
            <div className="location-result">
              <div className="selected-location">
                <h4>Selected Location:</h4>
                <p>{userLocation.address}</p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  📍 Coordinates: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>

              {/* Delivery Center Info */}
              <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', fontSize: '14px' }}>
                <p style={{ margin: 0, color: '#1e40af' }}>
                  🏪 <strong>Our Kitchen:</strong> Shyam Nagar, Kanpur - 208013
                </p>
                <p style={{ margin: '4px 0 0 0', color: '#1e40af', fontSize: '12px' }}>
                  📍 {DELIVERY_CENTER.lat}, {DELIVERY_CENTER.lng}
                </p>
                <p style={{ margin: '4px 0 0 0', color: '#1e40af' }}>
                  🚚 <strong>Delivery Radius:</strong> {DELIVERY_RADIUS_KM} kilometers
                </p>
              </div>

              {deliveryStatus && (
                <div className={`delivery-status ${deliveryStatus.loading ? 'loading' : (deliveryStatus.available ? 'available' : 'unavailable')}`}>
                  {deliveryStatus.loading ? (
                    <div className="delivery-loading">
                      <span className="status-icon">🔄</span>
                      <div>
                        <strong>Calculating Distance...</strong>
                        <p>Getting real driving distance from Google Maps</p>
                      </div>
                    </div>
                  ) : deliveryStatus.error ? (
                    <div className="delivery-error">
                      <span className="status-icon">⚠️</span>
                      <div>
                        <strong>Unable to Calculate Distance</strong>
                        <p>Please try a different location or contact us directly</p>
                      </div>
                    </div>
                  ) : deliveryStatus.available ? (
                    <div className="delivery-available">
                      <span className="status-icon">✅</span>
                      <div>
                        <strong>Delivery Available!</strong>
                        <p>
                          <strong>Driving Distance:</strong> {deliveryStatus.distance} km from our kitchen
                          {deliveryStatus.duration && ` (${deliveryStatus.duration})`}
                        </p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>
                          Within {DELIVERY_RADIUS_KM}km delivery zone ✓
                          {deliveryStatus.fallback && " (Approximate distance)"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="delivery-unavailable">
                      <span className="status-icon">❌</span>
                      <div>
                        <strong>Delivery Not Available</strong>
                        <p>
                          <strong>Driving Distance:</strong> {deliveryStatus.distance} km from our kitchen
                          {deliveryStatus.duration && ` (${deliveryStatus.duration})`}
                        </p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>
                          Outside {DELIVERY_RADIUS_KM}km delivery zone ✗
                          {deliveryStatus.fallback && " (Approximate distance)"}
                        </p>
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
            disabled={!userLocation || !deliveryStatus || deliveryStatus.loading}
          >
            {deliveryStatus?.loading ? "Calculating..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
