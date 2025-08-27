import React from 'react';

// Objeto que mapeia a raridade para as classes de cor do Tailwind
const rarityConfig = {
  Comum: 'bg-green-100 text-green-800',
  Raro: 'bg-blue-100 text-blue-800',
  Épico: 'bg-purple-100 text-purple-800',
  Lendário: 'bg-yellow-100 text-yellow-800',
  Místico: 'bg-red-100 text-red-800',
};

const CigarroCard = ({ cigarro }) => {
  if (!cigarro) return null;

  // Pega a classe de cor correta com base na raridade do cigarro
  const rarityClasses = rarityConfig[cigarro.raridade] || 'bg-gray-100 text-gray-800';

  return (
    <div className="w-80 rounded-lg bg-white shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out">
      <img className="w-full h-64 object-cover" src={cigarro.imageUrl} alt={cigarro.marca} />
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800">{cigarro.marca}</h2>
        <p className="text-sm text-gray-600 mb-2">{cigarro.tipo}</p>
        <div className="flex justify-between items-center my-4">
          <span className="text-xs font-semibold bg-gray-200 text-gray-800 px-2 py-1 rounded-full">Origem: {cigarro.origem}</span>
          {/* A mágica acontece aqui, onde usamos as classes dinâmicas */}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rarityClasses}`}>
            {cigarro.raridade}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CigarroCard;