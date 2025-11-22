import React from 'react';

export default function UserLogin() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-4">User Login</h2>
        <form>
          <label className="block text-sm mb-1">Phone or Email</label>
          <input className="w-full border px-3 py-2 rounded-md mb-3" />
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full border px-3 py-2 rounded-md mb-4" />
          <button className="w-full bg-primary text-white px-4 py-2 rounded-md">Sign In</button>
        </form>
      </div>
    </div>
  );
}
