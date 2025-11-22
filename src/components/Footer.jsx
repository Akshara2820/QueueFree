import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="container mx-auto px-6 py-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} QueueFree — Check queues, save time.
          </p>
        </div>
      </div>
    </footer>
  );
}
