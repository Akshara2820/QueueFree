import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

// Get all places
export const getPlaces = async () => {
  const placesRef = collection(db, 'places');
  const snapshot = await getDocs(placesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Get AI prediction (simplified)
export const getPrediction = (place) => {
  const hour = new Date().getHours();
  // Simple logic: busy during lunch/dinner, weekends
  const day = new Date().getDay();
  let busy = false;
  if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21) || day === 0 || day === 6) {
    busy = true;
  }
  return {
    level: busy ? 'busy' : 'normal',
    waitTime: busy ? '20-30 mins' : '10-15 mins'
  };
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