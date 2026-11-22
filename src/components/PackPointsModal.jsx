import React, { useState } from 'react';
import { CARDS } from '../data/cards.js';
import { RARITIES, RARITY_ORDER, VARIANTS, VARIANT_ORDER } from '../data/rarities.js';
import { calculateCardValue, formatCurrency, getCraftCost } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';

const PackPointsModal = ({ packPoints, ownedKeys, onCraftCard, onClose }) => {
  const [rarityFilter, setRarityFilter] = useState('Todas');
  const [selectedVariants, setSelectedVariants] = useState({});

  const filtered = CARDS.filter((c) =>
    rarityFilter === 'Todas' ? true : c.raridade === rarityFilter
  ).sort((a, b) => (RARITIES[b.raridade]?.tier || 0) - (RARITIES[a.raridade]?.tier || 0));

  const getVariant = (card) => {
    const r = RARITIES[card.raridade];
    if (!r?.hasSpecialEditions) return 'normal';
    return selectedVariants[card.id] || 'normal';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-400/35 shadow-2xl overflow-hidden animate-pop-in"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300">
              Sistema de Pity • Pack Points
            </span>
            <h2 className="font-display font-black text-2xl text-white mt-0.5">
              Trocar Pontos de Pacote
            </h2>
            <p className="text-xs text-slate-300">
              Ganhe pontos abrindo pacotes, missões e duelos — troque diretamente por qualquer carta Normal, Foil ou Full Art!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-400/40 text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Seus Pontos</div>
              <div className="font-mono font-black text-lg text-amber-300">{packPoints} PT</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-2">
          {['Todas', ...RARITY_ORDER].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setRarityFilter(r);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                rarityFilter === r
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Lista de Craft */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((card) => {
            const r = RARITIES[card.raridade];
            const variant = getVariant(card);
            const cost = getCraftCost(card, variant);
            const value = calculateCardValue(card, variant);
            const canAfford = packPoints >= cost;
            const isOwned = ownedKeys.has(`${card.id}::${variant}`);

            return (
              <div
                key={card.id}
                className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeClass}`}>
                        {r.symbol} {r.label}
                      </span>
                      {isOwned && (
                        <span className="text-[10px] font-bold text-emerald-400">✓ Já possui</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-white mt-1">
                      {card.marca} <span className="font-sans font-normal text-xs text-slate-400">{card.tipo}</span>
                    </h3>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-400">Mercado</div>
                    <div className="text-sm font-bold text-amber-300">{formatCurrency(value)}</div>
                  </div>
                </div>

                {/* Escolha de Edição */}
                {r.hasSpecialEditions && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {VARIANT_ORDER.map((vKey) => {
                      const active = variant === vKey;
                      return (
                        <button
                          key={vKey}
                          type="button"
                          onClick={() => {
                            soundEngine.playUiClick();
                            setSelectedVariants((prev) => ({ ...prev, [card.id]: vKey }));
                          }}
                          className={`py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            active
                              ? 'bg-slate-800 border-amber-400 text-amber-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {VARIANTS[vKey].shortLabel} ({getCraftCost(card, vKey)} PT)
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => onCraftCard(card, variant, cost)}
                  className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? `Forjar Carta por ${cost} PT` : `Faltam ${cost - packPoints} PT`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PackPointsModal;
