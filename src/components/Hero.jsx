import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="bg-white border-b border-gray-200 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-3">
            Find real-time queue status near you
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Check wait times at hospitals, salons, banks, and restaurants — fast and easy.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.elements.search.value.trim();
              if (q) {
                navigate(`/search?query=${encodeURIComponent(q)}`);
              }
            }}
            className="flex items-center gap-0 max-w-2xl mx-auto shadow-sm border border-gray-300 rounded-lg overflow-hidden relative z-10"
          >
            <div className="relative flex-1">
              <input
                name="search"
                className="w-full px-4 py-3 pl-10 text-base border-0 focus:outline-none focus:ring-0 bg-transparent"
                placeholder="Search a place or address"
                style={{ pointerEvents: 'auto' }}
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="px-6 py-3 bg-primary-500 text-white text-base font-medium hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
