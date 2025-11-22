import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceCard from '../components/PlaceCard';
import placesData from '../data/places';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dummy data
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
  }, []);

  useEffect(() => {
    // Update URL when query changes
    if (query) {
      setSearchParams({ query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const filtered = places.filter(p => {
    if (!query) return true;
    return p.name.toLowerCase().includes(query.toLowerCase()) || p.type.toLowerCase().includes(query.toLowerCase());
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Search Results</h1>
      <div className="mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-md"
          placeholder="Search places, e.g., hospital, salon"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => <PlaceCard key={p.id} place={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No results found for "{query}".
        </div>
      )}
    </div>
  );
}
