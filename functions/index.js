const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Google Places API proxy function
exports.getNearbyPlaces = functions.https.onCall(async (data, context) => {
  try {
    const { lat, lng, radius = 5000, type = 'establishment' } = data;

    // Validate input
    if (!lat || !lng) {
      throw new functions.https.HttpsError('invalid-argument', 'Latitude and longitude are required');
    }

    // Get API key from environment variables
    const apiKey = functions.config().google_places?.api_key || process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Google Places API key not configured');
    }

    // Construct Google Places API URL
    const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

    console.log('Calling Google Places API:', apiUrl.replace(apiKey, '[API_KEY]'));

    // Make request to Google Places API
    const response = await fetch(apiUrl);
    const apiData = await response.json();

    console.log('Google Places API response status:', response.status);
    console.log('Number of results:', apiData.results?.length || 0);

    if (!response.ok) {
      console.error('Google Places API error:', apiData);
      throw new functions.https.HttpsError('internal', 'Failed to fetch places from Google API');
    }

    // Transform the response to include only necessary data
    const places = apiData.results?.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating,
      types: place.types,
      price_level: place.price_level,
      business_status: place.business_status,
      photos: place.photos?.map(photo => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      }))
    })) || [];

    return {
      places,
      status: apiData.status,
      next_page_token: apiData.next_page_token
    };

  } catch (error) {
    console.error('Error in getNearbyPlaces function:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});

// Reverse geocoding function (using Nominatim via server to avoid CORS)
exports.getLocationName = functions.https.onCall(async (data, context) => {
  try {
    const { lat, lng } = data;

    if (!lat || !lng) {
      throw new functions.https.HttpsError('invalid-argument', 'Latitude and longitude are required');
    }

    console.log('Server-side reverse geocoding for coordinates:', lat, lng);

    // Use Nominatim for reverse geocoding (server-side to avoid CORS)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'QueueFree-App/1.0'
      }
    });

    console.log('Nominatim response status:', response.status);

    if (!response.ok) {
      console.error('Nominatim API error status:', response.status);
      return { cityName: 'Unknown Location' };
    }

    const nominatimData = await response.json();

    if (!nominatimData || !nominatimData.address) {
      console.error('Invalid Nominatim response:', nominatimData);
      return { cityName: 'Unknown Location' };
    }

    // Extract city name from Nominatim response
    const cityName = nominatimData.address?.city ||
                    nominatimData.address?.town ||
                    nominatimData.address?.village ||
                    nominatimData.address?.suburb ||
                    nominatimData.address?.state_district ||
                    nominatimData.address?.state ||
                    nominatimData.display_name?.split(',')[0] ||
                    'Unknown Location';

    console.log('Server extracted city name:', cityName);

    return { cityName };

  } catch (error) {
    console.error('Error in getLocationName Cloud Function:', error);
    return { cityName: 'Unknown Location' };
  }
});