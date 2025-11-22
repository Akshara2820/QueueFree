import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import PlaceCard from '../components/PlaceCard';
import placesData from '../data/places';
import { getPlaces, isBusinessRegistered, getBusinessQueueData, getCommunityReports, getPrediction } from '../services/firestore';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    // Temporarily use fallback data to show cards
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

  const filtered = places.filter(p => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Hospitals') return p.type === 'Hospital';
    if (activeFilter === 'Salons') return p.type === 'Salon';
    if (activeFilter === 'Banks') return p.type === 'Bank';
    if (activeFilter === 'Restaurants') return p.type === 'Restaurant';
    if (activeFilter === 'Clinics') return p.name.toLowerCase().includes('clinic');
    return true;
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="">
      <Hero />

      <section className="container mx-auto px-4 py-8 ">
        <h2 className="text-2xl font-semibold mb-4">Nearby Places</h2>
        <div className="flex flex-wrap gap-3 mb-8 relative z-10">
          {['All', 'Hospitals', 'Salons', 'Banks', 'Clinics', 'Restaurants'].map(filter => (
            <button
              key={filter}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Filter clicked:', filter);
                setActiveFilter(filter);
              }}
              onMouseDown={(e) => e.preventDefault()}
              className={`
                px-6 py-3 rounded-xl text-sm font-semibold transition-all 
                duration-200 shadow-sm select-none focus:outline-none 
                focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 
                relative z-20 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 scale-105'
                  : 'bg-background-accent text-text-secondary hover:bg-background hover:text-text hover:shadow-md active:scale-95'
              }`}
              type="button"
              tabIndex={0}
              style={{ pointerEvents: 'auto' }}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>
    </div>
  );
}
