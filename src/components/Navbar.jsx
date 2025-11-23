import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityName, setCityName] = useState('');
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Simple MVP: Direct coordinate-based location detection (no external APIs)
  const fetchLocationName = (lat, lng) => {
    console.log('🎯 MVP Location Detection - Checking coordinates:', { lat, lng });

    // Gurgaon coordinates: ~28.40°N to 28.55°N, ~76.90°E to 77.20°E
    if (lat >= 28.40 && lat <= 28.55 && lng >= 76.90 && lng <= 77.20) {
      console.log('📍 Detected: Gurgaon, Haryana');
      return Promise.resolve("Gurgaon, Haryana");
    }
    // Delhi coordinates: ~28.55°N to 28.80°N, ~77.00°E to 77.40°E
    else if (lat >= 28.55 && lat <= 28.80 && lng >= 77.00 && lng <= 77.40) {
      console.log('📍 Detected: Delhi, India');
      return Promise.resolve("Delhi, India");
    }
    // Kanpur coordinates: ~26.35°N to 26.55°N, ~80.20°E to 80.45°E
    else if (lat >= 26.35 && lat <= 26.55 && lng >= 80.20 && lng <= 80.45) {
      console.log('📍 Detected: Kanpur, Uttar Pradesh');
      return Promise.resolve("Kanpur, Uttar Pradesh");
    }
    // Mumbai coordinates: ~18.85°N to 19.35°N, ~72.65°E to 73.05°E
    else if (lat >= 18.85 && lat <= 19.35 && lng >= 72.65 && lng <= 73.05) {
      console.log('📍 Detected: Mumbai, Maharashtra');
      return Promise.resolve("Mumbai, Maharashtra");
    }
    // Add more cities as needed
    else {
      console.log('📍 Unknown location, showing coordinates');
      return Promise.resolve(`${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`);
    }
  };

  // Load user location from localStorage and fetch city name
  useEffect(() => {
    const location = localStorage.getItem('userLocation');
    if (location) {
      const parsedLocation = JSON.parse(location);
      console.log('📍 User Location from localStorage:', parsedLocation);

      // Fetch the actual city name using Nominatim
      fetchLocationName(parsedLocation.lat, parsedLocation.lng)
        .then(name => {
          console.log('🏙️ Fetched City Name from OpenStreetMap:', name);
          setCityName(name);
        })
        .catch(error => {
          console.error('❌ Error fetching city name:', error);
        });
    }
  }, []);

  // Log when city name is displayed
  useEffect(() => {
    if (cityName) {
      console.log('📍 Displaying location in navbar:', cityName);
    }
  }, [cityName]);

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
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-accent transition-colors"
              >
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=6366f1&color=fff&size=32`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-primary-200"
                />
                <div className="text-left hidden lg:block">
                  <span className="text-sm font-medium text-text block">
                    {user.displayName || 'User'}
                  </span>
                  {cityName && (
                    <span className="text-xs text-text-secondary block">
                      📍 {cityName}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-text-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=6366f1&color=fff&size=40`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-primary-200"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.displayName || 'User'}
                        </p>
                        {cityName && (
                          <p className="text-xs text-blue-600">
                            📍 {cityName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login/user" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 shadow-md transition-colors">
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
            <Link to="/about" onClick={() => setOpen(false)} className="text-gray-700">About</Link>
            {user ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-3 px-2">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=6366f1&color=fff&size=32`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-primary-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || 'User'}
                    </p>
                    {cityName && (
                      <p className="text-xs text-blue-600">
                        📍 {cityName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="w-full px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Sign Out
                </button>
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
