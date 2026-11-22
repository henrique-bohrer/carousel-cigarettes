import React, { useMemo, useState } from 'react';
import { CARDS } from '../data/cards.js';
import { RARITIES, TRADE_UP_RECIPES, VARIANTS } from '../data/rarities.js';
import { formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import TcgCard from './TcgCard.jsx';

const TradeUpModal = ({ collection, onExecuteTradeUp, onClose }) => {
  const [resultPull, setResultPull] = useState(null);

  const countByRarity = useMemo(() => {
    const cardMap = new Map(CARDS.map((c) => [c.id, c]));
    const counts = { Comum: 0, Raro: 0, Épico: 0, Lendário: 0, Místico: 0, 'F1 Histórica': 0 };
    for (const item of collection) {
      // Só contabiliza cartas não-graduadas para evitar queimar cartas PSA por acidente
      if (item.grade) continue;
      const card = cardMap.get(item.cardId);
      if (card && counts[card.raridade] !== undefined) {
        counts[card.raridade] += 1;
      }
    }
    return counts;
  }, [collection]);

  const handleFuse = (recipe) => {
    soundEngine.playTradeUpFanfare();
    const forged = onExecuteTradeUp(recipe);
    if (forged) {
      setResultPull(forged);
      setTimeout(() => {
        soundEngine.playRarityReveal(forged.card.raridade, forged.variant);
      }, 450);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 backdrop-blur-lg p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-purple-400/40 shadow-2xl overflow-hidden animate-pop-in"
      >
        <div className="p-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-300">
              Alquimia TCG • Trade-Up
            </span>
            <h2 className="font-display font-black text-2xl text-white mt-0.5">
              Fusão de Cartas
            </h2>
            <p className="text-xs text-slate-300">
              Combine cartas sobrando (não graduadas) para forjar uma carta de raridade superior — com chance de Foil e Full Art!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {resultPull ? (
            <div className="flex flex-col items-center text-center py-4 animate-pop-in">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-300 mb-3">
                ✦ Fusão Concluída! ✦
              </span>
              <TcgCard card={resultPull.card} variant={resultPull.variant} size="md" isNew />
              <div className="mt-4 space-y-1">
                <div className="font-display font-bold text-xl text-white">
                  {resultPull.card.marca} — {resultPull.card.tipo}
                </div>
                <div className="text-sm font-mono font-bold text-amber-300">
                  {VARIANTS[resultPull.variant].label} • {formatCurrency(resultPull.value)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResultPull(null)}
                className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-amber-400 text-slate-950 font-black text-sm"
              >
                Fazer Outra Fusão
              </button>
            </div>
          ) : (
            TRADE_UP_RECIPES.map((recipe) => {
              const fromMeta = RARITIES[recipe.fromRarity];
              const toMeta = RARITIES[recipe.toRarity];
              const available = countByRarity[recipe.fromRarity] || 0;
              const canFuse = available >= recipe.requiredCount;

              return (
                <div
                  key={recipe.id}
                  className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${fromMeta.badgeClass}`}>
                        {recipe.requiredCount}× {fromMeta.label}
                      </span>
                      <span className="text-slate-500 font-black">→</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${toMeta.badgeClass}`}>
                        1× {toMeta.symbol} {toMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{recipe.description}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Disponíveis: <strong className={canFuse ? 'text-emerald-300' : 'text-slate-300'}>{available}</strong> / {recipe.requiredCount} • Foil {recipe.foilChance}% • Full Art {recipe.fullArtChance}%
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!canFuse}
                    onClick={() => handleFuse(recipe)}
                    className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                      canFuse
                        ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:brightness-110 shadow-[0_6px_20px_rgba(168,85,247,0.35)] active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Fundir ⚗
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeUpModal;
