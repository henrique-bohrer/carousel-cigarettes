import { useState } from "react";
import CigarroCard from "./components/CigarroCard";
import NavButton from "./components/NavButton";
import CIGARROS from "./cigarros";
import './App.css'; // Importa o CSS global

const App = () => {
  const [cigarroIdx, setCigarroIdx] = useState(0);

  const irParaAnterior = () => {
    if (cigarroIdx > 0) {
      setCigarroIdx(cigarroIdx - 1);
    }
  };

  const irParaProximo = () => {
    if (cigarroIdx < CIGARROS.length - 1) {
      setCigarroIdx(cigarroIdx + 1);
    }
  };

  return (
    <div className="appContainer">
      <h1 className="mainTitle">Carrossel de Cigarros</h1>
      <div className="carousel">
        <NavButton
          icon="fa-square-caret-left"
          onClick={irParaAnterior}
          show={cigarroIdx > 0}
        />

        <CigarroCard cigarro={CIGARROS[cigarroIdx]} />

        <NavButton
          icon="fa-square-caret-right"
          onClick={irParaProximo}
          show={cigarroIdx < CIGARROS.length - 1}
        />
      </div>
    </div>
  );
};

export default App;