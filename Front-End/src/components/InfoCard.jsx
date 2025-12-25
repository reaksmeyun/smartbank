// src/components/InfoCard.jsx
import React from 'react';

const InfoCard = ({ title, description }) => {
  return (
    <div className="bg-white bg-opacity-5 backdrop-blur-md p-6 rounded-xl border border-white border-opacity-10">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default InfoCard;