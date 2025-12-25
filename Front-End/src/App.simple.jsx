// Simple test version of App.js to check basic rendering
import React from 'react';

export default function SimpleApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20">
        <h1 className="text-4xl font-bold text-white mb-4">SmartBank</h1>
        <p className="text-xl text-gray-300 mb-6">Decentralized Banking Solution</p>
        <div className="space-y-4">
          <div className="text-green-400 text-lg">✅ Basic React Rendering Working</div>
          <div className="text-blue-400 text-lg">✅ Tailwind CSS Applied</div>
          <div className="text-purple-400 text-lg">✅ Background & Styles Loaded</div>
        </div>
        <button className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
          Test Button
        </button>
      </div>
    </div>
  );
}
