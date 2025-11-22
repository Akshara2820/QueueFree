function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const places = [
  { id: 1, name: 'City Hospital', type: 'Hospital', address: '12 Health St', category: 'hospital', distance: '0.5 km' },
  { id: 2, name: 'Downtown Salon', type: 'Salon', address: '45 Style Ave', category: 'salon', distance: '1.2 km' },
  { id: 3, name: 'National Bank', type: 'Bank', address: '7 Finance Rd', category: 'bank', distance: '0.8 km' },
  { id: 4, name: 'Sunny Bistro', type: 'Restaurant', address: '88 Food Ln', category: 'restaurant', distance: '1.5 km' },
  { id: 5, name: 'Green Clinic', type: 'Hospital', address: '101 Care Blvd', category: 'hospital', distance: '2.0 km' },
  { id: 6, name: 'Elite Cuts', type: 'Salon', address: '22 Barber St', category: 'salon', distance: '0.3 km' },
  { id: 7, name: 'Community Bank', type: 'Bank', address: '3 Market Pl', category: 'bank', distance: '1.8 km' },
  { id: 8, name: 'Riverside Cafe', type: 'Restaurant', address: '5 River Rd', category: 'restaurant', distance: '2.5 km' },
];

// Add dynamic fields: waitTime (minutes) and queueCount
const enriched = places.map(p => ({
  ...p,
  waitTime: rand(5, 45),
  queueCount: rand(0, 20),
}));

export default enriched;
