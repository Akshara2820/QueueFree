export function formatWait(minutes) {
  if (minutes <= 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hrs}h${rem ? ` ${rem}m` : ''}`;
}

// Calculate distance between two points using Haversine formula
// d = 2r * arcsin(sqrt(sin²(φ₂-φ₁/2) + cos(φ₁)cos(φ₂)sin²(λ₂-λ₁/2)))
// where r is Earth's radius (6371 km), φ is latitude, λ is longitude (all in radians)
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  // Haversine formula
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in kilometers
}
