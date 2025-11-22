import React from 'react';

export default function Hero({ onSearch }) {
  return (
    <section className="bg-gradient-to-r from-white to-light py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-dark mb-4">Find real-time queue status near you</h1>
          <p className="text-gray-600 mb-8">Check wait times at hospitals, salons, banks, and restaurants — fast and easy.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.elements.search.value.trim();
              onSearch && onSearch(q);
            }}
            className="flex items-center gap-2 max-w-2xl mx-auto"
          >
            <input name="search" className="flex-1 px-4 py-3 rounded-l-md border focus:outline-none" placeholder="Search a place or address" />
            <button className="px-5 py-3 rounded-r-md bg-primary text-white font-medium">Search</button>
          </form>
        </div>
      </div>
    </section>
  );
}
