import { useState } from 'react';
import CIGARROS from './data.js';
import CigarroCard from './components/CigarroCard.jsx';
import NavButton from './components/NavButton.jsx';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? CIGARROS.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === CIGARROS.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold text-white mb-10">Carrossel de Cigarros</h1>

      {/* Container do Carrossel */}
      <div className="flex items-center justify-center space-x-6">
        <NavButton onClick={goToPrevious} direction="prev" />
        <div className="w-80 h-96">
          <CigarroCard cigarro={CIGARROS[currentIndex]} />
        </div>
        <NavButton onClick={goToNext} direction="next" />
      </div>

      {/* Nova Legenda de Raridades */}
      <div className="mt-10 p-4 bg-gray-800 rounded-lg shadow-inner">
        <h3 className="text-lg font-bold text-white text-center mb-2">Probabilidades de Raridade</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-green-200 text-green-900"><strong>Comum</strong><br />(60-100%)</div>
          <div className="p-2 rounded bg-blue-200 text-blue-900"><strong>Raro</strong><br />(30-59%)</div>
          <div className="p-2 rounded bg-purple-200 text-purple-900"><strong>Épico</strong><br />(15-29%)</div>
          <div className="p-2 rounded bg-yellow-200 text-yellow-900"><strong>Lendário</strong><br />(5-14%)</div>
          <div className="p-2 rounded bg-red-200 text-red-900"><strong>Místico</strong><br />(&lt;5%)</div>
        </div>
      </div>

    </div>
  );
}

export default App;