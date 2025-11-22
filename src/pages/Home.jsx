import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import PlaceCard from '../components/PlaceCard';
import { isBusinessRegistered, getBusinessQueueData, getCommunityReports, getPrediction } from '../services/firestore';
import { calculateDistance } from '../utils/formatters';

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

  // Step 2: Load places and sort by distance when location is available
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);

        // Mock places with coordinates (replace with your database data)
        const mockPlaces = [
          {
            id: 'place_1',
            name: 'City General Hospital',
            type: 'Hospital',
            address: '123 Medical Center Dr, Sector 28',
            lat: 28.4595 + 0.01, // ~1km away
            lng: 77.0266 + 0.01,
            category: 'hospital'
          },
          {
            id: 'place_2',
            name: 'Downtown Bistro',
            type: 'Restaurant',
            address: '456 Main Street, Sector 29',
            lat: 28.4595 - 0.005, // ~0.5km away
            lng: 77.0266 + 0.008,
            category: 'restaurant'
          },
          {
            id: 'place_3',
            name: 'National Bank',
            type: 'Bank',
            address: '789 Finance Ave, Sector 30',
            lat: 28.4595 + 0.008, // ~1km away
            lng: 77.0266 - 0.005,
            category: 'bank'
          },
          {
            id: 'place_4',
            name: 'Elegant Cuts Salon',
            type: 'Salon',
            address: '321 Beauty Blvd, Sector 31',
            lat: 28.4595 - 0.003, // ~0.3km away
            lng: 77.0266 - 0.007,
            category: 'salon'
          },
          {
            id: 'place_5',
            name: 'Health Pharmacy',
            type: 'Pharmacy',
            address: '654 Health Street, Sector 32',
            lat: 28.4595 + 0.006, // ~0.8km away
            lng: 77.0266 + 0.004,
            category: 'pharmacy'
          },
          {
            id: 'place_6',
            name: 'Fitness Center',
            type: 'Gym',
            address: '987 Workout Way, Sector 33',
            lat: 28.4595 - 0.002, // ~0.2km away
            lng: 77.0266 + 0.006,
            category: 'gym'
          }
        ];

        // Enrich places with queue information
        const enrichedPlaces = await Promise.all(mockPlaces.map(async (place) => {
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
        setLocationError('Failed to load places. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, []);

  // Step 3: Sort places by distance when user location is available
  useEffect(() => {
    if (!userLocation || places.length === 0) return;

    const updated = places.map(place => ({
      ...place,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.lat,
        place.lng
      )
    }));

    const sorted = updated.sort((a, b) => a.distance - b.distance);
    setPlaces(sorted);
  }, [userLocation]); // Only depend on userLocation, not places.length

  const filtered = places.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Hospitals') return p.type === 'Hospital';
    if (activeFilter === 'Salons') return p.type === 'Salon';
    if (activeFilter === 'Banks') return p.type === 'Bank';
    if (activeFilter === 'Restaurants') return p.type === 'Restaurant';
    if (activeFilter === 'Clinics') return p.name.toLowerCase().includes('clinic');
    return true;
  });

  if (loading) {
    return (
      <div className="">
        <Hero />
        <section className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Finding places near you...</p>
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
          {['All', 'Hospitals', 'Salons', 'Banks', 'Clinics', 'Restaurants'].map(filter => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>
    </div>
  );
}
