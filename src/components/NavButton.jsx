import React from 'react';

const NavButton = ({ onClick, direction, disabled }) => {
  const icon = direction === 'prev' ? '<' : '>';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-gray-700 shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );
};

export default NavButton;