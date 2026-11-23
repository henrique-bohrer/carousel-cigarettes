import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CARDS } from '../data/cards.js';
import { CATEGORIES, CATEGORY_ORDER } from '../data/categories.js';
import { PACKS } from '../data/packs.js';
import { RARITIES, VARIANTS, VARIANT_ORDER } from '../data/rarities.js';
import { calculateCardValue, formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import RarityRevealOverlay, { getRevealConfig } from './RarityRevealOverlay.jsx';
import NavButton from './NavButton.jsx';
import TcgCard from './TcgCard.jsx';

const ShowcaseCarousel = ({ ownedKeys }) => {
  const [selectedCategory, setSelectedCategory] = useState('gt3');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewVariant, setPreviewVariant] = useState('normal');
  const [demoPhase, setDemoPhase] = useState('idle');
  const demoTimersRef = useRef([]);

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
  };

  useEffect(() => () => clearDemoTimers(), []);

  // Filtra por categoria e ordena em ranking do Comum até o Místico / F1 Histórica!
  const filteredCards = useMemo(() => {
    const list =
      selectedCategory === 'all'
        ? [...CARDS]
        : CARDS.filter((c) => c.category === selectedCategory);
    return list.sort((a, b) => {
      const tierDiff = (RARITIES[a.raridade]?.tier || 0) - (RARITIES[b.raridade]?.tier || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.baseValue - b.baseValue;
    });
  }, [selectedCategory]);

  const safeIndex = currentIndex >= filteredCards.length ? 0 : currentIndex;
  const currentCard = filteredCards[safeIndex];
  const rarity = RARITIES[currentCard.raridade] || RARITIES.Comum;
  const categoryMeta = CATEGORIES[currentCard.category];
  const effectiveVariant = rarity.hasSpecialEditions ? previewVariant : 'normal';
  const currentValue = calculateCardValue(currentCard, effectiveVariant);
  const hasCurrentEdition = ownedKeys.has(`${currentCard.id}::${effectiveVariant}`);

  const goToPrevious = () => {
    clearDemoTimers();
    setDemoPhase('idle');
    soundEngine.playCardSlide();
    setCurrentIndex((prev) => (prev === 0 ? filteredCards.length - 1 : prev - 1));
  };

  const goToNext = () => {
    clearDemoTimers();
    setDemoPhase('idle');
    soundEngine.playCardSlide();
    setCurrentIndex((prev) => (prev === filteredCards.length - 1 ? 0 : prev + 1));
  };

  const handleCategoryChange = (catId) => {
    clearDemoTimers();
    setDemoPhase('idle');
    soundEngine.playUiClick();
    setSelectedCategory(catId);
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

  const revealCfg = getRevealConfig(currentCard.raridade);

  const handleTestRevealAnim = () => {
    if (!revealCfg.hasCinematic) return;
    clearDemoTimers();
    setDemoPhase('buildup');
    soundEngine.playRevealBuildup(currentCard.raridade);

    const t1 = setTimeout(() => {
      setDemoPhase('burst');
      soundEngine.playCardFlip();
      soundEngine.playRarityReveal(currentCard.raridade, effectiveVariant);
    }, revealCfg.buildupMs);

    demoTimersRef.current = [t1];
  };

  const cardPacks = PACKS.filter((p) => currentCard.packIds.includes(p.id));
  const activeCatMeta = selectedCategory === 'all' ? null : CATEGORIES[selectedCategory];

  return (
    <div className="space-y-8 relative">
      {/* Cabeçalho & Seletor de Categoria (Ranking Comum -> Místico) */}
      <div className="text-center space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-300">
          Ranking por Categoria • Comum → Místico
        </span>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
          Vitrine & Escada de Raridades
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Cada categoria possui seu próprio ranking do <strong className="text-emerald-300">♦ Comum</strong> ao{' '}
          <strong className="text-rose-300">★★★ Místico</strong> (e <strong className="text-amber-300">♛ F1 Histórica</strong> na F1).
          Segure qualquer carta para testar o motor e as trocas de marcha reais!
        </p>

        {/* Pills de Categoria */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            Todos ({CARDS.length})
          </button>
          {CATEGORY_ORDER.map((catId) => {
            const cat = CATEGORIES[catId];
            const count = CARDS.filter((c) => c.category === catId).length;
            return (
              <button
                key={catId}
                type="button"
                onClick={() => handleCategoryChange(catId)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  selectedCategory === catId
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="opacity-75 font-mono text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {activeCatMeta && (
          <p className="text-xs text-slate-400 italic">{activeCatMeta.description}</p>
        )}
      </div>

      {/* Palco Principal do Carrossel */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <NavButton onClick={goToPrevious} direction="prev" />
          <div className="flex flex-col items-center">
            <div
              className={`relative ${
                demoPhase === 'buildup'
                  ? 'animate-cr-shake'
                  : demoPhase === 'burst'
                    ? 'animate-cr-impact'
                    : ''
              }`}
            >
              {demoPhase !== 'idle' && (
                <RarityRevealOverlay
                  key={`${currentCard.id}-${demoPhase}-back`}
                  rarity={currentCard.raridade}
                  variant={effectiveVariant}
                  phase={demoPhase}
                  layer="back"
                />
              )}
              <div className="relative z-20">
                <TcgCard card={currentCard} variant={effectiveVariant} size="lg" enableEngineRev />
              </div>
              {demoPhase !== 'idle' && (
                <RarityRevealOverlay
                  key={`${currentCard.id}-${demoPhase}-front`}
                  rarity={currentCard.raridade}
                  variant={effectiveVariant}
                  phase={demoPhase}
                  layer="front"
                />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>
                Ranking {safeIndex + 1} / {filteredCards.length}
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {categoryMeta && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${categoryMeta.badgeClass}`}>
                    {categoryMeta.icon} {categoryMeta.shortName}
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${rarity.badgeClass}`}>
                  {rarity.symbol} {rarity.label}
                </span>
                <span className="text-xs font-mono text-slate-400">#{currentCard.number}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {revealCfg.hasCinematic && (
                  <button
                    type="button"
                    onClick={handleTestRevealAnim}
                    className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/50 text-amber-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    title="Testar animação cinematográfica de revelação"
                  >
                    <span>🎬</span>
                    <span>Animação</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePlayCardSound}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Ouvir o efeito sonoro desta raridade e edição"
                >
                  <span>🔊</span>
                  <span>Som</span>
                </button>
              </div>
            </div>
            <h3 className="font-display font-black text-2xl text-white mt-2">
              {currentCard.marca}
            </h3>
            <p className="text-sm text-amber-200/90 font-medium">{currentCard.tipo}</p>
            <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
              “{currentCard.flavorText}”
            </p>
            {currentCard.engine && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                <div>
                  <div className="text-[9px] font-mono uppercase text-slate-500">Motor</div>
                  <div className="text-[10px] font-bold text-slate-200 truncate" title={currentCard.engine.label}>
                    {currentCard.engine.label}
                  </div>
                </div>
                <div className="border-x border-slate-800 px-1">
                  <div className="text-[9px] font-mono uppercase text-slate-500">Câmbio</div>
                  <div className="text-[10px] font-bold text-cyan-300 truncate" title={currentCard.engine.transmission}>
                    {currentCard.engine.transmission || `${currentCard.engine.gears}M`}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-slate-500">Troca Média</div>
                  <div className="text-[11px] font-mono font-black text-amber-300">
                    ~{currentCard.engine.shiftMs} ms
                  </div>
                </div>
              </div>
            )}
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
                Carros <strong className="text-emerald-300">Comuns</strong> possuem apenas edição Normal ({formatCurrency(currentCard.baseValue)}). Versões <strong className="text-cyan-300">Foil</strong> e <strong className="text-amber-300">Full Art</strong> são exclusivas de carros <strong className="text-sky-300">Raros+</strong>!
              </div>
            )}
          </div>

          {/* Pacote exclusivo da categoria */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Disponível no Pacote da Categoria:
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

      {/* Escada Visual do Ranking da Categoria (Comum -> Místico / F1 Histórica) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 text-center mb-3">
          {activeCatMeta
            ? `Ranking ${activeCatMeta.icon} ${activeCatMeta.name} — do Comum ao Topo`
            : `Todos os ${CARDS.length} Carros Ordenados por Raridade`}
        </div>
        <div className="flex items-center justify-center flex-wrap gap-2">
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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-800 border-amber-400 text-white scale-105 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className={`font-black ${r.textAccent}`}>{r.symbol}</span>
                <span>{c.marca} {c.tipo.split(' ')[0]}</span>
                <span className="text-[9px] font-mono text-slate-500">({r.label})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShowcaseCarousel;
