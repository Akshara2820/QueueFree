import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Check for mock user
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
          setUser(JSON.parse(mockUser));
        } else {
          setUser(null);
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      // Ignore if Firebase not configured
    }
    localStorage.removeItem('mockUser');
    setUser(null);
  };

  return (
    <header className="bg-background-accent/80 backdrop-blur-md border-b border-border-light shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text">QueueFree</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <Link to="/search" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Link>
          <Link to="/places" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Places
          </Link>
          <Link to="/about" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text">Hi, {user.displayName}</span>
              <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 shadow-md transition-colors">Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login/user" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-600 shadow-md transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                User Login
              </Link>
              <Link to="/login/business" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary border-2 border-primary shadow-md hover:bg-primary hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Business
              </Link>
            </>
          )}
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
            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-sm">Hi, {user.displayName}</span>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500">Logout</button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login/user" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-white bg-primary">User Login</Link>
                <Link to="/login/business" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-primary border border-primary">Business</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
