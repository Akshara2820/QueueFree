import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import PlaceCard from '../components/PlaceCard';
import { getNearbyPlaces, searchPlacesByName } from '../services/nearbyPlaces';
import { isBusinessRegistered, getBusinessQueueData, getCommunityReports, getPrediction } from '../services/firestore';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);


  // Step 1: Get user's live location (FREE)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          // Store location for global access
          localStorage.setItem('userLocation', JSON.stringify(location));
        },
        (error) => {
          console.log("Location error:", error);
        }
      );
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Step 2: Load places when location is available or debounced search query changes
  useEffect(() => {
    const loadPlaces = async () => {
      if (!userLocation && !debouncedSearchQuery) return;

      try {
        setLoading(true);
        setIsSearching(!!searchQuery);

        if (debouncedSearchQuery) {
          console.log('🔍 Searching for places with query:', debouncedSearchQuery);
          // Search by name - use larger radius and filter by name
          const searchResults = await searchPlacesByName(debouncedSearchQuery, userLocation);
          console.log('✅ Search results:', searchResults.length);

          // Enrich search results with queue information
          const enrichedPlaces = await Promise.all(searchResults.map(async (place) => {
            return await enrichPlaceWithQueueInfo(place);
          }));

          setPlaces(enrichedPlaces);
        } else {
          console.log('🏥 Loading nearby places from Overpass API for location:', userLocation);

          // Get places from Overpass API (0-5km radius)
          const nearbyPlaces = await getNearbyPlaces(userLocation.lat, userLocation.lng, 5000); // 5km radius

          console.log('✅ Received places from Overpass API:', nearbyPlaces.length);
          console.log('🏥 Nearby places:', nearbyPlaces.map(p => p.name).join(', '));

          // Enrich places with queue information
          const enrichedPlaces = await Promise.all(nearbyPlaces.map(async (place) => {
            return await enrichPlaceWithQueueInfo(place);
          }));

          setPlaces(enrichedPlaces);
        }
      } catch (error) {
        console.error('Error loading places:', error);
        setLocationError(`Failed to load places: ${error.message}. Please check your internet connection.`);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    loadPlaces();
  }, [userLocation, debouncedSearchQuery]);

  // Helper function to enrich place with queue information
  const enrichPlaceWithQueueInfo = async (place) => {
    let queueInfo = {};

    try {
      // Check if business is registered in our system
      const registered = await isBusinessRegistered(place.id);
      if (registered) {
        const data = await getBusinessQueueData(place.id);
        queueInfo = {
          type: 'real',
          waitTime: data.waitTime,
          queueCount: data.queueCount
        };
      } else {
        // Check community reports
        const reports = await getCommunityReports(place.id);
        if (reports.length > 0) {
          const levels = reports.map(r => r.crowdLevel);
          const avgLevel = levels.reduce((a, b) => (a === 'high' ? 3 : a === 'medium' ? 2 : 1) + (b === 'high' ? 3 : b === 'medium' ? 2 : 1)) / levels.length;
          const level = avgLevel > 2.5 ? 'high' : avgLevel > 1.5 ? 'medium' : 'low';
          const confidence = Math.min(reports.length * 10, 100);
          queueInfo = {
            type: 'community',
            level,
            confidence,
            waitTime: level === 'high' ? '28-40 mins' : level === 'medium' ? '15-25 mins' : '5-10 mins'
          };
        } else {
          // Use prediction
          const pred = getPrediction(place);
          queueInfo = {
            type: 'prediction',
            level: pred.level,
            waitTime: pred.waitTime
          };
        }
      }
    } catch (error) {
      console.warn('Error getting queue info for place:', place.name, error);
      // Fallback to prediction
      const pred = getPrediction(place);
      queueInfo = {
        type: 'prediction',
        level: pred.level,
        waitTime: pred.waitTime
      };
    }

    return { ...place, queueInfo };
  };

  // Places are already sorted by distance in fetchNearbyPlaces

  const filtered = places.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Hospitals') return p.type === 'Hospital';
    if (activeFilter === 'Salons') return ['Salon', 'Beauty Parlor', 'Spa', 'Nail Salon', 'Tattoo Studio'].includes(p.type) ||
                                          p.name.toLowerCase().includes('salon') ||
                                          p.name.toLowerCase().includes('parlor') ||
                                          p.name.toLowerCase().includes('spa') ||
                                          p.name.toLowerCase().includes('beauty') ||
                                          p.name.toLowerCase().includes('nail') ||
                                          p.name.toLowerCase().includes('hair') ||
                                          p.name.toLowerCase().includes('groom') ||
                                          p.name.toLowerCase().includes('bride') ||
                                          p.name.toLowerCase().includes('mens') ||
                                          p.name.toLowerCase().includes('men\'s');
    if (activeFilter === 'Banks') return p.type === 'Bank';
    if (activeFilter === 'Restaurants') return p.type === 'Restaurant' || p.type === 'Cafe';
    if (activeFilter === 'Markets') return p.type === 'Market' || p.type === 'Supermarket' || p.category === 'shop';
    if (activeFilter === 'Popular Places') return ['Tourist Attraction', 'Theatre', 'Cinema', 'Museum', 'Park'].includes(p.type);
    if (activeFilter === 'Clinics') return ['Hospital', 'Clinic', 'Doctor', 'Pharmacy', 'Medical Store', 'Chemist'].includes(p.type) ||
                                          p.name.toLowerCase().includes('clinic') ||
                                          p.name.toLowerCase().includes('hospital') ||
                                          p.name.toLowerCase().includes('medical') ||
                                          p.name.toLowerCase().includes('pharmacy') ||
                                          p.name.toLowerCase().includes('chemist') ||
                                          p.name.toLowerCase().includes('drug') ||
                                          p.name.toLowerCase().includes('medicine') ||
                                          p.name.toLowerCase().includes('health') ||
                                          p.type === 'Doctor';
    if (activeFilter === 'Logistics') return ['Warehouse', 'Storage', 'Transport', 'Moving', 'Cargo', 'Office'].includes(p.type) ||
                                          p.name.toLowerCase().includes('logistic') ||
                                          p.name.toLowerCase().includes('transport') ||
                                          p.name.toLowerCase().includes('cargo') ||
                                          p.name.toLowerCase().includes('mover') ||
                                          p.name.toLowerCase().includes('packer') ||
                                          p.name.toLowerCase().includes('warehouse') ||
                                          p.name.toLowerCase().includes('storage');
    if (activeFilter === 'Quick Delivery') return p.name.toLowerCase().includes('blinkit') ||
                                                 p.name.toLowerCase().includes('grofers') ||
                                                 p.name.toLowerCase().includes('bigbasket') ||
                                                 p.name.toLowerCase().includes('swiggy') ||
                                                 p.name.toLowerCase().includes('zomato') ||
                                                 p.name.toLowerCase().includes('delivery') ||
                                                 p.name.toLowerCase().includes('quick commerce') ||
                                                 p.name.toLowerCase().includes('supply chain') ||
                                                 p.name.toLowerCase().includes('courier') ||
                                                 p.name.toLowerCase().includes('express') ||
                                                 p.type === 'Courier' ||
                                                 p.type === 'Delivery';
    return true;
  });

  if (loading) {
    return (
      <div className="">
        <Hero />
        <section className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Finding hospitals, restaurants, markets, and attractions near you...</p>
            <p className="text-sm text-gray-500 mt-2">Using FREE OpenStreetMap data within 5km radius</p>
          </div>
        </section>
      </div>
    );
  }

  // Handle search from Hero component
  const handleHeroSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="">
      <Hero onSearch={handleHeroSearch} />

      <section className="container mx-auto px-4 py-8 ">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            {debouncedSearchQuery
              ? `Search Results for "${debouncedSearchQuery}"`
              : userLocation
                ? 'Nearby Places'
                : 'Places Near You'
            }
          </h2>
          {locationError && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
              ⚠️ {locationError}
            </div>
          )}
        </div>

        {/* Step 5: Allow Location Popup */}
        {!userLocation && !locationError && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Enable Location Access</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Allow location access to see places sorted by distance from your current location.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-8 relative z-10">
          {['All', 'Hospitals', 'Restaurants', 'Salons', 'Markets', 'Popular Places', 'Banks', 'Clinics', 'Logistics', 'Quick Delivery'].map(filter => (
            <button
              key={filter}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Filter clicked:', filter);
                setActiveFilter(filter);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                duration-200 select-none focus:outline-none
                focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75
                relative z-20 ${
                activeFilter === filter
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              type="button"
              tabIndex={0}
              style={{ pointerEvents: 'auto' }}
            >
              {filter}
            </button>
          ))}
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No search results found' : 'No places found'}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? `No places found matching "${searchQuery}". Try a different search term.`
                : activeFilter === 'All'
                  ? "No places found in your area. Try refreshing or check your location permissions."
                  : `No ${activeFilter.toLowerCase()} found. Try a different category.`
              }
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
