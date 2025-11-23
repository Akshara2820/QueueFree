// Google Places API service
// To get dynamic places, replace this with your actual Google Places API key from:
// https://console.cloud.google.com/apis/credentials
// Make sure Places API is enabled and billing is set up
const GOOGLE_PLACES_API_KEY = 'AIzaSyCv3dM4Tm94cDo72dlzQFXK-Yt405rzgi0'; // Replace with your actual Google Places API key

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

// Fetch nearby places - try Cloud Function first, fallback to direct API
export const fetchNearbyPlaces = async (location, radius = 5000) => {
  try {
    console.log('🌐 Attempting Firebase Cloud Function for nearby places...');

    // Try Firebase Cloud Function first
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../firebase');

    const getNearbyPlaces = httpsCallable(functions, 'getNearbyPlaces');
    const result = await getNearbyPlaces({
      lat: location.lat,
      lng: location.lng,
      radius,
      type: 'establishment'
    });

    console.log('✅ Received places from Cloud Function:', result.data.places?.length || 0);

    if (result.data.places && result.data.places.length > 0) {
      // Format places with distance calculation
      const formattedPlaces = result.data.places.map(place => ({
        id: place.id,
        name: place.name,
        type: getPlaceTypeFromCategories(place.types),
        address: place.address,
        location: {
          lat: place.lat,
          lng: place.lng
        },
        distance: calculateDistance(
          location.lat,
          location.lng,
          place.lat,
          place.lng
        ).toFixed(1),
        rating: place.rating || 0,
        business_status: place.business_status,
        category: place.types?.[0] || 'business'
      }));

      // Sort by distance
      return formattedPlaces.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

  } catch (cloudFunctionError) {
    console.warn('⚠️ Cloud Function failed, trying direct Google Places API...', cloudFunctionError.message);

    // Fallback to direct Google Places API call
    try {
      console.log('🌐 Calling Google Places API directly...');
      console.log('📍 Using location:', location);
      console.log('🔑 API Key configured:', !!GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'your-google-places-api-key');

      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
        throw new Error('Google Places API key not configured. Please set a valid API key in googlePlaces.js');
      }

      const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location.lat},${location.lng}&` +
        `radius=${radius}&` +
        `type=establishment&` +
        `key=${GOOGLE_PLACES_API_KEY}`;

      console.log('🔗 API URL:', apiUrl.replace(GOOGLE_PLACES_API_KEY, '[API_KEY]'));

      const response = await fetch(apiUrl);
      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📋 API Response:', data);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        console.log('✅ Received places from direct API:', data.results.length);

        // Format places
        const formattedPlaces = data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          type: getPlaceTypeFromCategories(place.types),
          address: place.vicinity || 'Address not available',
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          distance: calculateDistance(
            location.lat,
            location.lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          ).toFixed(1),
          rating: place.rating || 0,
          business_status: place.business_status || 'OPERATIONAL',
          category: place.types?.[0] || 'business'
        }));

        return formattedPlaces.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      } else {
        console.error('❌ Google Places API Error:', data.status, data.error_message);
        throw new Error(`Google Places API returned status: ${data.status}. Please check your API key and billing setup.`);
      }

    } catch (directApiError) {
      console.error('❌ Direct Google Places API call failed:', directApiError);
      throw directApiError;
    }
  }

  // If Cloud Function didn't return places, throw error
  console.error('No places received from Cloud Function, and direct API failed');
  throw new Error('Unable to fetch places. Please check Firebase Cloud Functions deployment and Google Places API key configuration.');
};




// Convert Google Places API types to readable labels
const getPlaceTypeFromCategories = (types) => {
  if (!types || types.length === 0) return 'Business';

  const typeLabels = {
    hospital: 'Hospital',
    restaurant: 'Restaurant',
    bank: 'Bank',
    pharmacy: 'Pharmacy',
    store: 'Store',
    supermarket: 'Supermarket',
    cafe: 'Cafe',
    gym: 'Gym',
    spa: 'Spa',
    salon: 'Salon',
    doctor: 'Doctor',
    dentist: 'Dentist',
    bar: 'Bar',
    hotel: 'Hotel',
    school: 'School',
    university: 'University',
    park: 'Park',
    museum: 'Museum',
    movie_theater: 'Cinema',
    shopping_mall: 'Mall'
  };

  // Return the first matching type label
  for (const type of types) {
    if (typeLabels[type]) {
      return typeLabels[type];
    }
  }

  // Capitalize and return the first type if no match
  return types[0].charAt(0).toUpperCase() + types[0].slice(1);
};

// Check if Google Places API key is configured
export const isGooglePlacesConfigured = () => {
  return GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'your-google-places-api-key';
};