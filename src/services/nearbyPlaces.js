// Overpass API service for fetching nearby places (FREE OpenStreetMap data)
// Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
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

// Amenity type mapping for Overpass queries and display
const AMENITY_TYPES = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  doctors: 'Doctor',
  dentist: 'Dentist',
  pharmacy: 'Pharmacy',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  hairdresser: 'Salon',
  beauty: 'Beauty Parlor',
  spa: 'Spa',
  tattoo: 'Tattoo Studio',
  nails: 'Nail Salon',
  shop: 'Shop',
  marketplace: 'Market',
  supermarket: 'Supermarket',
  mall: 'Mall',
  pharmacy: 'Pharmacy',
  bank: 'Bank',
  atm: 'ATM',
  fuel: 'Gas Station',
  school: 'School',
  university: 'University',
  library: 'Library',
  theatre: 'Theatre',
  cinema: 'Cinema',
  museum: 'Museum',
  park: 'Park',
  tourism: 'Tourist Attraction',
  leisure: 'Leisure',
  office: 'Office',
  warehouse: 'Warehouse',
  storage: 'Storage',
  transport: 'Transport',
  moving_company: 'Moving Company',
  logistics: 'Logistics',
  delivery: 'Delivery',
  courier: 'Courier',
  post_office: 'Post Office'
};

// Build Overpass query for nearby amenities
const buildOverpassQuery = (lat, lng, radius) => {
  const amenityKeys = Object.keys(AMENITY_TYPES).join('|');

  const query = `
    [out:json][timeout:30];
    (
      // Core amenities
      node["amenity"~"${amenityKeys}"](around:${radius},${lat},${lng});
      way["amenity"~"${amenityKeys}"](around:${radius},${lat},${lng});
      relation["amenity"~"${amenityKeys}"](around:${radius},${lat},${lng});

      // Healthcare facilities
      node["healthcare"](around:${radius},${lat},${lng});
      way["healthcare"](around:${radius},${lat},${lng});

      // Shops and commercial
      node["shop"](around:${radius},${lat},${lng});
      way["shop"](around:${radius},${lat},${lng});

      // Tourism and leisure
      node["tourism"](around:${radius},${lat},${lng});
      way["tourism"](around:${radius},${lat},${lng});

      // Additional places
      node["leisure"](around:${radius},${lat},${lng});
      way["leisure"](around:${radius},${lat},${lng});
      node["office"](around:${radius},${lat},${lng});
      way["office"](around:${radius},${lat},${lng});

      // Beauty and wellness services
      node["beauty"](around:${radius},${lat},${lng});
      way["beauty"](around:${radius},${lat},${lng});
      node["spa"](around:${radius},${lat},${lng});
      way["spa"](around:${radius},${lat},${lng});
      node["tattoo"](around:${radius},${lat},${lng});
      way["tattoo"](around:${radius},${lat},${lng});
      node["nails"](around:${radius},${lat},${lng});
      way["nails"](around:${radius},${lat},${lng});

      // Logistics and storage
      node["warehouse"](around:${radius},${lat},${lng});
      way["warehouse"](around:${radius},${lat},${lng});
      node["industrial"](around:${radius},${lat},${lng});
      way["industrial"](around:${radius},${lat},${lng});

      // Delivery and courier services
      node["post_office"](around:${radius},${lat},${lng});
      way["post_office"](around:${radius},${lat},${lng});
    );
    out center meta;
  `;

  return query.trim();
};

// Parse Overpass response and normalize data
const parseOverpassResponse = (data, userLat, userLng) => {
  const places = [];

  if (!data.elements || !Array.isArray(data.elements)) {
    return places;
  }

  data.elements.forEach(element => {
    // Get coordinates (nodes have direct lat/lng, ways/relations have center)
    let lat, lng;
    if (element.type === 'node') {
      lat = element.lat;
      lng = element.lon;
    } else if (element.center) {
      lat = element.center.lat;
      lng = element.center.lon;
    } else {
      return; // Skip if no coordinates
    }

    // Get tags
    const tags = element.tags || {};

    // Determine amenity type
    let amenityType = 'Unknown';
    let category = 'business';

    if (tags.amenity && AMENITY_TYPES[tags.amenity]) {
      amenityType = AMENITY_TYPES[tags.amenity];
      category = tags.amenity;
    } else if (tags.healthcare && tags.healthcare === 'clinic') {
      amenityType = 'Clinic';
      category = 'clinic';
    } else if (tags.healthcare && tags.healthcare === 'doctor') {
      amenityType = 'Doctor';
      category = 'doctors';
    } else if (tags.healthcare && tags.healthcare === 'dentist') {
      amenityType = 'Dentist';
      category = 'dentist';
    } else if (tags.shop && AMENITY_TYPES[tags.shop]) {
      amenityType = AMENITY_TYPES[tags.shop];
      category = tags.shop;
    } else if (tags.shop) {
      amenityType = tags.shop.charAt(0).toUpperCase() + tags.shop.slice(1);
      category = 'shop';
    } else if (tags.tourism && AMENITY_TYPES[tags.tourism]) {
      amenityType = AMENITY_TYPES[tags.tourism];
      category = tags.tourism;
    } else if (tags.tourism) {
      amenityType = 'Tourist Attraction';
      category = 'tourism';
    } else if (tags.warehouse) {
      amenityType = 'Warehouse';
      category = 'warehouse';
    } else if (tags.industrial) {
      amenityType = 'Industrial';
      category = 'industrial';
    } else if (tags.post_office) {
      amenityType = 'Post Office';
      category = 'post_office';
    } else if (tags.beauty) {
      amenityType = 'Beauty Parlor';
      category = 'beauty';
    } else if (tags.spa) {
      amenityType = 'Spa';
      category = 'spa';
    } else if (tags.tattoo) {
      amenityType = 'Tattoo Studio';
      category = 'tattoo';
    } else if (tags.nails) {
      amenityType = 'Nail Salon';
      category = 'nails';
    }

    // Get name (handle missing names)
    const name = tags.name || tags['name:en'] || `Unnamed ${amenityType}`;

    // Skip places with "Unnamed" names
    if (name.startsWith('Unnamed')) {
      return;
    }

    // Calculate distance
    const distance = calculateDistance(userLat, userLng, lat, lng);

    // Generate unique ID
    const id = `${element.type}_${element.id}`;

    // Get opening hours and business status
    const { isOpen, openingHours } = getBusinessStatus(tags, name);

    // Get description
    const description = tags.description || tags['description:en'] || generateDescription(amenityType, tags);

    // Get rating (OSM doesn't have ratings, generate based on place type and completeness)
    const rating = generateRating(tags, amenityType);

    places.push({
      id,
      name,
      type: amenityType,
      address: tags['addr:full'] ||
               (tags['addr:housenumber'] && tags['addr:street']
                 ? `${tags['addr:housenumber']} ${tags['addr:street']}`
                 : tags['addr:housenumber'] || tags['addr:street'] || 'Address not available'),
      location: { lat, lng },
      distance: distance.toFixed(1),
      rating,
      business_status: isOpen ? 'OPERATIONAL' : 'CLOSED',
      opening_hours: openingHours,
      description,
      category,
      tags // Keep original tags for additional processing
    });
  });

  return places;
};

// Enhanced business hours logic with formatted display
const getBusinessStatus = (tags, placeName) => {
  const openingHours = tags.opening_hours;
  const amenity = tags.amenity;
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // minutes since midnight

  // Handle 24/7 places
  if (openingHours && openingHours.includes('24/7')) {
    return {
      isOpen: true,
      openingHours: '24/7'
    };
  }

  // Special handling for educational institutions
  if (amenity === 'school' || amenity === 'university' || amenity === 'college') {
    // Schools are typically closed on weekends and outside school hours
    if (currentDay === 0 || currentDay === 6) { // Sunday or Saturday
      return {
        isOpen: false,
        openingHours: openingHours || 'Typically Mon-Fri 8:00-16:00'
      };
    }

    // Check if within typical school hours (8 AM - 4 PM)
    const schoolStart = 8 * 60; // 8:00 AM
    const schoolEnd = 16 * 60; // 4:00 PM

    if (currentTime < schoolStart || currentTime > schoolEnd) {
      return {
        isOpen: false,
        openingHours: openingHours || 'Typically Mon-Fri 8:00-16:00'
      };
    }

    return {
      isOpen: true,
      openingHours: openingHours || 'Typically Mon-Fri 8:00-16:00'
    };
  }

  // Special handling for government offices and banks
  // Also check if placeName contains "bank" as fallback
  const isBank = amenity === 'bank' || placeName.toLowerCase().includes('bank') ||
                 placeName.toLowerCase().includes('banking') || tags.name?.toLowerCase().includes('bank');

  if (isBank || amenity === 'government' || tags.office === 'government') {
    // Government offices and banks are typically closed on weekends
    if (currentDay === 0 || currentDay === 6) { // Sunday or Saturday
      return {
        isOpen: false,
        openingHours: openingHours || 'Typically Mon-Fri 9:00-17:00'
      };
    }

    // Check if within typical business hours (9 AM - 5 PM)
    const businessStart = 9 * 60; // 9:00 AM
    const businessEnd = 17 * 60; // 5:00 PM

    if (currentTime < businessStart || currentTime > businessEnd) {
      return {
        isOpen: false,
        openingHours: openingHours || 'Typically Mon-Fri 9:00-17:00'
      };
    }
  }

  // If no opening hours specified, assume operational for most places
  if (!openingHours) {
    return {
      isOpen: true,
      openingHours: 'Hours not specified'
    };
  }

  // Parse OSM opening_hours format (simplified)
  // OSM uses format like: "Mo-Fr 09:00-17:00; Sa 09:00-12:00"
  try {
    const formatted = formatOpeningHours(openingHours);
    // For now, assume operational during parsing - could be enhanced with full parsing
    return {
      isOpen: true,
      openingHours: formatted
    };
  } catch (error) {
    return {
      isOpen: true,
      openingHours: 'Hours available'
    };
  }
};

// Format OSM opening_hours to readable format
const formatOpeningHours = (osmHours) => {
  if (!osmHours || osmHours === '24/7') return '24/7';

  // Split by semicolon for different time periods
  const periods = osmHours.split(';').map(p => p.trim()).filter(p => p);

  const formattedPeriods = periods.map(period => {
    // Handle formats like "Mo-Fr 09:00-17:00" or "09:00-17:00"
    const parts = period.split(' ');
    if (parts.length === 1) {
      // Just time range like "09:00-17:00"
      return formatTimeRange(parts[0]);
    } else {
      // Day and time like "Mo-Fr 09:00-17:00"
      const timePart = parts[parts.length - 1];
      return formatTimeRange(timePart);
    }
  });

  return formattedPeriods.join(', ');
};

// Format time range from OSM format to readable format
const formatTimeRange = (timeRange) => {
  if (!timeRange.includes('-')) return timeRange;

  const [start, end] = timeRange.split('-');

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return minutes ? `${displayHour}:${minutes}${ampm}` : `${displayHour}${ampm}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
};

// Retry function with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('429') && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`⏳ Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Main function to get nearby places
export const getNearbyPlaces = async (lat, lng, radius = 5000) => {
  try {
    console.log('🌍 Fetching places from Overpass API...', { lat, lng, radius });

    const query = buildOverpassQuery(lat, lng, radius);
    console.log('🔍 Overpass Query:', query);

    const fetchPlaces = async () => {
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'QueueFree-App/1.0'
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('429'); // Special error for rate limiting
        }
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
      }

      return response;
    };

    const response = await retryWithBackoff(fetchPlaces, 3, 2000); // 3 retries, 2s base delay
    const data = await response.json();
    console.log('✅ Overpass API response:', data.elements?.length || 0, 'elements');

    const places = parseOverpassResponse(data, lat, lng);

    // Remove duplicates and sort by distance, limit to top 50
    const deduplicatedPlaces = removeDuplicatePlaces(places);
    const sortedPlaces = deduplicatedPlaces
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, 50);

    console.log('📍 Processed places:', sortedPlaces.length);

    return sortedPlaces;

  } catch (error) {
    console.error('❌ Error fetching places from Overpass:', error);

    // If it's a rate limit error, provide helpful message
    if (error.message.includes('429')) {
      throw new Error('Overpass API is temporarily rate limited. Please wait a moment and try again.');
    }

    throw new Error(`Failed to fetch nearby places: ${error.message}`);
  }
};

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Generate sample description based on place type
const generateDescription = (type, tags) => {
  const descriptions = {
    'Hospital': 'Medical facility providing healthcare services and emergency care.',
    'Clinic': 'Medical clinic offering general healthcare and consultations.',
    'Doctor': 'Medical practitioner providing healthcare services and treatments.',
    'Dentist': 'Dental clinic offering teeth care and oral health services.',
    'Pharmacy': 'Medical store providing medicines and healthcare products.',
    'Medical Store': 'Pharmacy and medical supplies store.',
    'Chemist': 'Chemist shop providing medicines and health products.',
    'Restaurant': 'Dining establishment serving various cuisines and meals.',
    'Cafe': 'Coffee shop offering beverages, light meals, and a relaxed atmosphere.',
    'Salon': 'Beauty and hair care services for styling and grooming.',
    'Beauty Parlor': 'Full-service beauty salon offering hair, makeup, and skincare treatments.',
    'Spa': 'Relaxing spa offering massages, facials, and wellness treatments.',
    'Nail Salon': 'Specialized salon for manicures, pedicures, and nail art.',
    'Tattoo Studio': 'Professional tattoo and body art studio.',
    'Bank': 'Financial institution offering banking services and accounts.',
    'Pharmacy': 'Medical store providing medicines and healthcare products.',
    'Supermarket': 'Large retail store offering groceries and household items.',
    'Market': 'Local marketplace with fresh produce and goods.',
    'Gym': 'Fitness center with equipment for workouts and exercise.',
    'School': 'Educational institution for learning and development.',
    'Park': 'Public green space for recreation and relaxation.',
    'Museum': 'Cultural institution showcasing art, history, and exhibits.',
    'Theatre': 'Entertainment venue for performances and shows.',
    'Library': 'Public facility with books and resources for reading.',
    'Shop': 'Retail store offering various products and services.'
  };

  return descriptions[type] || `${type} establishment in the area.`;
};

// Generate sample rating based on place type and data completeness
const generateRating = (tags, type) => {
  // Base rating by type
  const baseRatings = {
    'Hospital': 4.2,
    'Clinic': 4.0,
    'Doctor': 4.1,
    'Dentist': 4.3,
    'Pharmacy': 4.0,
    'Medical Store': 3.9,
    'Chemist': 3.8,
    'Restaurant': 4.1,
    'Cafe': 4.3,
    'Salon': 4.0,
    'Beauty Parlor': 4.1,
    'Spa': 4.3,
    'Nail Salon': 4.2,
    'Tattoo Studio': 4.0,
    'Bank': 3.8,
    'Supermarket': 3.9,
    'Market': 4.1,
    'Gym': 4.2,
    'School': 4.4,
    'Park': 4.5,
    'Museum': 4.6,
    'Theatre': 4.3,
    'Library': 4.4,
    'Shop': 3.9,
    'Warehouse': 3.7,
    'Post Office': 3.9,
    'Industrial': 3.5,
    'Office': 4.0,
    'Transport': 3.8,
    'Moving Company': 4.1,
    'Logistics': 3.9,
    'Delivery': 4.2,
    'Courier': 3.8,
    'Tourist Attraction': 4.4,
    'Leisure': 4.1
  };

  let rating = baseRatings[type] || 4.0;

  // Adjust based on data completeness
  let completenessBonus = 0;
  if (tags.name) completenessBonus += 0.1;
  if (tags.opening_hours) completenessBonus += 0.2;
  if (tags.phone) completenessBonus += 0.1;
  if (tags.website) completenessBonus += 0.1;

  rating = Math.min(5.0, rating + completenessBonus);

  // Add some randomness (±0.3)
  const randomVariation = (Math.random() - 0.5) * 0.6;
  rating = Math.max(1.0, Math.min(5.0, rating + randomVariation));

  return Math.round(rating * 10) / 10; // Round to 1 decimal place
};

// Search for places by name (worldwide search, sorted by distance)
export const searchPlacesByName = async (query, userLocation = null) => {
  try {
    console.log('🔍 Searching for places by name:', query);

    // Search worldwide but prioritize by distance from user location
    const searchLocation = userLocation || { lat: 0, lng: 0 };
    const searchRadius = 100000; // 100km radius for broader search

    // Build Overpass query to search by name
    const searchQuery = buildNameSearchQuery(query, searchLocation, searchRadius);
    console.log('🔍 Search query:', searchQuery);

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(searchQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Search API response:', data.elements?.length || 0, 'elements');

    const places = parseOverpassResponse(data, searchLocation.lat, searchLocation.lng);

    // Filter results by name similarity
    const filteredPlaces = places.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.name.toLowerCase().includes(query.toLowerCase().replace(/\s+/g, ''))
    );

    // Remove duplicates based on name and location
    const deduplicatedPlaces = removeDuplicatePlaces(filteredPlaces);

    // Sort by relevance and distance (closer places first)
    const sortedPlaces = deduplicatedPlaces
      .sort((a, b) => {
        // Exact match first
        const aExact = a.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
        const bExact = b.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Starts with query
        const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // Then by distance (closer first)
        return parseFloat(a.distance) - parseFloat(b.distance);
      })
      .slice(0, 50); // Limit to 50 results for worldwide search

    console.log('📍 Filtered search results:', sortedPlaces.length);

    return sortedPlaces;

  } catch (error) {
    console.error('❌ Error searching places by name:', error);
    throw new Error(`Failed to search places: ${error.message}`);
  }
};

// Build Overpass query for name-based search
const buildNameSearchQuery = (query, location, radius) => {
  const amenityKeys = Object.keys(AMENITY_TYPES).join('|');

  // Create a more flexible name search
  const namePatterns = [
    `"${query}"`,  // Exact match
    `"${query}*"`  // Starts with
  ];

  const nameConditions = namePatterns.map(pattern => `name${pattern}`).join(' ');

  const queryQL = `
    [out:json][timeout:25];
    (
      // Search by exact name match
      node["name"~"${query}",i](${location.lat - 0.1},${location.lng - 0.1},${location.lat + 0.1},${location.lng + 0.1});
      way["name"~"${query}",i](${location.lat - 0.1},${location.lng - 0.1},${location.lat + 0.1},${location.lng + 0.1});

      // Also search amenities within radius
      node["amenity"~"${amenityKeys}"](around:${radius},${location.lat},${location.lng});
      way["amenity"~"${amenityKeys}"](around:${radius},${location.lat},${location.lng});
      relation["amenity"~"${amenityKeys}"](around:${radius},${location.lat},${location.lng});

      // Include shops and tourism
      node["shop"](around:${radius},${location.lat},${location.lng});
      way["shop"](around:${radius},${location.lat},${location.lng});
      node["tourism"](around:${radius},${location.lat},${location.lng});
      way["tourism"](around:${radius},${location.lat},${location.lng});
    );
    out center meta;
  `;

  return queryQL.trim();
};

// Remove duplicate places based on name and location similarity
const removeDuplicatePlaces = (places) => {
  const uniquePlaces = [];
  const seen = new Set();

  // Normalize place name for comparison
  const normalizeName = (name) => {
    return name.toLowerCase()
      .replace(/\s+/g, ' ') // normalize spaces
      .replace(/[^\w\s]/g, '') // remove punctuation
      .trim();
  };

  // Calculate distance between two places
  const getDistanceBetweenPlaces = (place1, place2) => {
    return calculateDistance(
      place1.location.lat, place1.location.lng,
      place2.location.lat, place2.location.lng
    );
  };

  for (const place of places) {
    const normalizedName = normalizeName(place.name);
    let isDuplicate = false;

    // Check against already seen places
    for (const existingPlace of uniquePlaces) {
      const existingNormalizedName = normalizeName(existingPlace.name);
      const distance = getDistanceBetweenPlaces(place, existingPlace);

      // Consider duplicates if:
      // 1. Names are very similar (exact match after normalization)
      // 2. OR names are similar and locations are very close (< 50 meters)
      const namesSimilar = normalizedName === existingNormalizedName ||
        (normalizedName.includes(existingNormalizedName) && existingNormalizedName.length > 3) ||
        (existingNormalizedName.includes(normalizedName) && normalizedName.length > 3);

      if (namesSimilar && distance < 0.05) { // 50 meters
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      uniquePlaces.push(place);
    }
  }

  return uniquePlaces;
};

// Export amenity types for filtering
export { AMENITY_TYPES };