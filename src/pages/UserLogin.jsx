import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function UserLogin() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/'); // Redirect to home after login
    } catch (err) {
      if (err.code === 'auth/api-key-not-valid-please-pass-a-valid-api-key') {
        // Fallback to mock login for demo
        const mockUser = { displayName: 'Demo User', uid: 'demo123' };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        window.location.reload(); // Reload to update auth state
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-4">User Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-md mb-4 hover:bg-red-600"
        >
          Sign in with Google
        </button>
        <p className="text-sm text-gray-600">Or use traditional login (coming soon)</p>
      </div>
    </div>
  );
}
