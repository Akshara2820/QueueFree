import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="mb-6">Page not found.</p>
      <Link to="/" className="text-primary">Go back home</Link>
    </div>
  );
}
