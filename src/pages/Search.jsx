import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceCard from '../components/PlaceCard';
import { searchPlacesByName, getCurrentLocation } from '../services/nearbyPlaces';
import { isBusinessRegistered, getBusinessQueueData, getCommunityReports, getPrediction } from '../services/firestore';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState('');

  // Get user location on mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn('Could not get location for search:', error);
        // Continue without location - search will still work globally
      }
    };
    loadLocation();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [query]);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // Search for places when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setPlaces([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        console.log('🔍 Searching for places:', debouncedQuery);
        const searchResults = await searchPlacesByName(debouncedQuery, userLocation);

        // Enrich search results with queue information
        const enrichedPlaces = await Promise.all(searchResults.map(async (place) => {
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
        console.error('Search error:', error);
        setError(`Failed to search places: ${error.message}`);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, userLocation]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Search Places</h1>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto md:mx-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
            placeholder="Search for places by name..."
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {loading && debouncedQuery && (
          <p className="text-sm text-gray-600 text-center mt-2">
            🔍 Searching for "{debouncedQuery}"...
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for places...</p>
          <p className="text-sm text-gray-500 mt-2">Using FREE OpenStreetMap data</p>
        </div>
      )}

      {/* Search Results */}
      {!loading && !error && (
        <>
          {places.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  Found {places.length} place{places.length !== 1 ? 's' : ''} for "{debouncedQuery}"
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {places.map(place => <PlaceCard key={place.id} place={place} />)}
              </div>
            </>
          ) : debouncedQuery ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 13l-6-6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No places found</h3>
              <p className="text-gray-600">
                No places found matching "{debouncedQuery}". Try a different search term or check your spelling.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Places</h3>
              <p className="text-gray-600">
                Enter a place name above to search across OpenStreetMap data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
