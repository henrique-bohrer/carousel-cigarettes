import React, { useState } from 'react';
import { RARITIES, VARIANTS } from '../data/rarities.js';
import { calculateCardValue, formatCurrency, generateWonderPickTables } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import RarityRevealOverlay, { getRevealConfig } from './RarityRevealOverlay.jsx';
import TcgCard from './TcgCard.jsx';

const WonderPickView = ({ balance, onCompleteWonderPick }) => {
  const [tables, setTables] = useState(() => generateWonderPickTables());
  const [activeSession, setActiveSession] = useState(null);
  // activeSession = { table, phase: 'shuffling' | 'picking' | 'revealed', shuffledSlots, pickedIndex }

  const handleRefreshTables = () => {
    soundEngine.playShuffleSound();
    setTables(generateWonderPickTables());
  };

  const handleStartPick = (table) => {
    if (balance < table.cost) {
      soundEngine.playUiClick();
      return;
    }

    soundEngine.playLighterClick();
    const shuffled = [...table.slots].sort(() => Math.random() - 0.5);

    setActiveSession({
      table,
      phase: 'shuffling',
      shuffledSlots: shuffled,
      pickedIndex: null,
    });

    setTimeout(() => {
      soundEngine.playShuffleSound();
    }, 140);

    setTimeout(() => {
      setActiveSession((curr) =>
        curr ? { ...curr, phase: 'picking' } : null
      );
    }, 950);
  };

  const handleChooseSlot = (idx) => {
    if (!activeSession || activeSession.phase !== 'picking') return;
    const chosen = activeSession.shuffledSlots[idx];

    soundEngine.playCardFlip();
    setTimeout(() => {
      soundEngine.playRarityReveal(chosen.card.raridade, chosen.variant);
    }, 170);

    setActiveSession((curr) => ({
      ...curr,
      phase: 'revealed',
      pickedIndex: idx,
    }));

    onCompleteWonderPick({
      cost: activeSession.table.cost,
      card: chosen.card,
      variant: chosen.variant,
    });
  };

  const handleCloseSession = () => {
    soundEngine.playUiClick();
    setActiveSession(null);
    setTables(generateWonderPickTables());
  };

  return (
    <div className="space-y-8">
      {/* Banner Introdutório */}
      <section className="relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-slate-900 via-fuchsia-950/40 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 text-[11px] font-mono font-bold uppercase tracking-wider">
              <span>✧</span>
              <span>Escolha Misteriosa • Wonder Pick</span>
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
              Tente a Sorte em 1 de 5 Cartas
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Veja pacotes recém-abertos por outros colecionadores! As 5 cartas são viradas e embaralhadas —
              escolha uma e leve para casa com <strong className="text-amber-300">20% de chance exata</strong> de
              fisgar a carta destaque <strong className="text-cyan-300">Foil</strong> ou{' '}
              <strong className="text-amber-300">Full Art</strong>!
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshTables}
            className="shrink-0 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-fuchsia-400/40 text-fuchsia-200 font-bold text-xs flex items-center gap-2 transition-colors self-start md:self-center"
          >
            <span>↻</span>
            <span>Atualizar Mesas</span>
          </button>
        </div>
      </section>

      {/* Lista das 3 Mesas Disponíveis */}
      <div className="space-y-5">
        {tables.map((table) => {
          const canAfford = balance >= table.cost;
          return (
            <div
              key={table.id}
              className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-sm">
                    {table.owner[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg text-white">{table.title}</h3>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${table.badgeStyle}`}>
                        {table.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Pacote aberto por <span className="text-slate-200 font-semibold">@{table.owner}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleStartPick(table)}
                  className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
                    canAfford
                      ? 'bg-gradient-to-r from-fuchsia-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-[0_6px_20px_rgba(217,70,239,0.3)] active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>Participar</span>
                  <span className="font-mono text-xs bg-black/20 px-2 py-0.5 rounded-md">
                    {formatCurrency(table.cost)}
                  </span>
                </button>
              </div>

              {/* Preview das 5 cartas da mesa */}
              <div className="flex flex-wrap items-center justify-center lg:justify-between gap-3">
                {table.slots.map((slot) => {
                  const val = calculateCardValue(slot.card, slot.variant);
                  return (
                    <div
                      key={slot.slotId}
                      className={`relative flex flex-col items-center gap-1 p-1.5 rounded-2xl ${
                        slot.isChase ? 'ring-2 ring-amber-400/70 bg-amber-400/5' : ''
                      }`}
                    >
                      {slot.isChase && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
                          ★ Destaque
                        </span>
                      )}
                      <TcgCard card={slot.card} variant={slot.variant} size="sm" interactive={false} />
                      <span className="text-[11px] font-mono font-bold text-slate-300">
                        {formatCurrency(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Interativo de Embaralhamento & Escolha */}
      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="relative z-40 w-full max-w-5xl flex flex-col items-center text-center animate-pop-in">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${activeSession.table.badgeStyle}`}>
              WONDER PICK • {activeSession.table.title}
            </span>

            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-3">
              {activeSession.phase === 'shuffling' && 'Embaralhando as 5 cartas...'}
              {activeSession.phase === 'picking' && 'Escolha 1 das 5 cartas viradas!'}
              {activeSession.phase === 'revealed' && 'Carta Conquistada!'}
            </h2>

            {activeSession.phase === 'revealed' && activeSession.pickedIndex !== null && (
              <p className="text-sm text-amber-300 font-mono font-bold mt-1">
                Você tirou {activeSession.shuffledSlots[activeSession.pickedIndex].card.marca}{' '}
                ({VARIANTS[activeSession.shuffledSlots[activeSession.pickedIndex].variant].shortLabel}) —{' '}
                {formatCurrency(
                  calculateCardValue(
                    activeSession.shuffledSlots[activeSession.pickedIndex].card,
                    activeSession.shuffledSlots[activeSession.pickedIndex].variant
                  )
                )}
              </p>
            )}

            {/* As 5 cartas interativas */}
            <div className="flex flex-wrap items-center justify-center gap-4 my-7">
              {activeSession.shuffledSlots.map((slot, idx) => {
                const isRevealed = activeSession.phase === 'revealed';
                const isPicked = activeSession.pickedIndex === idx;
                const r = RARITIES[slot.card.raridade];

                return (
                  <div
                    key={slot.slotId}
                    onClick={() => handleChooseSlot(idx)}
                    className={`perspective-1200 transition-all duration-500 ${
                      activeSession.phase === 'shuffling'
                        ? 'animate-pulse scale-95'
                        : activeSession.phase === 'picking'
                          ? 'cursor-pointer hover:-translate-y-3 hover:scale-105'
                          : isPicked
                            ? 'scale-105 ring-4 ring-amber-400 rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.55)]'
                            : 'opacity-55 scale-95'
                    }`}
                  >
                    <div
                      className={`relative w-44 h-[16.5rem] preserve-3d transition-transform duration-700 ${
                        isRevealed ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Verso da Carta */}
                      <div className="absolute inset-0 backface-hidden rounded-2xl border-2 border-fuchsia-400/60 bg-gradient-to-br from-slate-900 via-fuchsia-950 to-indigo-950 flex flex-col items-center justify-center p-4 shadow-2xl">
                        <div className="absolute inset-2.5 rounded-xl border border-amber-300/30 pointer-events-none" />
                        <div className="w-16 h-16 rounded-full border-2 border-amber-300/70 bg-amber-400/10 flex items-center justify-center">
                          <span className="font-display font-black text-2xl text-amber-300">?</span>
                        </div>
                        <span className="mt-4 text-[10px] font-mono uppercase tracking-[0.2em] text-fuchsia-200">
                          {activeSession.phase === 'picking' ? `Carta #${idx + 1}` : 'Embaralhando'}
                        </span>
                      </div>

                      {/* Frente Revelada */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180">
                        {isRevealed && isPicked && getRevealConfig(slot.card.raridade).hasCinematic && (
                          <RarityRevealOverlay
                            rarity={slot.card.raridade}
                            variant={slot.variant}
                            phase="burst"
                            layer="back"
                          />
                        )}
                        <div className="relative z-20">
                          <TcgCard
                            card={slot.card}
                            variant={slot.variant}
                            size="sm"
                            interactive={false}
                          />
                        </div>
                        {isRevealed && isPicked && getRevealConfig(slot.card.raridade).hasCinematic && (
                          <RarityRevealOverlay
                            rarity={slot.card.raridade}
                            variant={slot.variant}
                            phase="burst"
                            layer="front"
                          />
                        )}
                        {isPicked && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                            ★ SUA CARTA!
                          </div>
                        )}
                        {!isPicked && slot.isChase && (
                          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-slate-950 whitespace-nowrap ${r.badgeClass}`}>
                            Estava aqui
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {activeSession.phase === 'revealed' && (
              <button
                type="button"
                onClick={handleCloseSession}
                className="mt-4 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:brightness-110 transition-all"
              >
                Guardar na Coleção ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WonderPickView;
