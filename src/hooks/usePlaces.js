import { useState, useEffect } from 'react';
import placesData from '../data/places';

export function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading places
    const loadPlaces = () => {
      const enrichedPlaces = placesData.map(place => {
        const waitTime = place.waitTime;
        let crowdLevel = 'Low';
        if (waitTime > 20) crowdLevel = 'High';
        else if (waitTime > 10) crowdLevel = 'Moderate';
        return {
          ...place,
          queueInfo: {
            type: 'prediction',
            level: crowdLevel.toLowerCase(),
            waitTime: `${waitTime} min`,
            crowdLevel
          }
        };
      });
      setPlaces(enrichedPlaces);
      setLoading(false);
    };

    // Simulate async load
    setTimeout(loadPlaces, 500);
  }, []);

  return { places, loading };
}