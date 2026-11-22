import React, { useState, useRef } from 'react';
import { RARITIES, VARIANTS } from '../data/rarities.js';
import { formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import TcgCard from './TcgCard.jsx';

const PackOpeningModal = ({
  openingResult,
  previousOwnedKeys,
  balance,
  onOpenAnother,
  onClose,
}) => {
  const { pack, pulls, isGodPack, totalValue } = openingResult;
  const [stage, setStage] = useState('sealed'); // 'sealed' | 'tearing' | 'revealing' | 'summary'
  const [tearProgress, setTearProgress] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const tearStripRef = useRef(null);
  const isDraggingRef = useRef(false);

  const currentPull = pulls[currentIdx];
  const isNewKey = (pull) => !previousOwnedKeys.has(`${pull.cardId}::${pull.variant}`);

  const triggerTearComplete = () => {
    if (stage !== 'sealed') return;
    setTearProgress(100);
    setStage('tearing');
    soundEngine.playPackTear(isGodPack);
    setTimeout(() => {
      setStage('revealing');
      setCurrentIdx(0);
      setIsFlipped(false);
    }, 620);
  };

  const updateTearFromClientX = (clientX) => {
    if (!tearStripRef.current || stage !== 'sealed') return;
    const rect = tearStripRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setTearProgress(pct);
    soundEngine.playPackTearTick(pct);
    if (pct >= 72) {
      isDraggingRef.current = false;
      triggerTearComplete();
    }
  };

  const handlePointerDown = (e) => {
    if (stage !== 'sealed') return;
    isDraggingRef.current = true;
    updateTearFromClientX(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || stage !== 'sealed') return;
    updateTearFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (tearProgress < 72) {
      setTearProgress(0);
    }
  };

  const goToSummary = (fromSealed = false) => {
    setStage('summary');
    const topPull = pulls[pulls.length - 1];
    if (fromSealed) {
      soundEngine.playPackTear(isGodPack);
      if (topPull) {
        setTimeout(() => {
          soundEngine.playRarityReveal(topPull.card.raridade, topPull.variant);
        }, 360);
      }
    } else {
      soundEngine.playSummaryChime(totalValue >= pack.price);
    }
  };

  const handleCardAction = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      soundEngine.playCardFlip();
      if (currentPull) {
        setTimeout(() => {
          soundEngine.playRarityReveal(currentPull.card.raridade, currentPull.variant);
        }, 170);
      }
      return;
    }
    if (currentIdx < pulls.length - 1) {
      soundEngine.playCardSlide();
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx((idx) => idx + 1);
      }, 160);
    } else {
      goToSummary(false);
    }
  };

  const currentRarity = currentPull ? RARITIES[currentPull.card.raridade] : RARITIES.Comum;
  const isSpecialPull = currentPull && (currentPull.variant !== 'normal' || currentRarity.tier >= 4);
  const profit = totalValue - pack.price;
  const canAffordAnother = balance >= pack.price;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 backdrop-blur-xl p-4 overflow-y-auto"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Brilho ambiente dinâmico */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-500"
        style={{
          background:
            stage === 'revealing' && isSpecialPull
              ? `radial-gradient(circle at 50% 45%, ${currentRarity.glowColor}, transparent 60%)`
              : `radial-gradient(circle at 50% 45%, ${pack.foilTint}, transparent 62%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* ======================== STAGE 1 & 2: PACOTE SELADO / RASGANDO ======================== */}
        {(stage === 'sealed' || stage === 'tearing') && (
          <div className="flex flex-col items-center animate-pop-in">
            <div className="mb-4 text-center">
              <span className={`text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full border ${pack.badgeStyle}`}>
                {pack.badge}
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-2">
                {pack.name}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Deslize na faixa pontilhada no topo ou clique em <strong className="text-amber-300">Rasgar Pacote</strong>
              </p>
            </div>

            {/* Embalagem do Booster interativa */}
            <div className="relative w-64 sm:w-72 h-[25rem] select-none my-2">
              {/* Tampa superior que rasga e voa */}
              <div
                ref={tearStripRef}
                onPointerDown={handlePointerDown}
                style={{
                  transform:
                    stage === 'tearing'
                      ? 'translateY(-48px) rotate(-10deg) scale(1.04)'
                      : `translateX(${tearProgress * 0.12}px)`,
                  opacity: stage === 'tearing' ? 0 : 1,
                }}
                className={`relative z-20 h-14 w-full rounded-t-2xl border-2 border-b-0 ${pack.accentBorder} bg-gradient-to-r ${pack.gradient} cursor-grab active:cursor-grabbing touch-none transition-all duration-500 overflow-hidden shadow-lg`}
              >
                <div className="h-5 w-full pack-crimp-top border-b border-white/25" />
                <div className="h-9 flex items-center justify-center relative px-3">
                  {/* Barra de progresso do rasgo */}
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-300/35 transition-all duration-75"
                    style={{ width: `${tearProgress}%` }}
                  />
                  <span className="relative z-10 text-[11px] font-mono font-bold tracking-[0.18em] text-amber-200 flex items-center gap-2">
                    <span>✂</span>
                    <span>DESLIZE PARA RASGAR →</span>
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 border-b-2 border-dashed border-amber-300/80" />
              </div>

              {/* Flash de luz ao abrir */}
              {stage === 'tearing' && (
                <div className="absolute inset-x-2 top-12 h-8 bg-amber-200 blur-xl animate-pulse z-30" />
              )}

              {/* Corpo inferior do booster */}
              <div
                onClick={triggerTearComplete}
                className={`relative z-10 h-[21.5rem] w-full rounded-b-2xl border-2 border-t-0 ${pack.accentBorder} bg-gradient-to-b ${pack.gradient} shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden transition-transform duration-500 ${
                  stage === 'tearing' ? 'scale-105 brightness-125' : 'hover:scale-[1.01]'
                }`}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-45"
                  style={{
                    background: `linear-gradient(125deg, transparent 20%, ${pack.foilTint} 48%, rgba(255,255,255,0.5) 52%, transparent 80%)`,
                  }}
                />
                <div className="relative z-10 space-y-3">
                  <div className="text-xs font-mono tracking-[0.3em] text-white/75 uppercase">
                    APEX TCG
                  </div>
                  <div className="font-display font-black text-3xl text-white drop-shadow-lg">
                    {pack.emblemText}
                  </div>
                  <p className="text-xs text-white/80 max-w-[12rem] mx-auto">
                    Contém {pack.cardsPerPack} cartas com 1 carta Rara+ garantida
                  </p>
                  {isGodPack && (
                    <div className="text-[10px] font-mono text-amber-200/80 animate-pulse">
                      ✦ Aura prismática detectada... ✦
                    </div>
                  )}
                </div>
                <div className="h-5 w-full pack-crimp-top border-t border-white/25 absolute bottom-0" />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={triggerTearComplete}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm tracking-wide shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:from-amber-300 hover:to-yellow-400 active:scale-95 transition-all"
              >
                ✂ Rasgar Pacote Agora
              </button>
              <button
                type="button"
                onClick={() => goToSummary(true)}
                className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Pular Animação
              </button>
            </div>
          </div>
        )}

        {/* ======================== STAGE 3: REVELAÇÃO CARTA POR CARTA ======================== */}
        {stage === 'revealing' && currentPull && (
          <div className="flex flex-col items-center w-full animate-pop-in">
            {/* Barra de progresso das 5 cartas */}
            <div className="flex items-center gap-2 mb-4">
              {pulls.map((p, i) => {
                const r = RARITIES[p.card.raridade];
                const revealed = i < currentIdx || (i === currentIdx && isFlipped);
                return (
                  <div
                    key={p.instanceId}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIdx ? 'w-10' : 'w-5'
                    } ${revealed ? r.summaryBar : 'bg-slate-700'}`}
                  />
                );
              })}
            </div>

            {isGodPack && (
              <div className="mb-3 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 text-white text-xs font-black tracking-[0.2em] uppercase shadow-lg animate-pulse">
                ✦ GOD PACK! TODAS AS CARTAS SÃO ESPECIAIS ✦
              </div>
            )}

            <div className="text-xs font-mono text-slate-400 mb-3">
              Carta {currentIdx + 1} de {pulls.length}
              {!isFlipped && isSpecialPull && (
                <span className="ml-2 text-amber-300 font-bold animate-pulse">
                  ✦ Brilho Raro Detectado!
                </span>
              )}
            </div>

            {/* Carta com Flip 3D */}
            <div
              onClick={handleCardAction}
              className="perspective-1200 cursor-pointer my-1"
            >
              <div
                className={`relative w-72 sm:w-80 h-[27rem] sm:h-[29.5rem] preserve-3d transition-transform duration-700 ease-out ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Verso da Carta (Card Back estilo TCG) */}
                <div
                  className={`absolute inset-0 backface-hidden rounded-2xl border-2 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 shadow-2xl overflow-hidden ${
                    isSpecialPull
                      ? 'border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.55)]'
                      : 'border-slate-600'
                  }`}
                >
                  <div className="absolute inset-3 rounded-xl border border-amber-400/35 pointer-events-none" />
                  <div className="absolute inset-5 rounded-lg border border-dashed border-white/15 pointer-events-none" />
                  <div
                    className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center ${
                      isSpecialPull
                        ? 'border-amber-300 bg-amber-400/15 animate-pulse'
                        : 'border-indigo-400/40 bg-indigo-500/10'
                    }`}
                  >
                    <span className="font-display font-black text-2xl text-amber-300 tracking-widest">
                      TCG
                    </span>
                    <span className="text-[9px] font-mono tracking-[0.25em] text-slate-300 mt-0.5">
                      APEX
                    </span>
                  </div>
                  <p className="mt-6 text-xs font-semibold text-slate-300 tracking-wide">
                    Clique para virar a carta
                  </p>
                </div>

                {/* Frente da Carta */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                  <TcgCard
                    key={currentPull.instanceId}
                    card={currentPull.card}
                    variant={currentPull.variant}
                    size="lg"
                    isNew={isNewKey(currentPull)}
                  />
                </div>
              </div>
            </div>

            {/* Banner de Destaque quando virada */}
            <div className="h-14 flex flex-col items-center justify-center mt-3">
              {isFlipped ? (
                <div className="text-center animate-pop-in">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentRarity.badgeClass}`}>
                      {currentRarity.symbol} {currentRarity.label}
                    </span>
                    {currentPull.variant !== 'normal' && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${VARIANTS[currentPull.variant].badgeClass}`}>
                        ✦ {VARIANTS[currentPull.variant].label} ({VARIANTS[currentPull.variant].multiplier}×)
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono font-bold text-amber-300 mt-1">
                    Valor de Mercado: {formatCurrency(currentPull.value)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Toque na carta para revelar
                </p>
              )}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleCardAction}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-yellow-400 active:scale-95 transition-all"
              >
                {!isFlipped
                  ? 'Virar Carta'
                  : currentIdx < pulls.length - 1
                    ? 'Próxima Carta →'
                    : 'Ver Resumo do Pacote'}
              </button>
              <button
                type="button"
                onClick={() => goToSummary(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Revelar Todas
              </button>
            </div>
          </div>
        )}

        {/* ======================== STAGE 4: RESUMO DO PACOTE ======================== */}
        {stage === 'summary' && (
          <div className="w-full flex flex-col items-center animate-pop-in py-4">
            <div className="text-center mb-5">
              {isGodPack && (
                <div className="inline-block mb-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 text-white text-xs font-black tracking-[0.2em] uppercase shadow-lg">
                  ✦ GOD PACK LENDÁRIO! ✦
                </div>
              )}
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                Resumo do Pacote — {pack.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-sm">
                <span className="text-slate-400">
                  Custo: <strong className="font-mono text-slate-200">{formatCurrency(pack.price)}</strong>
                </span>
                <span className="text-slate-400">
                  Valor Obtido:{' '}
                  <strong className="font-mono text-amber-300 text-base">
                    {formatCurrency(totalValue)}
                  </strong>
                </span>
                <span
                  className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    profit >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}
                >
                  {profit >= 0 ? `+${formatCurrency(profit)} Lucro` : `${formatCurrency(profit)} Saldo`}
                </span>
              </div>
            </div>

            {/* Grade com as 5 cartas reveladas (clique para ouvir o som da carta novamente) */}
            <div className="flex flex-wrap items-center justify-center gap-4 my-2">
              {pulls.map((pull) => (
                <div key={pull.instanceId} className="flex flex-col items-center gap-1.5">
                  <TcgCard
                    card={pull.card}
                    variant={pull.variant}
                    size="sm"
                    isNew={isNewKey(pull)}
                    onClick={() => {
                      soundEngine.playCardFlip();
                      setTimeout(() => {
                        soundEngine.playRarityReveal(pull.card.raridade, pull.variant);
                      }, 100);
                    }}
                  />
                  <div className="text-center">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {formatCurrency(pull.value)}
                    </span>
                    {pull.variant !== 'normal' && (
                      <span className="ml-1.5 text-[10px] font-bold text-cyan-300 uppercase">
                        {VARIANTS[pull.variant].shortLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ações Finais */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
              <button
                type="button"
                disabled={!canAffordAnother}
                onClick={() => onOpenAnother(pack)}
                className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                  canAffordAnother
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:from-amber-300 hover:to-yellow-400 shadow-[0_8px_25px_rgba(245,158,11,0.35)] active:scale-95'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <span>Abrir Outro Pacote</span>
                <span className="font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded">
                  {formatCurrency(pack.price)}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm transition-colors"
              >
                Guardar na Coleção ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackOpeningModal;
