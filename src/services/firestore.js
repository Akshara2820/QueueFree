import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { calculateDistance } from '../utils/formatters';
import { calculateWaitTime } from '../utils/waitTimeCalculator';

// Get all places
export const getPlaces = async () => {
  const placesRef = collection(db, 'places');
  const snapshot = await getDocs(placesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Fetch nearby places with proximity filtering (Firestore approach)
// Since Firestore doesn't support native geographic queries, we:
// 1. Fetch all places from Firestore
// 2. Calculate distance using Haversine formula
// 3. Filter by radius and sort by distance
export const fetchNearbyPlaces = async (userLocation, radiusKm = 5) => {
  try {
    // Fetch all places from Firestore (assuming we have a places collection)
    const placesRef = collection(db, 'places');
    const snapshot = await getDocs(placesRef);

    const allPlaces = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter places within radius and calculate distances
    const nearbyPlaces = allPlaces
      .filter(place => {
        // Assuming places have lat/lng fields in Firestore
        if (!place.lat || !place.lng) return false;

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.lat,
          place.lng
        );

        // Add distance to place object
        place.distance = distance;
        return distance <= radiusKm;
      })
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return nearbyPlaces;
  } catch (error) {
    console.error('Error fetching nearby places from Firestore:', error);
    throw error;
  }
};

// Check if business is registered
export const isBusinessRegistered = async (placeId) => {
  const businessRef = collection(db, 'businesses');
  const q = query(businessRef, where('placeId', '==', placeId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Get business queue data
export const getBusinessQueueData = async (placeId) => {
  const businessRef = collection(db, 'businesses');
  const q = query(businessRef, where('placeId', '==', placeId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data();
  }
  return null;
};

// Get community reports for a place
export const getCommunityReports = async (placeId) => {
  const reportsRef = collection(db, 'reports');
  const q = query(reportsRef, where('placeId', '==', placeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

// Submit a community report
export const submitReport = async (placeId, crowdLevel, userId) => {
  await addDoc(collection(db, 'reports'), {
    placeId,
    crowdLevel, // 'low', 'medium', 'high'
    timestamp: new Date(),
    userId
  });
};

// Get AI prediction using realistic wait time calculator
export const getPrediction = (place, userLocation = { lat: 0, lng: 0 }) => {
  try {
    // Use the realistic wait time calculator
    const waitTimeData = calculateWaitTime(place, userLocation);

    // Convert to the expected format for backward compatibility
    return {
      level: waitTimeData.level.toLowerCase(), // 'low', 'medium', 'high'
      waitTime: waitTimeData.label, // '12-25 min'
      crowdLevel: waitTimeData.level, // 'Low', 'Medium', 'High'
      emoji: waitTimeData.emoji, // 🟢🟡🔴
      isPeakHours: waitTimeData.isPeakHours
    };
  } catch (error) {
    console.warn('Error calculating wait time, using fallback:', error);
    // Fallback to simple logic if calculator fails
    const hour = new Date().getHours();
    const day = new Date().getDay();
    let busy = false;
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21) || day === 0 || day === 6) {
      busy = true;
    }
    return {
      level: busy ? 'high' : 'low',
      waitTime: busy ? '20-30 mins' : '10-15 mins',
      crowdLevel: busy ? 'High' : 'Low',
      emoji: busy ? '🔴' : '🟢',
      isPeakHours: busy
    };
  }
};

// Book appointment
export const bookAppointment = async (placeId, userId, time) => {
  await addDoc(collection(db, 'bookings'), {
    placeId,
    userId,
    time,
    status: 'pending'
  });
};