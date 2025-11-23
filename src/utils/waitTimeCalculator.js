/**
 * Realistic Wait Time Calculator for QueueFree App
 * Generates dynamic wait times based on multiple factors
 * Completely FREE - no external APIs required
 */

// Haversine formula for distance calculation
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Base wait times by place type (in minutes)
const BASE_WAIT_TIMES = {
  'Hospital': { min: 15, max: 45 },
  'Clinic': { min: 10, max: 25 },
  'Doctor': { min: 12, max: 30 },
  'Dentist': { min: 15, max: 35 },
  'Pharmacy': { min: 8, max: 18 },
  'Medical Store': { min: 5, max: 15 },
  'Chemist': { min: 6, max: 16 },
  'Restaurant': { min: 10, max: 25 },
  'Cafe': { min: 8, max: 20 },
  'Salon': { min: 5, max: 15 },
  'Beauty Parlor': { min: 8, max: 20 },
  'Spa': { min: 15, max: 35 },
  'Nail Salon': { min: 10, max: 25 },
  'Tattoo Studio': { min: 12, max: 30 },
  'Market': { min: 20, max: 45 },
  'Supermarket': { min: 15, max: 35 },
  'Mall': { min: 25, max: 50 },
  'Bank': { min: 12, max: 30 },
  'Pharmacy': { min: 8, max: 18 },
  'Gym': { min: 10, max: 25 },
  'Theatre': { min: 15, max: 35 },
  'Cinema': { min: 20, max: 40 },
  'Park': { min: 5, max: 15 },
  'Warehouse': { min: 10, max: 25 },
  'Post Office': { min: 8, max: 20 },
  'School': { min: 5, max: 15 },
  'University': { min: 8, max: 20 },
  'Library': { min: 3, max: 10 },
  'Museum': { min: 12, max: 28 },
  'Shop': { min: 5, max: 15 },
  'Clinic': { min: 10, max: 25 },
  'Doctor': { min: 12, max: 30 },
  'Industrial': { min: 8, max: 18 },
  'Office': { min: 6, max: 16 },
  'Transport': { min: 8, max: 20 },
  'Moving Company': { min: 15, max: 35 },
  'Logistics': { min: 10, max: 25 },
  'Delivery': { min: 5, max: 15 },
  'Courier': { min: 8, max: 18 },
  'Tourist Attraction': { min: 10, max: 30 },
  'Leisure': { min: 8, max: 20 }
};

// Time of day adjustments (in minutes)
const getTimeOfDayAdjustment = (currentHour) => {
  if (currentHour >= 6 && currentHour <= 10) {
    return -10; // Morning - less busy
  } else if (currentHour >= 17 && currentHour <= 21) {
    return +20; // Evening peak hours
  } else if (currentHour >= 22 || currentHour <= 5) {
    return -5; // Late night - very quiet
  }
  return 0; // Normal hours (11 AM - 4 PM)
};

// Weekend adjustment
const getWeekendAdjustment = (isWeekend) => {
  return isWeekend ? +15 : 0;
};

// Distance-based adjustment
const getDistanceAdjustment = (distance) => {
  if (distance < 1) {
    return +5; // Very close - popular area
  } else if (distance > 5) {
    return -5; // Far away - less crowded
  }
  return 0; // Normal distance (1-5km)
};

// Popularity score adjustment
const getPopularityAdjustment = (popularityScore) => {
  if (popularityScore > 10) {
    return +20; // Very popular
  } else if (popularityScore >= 5) {
    return +10; // Moderately popular
  }
  return 0; // Not very popular
};

// Generate fallback popularity score
const generatePopularityScore = () => {
  return Math.floor(Math.random() * 10) + 3; // Random 3-12
};

// Determine crowd level based on final wait time
const determineCrowdLevel = (avgWaitTime) => {
  if (avgWaitTime <= 12) return 'Low';
  if (avgWaitTime <= 25) return 'Medium';
  return 'High';
};

// Check if current time is peak hours
const isPeakHours = (currentHour) => {
  return currentHour >= 17 && currentHour <= 21; // 5 PM - 9 PM
};

/**
 * Calculate realistic wait time for a place
 * @param {Object} place - Place object with type, lat, lng, popularityScore
 * @param {Object} userLocation - User location with lat, lng
 * @returns {Object} Wait time data with level, min, max, label, emoji, isPeakHours
 */
export const calculateWaitTime = (place, userLocation) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = currentDay === 0 || currentDay === 6;

  // Get base wait time for place type
  const placeType = place.type || 'Shop';
  const baseTime = BASE_WAIT_TIMES[placeType] || BASE_WAIT_TIMES['Shop'];

  // Calculate distance
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    place.location.lat,
    place.location.lng
  );

  // Get popularity score (use provided or generate random)
  const popularityScore = place.popularityScore || place.rating * 2.5 || generatePopularityScore();

  // Calculate all adjustments
  const timeAdjustment = getTimeOfDayAdjustment(currentHour);
  const weekendAdjustment = getWeekendAdjustment(isWeekend);
  const distanceAdjustment = getDistanceAdjustment(distance);
  const popularityAdjustment = getPopularityAdjustment(popularityScore);

  // Calculate final wait time range
  let minWait = baseTime.min + timeAdjustment + weekendAdjustment + distanceAdjustment + popularityAdjustment;
  let maxWait = baseTime.max + timeAdjustment + weekendAdjustment + distanceAdjustment + popularityAdjustment;

  // Ensure minimum wait time is at least 1 minute
  minWait = Math.max(1, Math.round(minWait));
  maxWait = Math.max(minWait + 2, Math.round(maxWait)); // Ensure max > min

  // Calculate average for crowd level determination
  const avgWaitTime = (minWait + maxWait) / 2;
  const crowdLevel = determineCrowdLevel(avgWaitTime);
  const peakHours = isPeakHours(currentHour);

  // Generate emoji based on crowd level
  const emoji = {
    'Low': '🟢',
    'Medium': '🟡',
    'High': '🔴'
  }[crowdLevel];

  // Create label
  const label = `${minWait}–${maxWait} min`;

  return {
    level: crowdLevel,
    min: minWait,
    max: maxWait,
    label,
    emoji,
    isPeakHours: peakHours,
    // Additional metadata for debugging/transparency
    adjustments: {
      base: baseTime,
      timeOfDay: timeAdjustment,
      weekend: weekendAdjustment,
      distance: distanceAdjustment,
      popularity: popularityAdjustment
    }
  };
};

// Export utility functions for testing/debugging
export {
  calculateDistance,
  BASE_WAIT_TIMES,
  getTimeOfDayAdjustment,
  getWeekendAdjustment,
  getDistanceAdjustment,
  getPopularityAdjustment,
  determineCrowdLevel,
  isPeakHours
};