"use client";
import { useState, useEffect, useRef } from "react";
import "./ZomatoLocationModal.css";

const DELIVERY_CENTER = {
  lat: 26.4201563,
  lng: 80.3600507
};

const DELIVERY_RADIUS_KM = 7;

export default function LocationModal({ isOpen, onClose, onLocationSet }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [showPopularLocalities, setShowPopularLocalities] = useState(false);
  
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  // Popular localities in delivery areas
  const popularLocalities = [
    { name: "Sector 15, Noida", type: "🏙️ Popular Area", place_id: "sector-15-noida" },
    { name: "Connaught Place, Delhi", type: "🏙️ Popular Area", place_id: "cp-delhi" },
    { name: "Cyber City, Gurgaon", type: "🏙️ Popular Area", place_id: "cyber-city-gurgaon" },
    { name: "Gomti Nagar, Lucknow", type: "🏙️ Popular Area", place_id: "gomti-nagar-lucknow" },
    { name: "Civil Lines, Kanpur", type: "🏙️ Popular Area", place_id: "civil-lines-kanpur" },
    { name: "Hazratganj, Lucknow", type: "🏙️ Popular Area", place_id: "hazratganj-lucknow" },
    { name: "Karol Bagh, Delhi", type: "🏙️ Popular Area", place_id: "karol-bagh-delhi" },
    { name: "Indirapuram, Ghaziabad", type: "🏙️ Popular Area", place_id: "indirapuram-ghaziabad" }
  ];

  // Initialize Google Maps and services
  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapOptions = {
      zoom: 13,
      center: DELIVERY_CENTER,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      },
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // Initialize services
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    placesService.current = new window.google.maps.places.PlacesService(newMap);

    // Add delivery center marker
    new window.google.maps.Marker({
      position: DELIVERY_CENTER,
      map: newMap,
      title: "The Quisine - Delivery Center",
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#ff6b35" stroke="white" stroke-width="3"/>
            <circle cx="15" cy="15" r="5" fill="white"/>
            <text x="15" y="18" text-anchor="middle" fill="#ff6b35" font-size="8" font-weight="bold">🏪</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(30, 30)
      }
    });

    // Add delivery radius circle
    new window.google.maps.Circle({
      strokeColor: "#ff6b35",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#ff6b35",
      fillOpacity: 0.1,
      map: newMap,
      center: DELIVERY_CENTER,
      radius: DELIVERY_RADIUS_KM * 1000, // Convert km to meters
    });

    // Add click listener for map
    newMap.addListener('click', (event) => {
      const clickedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      
      // Reverse geocode the clicked location
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: clickedLocation }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setLocationOnMap({
            lat: clickedLocation.lat,
            lng: clickedLocation.lng,
            address: results[0].formatted_address,
            place_id: results[0].place_id
          });
        }
      });
    });
  };

  // Set location on map
  const setLocationOnMap = (location) => {
    setSelectedAddress(location);
    
    if (map) {
      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Add new marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.address,
        draggable: true,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="12" fill="#00c851" stroke="white" stroke-width="3"/>
              <circle cx="15" cy="15" r="5" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      // Handle marker drag
      newMarker.addListener('dragend', (event) => {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPosition }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const updatedLocation = {
              lat: newPosition.lat,
              lng: newPosition.lng,
              address: results[0].formatted_address,
              place_id: results[0].place_id
            };
            setSelectedAddress(updatedLocation);
            checkDeliveryAvailability(updatedLocation);
          }
        });
      });

      setMarker(newMarker);
      map.panTo({ lat: location.lat, lng: location.lng });
    }

    // Check delivery availability
    checkDeliveryAvailability(location);
  };

  // Check delivery availability using Google Distance Matrix API
  const checkDeliveryAvailability = (location) => {
    if (!window.google || !window.google.maps) {
      // Fallback to straight-line distance if Google Maps is not loaded
      const straightDistance = calculateStraightLineDistance(
        DELIVERY_CENTER.lat,
        DELIVERY_CENTER.lng,
        location.lat,
        location.lng
      );
      
      const isAvailable = straightDistance <= DELIVERY_RADIUS_KM;
      setDeliveryStatus({
        available: isAvailable,
        distance: straightDistance.toFixed(1),
        duration: 'Calculating...',
        message: isAvailable 
          ? `✅ Delivery available (~${straightDistance.toFixed(1)} km away)`
          : `❌ Outside delivery area (~${straightDistance.toFixed(1)} km away)`
      });
      return;
    }

    // Set loading state
    setDeliveryStatus({
      available: null,
      distance: null,
      duration: null,
      message: '🔄 Calculating delivery availability...',
      loading: true
    });

    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: [DELIVERY_CENTER],
      destinations: [{ lat: location.lat, lng: location.lng }],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
        const element = response.rows[0].elements[0];
        const distanceInKm = element.distance.value / 1000; // Convert meters to km
        const durationText = element.duration.text;
        const durationInMinutes = Math.round(element.duration.value / 60); // Convert seconds to minutes
        
        // Add 25 minutes for food preparation time
        const totalDurationMinutes = durationInMinutes + 25;
        const totalDurationText = `${totalDurationMinutes} mins (${durationText} drive + 25 mins prep)`;
        
        const isAvailable = distanceInKm <= DELIVERY_RADIUS_KM;
        
        setDeliveryStatus({
          available: isAvailable,
          distance: distanceInKm.toFixed(1),
          duration: totalDurationText,
          durationMinutes: totalDurationMinutes,
          message: isAvailable 
            ? `✅ Delivery available (${distanceInKm.toFixed(1)} km away, ${totalDurationText})`
            : `❌ Outside delivery area (${distanceInKm.toFixed(1)} km away, we deliver within ${DELIVERY_RADIUS_KM} km)`
        });
      } else {
        // Fallback to straight-line distance if Distance Matrix fails
        console.warn('Distance Matrix API failed, using straight-line distance');
        const straightDistance = calculateStraightLineDistance(
          DELIVERY_CENTER.lat,
          DELIVERY_CENTER.lng,
          location.lat,
          location.lng
        );
        
        // Estimate delivery time based on distance (assuming ~30 km/h average speed) + 25 mins prep
        const estimatedDriveMinutes = Math.round((straightDistance / 30) * 60); // 30 km/h average speed
        const totalEstimatedMinutes = estimatedDriveMinutes + 25; // Add 25 mins prep time
        
        const isAvailable = straightDistance <= DELIVERY_RADIUS_KM;
        setDeliveryStatus({
          available: isAvailable,
          distance: straightDistance.toFixed(1),
          duration: `~${totalEstimatedMinutes} mins (estimated with prep)`,
          durationMinutes: totalEstimatedMinutes,
          message: isAvailable 
            ? `✅ Delivery available (~${straightDistance.toFixed(1)} km away, ~${totalEstimatedMinutes} mins total)`
            : `❌ Outside delivery area (~${straightDistance.toFixed(1)} km away)`
        });
      }
    });
  };

  // Fallback: Calculate straight-line distance between two points (Haversine formula)
  const calculateStraightLineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate prediction priority for better sorting
  const calculatePredictionPriority = (prediction, searchValue) => {
    let priority = 0;
    const description = prediction.description.toLowerCase();
    const searchLower = searchValue.toLowerCase();
    
    // Higher priority for exact matches
    if (description.includes(searchLower)) {
      priority += 10;
    }
    
    // Higher priority for addresses vs establishments
    if (prediction.types.includes('street_address') || 
        prediction.types.includes('route') ||
        prediction.types.includes('subpremise')) {
      priority += 8;
    }
    
    // Priority for localities and areas
    if (prediction.types.includes('locality') || 
        prediction.types.includes('sublocality') ||
        prediction.types.includes('neighborhood')) {
      priority += 6;
    }
    
    // Boost results in delivery area (major cities)
    const deliveryCities = ['kanpur', 'lucknow', 'delhi', 'noida', 'gurgaon', 'ghaziabad'];
    if (deliveryCities.some(city => description.includes(city))) {
      priority += 5;
    }
    
    // Higher priority for main text matches
    if (prediction.structured_formatting?.main_text?.toLowerCase().includes(searchLower)) {
      priority += 7;
    }
    
    return priority;
  };
  
  // Extract locality information from prediction
  const extractLocalityInfo = (prediction) => {
    const types = prediction.types || [];
    
    if (types.includes('establishment')) {
      return '🏢 Business';
    } else if (types.includes('street_address')) {
      return '🏠 Address';
    } else if (types.includes('locality')) {
      return '🏙️ City';
    } else if (types.includes('sublocality')) {
      return '📍 Area';
    } else if (types.includes('route')) {
      return '🛣️ Street';
    } else {
      return '📍 Location';
    }
  };

  // Handle search input with enhanced autocomplete
  const handleSearchInput = (value) => {
    setSearchQuery(value);
    
    // Show popular localities when search is empty or very short
    if (value.length === 0) {
      setSearchResults([]);
      setShowPopularLocalities(true);
      return;
    } else if (value.length <= 2) {
      // Filter popular localities based on search
      const filteredLocalities = popularLocalities.filter(locality =>
        locality.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filteredLocalities.slice(0, 4));
      setShowPopularLocalities(true);
      return;
    }
    
    setShowPopularLocalities(false);
    
    if (value.length > 2 && autocompleteService.current) {
      setIsSearching(true);
      
      // Enhanced autocomplete request with multiple prediction types
      const requestConfig = {
        input: value,
        componentRestrictions: { country: 'in' },
        types: ['address'], // Focus on addresses rather than just geocode
        fields: ['place_id', 'formatted_address', 'name', 'types'],
        // Bias results towards delivery center location
        locationBias: {
          center: DELIVERY_CENTER,
          radius: 50000 // 50km radius for better local results
        }
      };
      
      autocompleteService.current.getPlacePredictions(requestConfig, (predictions, status) => {
        setIsSearching(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Enhanced filtering and sorting of results
          const enhancedResults = predictions.map(prediction => ({
            ...prediction,
            // Add priority scoring for better sorting
            priority: calculatePredictionPriority(prediction, value),
            // Extract locality information
            locality: extractLocalityInfo(prediction)
          }))
          .sort((a, b) => b.priority - a.priority) // Sort by priority
          .slice(0, 8); // Limit to top 8 results
          
          setSearchResults(enhancedResults);
        } else {
          // If address search fails, try establishment search
          const fallbackConfig = {
            input: value,
            componentRestrictions: { country: 'in' },
            types: ['establishment', 'geocode'],
            locationBias: {
              center: DELIVERY_CENTER,
              radius: 50000
            }
          };
          
          autocompleteService.current.getPlacePredictions(fallbackConfig, (fallbackPredictions, fallbackStatus) => {
            if (fallbackStatus === window.google.maps.places.PlacesServiceStatus.OK) {
              setSearchResults(fallbackPredictions?.slice(0, 6) || []);
            } else {
              setSearchResults([]);
            }
          });
        }
      });
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Select a search result
  const selectSearchResult = (place) => {
    // Handle popular localities
    if (showPopularLocalities && place.place_id.includes('-')) {
      // For popular localities, search them using autocomplete
      setSearchQuery(place.name);
      handleSearchInput(place.name);
      setShowPopularLocalities(false);
      return;
    }
    
    if (!placesService.current) return;
    
    placesService.current.getDetails(
      { placeId: place.place_id },
      (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const location = {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
            address: result.formatted_address,
            place_id: result.place_id
          };
          
          setLocationOnMap(location);
          setSearchQuery(result.formatted_address);
          setSearchResults([]);
          setShowPopularLocalities(false);
        }
      }
    );
  };

  // Get current location
  const getCurrentLocation = () => {
    setCurrentLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          setCurrentLocationLoading(false);
          if (status === 'OK' && results[0]) {
            const detectedLocation = {
              lat: location.lat,
              lng: location.lng,
              address: results[0].formatted_address,
              place_id: results[0].place_id
            };
            setLocationOnMap(detectedLocation);
            setSearchQuery(detectedLocation.address);
          }
        });
      },
      (error) => {
        setCurrentLocationLoading(false);
        alert('Unable to get your current location. Please search for your address.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Save address
  const handleSaveAddress = () => {
    if (selectedAddress && deliveryStatus?.available) {
      onLocationSet({
        lat: selectedAddress.lat,
        lng: selectedAddress.lng,
        address: selectedAddress.address,
        isWithinDeliveryRadius: deliveryStatus.available,
        distance: deliveryStatus.distance,
        duration: deliveryStatus.duration,
        durationMinutes: deliveryStatus.durationMinutes
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
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else if (isOpen && window.google) {
      setTimeout(initializeMap, 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedAddress(null);
      setSearchResults([]);
      setDeliveryStatus(null);
      setMap(null);
      setMarker(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="zomato-location-modal-overlay">
      <div className="zomato-location-modal">
        {/* Header */}
        <div className="zomato-modal-header">
          <button className="back-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2>Select delivery location</h2>
          <button className="close-button" onClick={onClose} title="Close without selecting location">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-input-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="search-input"
            />
            {isSearching && (
              <div className="search-loading">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          {/* Enhanced Search Results */}
          {(searchResults.length > 0 || showPopularLocalities) && (
            <div className="search-results">
              {/* Popular Localities Section */}
              {showPopularLocalities && (
                <div className="popular-section">
                  <div className="popular-header">📍 Popular Localities</div>
                  {popularLocalities.map((locality, index) => (
                    <div
                      key={`popular-${index}`}
                      className="search-result-item popular-locality"
                      onClick={() => selectSearchResult({...locality, place_id: `popular-${index}`})}
                    >
                      <div className="result-icon-container">
                        <div className="result-icon">📍</div>
                        <div className="result-type">Popular</div>
                      </div>
                      <div className="result-text">
                        <div className="result-main">{locality.name}</div>
                        <div className="result-secondary">{locality.area}</div>
                      </div>
                      <div className="result-badge">
                        <span className="badge-text popular-badge">Popular</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Autocomplete Search Results */}
              {searchResults.map((place, index) => (
                <div
                  key={place.place_id}
                  className={`search-result-item ${place.priority > 10 ? 'high-priority' : ''}`}
                  onClick={() => selectSearchResult(place)}
                >
                  <div className="result-icon-container">
                    <div className="result-icon">
                      {place.types?.includes('establishment') ? '🏢' : 
                       place.types?.includes('street_address') ? '🏠' :
                       place.types?.includes('locality') ? '🏙️' :
                       place.types?.includes('sublocality') ? '📍' : '📍'}
                    </div>
                    <div className="result-type">{place.locality}</div>
                  </div>
                  <div className="result-text">
                    <div className="result-main">
                      {place.structured_formatting?.main_text || (place.description ? place.description.split(',')[0] : place.name || 'Unknown')}
                    </div>
                    <div className="result-secondary">
                      {place.structured_formatting?.secondary_text || 
                       (place.description ? place.description.split(',').slice(1).join(',').trim() : place.area || '')}
                    </div>
                  </div>
                  {place.priority > 15 && (
                    <div className="result-badge">
                      <span className="badge-text">Best Match</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Search Tips */}
              {!showPopularLocalities && (
                <div className="search-tips">
                  <div className="tips-header">💡 Search Tips:</div>
                  <div className="tips-list">
                    • Try searching by area name (e.g., "Sector 15")
                    • Include landmarks (e.g., "Near Metro Station")
                    • Search by building name or society
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="map-container">
          <div ref={mapRef} className="map"></div>
          
          {/* Map Overlay Instructions */}
          <div className="map-instruction">
            Move pin to your exact delivery location
          </div>

          {/* Current Location Button */}
          <button 
            className="current-location-btn"
            onClick={getCurrentLocation}
            disabled={currentLocationLoading}
          >
            {currentLocationLoading ? (
              <div className="btn-loading">
                <div className="spinner-small"></div>
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            )}
            Use current location
          </button>
        </div>

        {/* Delivery Details */}
        {selectedAddress && (
          <div className="delivery-details">
            <div className="selected-location">
              <div className="location-icon">📍</div>
              <div className="location-info">
                <div className="location-name">{selectedAddress.address.split(',')[0]}</div>
                <div className="location-full">{selectedAddress.address}</div>
              </div>
            </div>
            
            {deliveryStatus && (
              <div className={`delivery-status ${
                deliveryStatus.loading ? 'loading' : 
                (deliveryStatus.available ? 'available' : 'unavailable')
              }`}>
                <div className="status-message">{deliveryStatus.message}</div>
                {deliveryStatus.available && !deliveryStatus.loading && deliveryStatus.duration && (
                  <div className="delivery-details">
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">Distance: {deliveryStatus.distance} km</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏱️</span>
                      <span className="detail-text">ETA: {deliveryStatus.duration}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Action */}
        <div className="modal-actions">
          <button 
            className="save-address-btn"
            onClick={handleSaveAddress}
            disabled={!selectedAddress || !deliveryStatus?.available}
          >
            Save address
          </button>
        </div>
      </div>
    </div>
  );
}