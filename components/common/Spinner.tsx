
import React from 'react';

const Spinner = ({ size = '8', color = 'primary-600' }) => {
  return (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-${color}`}></div>
  );
};

export default Spinner;
