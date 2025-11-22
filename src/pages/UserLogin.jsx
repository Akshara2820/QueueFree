import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function UserLogin() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      // Create a new instance of GoogleAuthProvider
      const provider = new GoogleAuthProvider();

      // Use signInWithPopup to trigger the Google sign-in window
      const result = await signInWithPopup(auth, provider);

      // Handle the success case by logging the user's details
      const user = result.user;
      console.log('User signed in:', {
        displayName: user.displayName,
        email: user.email,
        uid: user.uid
      });

      // Redirect to the homepage
      navigate('/');
    } catch (err) {
      // Handle error cases gracefully
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/api-key-not-valid-please-pass-a-valid-api-key') {
        setError('Firebase configuration error. Please check your API key.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else {
        setError(`Sign-in failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-4">User Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-md mb-4 hover:bg-red-600"
        >
          Sign in with Google
        </button>
        <p className="text-sm text-gray-600">Or use traditional login (coming soon)</p>
      </div>
    </div>
  );
}
