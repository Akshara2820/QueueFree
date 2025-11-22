import React from 'react';

export default function Contact() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Contact</h1>
      <p className="mb-4">Have questions or want to list your business? Reach out to us.</p>
      <form className="max-w-lg">
        <input className="w-full border px-3 py-2 rounded-md mb-3" placeholder="Your name" />
        <input className="w-full border px-3 py-2 rounded-md mb-3" placeholder="Email" />
        <textarea className="w-full border px-3 py-2 rounded-md mb-3" placeholder="Message" rows={5} />
        <button className="bg-primary text-white px-4 py-2 rounded-md">Send</button>
      </form>
    </div>
  );
}
