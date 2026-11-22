import React from 'react';
import { RARITIES, RARITY_ORDER, VARIANTS } from '../data/rarities.js';
import { calculateCardValue, formatCurrency, getCardsForPack } from '../utils/packEngine.js';

const PackOddsModal = ({ pack, onClose, onInspectCard }) => {
  if (!pack) return null;

  const packCards = getCardsForPack(pack.id).sort(
    (a, b) => (RARITIES[b.raridade]?.tier || 0) - (RARITIES[a.raridade]?.tier || 0)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-pop-in"
      >
        {/* Header */}
        <div className={`p-5 bg-gradient-to-r ${pack.gradient} border-b border-white/15 flex items-start justify-between`}>
          <div>
            <span className={`text-[10px] font-black tracking-[0.2em] px-2.5 py-0.5 rounded-full border ${pack.badgeStyle}`}>
              {pack.badge}
            </span>
            <h2 className="font-display font-black text-2xl text-white mt-1.5">{pack.name}</h2>
            <p className="text-xs text-white/80 mt-0.5">{pack.subtitle} • {pack.cardsPerPack} cartas por pacote</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Tabela de Probabilidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Probabilidade por Raridade
              </h3>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 text-[10px] font-mono text-slate-500 pb-1 border-b border-slate-800">
                  <span>Raridade</span>
                  <span className="text-right">Slots 1–4</span>
                  <span className="text-right text-amber-300">5ª Carta (Hit)</span>
                </div>
                {RARITY_ORDER.map((rKey) => {
                  const r = RARITIES[rKey];
                  return (
                    <div key={rKey} className="grid grid-cols-3 items-center">
                      <span className={`font-semibold ${r.textAccent}`}>
                        {r.symbol} {r.label}
                      </span>
                      <span className="text-right font-mono text-slate-300">
                        {pack.normalSlotOdds[rKey] || 0}%
                      </span>
                      <span className="text-right font-mono font-bold text-amber-200">
                        {pack.hitSlotOdds[rKey] || 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Edições Especiais (Cartas Raras+)
                </h3>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  Todo carro <strong className="text-sky-300">Raro</strong>, <strong className="text-purple-300">Épico</strong>,{' '}
                  <strong className="text-amber-300">Lendário</strong>, <strong className="text-rose-300">Místico</strong> ou{' '}
                  <strong className="text-red-300">F1 Histórica (♛)</strong> pode vir em versão{' '}
                  <strong className="text-cyan-300">Foil</strong> ou <strong className="text-amber-200">Full Art</strong> com valor muito superior!
                </p>
                <div className="space-y-2">
                  {Object.values(VARIANTS).map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${v.badgeClass}`}>
                          {v.shortLabel}
                        </span>
                        <span className="text-slate-300">{v.multiplier}× Valor</span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {pack.variantOdds[v.id]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-[10px] font-mono text-amber-300/90 bg-amber-500/10 border border-amber-400/25 rounded-lg px-2.5 py-1.5">
                ✦ Bônus Secreto: 2.5% de chance de God Pack (5 cartas Épicas+ Foil/Full Art)
              </div>
            </div>
          </div>

          {/* Lista de Cartas do Pacote */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Cartas Disponíveis neste Pacote ({packCards.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {packCards.map((card) => {
                const r = RARITIES[card.raridade];
                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => onInspectCard(card, r.hasSpecialEditions ? 'full-art' : 'normal')}
                    className="text-left p-3 rounded-xl bg-slate-950/75 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${r.badgeClass}`}>
                          {r.symbol} {r.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">#{card.number}</span>
                      </div>
                      <div className="font-bold text-sm text-white truncate mt-1">
                        {card.marca} <span className="font-normal text-slate-400">{card.tipo}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px]">
                      <div className="text-slate-300">
                        Normal: <strong className="text-white">{formatCurrency(card.baseValue)}</strong>
                      </div>
                      {r.hasSpecialEditions && (
                        <>
                          <div className="text-cyan-300">
                            Foil: <strong>{formatCurrency(calculateCardValue(card, 'foil'))}</strong>
                          </div>
                          <div className="text-amber-300">
                            Full Art: <strong>{formatCurrency(calculateCardValue(card, 'full-art'))}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackOddsModal;
