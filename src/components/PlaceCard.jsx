import React from 'react';

export default function PlaceCard({ place }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-secondary">{place.name}</h3>
          <p className="text-sm text-gray-500">{place.type} • {place.address}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Wait</div>
          <div className="text-primary font-bold text-lg">{place.waitTime} min</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">In queue: <span className="font-medium">{place.queueCount}</span></div>
        <button className="px-3 py-1 rounded-md bg-primary text-white text-sm">Join/Book</button>
      </div>
    </div>
  );
}
