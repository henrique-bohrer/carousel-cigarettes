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
      <div className="flex items-center justify-center space-x-6">
        <NavButton onClick={goToPrevious} direction="prev" />

        <div className="w-80 h-96">
          <CigarroCard cigarro={CIGARROS[currentIndex]} />
        </div>

        <NavButton onClick={goToNext} direction="next" />
      </div>
    </div>
  );
}

export default App;