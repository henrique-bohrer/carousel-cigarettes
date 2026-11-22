import React, { useState, useEffect, useRef } from 'react';
import { GRADING_FEE, PSA_GRADES, RARITIES, VARIANTS, VARIANT_ORDER } from '../data/rarities.js';
import { calculateCardValue, formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import engineAudio from '../utils/engineAudio.js';
import TcgCard from './TcgCard.jsx';

const CardInspectorModal = ({
  card,
  initialVariant = 'normal',
  initialGrade = null,
  ownedCount = 0,
  canSell = false,
  balance = 0,
  isPinned = false,
  onTogglePin,
  onGradeCard,
  onSellOne,
  onClose,
}) => {
  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [activeGrade, setActiveGrade] = useState(initialGrade);
  const [gradingAnim, setGradingAnim] = useState(false);
  const [audioStatus, setAudioStatus] = useState({ hasRealAudio: false, sourceType: 'synth', label: null });
  const [audioUploadMsg, setAudioUploadMsg] = useState(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    setSelectedVariant(initialVariant);
    setActiveGrade(initialGrade);
    setGradingAnim(false);
    setAudioUploadMsg(null);
    if (card) {
      engineAudio.inspectCardAudioStatus(card).then(setAudioStatus);
    }
  }, [card, initialVariant, initialGrade]);

  const handleUploadRealAudio = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !card) return;
    try {
      setAudioUploadMsg('Processando loop contínuo...');
      const entry = await engineAudio.registerCustomAudioFile(card, file);
      setAudioStatus({ hasRealAudio: true, sourceType: entry.sourceType, label: entry.label });
      setAudioUploadMsg('Áudio real salvo! Clique ou segure a carta.');
      engineAudio.playRevBlip(card);
    } catch (err) {
      setAudioUploadMsg(err?.message || 'Erro ao decodificar áudio (.mp3/.wav/.ogg).');
    }
  };

  const handleClearCustomAudio = async () => {
    if (!card) return;
    await engineAudio.clearCustomAudio(card.id);
    const updated = await engineAudio.inspectCardAudioStatus(card);
    setAudioStatus(updated);
    setAudioUploadMsg('Áudio personalizado removido.');
  };

  if (!card) return null;

  const rarity = RARITIES[card.raridade] || RARITIES.Comum;
  const effectiveVariant = rarity.hasSpecialEditions ? selectedVariant : 'normal';
  const variantInfo = VARIANTS[effectiveVariant];
  const displayGrade = effectiveVariant === initialVariant ? activeGrade : null;
  const currentValue = calculateCardValue(card, effectiveVariant, displayGrade);
  const isViewingOwnedExact = canSell && ownedCount > 0 && effectiveVariant === initialVariant;

  const handleSelectVariant = (vKey) => {
    setSelectedVariant(vKey);
    soundEngine.playSwitchEdition(vKey);
  };

  const handlePreviewCardSound = () => {
    soundEngine.playCardFlip();
    setTimeout(() => {
      soundEngine.playRarityReveal(card.raridade, effectiveVariant);
    }, 110);
  };

  const handleStartGrading = () => {
    if (!onGradeCard || balance < GRADING_FEE || gradingAnim || displayGrade) return;
    soundEngine.playLighterClick();
    setGradingAnim(true);

    setTimeout(() => {
      const assignedGrade = onGradeCard(card.id, effectiveVariant);
      setGradingAnim(false);
      if (assignedGrade) {
        setActiveGrade(assignedGrade);
        soundEngine.playGradeReveal(assignedGrade);
      }
    }, 850);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-7 animate-pop-in relative my-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold transition-colors"
        >
          ✕
        </button>

        {/* Carta interativa em tamanho grande */}
        <div className="flex flex-col items-center shrink-0">
          <div className={gradingAnim ? 'animate-pulse scale-95 transition-transform' : ''}>
            <TcgCard
              card={card}
              variant={effectiveVariant}
              grade={displayGrade}
              size="lg"
              enableEngineRev
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handlePreviewCardSound}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>🔊</span>
              <span>Som Raridade</span>
            </button>
            <button
              type="button"
              onClick={() => engineAudio.playRevBlip(card)}
              className="px-3 py-1.5 rounded-lg bg-red-600/25 hover:bg-red-600/40 border border-red-400/50 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>🏁</span>
              <span>Acelerar Motor</span>
            </button>
            {isViewingOwnedExact && onTogglePin && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onTogglePin(card.id, effectiveVariant, displayGrade);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                  isPinned
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                }`}
              >
                {isPinned ? '★ Na Estante' : '☆ Fixar'}
              </button>
            )}
          </div>
          <span className="mt-1.5 text-[10px] font-mono text-slate-400">
            Segure a carta para acelerar e trocar de marcha ({card.engine?.label})
          </span>

          {/* Controle de Áudio Real (.mp3 / .wav / .ogg) com pitch dinâmico */}
          <div className="mt-2.5 flex flex-col items-center gap-1">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleUploadRealAudio}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                  audioStatus.hasRealAudio
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400/50 hover:text-amber-200'
                }`}
              >
                {audioStatus.hasRealAudio
                  ? `✓ Áudio Real (${audioStatus.label})`
                  : '🎵 Carregar Áudio Real (.mp3/.wav)'}
              </button>
              {audioStatus.sourceType === 'custom' && (
                <button
                  type="button"
                  onClick={handleClearCustomAudio}
                  title="Remover áudio personalizado"
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-[10px] text-slate-400 hover:text-rose-200"
                >
                  ✕
                </button>
              )}
            </div>
            {audioUploadMsg && (
              <span className="text-[10px] text-amber-300 font-medium">{audioUploadMsg}</span>
            )}
          </div>
        </div>

        {/* Detalhes + Seletor de Edição + Estação PSA + Venda */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${rarity.badgeClass}`}>
                {rarity.symbol} {rarity.label}
              </span>
              {displayGrade && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {PSA_GRADES[displayGrade].label} ({PSA_GRADES[displayGrade].multiplier}×)
                </span>
              )}
              <span className="text-xs font-mono text-slate-400">#{card.number}</span>
            </div>
            <h2 className="font-display font-black text-3xl text-white mt-2">{card.marca}</h2>
            <p className="text-sm text-amber-200/90 font-medium">
              {card.tipo} • {card.origem} ({card.ano})
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-amber-400/50 pl-3">
            “{card.flavorText}”
          </p>

          {/* Seletor de Edições para cartas Raras+ */}
          <div className="bg-slate-950/75 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Acabamento & Cotação
              </span>
              {!rarity.hasSpecialEditions && (
                <span className="text-[10px] text-slate-500">
                  Foil & Full Art exclusivos para Raro+
                </span>
              )}
            </div>

            {rarity.hasSpecialEditions && (
              <div className="grid grid-cols-3 gap-2">
                {VARIANT_ORDER.map((vKey) => {
                  const v = VARIANTS[vKey];
                  const active = effectiveVariant === vKey;
                  const val = calculateCardValue(
                    card,
                    vKey,
                    vKey === initialVariant ? activeGrade : null
                  );
                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => handleSelectVariant(vKey)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        active
                          ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-white">{v.shortLabel}</div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                        {formatCurrency(val)}
                      </div>
                      <div className="text-[9px] text-slate-400">{v.multiplier}×</div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <div className="text-[11px] text-slate-300 font-semibold">{variantInfo.label}</div>
                <div className="text-[10px] text-slate-500">{variantInfo.description}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-400">Valor</div>
                <div className="font-mono font-black text-2xl text-amber-300">
                  {formatCurrency(currentValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Estação de Graduação PSA (para cartas possuídas ainda não graduadas) */}
          {isViewingOwnedExact && !displayGrade && onGradeCard && (
            <div className="bg-indigo-950/45 border border-indigo-400/35 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <span>🛡</span>
                  <span>Graduação PSA (Cápsula Acrílica)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Nota 8 (1.2×), 9 (1.55×) ou <strong className="text-amber-300">PSA 10 Gem Mint (2.25×)</strong> + bônus no Duelo!
                </div>
              </div>
              <button
                type="button"
                disabled={balance < GRADING_FEE || gradingAnim}
                onClick={handleStartGrading}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  balance >= GRADING_FEE && !gradingAnim
                    ? 'bg-gradient-to-r from-indigo-400 to-cyan-400 text-slate-950 hover:brightness-110 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {gradingAnim ? 'Avaliando...' : `Graduar (${formatCurrency(GRADING_FEE)})`}
              </button>
            </div>
          )}

          {/* Ação de venda */}
          {isViewingOwnedExact && (
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
              <div className="text-xs text-slate-300">
                Na sua coleção: <strong className="font-mono text-white">×{ownedCount}</strong>
              </div>
              <button
                type="button"
                onClick={() => onSellOne(card.id, effectiveVariant, displayGrade)}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors"
              >
                Vender 1 cópia (+{formatCurrency(currentValue)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardInspectorModal;
