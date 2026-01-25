"use client";
import { useState, useEffect, useRef } from "react";
import "./ZomatoLocationModal.css";

const DELIVERY_CENTER = {
  lat: 26.420157668819858,
  lng: 80.36262485130308
};

const DELIVERY_RADIUS_KM = 7;

export default function LocationModal({ isOpen, onClose, onLocationSet }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [showPopularLocalities, setShowPopularLocalities] = useState(false);
  
  const searchInputRef = useRef(null);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const modalRef = useRef(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);

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

  // Initialize Google Maps services (for search only, no map display)
  const initializeServices = () => {
    if (!window.google) return;

    // Initialize autocomplete service for search
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    geocoder.current = new window.google.maps.Geocoder();
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
    
    if (!geocoder.current) return;
    
    // Get place details using Geocoder
    geocoder.current.geocode(
      { placeId: place.place_id },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            address: results[0].formatted_address,
            place_id: results[0].place_id
          };
          
          // Set location without map
          setSelectedAddress(location);
          checkDeliveryAvailability(location);
          setSearchQuery(results[0].formatted_address);
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
        if (!geocoder.current) {
          geocoder.current = new window.google.maps.Geocoder();
        }
        
        geocoder.current.geocode({ location }, (results, status) => {
          setCurrentLocationLoading(false);
          if (status === 'OK' && results[0]) {
            const detectedLocation = {
              lat: location.lat,
              lng: location.lng,
              address: results[0].formatted_address,
              place_id: results[0].place_id
            };
            setSelectedAddress(detectedLocation);
            checkDeliveryAvailability(detectedLocation);
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
    if (selectedAddress) {
      // Check if delivery is available (within 6km radius)
      if (deliveryStatus && deliveryStatus.available === false) {
        alert(`⚠️ This location is ${deliveryStatus.distance || 'too far'} km away.\n\nWe only deliver within ${DELIVERY_RADIUS_KM}km radius from our restaurant.\n\nPlease choose a different location.`);
        return;
      }

      onLocationSet({
        lat: selectedAddress.lat,
        lng: selectedAddress.lng,
        address: selectedAddress.address,
        isWithinDeliveryRadius: deliveryStatus?.available !== false,
        distance: deliveryStatus?.distance,
        duration: deliveryStatus?.duration,
        durationMinutes: deliveryStatus?.durationMinutes,
        deliveryStatus: deliveryStatus
      });
      onClose();
    }
  };

  // Load Google Maps script (for search services only)
  useEffect(() => {
    if (isOpen && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.onload = initializeServices;
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else if (isOpen && window.google) {
      setTimeout(initializeServices, 100);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original body overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original overflow when modal closes
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedAddress(null);
      setSearchResults([]);
      setDeliveryStatus(null);
    }
  }, [isOpen]);

  // Drag to close functionality
  const handleDragStart = (e) => {
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    dragStartY.current = clientY;
    isDragging.current = true;
    if (modalRef.current) {
      modalRef.current.style.transition = 'none';
    }
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    const deltaY = clientY - dragStartY.current;
    
    // Only allow dragging down
    if (deltaY > 0 && modalRef.current) {
      dragCurrentY.current = deltaY;
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (modalRef.current) {
      modalRef.current.style.transition = 'transform 0.3s ease-out';
      
      // If dragged down more than 100px, close the modal
      if (dragCurrentY.current > 100) {
        modalRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Otherwise, snap back
        modalRef.current.style.transform = 'translateY(0)';
      }
      
      dragCurrentY.current = 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="zomato-location-modal-overlay"
      onClick={(e) => {
        // Close when clicking overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="zomato-location-modal"
      >
        {/* Drag Handle */}
        <div 
          className="modal-drag-handle"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        ></div>

        {/* Header */}
        <div className="zomato-modal-header">
          <h2>Choose a Location</h2>
          <button className="close-button" onClick={onClose} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Delivery Tab (Only) */}
        <div className="delivery-tab-container">
          <div className="delivery-tab active">
            Delivery
          </div>
        </div>

        {/* Restaurant Location Info */}
        <div className="restaurant-location-info">
          <div className="restaurant-icon">🏪</div>
          <div className="restaurant-details">
            <div className="restaurant-name">The Quisine - Cloud Kitchen And Caterers</div>
            <div className="delivery-radius">We deliver within 7 km radius</div>
          </div>
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
            
            {/* Current Location Button - Inside search bar */}
            <button
              className="current-location-btn-inline"
              onClick={getCurrentLocation}
              disabled={currentLocationLoading}
              title="Use current location"
            >
              {currentLocationLoading ? (
                <div className="spinner-small"></div>
              ) : (
                <svg className="location-target-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none"/>
                  <line x1="12" y1="0.5" x2="12" y2="3.5" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="12" y1="20.5" x2="12" y2="23.5" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="0.5" y1="12" x2="3.5" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="20.5" y1="12" x2="23.5" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
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

        {/* Selected Address and Delivery Status */}
        {selectedAddress && (
          <div className="address-status-section">
            {/* Selected Address - Single Line */}
            <div className="selected-address-compact">
              <div className="location-icon">📍</div>
              <div className="address-text">{selectedAddress.address}</div>
            </div>
          </div>
        )}

        {/* Bottom Action */}
        <div className="modal-actions">
          <button 
            className="save-address-btn"
            onClick={handleSaveAddress}
            disabled={!selectedAddress || (deliveryStatus && deliveryStatus.available === false)}
            style={{
              backgroundColor: (deliveryStatus && deliveryStatus.available === false) ? '#ccc' : '',
              cursor: (deliveryStatus && deliveryStatus.available === false) ? 'not-allowed' : 'pointer'
            }}
          >
            {(deliveryStatus && deliveryStatus.available === false) 
              ? '❌ Outside Delivery Area' 
              : 'Save address'}
          </button>
        </div>
      </div>
    </div>
  );
}