import React from 'react';

const CigarroCard = ({ cigarro }) => {
  if (!cigarro) return null;

  return (
    <div className="w-80 rounded-lg bg-white shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out">
      <img className="w-full h-80 object-cover" src={cigarro.imageUrl} alt={cigarro.marca} />
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800">{cigarro.marca}</h2>
        <p className="text-sm text-gray-600 mb-2">{cigarro.tipo}</p>
        <div className="flex justify-between items-center my-4">
          <span className="text-xs font-semibold bg-gray-200 text-gray-800 px-2 py-1 rounded-full">Origem: {cigarro.origem}</span>
          <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{cigarro.raridade}</span>
        </div>
      </div>
    </div>
  );
};

export default CigarroCard;