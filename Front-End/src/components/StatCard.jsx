// src/components/StatCard.jsx
import React from 'react';
import { getIconColorClass } from '../utils/designUtils';

const StatCard = ({ label, value, subtext, icon: Icon, iconColor, index = 0 }) => {
  // Get proper icon color class
  const iconColorClass = getIconColorClass(iconColor);

  return (
    <div
      className="relative overflow-hidden glass-card glass-card-hover p-6 rounded-2xl border border-white border-opacity-10 transform transition-all duration-300 hover:scale-[102%] hover:shadow-2xl animate-slide-up bg-opacity-40"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Background Glow */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 blur-3xl opacity-20 bg-${iconColor.split('-')[0]}-400 rounded-full`}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-300 text-xs font-bold uppercase tracking-widest opacity-80">{label}</span>
          <div className="p-2.5 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-10">
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight break-all leading-tight">
            {value}
          </p>
          {subtext && (
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              <p className="text-gray-400 text-xs font-semibold tracking-wide uppercase">{subtext}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
