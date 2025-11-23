import { useState, useEffect } from 'react';
import { getNearbyPlaces, getCurrentLocation } from '../services/nearbyPlaces';
import { isBusinessRegistered, getBusinessQueueData, getCommunityReports, getPrediction } from '../services/firestore';
import { calculateCrowdScore } from '../services/crowdService';

export function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's location
        const userLocation = await getCurrentLocation();

        // Fetch places from Overpass API (use larger radius for "all places" page)
        const nearbyPlaces = await getNearbyPlaces(userLocation.lat, userLocation.lng, 15000); // 15km radius

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
                const pred = getPrediction(place, userLocation);
                queueInfo = {
                  type: 'prediction',
                  level: pred.crowdLevel.toLowerCase(),
                  waitTime: pred.waitTime
                };
              }
            }
          } catch (error) {
            console.warn('Error getting queue info for place:', place.name, error);
            // Fallback to prediction
            const pred = getPrediction(place, userLocation);
            queueInfo = {
              type: 'prediction',
              level: pred.crowdLevel.toLowerCase(),
              waitTime: pred.waitTime
            };
          }

          // Calculate crowd score for the place
          const crowdData = await calculateCrowdScore(place.id, place.type, userLocation, place.business_status);

          return {
            ...place,
            queueInfo,
            crowdData
          };
        }));

        setPlaces(enrichedPlaces);
      } catch (error) {
        console.error('Error loading places:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, []);

  return { places, loading, error };
}