import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white font-bold">QF</div>
          <span className="text-xl font-semibold text-secondary">QueueFree</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-primary">Home</Link>
          <Link to="/search" className="text-gray-700 hover:text-primary">Search</Link>
          <Link to="/about" className="text-gray-700 hover:text-primary">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-primary">Contact</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login/user" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:opacity-95">User Login</Link>
          <Link to="/login/business" className="px-3 py-2 rounded-md text-sm font-medium text-primary border border-primary">Business</Link>
        </div>

        <button
          className="md:hidden p-2 rounded-md border"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-light">
          <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)} className="text-gray-700">Home</Link>
            <Link to="/search" onClick={() => setOpen(false)} className="text-gray-700">Search</Link>
            <Link to="/about" onClick={() => setOpen(false)} className="text-gray-700">About</Link>
            <div className="flex gap-2 pt-2">
              <Link to="/login/user" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary">User Login</Link>
              <Link to="/login/business" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-primary border border-primary">Business</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
