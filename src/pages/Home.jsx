import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import PlaceCard from '../components/PlaceCard';
import { getNearbyPlaces } from '../services/nearbyPlaces';
import { isBusinessRegistered, getBusinessQueueData, getCommunityReports, getPrediction } from '../services/firestore';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [userLocation, setUserLocation] = useState(null);


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

  // Step 2: Load real places from Google Places API when location is available
  useEffect(() => {
    const loadPlaces = async () => {
      if (!userLocation) return;

      try {
        setLoading(true);
        console.log('🏥 Loading places from Overpass API for location:', userLocation);

        // Get places from Overpass API (0-5km radius)
        const nearbyPlaces = await getNearbyPlaces(userLocation.lat, userLocation.lng, 5000); // 5km radius

        console.log('✅ Received places from Overpass API:', nearbyPlaces.length);
        console.log('🏥 Nearby places:', nearbyPlaces.map(p => p.name).join(', '));

        // Enrich places with queue information
        const enrichedPlaces = await Promise.all(nearbyPlaces.map(async (place) => {
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
        }));

        setPlaces(enrichedPlaces);
      } catch (error) {
        console.error('Error loading places:', error);
        setLocationError(`Failed to load places: ${error.message}. Please check your Google Places API configuration.`);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [userLocation]);

  // Places are already sorted by distance in fetchNearbyPlaces

  const filtered = places.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Hospitals') return p.type === 'Hospital';
    if (activeFilter === 'Salons') return p.type === 'Salon';
    if (activeFilter === 'Banks') return p.type === 'Bank';
    if (activeFilter === 'Restaurants') return p.type === 'Restaurant' || p.type === 'Cafe';
    if (activeFilter === 'Markets') return p.type === 'Market' || p.type === 'Supermarket' || p.category === 'shop';
    if (activeFilter === 'Popular Places') return ['Tourist Attraction', 'Theatre', 'Cinema', 'Museum', 'Park'].includes(p.type);
    if (activeFilter === 'Clinics') return p.name.toLowerCase().includes('clinic') || p.type === 'Doctor';
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

  return (
    <div className="">
      <Hero />

      <section className="container mx-auto px-4 py-8 ">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            {userLocation ? 'Nearby Places' : 'Places Near You'}
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
          {['All', 'Hospitals', 'Restaurants', 'Salons', 'Markets', 'Popular Places', 'Banks', 'Clinics'].map(filter => (
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
                px-6 py-3 rounded-xl text-sm font-semibold transition-all 
                duration-200 shadow-sm select-none focus:outline-none 
                focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 
                relative z-20 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 scale-105'
                  : 'bg-background-accent text-text-secondary hover:bg-background hover:text-text hover:shadow-md active:scale-95'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No places found</h3>
            <p className="text-gray-600">
              {activeFilter === 'All'
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
