import React, { useState } from 'react';
import { CARDS } from '../data/cards.js';
import { formatCurrency } from '../utils/packEngine.js';
import CardArtwork from './CardArtwork.jsx';

const BoosterPack = ({ pack, balance, onOpen, onShowOdds }) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });
  const canAfford = balance >= pack.price;
  const featured = CARDS.find((c) => c.id === pack.featuredCardId);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    setTilt({ rx, ry, active: true });
  };

  return (
    <div className="flex flex-col items-center group">
      {/* Embalagem Metálica 3D estilo Booster Pack de Pokémon TCG */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ rx: 0, ry: 0, active: false })}
        onClick={() => canAfford && onOpen(pack)}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${tilt.active ? '-6px' : '0px'})`,
        }}
        className={`relative w-60 sm:w-64 h-[22rem] rounded-2xl overflow-hidden transition-transform duration-200 ease-out select-none border-2 ${pack.accentBorder} bg-gradient-to-b ${pack.gradient} shadow-[0_20px_45px_rgba(0,0,0,0.7)] ${
          canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-85'
        }`}
      >
        {/* Borda serrilhada superior (Crimp metálico) */}
        <div className="h-5 w-full pack-crimp-top border-b border-white/25 relative">
          <div className="absolute inset-x-4 bottom-0 border-b border-dashed border-white/40" />
        </div>

        {/* Reflexo metálico da embalagem */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
          style={{
            background: `linear-gradient(125deg, transparent 20%, ${pack.foilTint} 46%, rgba(255,255,255,0.45) 50%, ${pack.foilTint} 54%, transparent 80%)`,
          }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide" />
        </div>

        {/* Conteúdo central do pacote */}
        <div className="relative z-10 flex flex-col items-center justify-between h-[calc(100%-2.5rem)] px-4 py-3 text-center">
          {/* Selo de Evento / Colaboração */}
          <span
            className={`text-[10px] font-black tracking-[0.18em] px-2.5 py-0.5 rounded-full border backdrop-blur-md ${pack.badgeStyle}`}
          >
            {pack.badge}
          </span>

          {/* Emblema + Título */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.28em] text-white/75 uppercase">
              APEX TCG • {pack.emblemText}
            </div>
            <h3 className="font-display font-black text-xl leading-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]">
              {pack.name}
            </h3>
            <p className="text-[11px] text-white/80 font-medium">{pack.subtitle}</p>
          </div>

          {/* Medalhão do Carro Destaque */}
          <div className="relative w-40 h-24 rounded-2xl border-2 border-white/30 bg-slate-950/75 shadow-[0_0_25px_rgba(0,0,0,0.7)] overflow-hidden group-hover:scale-105 transition-transform duration-300">
            {featured && <CardArtwork card={featured} isFoil />}
          </div>

          {/* Rodapé informativo do Booster */}
          <div className="w-full space-y-1">
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-white/85">
              <span className="bg-black/40 px-2 py-0.5 rounded-full border border-white/15">
                {pack.cardsPerPack} CARTAS
              </span>
              <span className="bg-black/40 px-2 py-0.5 rounded-full border border-amber-300/30 text-amber-200">
                1 RARO+ GARANTIDO
              </span>
            </div>
            <div className="text-[10px] text-white/70">
              Foil {pack.variantOdds.foil}% • Full Art {pack.variantOdds['full-art']}%
            </div>
          </div>
        </div>

        {/* Borda serrilhada inferior */}
        <div className="h-5 w-full pack-crimp-top border-t border-white/25 absolute bottom-0" />
      </div>

      {/* Descrição & Ações abaixo do pacote */}
      <div className="w-60 sm:w-64 mt-4 flex flex-col gap-2">
        <p className="text-xs text-slate-400 text-center min-h-[3rem] leading-relaxed">
          {pack.description}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOpen(pack)}
            disabled={!canAfford}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              canAfford
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:from-amber-300 hover:to-yellow-400 shadow-[0_6px_20px_rgba(245,158,11,0.3)] active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>Abrir</span>
            <span className="font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {formatCurrency(pack.price)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onShowOdds(pack)}
            title="Ver probabilidades e cartas do pacote"
            className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Odds
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoosterPack;
