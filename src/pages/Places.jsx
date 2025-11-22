import React, { useState, useMemo } from 'react';
import PlaceCard from '../components/PlaceCard';
import { usePlaces } from '../hooks/usePlaces';

export default function Places() {
  const { places, loading } = usePlaces();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  // Get unique categories from places data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(places.map(p => p.type))];
    return ['All', ...uniqueCategories.sort()];
  }, [places]);

  const filteredAndSortedPlaces = useMemo(() => {
    let filtered = places.filter(p => {
      // Search filter
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.type.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'All' || p.type === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'waitTimeLow':
          return a.waitTime - b.waitTime;
        case 'waitTimeHigh':
          return b.waitTime - a.waitTime;
        case 'crowdLevel':
          const levels = { Low: 1, Moderate: 2, High: 3 };
          return levels[a.queueInfo.crowdLevel] - levels[b.queueInfo.crowdLevel];
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [places, searchQuery, categoryFilter, sortBy]);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-normal text-gray-900 mb-6">All Places</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search places..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75"
        />
        <div className="flex gap-4 ml-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75"
          >
            <option value="name">Name</option>
            <option value="waitTimeLow">Wait Time: Low to High</option>
            <option value="waitTimeHigh">Wait Time: High to Low</option>
            <option value="crowdLevel">Crowd Level</option>
            <option value="distance">Distance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedPlaces.map(place => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>

      {filteredAndSortedPlaces.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No places found matching your search.
        </div>
      )}
    </div>
  );
}