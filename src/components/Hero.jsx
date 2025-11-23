import React from 'react';

export default function Hero({ onSearch }) {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b border-gray-100 py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find places with real-time queue status
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Discover hospitals, restaurants, salons, and more near you. Check wait times and join queues instantly.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.elements.search.value.trim();
              if (q && onSearch) {
                onSearch(q);
              }
            }}
            className="max-w-2xl mx-auto relative"
          >
            <div className="relative flex shadow-lg rounded-full overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center pl-6 pr-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                name="search"
                className="flex-1 px-0 py-4 text-base placeholder-gray-500 focus:outline-none bg-transparent"
                placeholder="Search for hospitals, restaurants, salons..."
                style={{ pointerEvents: 'auto' }}
              />
              <button className="px-8 py-4 bg-primary-500 text-white text-base font-medium hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75 transition-all duration-200 hover:shadow-lg">
                Search
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['Hospitals', 'Restaurants', 'Salons', 'Banks', 'Markets'].map((term) => (
              <button
                key={term}
                onClick={() => onSearch && onSearch(term)}
                className="px-4 py-2 text-sm text-gray-600 bg-white rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
