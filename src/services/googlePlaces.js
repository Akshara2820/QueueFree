// Google Places API service
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

// Fetch nearby places using Firebase Cloud Function (CORS-free)
export const fetchNearbyPlaces = async (location, radius = 5000) => {
  try {
    console.log('🌐 Calling Firebase Cloud Function for nearby places...');

    // Import Firebase functions
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
    } else {
      console.warn('No places received from Cloud Function, using mock data');
      return generateMockNearbyPlaces(location, radius);
    }

  } catch (error) {
    console.error('❌ Error calling Firebase Cloud Function:', error);
    console.warn('Falling back to mock data due to:', error.message);
    return generateMockNearbyPlaces(location, radius);
  }
};

// Generate mock nearby places for testing when API is not available
const generateMockNearbyPlaces = (location, radius) => {
  const mockPlaces = [
    {
      id: 'mock_hospital_1',
      name: 'City General Hospital',
      type: 'Hospital',
      address: '123 Medical Center Dr',
      location: { lat: location.lat + 0.01, lng: location.lng + 0.01 },
      distance: '1.2',
      rating: 4.2,
      business_status: 'OPERATIONAL',
      category: 'hospital'
    },
    {
      id: 'mock_restaurant_1',
      name: 'Downtown Bistro',
      type: 'Restaurant',
      address: '456 Main Street',
      location: { lat: location.lat - 0.005, lng: location.lng + 0.008 },
      distance: '0.8',
      rating: 4.5,
      business_status: 'OPERATIONAL',
      category: 'restaurant'
    },
    {
      id: 'mock_bank_1',
      name: 'National Bank',
      type: 'Bank',
      address: '789 Finance Ave',
      location: { lat: location.lat + 0.008, lng: location.lng - 0.005 },
      distance: '1.5',
      rating: 3.8,
      business_status: 'OPERATIONAL',
      category: 'bank'
    },
    {
      id: 'mock_salon_1',
      name: 'Elegant Cuts Salon',
      type: 'Salon',
      address: '321 Beauty Blvd',
      location: { lat: location.lat - 0.003, lng: location.lng - 0.007 },
      distance: '0.9',
      rating: 4.7,
      business_status: 'OPERATIONAL',
      category: 'salon'
    },
    {
      id: 'mock_pharmacy_1',
      name: 'Health Pharmacy',
      type: 'Pharmacy',
      address: '654 Health Street',
      location: { lat: location.lat + 0.006, lng: location.lng + 0.004 },
      distance: '1.8',
      rating: 4.0,
      business_status: 'OPERATIONAL',
      category: 'pharmacy'
    },
    {
      id: 'mock_gym_1',
      name: 'Fitness Center',
      type: 'Gym',
      address: '987 Workout Way',
      location: { lat: location.lat - 0.002, lng: location.lng + 0.006 },
      distance: '1.1',
      rating: 4.3,
      business_status: 'OPERATIONAL',
      category: 'gym'
    }
  ];

  // Filter by radius and sort by distance
  return mockPlaces
    .filter(place => parseFloat(place.distance) <= (radius / 1000))
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
};

// Get photo URL from photo reference
const getPhotoUrl = (photoReference, maxWidth = 400) => {
  return `https://maps.googleapis.com/maps/api/place/photo?` +
         `maxwidth=${maxWidth}&` +
         `photoreference=${photoReference}&` +
         `key=${GOOGLE_PLACES_API_KEY}`;
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