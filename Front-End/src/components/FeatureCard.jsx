// src/components/FeatureCard.jsx
import React from 'react';
import { getIconColorClass, getAnimationDelay } from '../utils/designUtils';

const FeatureCard = ({ icon: Icon, title, description, iconColor, index = 0 }) => {
  // Get proper icon color class
  const iconColorClass = getIconColorClass(iconColor);
  
  return (
    <div 
      className="glass-card glass-card-hover p-8 rounded-xl border group animate-scale-in"
      style={{ animationDelay: `${getAnimationDelay(index, 150)}ms` }}
    >
      {/* Icon Container */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300">
          <Icon className={`w-8 h-8 ${iconColorClass} group-hover:scale-110 transition-transform duration-300`} />
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white group-hover:text-brand-200 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* Hover Effect Line */}
      <div className="mt-6 h-1 w-0 group-hover:w-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-full"></div>
    </div>
  );
};

export default FeatureCard;
