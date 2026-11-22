import React, { useMemo, useState } from 'react';
import { CARDS } from '../data/cards.js';
import { PACKS } from '../data/packs.js';
import { RARITIES, VARIANTS, VARIANT_ORDER } from '../data/rarities.js';
import { calculateCardValue, formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import NavButton from './NavButton.jsx';
import TcgCard from './TcgCard.jsx';

const ShowcaseCarousel = ({ ownedKeys }) => {
  const [selectedPackFilter, setSelectedPackFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewVariant, setPreviewVariant] = useState('normal');

  const filteredCards = useMemo(() => {
    if (selectedPackFilter === 'all') return CARDS;
    return CARDS.filter((c) => c.packIds.includes(selectedPackFilter));
  }, [selectedPackFilter]);

  const safeIndex = currentIndex >= filteredCards.length ? 0 : currentIndex;
  const currentCard = filteredCards[safeIndex];
  const rarity = RARITIES[currentCard.raridade] || RARITIES.Comum;
  const effectiveVariant = rarity.hasSpecialEditions ? previewVariant : 'normal';
  const currentValue = calculateCardValue(currentCard, effectiveVariant);
  const hasCurrentEdition = ownedKeys.has(`${currentCard.id}::${effectiveVariant}`);

  const goToPrevious = () => {
    soundEngine.playCardSlide();
    setCurrentIndex((prev) => (prev === 0 ? filteredCards.length - 1 : prev - 1));
  };

  const goToNext = () => {
    soundEngine.playCardSlide();
    setCurrentIndex((prev) => (prev === filteredCards.length - 1 ? 0 : prev + 1));
  };

  const handleFilterChange = (packId) => {
    soundEngine.playUiClick();
    setSelectedPackFilter(packId);
    setCurrentIndex(0);
  };

  const handleVariantChange = (vKey) => {
    setPreviewVariant(vKey);
    soundEngine.playRarityReveal(currentCard.raridade, vKey);
  };

  const handlePlayCardSound = () => {
    soundEngine.playCardFlip();
    setTimeout(() => {
      soundEngine.playRarityReveal(currentCard.raridade, effectiveVariant);
    }, 110);
  };

  const cardPacks = PACKS.filter((p) => currentCard.packIds.includes(p.id));

  return (
    <div className="space-y-8">
      {/* Cabeçalho & Filtro por Coleção/Evento */}
      <div className="text-center space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-300">
          Catálogo Interativo • Card Dex
        </span>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
          Vitrine de Cartas & Edições Especiais
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Navegue pelo carrossel completo e alterne entre <strong className="text-slate-200">Normal</strong>,{' '}
          <strong className="text-cyan-300">Foil (2.2×)</strong> e{' '}
          <strong className="text-amber-300">Full Art (3.8×)</strong> nas cartas raras para comparar arte e cotação.
        </p>

        {/* Pills de filtro por Pacote */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              selectedPackFilter === 'all'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            Todas ({CARDS.length})
          </button>
          {PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleFilterChange(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedPackFilter === p.id
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Palco Principal do Carrossel */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Carrossel com NavButton */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <NavButton onClick={goToPrevious} direction="prev" />
          <div className="flex flex-col items-center">
            <TcgCard card={currentCard} variant={effectiveVariant} size="lg" enableEngineRev />
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>
                {safeIndex + 1} / {filteredCards.length}
              </span>
              <span>•</span>
              <span className={hasCurrentEdition ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {hasCurrentEdition ? '✓ Desbloqueada na Coleção' : 'Ainda não obtida'}
              </span>
            </div>
            <span className="mt-1 text-[10px] font-mono text-amber-300/80">
              🏁 Clique para acelerar ou segure o card para trocar de marcha ({currentCard.engine?.label})
            </span>
          </div>
          <NavButton onClick={goToNext} direction="next" />
        </div>

        {/* Painel de Especificações + Seletor Foil / Full Art */}
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${rarity.badgeClass}`}>
                  {rarity.symbol} {rarity.label}
                </span>
                <span className="text-xs font-mono text-slate-400">#{currentCard.number}</span>
              </div>
              <button
                type="button"
                onClick={handlePlayCardSound}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                title="Ouvir o efeito sonoro desta raridade e edição"
              >
                <span>🔊</span>
                <span>Ouvir Som</span>
              </button>
            </div>
            <h3 className="font-display font-black text-2xl text-white mt-2">
              {currentCard.marca}
            </h3>
            <p className="text-sm text-amber-200/90 font-medium">{currentCard.tipo}</p>
            <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
              “{currentCard.flavorText}”
            </p>
          </div>

          {/* Alternador de Edição (Normal / Foil / Full Art) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pré-visualizar Edição
              </span>
              <span className="font-mono font-black text-lg text-amber-300">
                {formatCurrency(currentValue)}
              </span>
            </div>

            {rarity.hasSpecialEditions ? (
              <div className="grid grid-cols-3 gap-2">
                {VARIANT_ORDER.map((vKey) => {
                  const v = VARIANTS[vKey];
                  const isOwned = ownedKeys.has(`${currentCard.id}::${vKey}`);
                  const active = effectiveVariant === vKey;
                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => handleVariantChange(vKey)}
                      className={`relative p-2.5 rounded-xl border text-center transition-all ${
                        active
                          ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {isOwned && (
                        <span
                          title="Você já tem esta edição"
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black flex items-center justify-center"
                        >
                          ✓
                        </span>
                      )}
                      <div className="text-[11px] font-black text-white">{v.shortLabel}</div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                        {formatCurrency(calculateCardValue(currentCard, vKey))}
                      </div>
                      <div className="text-[9px] text-slate-400">{v.multiplier}×</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                Cartas <strong className="text-emerald-300">Comuns</strong> possuem apenas edição Normal ({formatCurrency(currentCard.baseValue)}). Versões <strong className="text-cyan-300">Foil</strong> e <strong className="text-amber-300">Full Art</strong> são exclusivas de cartas <strong className="text-sky-300">Raras+</strong>!
              </div>
            )}
          </div>

          {/* Pacotes onde pode ser encontrada */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Disponível nos Pacotes:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cardPacks.map((p) => (
                <span
                  key={p.id}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${p.badgeStyle}`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Miniaturas rápidas para saltar entre cartas */}
      <div className="flex items-center justify-center flex-wrap gap-1.5 pt-2">
        {filteredCards.map((c, idx) => {
          const r = RARITIES[c.raridade];
          const active = idx === safeIndex;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                soundEngine.playCardSlide();
                setCurrentIndex(idx);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                active
                  ? 'bg-slate-800 border-amber-400 text-white scale-105'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`mr-1 ${r.textAccent}`}>{r.symbol}</span>
              {c.marca}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ShowcaseCarousel;
