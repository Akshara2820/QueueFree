import React, { useState } from 'react';
import Hero from '../components/Hero';
import PlaceCard from '../components/PlaceCard';
import placesData from '../data/places';

export default function Home() {
  const [query, setQuery] = useState('');

  const filtered = placesData.filter(p => {
    if (!query) return true;
    return p.name.toLowerCase().includes(query.toLowerCase()) || p.type.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div>
      <Hero onSearch={(q) => setQuery(q)} />

      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Nearby Places</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>
    </div>
  );
}
