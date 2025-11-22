import React, { useState } from 'react';
import placesData from '../data/places';
import PlaceCard from '../components/PlaceCard';

export default function Search() {
  const [query, setQuery] = useState('');

  const filtered = placesData.filter(p => {
    if (!query) return true;
    return p.name.toLowerCase().includes(query.toLowerCase()) || p.type.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Search</h1>
      <div className="mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full md:w-1/2 px-4 py-2 border rounded-md" placeholder="Search places, e.g., hospital, salon" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => <PlaceCard key={p.id} place={p} />)}
      </div>
    </div>
  );
}
