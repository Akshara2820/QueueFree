/**
 * Crowd Level Service for QueueFree App
 * FREE crowd estimation using user reports, time patterns, and device density
 */

import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

// Static crowd prediction data based on place type, day of week, and hour
const CROWD_PATTERNS = {
  'Restaurant': {
    weekday: {
      7: 40, 8: 55, 9: 70, 10: 80, 11: 85, 12: 95, 13: 98, 14: 92, 15: 85, 16: 75,
      17: 80, 18: 90, 19: 100, 20: 95, 21: 85, 22: 70, 23: 50, 0: 30, 1: 15, 2: 10, 3: 5, 4: 5, 5: 5, 6: 20
    },
    weekend: {
      7: 35, 8: 50, 9: 65, 10: 75, 11: 85, 12: 95, 13: 100, 14: 98, 15: 95, 16: 90, 17: 85,
      18: 95, 19: 100, 20: 97, 21: 90, 22: 80, 23: 60, 0: 40, 1: 25, 2: 15, 3: 10, 4: 5, 5: 5, 6: 15
    }
  },
  'Cafe': {
    weekday: {
      7: 25, 8: 45, 9: 65, 10: 75, 11: 80, 12: 70, 13: 60, 14: 55, 15: 60, 16: 70, 17: 75, 18: 80,
      19: 70, 20: 60, 21: 45, 22: 30, 23: 15, 0: 10, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 15
    },
    weekend: {
      7: 15, 8: 25, 9: 40, 10: 60, 11: 75, 12: 80, 13: 75, 14: 70, 15: 75, 16: 80, 17: 85, 18: 80,
      19: 75, 20: 65, 21: 50, 22: 35, 23: 20, 0: 15, 1: 10, 2: 5, 3: 5, 4: 5, 5: 5, 6: 10
    }
  },
  'Mall': {
    weekday: {
      7: 15, 8: 25, 9: 35, 10: 55, 11: 75, 12: 85, 13: 90, 14: 95, 15: 100, 16: 98, 17: 95, 18: 90,
      19: 80, 20: 65, 21: 45, 22: 25, 23: 15, 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 10
    },
    weekend: {
      7: 20, 8: 35, 9: 50, 10: 70, 11: 85, 12: 95, 13: 100, 14: 98, 15: 95, 16: 92, 17: 88, 18: 85,
      19: 80, 20: 70, 21: 55, 22: 35, 23: 20, 0: 15, 1: 10, 2: 5, 3: 5, 4: 5, 5: 5, 6: 15
    }
  },
  'Gym': {
    weekday: {
      5: 20, 6: 40, 7: 60, 8: 75, 9: 65, 10: 50, 11: 40, 12: 35, 13: 30, 14: 25, 15: 30, 16: 35, 17: 50,
      18: 70, 19: 80, 20: 85, 21: 75, 22: 60, 23: 40, 0: 20, 1: 10, 2: 5, 3: 5, 4: 10
    },
    weekend: {
      6: 15, 7: 30, 8: 50, 9: 70, 10: 80, 11: 85, 12: 80, 13: 75, 14: 70, 15: 75, 16: 80, 17: 85, 18: 90,
      19: 85, 20: 75, 21: 65, 22: 50, 23: 30, 0: 15, 1: 10, 2: 5, 3: 5, 4: 5, 5: 10
    }
  },
  'Park': {
    weekday: {
      5: 5, 6: 15, 7: 25, 8: 20, 9: 15, 10: 10, 11: 15, 12: 20, 13: 25, 14: 30, 15: 35, 16: 40, 17: 50,
      18: 60, 19: 70, 20: 65, 21: 50, 22: 30, 23: 15, 0: 5, 1: 5, 2: 5, 3: 5, 4: 5
    },
    weekend: {
      6: 10, 7: 25, 8: 40, 9: 60, 10: 75, 11: 85, 12: 90, 13: 95, 14: 90, 15: 85, 16: 80, 17: 75, 18: 70,
      19: 65, 20: 55, 21: 40, 22: 25, 23: 15, 0: 10, 1: 5, 2: 5, 3: 5, 4: 5, 5: 10
    }
  },
  'Bank': {
    weekday: {
      9: 40, 10: 60, 11: 75, 12: 85, 13: 80, 14: 70, 15: 60, 16: 50, 17: 30, 18: 15,
      0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 19: 5, 20: 5, 21: 5, 22: 5, 23: 5
    },
    weekend: {
      0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5, 21: 5, 22: 5, 23: 5
    }
  },
  'Hospital': {
    weekday: {
      0: 30, 1: 25, 2: 20, 3: 15, 4: 20, 5: 30, 6: 45, 7: 60, 8: 75, 9: 85, 10: 90, 11: 85, 12: 80, 13: 75,
      14: 70, 15: 75, 16: 80, 17: 85, 18: 90, 19: 85, 20: 75, 21: 65, 22: 55, 23: 45
    },
    weekend: {
      0: 35, 1: 30, 2: 25, 3: 20, 4: 25, 5: 35, 6: 50, 7: 65, 8: 75, 9: 80, 10: 85, 11: 80, 12: 75, 13: 70,
      14: 75, 15: 80, 16: 85, 17: 80, 18: 75, 19: 70, 20: 65, 21: 55, 22: 50, 23: 45
    }
  }
};

// Default pattern for places not in CROWD_PATTERNS
const DEFAULT_PATTERN = {
  weekday: {
    6: 10, 7: 20, 8: 35, 9: 50, 10: 60, 11: 70, 12: 75, 13: 70, 14: 65, 15: 60, 16: 65, 17: 70, 18: 75,
    19: 70, 20: 60, 21: 45, 22: 30, 23: 20, 0: 10, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5
  },
  weekend: {
    6: 5, 7: 15, 8: 25, 9: 40, 10: 55, 11: 65, 12: 70, 13: 75, 14: 70, 15: 65, 16: 70, 17: 75, 18: 70,
    19: 65, 20: 55, 21: 40, 22: 25, 23: 15, 0: 10, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5
  }
};

/**
 * Submit a crowd level report for a place
 * @param {string} placeId - Unique place identifier
 * @param {string} userId - User ID
 * @param {string} crowdLevel - 'low', 'moderate', 'high', 'very_high'
 * @returns {Promise<Object>} Report data
 */
export const submitCrowdReport = async (placeId, userId, crowdLevel) => {
  try {
    const reportData = {
      placeId,
      userId,
      crowdLevel,
      timestamp: Timestamp.now(),
      // Convert to numeric for easier averaging
      crowdScore: crowdLevel === 'low' ? 25 :
                  crowdLevel === 'moderate' ? 50 :
                  crowdLevel === 'high' ? 75 : 100
    };

    await addDoc(collection(db, 'crowdReports'), reportData);

    return {
      success: true,
      message: 'Crowd report submitted successfully',
      data: reportData
    };
  } catch (error) {
    console.error('Error submitting crowd report:', error);
    throw new Error('Failed to submit crowd report');
  }
};

/**
 * Get crowd reports for a place (last 20 reports)
 * @param {string} placeId - Place identifier
 * @returns {Promise<Array>} Array of crowd reports
 */
export const getCrowdReports = async (placeId) => {
  try {
    const reportsRef = collection(db, 'crowdReports');
    const q = query(
      reportsRef,
      where('placeId', '==', placeId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching crowd reports:', error);
    return [];
  }
};

/**
 * Calculate time-based crowd prediction
 * @param {string} placeType - Type of place (Restaurant, Cafe, etc.)
 * @param {number} hour - Current hour (0-23)
 * @param {number} dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns {number} Crowd score (0-100)
 */
export const getTimeBasedCrowdPrediction = (placeType, hour, dayOfWeek) => {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const pattern = CROWD_PATTERNS[placeType] || DEFAULT_PATTERN;

  const dayPattern = isWeekend ? pattern.weekend : pattern.weekday;
  return dayPattern[hour] || 50; // Default to 50 if hour not found
};

/**
 * Calculate device density score (simplified - counts active users in area)
 * @param {Object} userLocation - User's current location
 * @returns {Promise<number>} Device density score (0-100)
 */
export const getDeviceDensityScore = async (userLocation) => {
  try {
    // This is a simplified implementation
    // In a real app, you'd track active users in the area
    // For now, return a random score based on time of day
    const hour = new Date().getHours();

    // Higher density during peak hours
    if (hour >= 11 && hour <= 14) return Math.floor(Math.random() * 30) + 70; // 70-100
    if (hour >= 17 && hour <= 21) return Math.floor(Math.random() * 25) + 60; // 60-85
    if (hour >= 9 && hour <= 16) return Math.floor(Math.random() * 20) + 40; // 40-60

    return Math.floor(Math.random() * 20) + 20; // 20-40 for off-peak
  } catch (error) {
    console.error('Error calculating device density:', error);
    return 30; // Default moderate density
  }
};

/**
 * Calculate comprehensive crowd score for a place
 * @param {string} placeId - Place identifier
 * @param {string} placeType - Type of place
 * @param {Object} userLocation - User's location for device density
 * @returns {Promise<Object>} Crowd analysis data
 */
export const calculateCrowdScore = async (placeId, placeType, userLocation, businessStatus = 'OPERATIONAL') => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // If place is closed, return low crowd level
    if (businessStatus !== 'OPERATIONAL') {
      return {
        score: 15,        // Very low score for closed places
        level: 'Low',
        emoji: '🟢',
        color: 'green',
        components: {
          userReports: 0,
          timePrediction: 15,
          deviceDensity: 10
        },
        reportsCount: 0,
        lastUpdated: now.toISOString(),
        isClosed: true,
        reason: 'Place is currently closed'
      };
    }

    console.log('🏪 Place is OPEN, calculating normal crowd level');

    // 1. Get user reports (60% weight)
    const reports = await getCrowdReports(placeId);
    const userReportsScore = reports.length > 0
      ? reports.reduce((sum, report) => sum + report.crowdScore, 0) / reports.length
      : 50; // Default if no reports

    // 2. Get time-based prediction (30% weight)
    const timePredictionScore = getTimeBasedCrowdPrediction(placeType, hour, dayOfWeek);

    // 3. Get device density (10% weight)
    const deviceDensityScore = await getDeviceDensityScore(userLocation);

    // 4. Calculate final weighted score
    const finalScore = Math.round(
      (userReportsScore * 0.6) +
      (timePredictionScore * 0.3) +
      (deviceDensityScore * 0.1)
    );

    // 5. Determine crowd level
    let crowdLevel, emoji, color;
    if (finalScore <= 30) {
      crowdLevel = 'Low';
      emoji = '🟢';
      color = 'green';
    } else if (finalScore <= 60) {
      crowdLevel = 'Moderate';
      emoji = '🟡';
      color = 'yellow';
    } else if (finalScore <= 80) {
      crowdLevel = 'High';
      emoji = '🟠';
      color = 'orange';
    } else {
      crowdLevel = 'Very High';
      emoji = '🔴';
      color = 'red';
    }

    return {
      score: finalScore,
      level: crowdLevel,
      emoji,
      color,
      components: {
        userReports: Math.round(userReportsScore),
        timePrediction: timePredictionScore,
        deviceDensity: deviceDensityScore
      },
      reportsCount: reports.length,
      lastUpdated: now.toISOString()
    };

  } catch (error) {
    console.error('Error calculating crowd score:', error);
    return {
      score: 50,
      level: 'Moderate',
      emoji: '🟡',
      color: 'yellow',
      components: {
        userReports: 50,
        timePrediction: 50,
        deviceDensity: 50
      },
      reportsCount: 0,
      error: error.message
    };
  }
};

/**
 * Subscribe to real-time crowd updates for a place
 * @param {string} placeId - Place identifier
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCrowdUpdates = (placeId, callback) => {
  const reportsRef = collection(db, 'crowdReports');
  const q = query(
    reportsRef,
    where('placeId', '==', placeId),
    orderBy('timestamp', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reports);
  }, (error) => {
    console.error('Error in crowd reports subscription:', error);
  });
};

/**
 * Get crowd level history for the last 24 hours
 * @param {string} placeId - Place identifier
 * @returns {Promise<Array>} Hourly crowd data for last 24 hours
 */
export const getCrowdHistory24h = async (placeId) => {
  try {
    const reportsRef = collection(db, 'crowdReports');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const q = query(
      reportsRef,
      where('placeId', '==', placeId),
      where('timestamp', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    // Group by hour and calculate average
    const hourlyData = {};
    reports.forEach(report => {
      const hour = report.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { total: 0, count: 0 };
      }
      hourlyData[hour].total += report.crowdScore;
      hourlyData[hour].count += 1;
    });

    // Convert to array format for charts
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData[hour];
      result.push({
        hour,
        crowdScore: data ? Math.round(data.total / data.count) : null,
        reportsCount: data ? data.count : 0
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching crowd history:', error);
    return [];
  }
};

// Export crowd level constants
export const CROWD_LEVELS = {
  LOW: { min: 0, max: 30, label: 'Low', emoji: '🟢', color: 'green' },
  MODERATE: { min: 31, max: 60, label: 'Moderate', emoji: '🟡', color: 'yellow' },
  HIGH: { min: 61, max: 80, label: 'High', emoji: '🟠', color: 'orange' },
  VERY_HIGH: { min: 81, max: 100, label: 'Very High', emoji: '🔴', color: 'red' }
};