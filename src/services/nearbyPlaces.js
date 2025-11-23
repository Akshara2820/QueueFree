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
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  hairdresser: 'Salon',
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
  tourism: 'Tourist Attraction'
};

// Build Overpass query for nearby amenities
const buildOverpassQuery = (lat, lng, radius) => {
  const amenityKeys = Object.keys(AMENITY_TYPES).join('|');

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"${amenityKeys}"](around:${radius},${lat},${lng});
      way["amenity"~"${amenityKeys}"](around:${radius},${lat},${lng});
      relation["amenity"~"${amenityKeys}"](around:${radius},${lat},${lng});

      // Also include shops and tourism
      node["shop"](around:${radius},${lat},${lng});
      way["shop"](around:${radius},${lat},${lng});
      node["tourism"](around:${radius},${lat},${lng});
      way["tourism"](around:${radius},${lat},${lng});
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
    }

    // Get name (handle missing names)
    const name = tags.name || tags['name:en'] || `Unnamed ${amenityType}`;

    // Calculate distance
    const distance = calculateDistance(userLat, userLng, lat, lng);

    // Generate unique ID
    const id = `${element.type}_${element.id}`;

    // Determine if place is likely open (simplified logic)
    const isOpen = getBusinessStatus(tags);

    places.push({
      id,
      name,
      type: amenityType,
      address: tags['addr:full'] || tags['addr:housenumber'] + ' ' + (tags['addr:street'] || '') || 'Address not available',
      location: { lat, lng },
      distance: distance.toFixed(1),
      rating: 0, // OpenStreetMap doesn't have ratings
      business_status: isOpen ? 'OPERATIONAL' : 'CLOSED',
      category,
      tags // Keep original tags for additional processing
    });
  });

  return places;
};

// Simple business hours logic (can be enhanced)
const getBusinessStatus = (tags) => {
  // This is a simplified implementation
  // In a real app, you'd parse opening_hours tag properly
  const openingHours = tags.opening_hours;

  if (!openingHours) {
    // If no hours specified, assume it's operational
    return true;
  }

  // Very basic check - if it contains "24/7", it's always open
  if (openingHours.includes('24/7')) {
    return true;
  }

  // For now, return true (operational) - you can enhance this
  return true;
};

// Main function to get nearby places
export const getNearbyPlaces = async (lat, lng, radius = 5000) => {
  try {
    console.log('🌍 Fetching places from Overpass API...', { lat, lng, radius });

    const query = buildOverpassQuery(lat, lng, radius);
    console.log('🔍 Overpass Query:', query);

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Overpass API response:', data.elements?.length || 0, 'elements');

    const places = parseOverpassResponse(data, lat, lng);

    // Sort by distance and limit to top 20
    const sortedPlaces = places
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, 20);

    console.log('📍 Processed places:', sortedPlaces.length);

    return sortedPlaces;

  } catch (error) {
    console.error('❌ Error fetching places from Overpass:', error);
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

// Export amenity types for filtering
export { AMENITY_TYPES };