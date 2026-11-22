import React, { useEffect, useRef, useState } from 'react';
import { PSA_GRADES, RARITIES, VARIANTS } from '../data/rarities.js';
import { calculateCardValue, formatCurrency } from '../utils/packEngine.js';
import engineAudio from '../utils/engineAudio.js';
import CardArtwork from './CardArtwork.jsx';

const TcgCard = ({
  card,
  variant = 'normal',
  grade = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  interactive = true,
  enableEngineRev = false,
  isNew = false,
  count = null,
  locked = false,
  onClick,
  className = '',
}) => {
  const cardRef = useRef(null);
  const holdTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, angle: 115, active: false });
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        engineAudio.stopAcceleration(true);
      }
    };
  }, []);

  if (!card) return null;

  const handlePointerDown = (e) => {
    if (!enableEngineRev || e.button !== 0) return;
    suppressNextClickRef.current = false;
    isHoldingRef.current = false;

    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      suppressNextClickRef.current = true;
      engineAudio.startAcceleration(card, (data) => {
        setTelemetry(data);
      });
    }, 220);
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      engineAudio.stopAcceleration(false);
      setTelemetry(null);
    }
  };

  const handleCardClick = (e) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (enableEngineRev) {
      engineAudio.playRevBlip(card);
    }
    if (onClick) onClick(e);
  };

  const renderTachometerHud = () => {
    if (!telemetry) return null;
    const pct = Math.min(100, Math.max(8, Math.round((telemetry.rpm / telemetry.maxRpm) * 100)));
    const barColor =
      pct > 86
        ? 'from-amber-400 via-orange-500 to-red-500'
        : pct > 62
          ? 'from-emerald-400 to-amber-400'
          : 'from-cyan-400 to-emerald-400';

    return (
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div
          className={`rounded-xl border backdrop-blur-md p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.85)] transition-transform duration-75 ${
            telemetry.shifting
              ? 'bg-amber-500/30 border-amber-300 scale-105'
              : 'bg-slate-950/90 border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[8px] font-mono uppercase tracking-wider text-amber-300 truncate">
                {telemetry.engineLabel}
              </div>
              <div className="font-mono font-black text-sm text-white leading-tight">
                {telemetry.rpm.toLocaleString('pt-BR')} <span className="text-[9px] text-slate-400">RPM</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right font-mono">
                <div className="text-[8px] text-slate-400">VEL</div>
                <div className="text-xs font-bold text-cyan-300">{telemetry.speedKmh} km/h</div>
              </div>
              <div
                className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-mono font-black border ${
                  telemetry.shifting
                    ? 'bg-amber-400 text-slate-950 border-white'
                    : 'bg-red-600/90 text-white border-red-400/70'
                }`}
              >
                <span className="text-[7px] leading-none opacity-80">M</span>
                <span className="text-sm leading-none">{telemetry.gear}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${barColor} transition-all duration-75`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1">
            <span>{telemetry.shifting ? '⚡ TROCANDO MARCHA!' : 'ACELERANDO...'}</span>
            <span>
              {telemetry.gear}/{telemetry.maxGears} MARCHAS
            </span>
          </div>
        </div>
      </div>
    );
  };

  const rarity = RARITIES[card.raridade] || RARITIES.Comum;
  const effectiveVariant = rarity.hasSpecialEditions ? variant : 'normal';
  const variantMeta = VARIANTS[effectiveVariant] || VARIANTS.normal;
  const gradeMeta = grade && PSA_GRADES[grade] ? PSA_GRADES[grade] : null;
  const isFoil = effectiveVariant === 'foil';
  const isFullArt = effectiveVariant === 'full-art';
  const marketValue = calculateCardValue(card, effectiveVariant, grade);

  const wrapWithPsaSlab = (cardElement) => {
    if (!gradeMeta) return cardElement;
    return (
      <div
        className={`inline-flex flex-col rounded-[1.25rem] p-1.5 bg-gradient-to-b from-white/20 via-slate-200/10 to-white/15 border border-white/30 shadow-[0_14px_35px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-sm ${className}`}
      >
        {/* Etiqueta PSA superior */}
        <div
          className={`mb-1.5 px-2.5 py-1 rounded-xl border bg-gradient-to-r ${gradeMeta.headerClass} flex items-center justify-between gap-2 shadow-inner`}
        >
          <div className="min-w-0">
            <div className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-80 leading-none">
              APEX GRADING • #{card.number}
            </div>
            <div className="text-[10px] font-black tracking-wide truncate leading-tight mt-0.5">
              {gradeMeta.label}
            </div>
          </div>
          <div className="shrink-0 w-7 h-7 rounded-lg bg-black/30 border border-white/30 flex items-center justify-center font-mono font-black text-sm">
            {gradeMeta.grade}
          </div>
        </div>
        {cardElement}
      </div>
    );
  };

  const sizeClasses = {
    sm: 'w-44 h-[16.5rem]',
    md: 'w-64 h-[23.5rem]',
    lg: 'w-72 sm:w-80 h-[27rem] sm:h-[29.5rem]',
  }[size] || 'w-64 h-[23.5rem]';

  const handleMouseMove = (e) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = ((y / rect.height) - 0.5) * -18;
    const ry = ((x / rect.width) - 0.5) * 18;
    const angle = Math.round(90 + (px - 50) * 1.4);
    setTilt({ rx, ry, mx: px, my: py, angle, active: true });
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50, angle: 115, active: false });
  };

  const frameBorderStyle = isFullArt
    ? 'border-2 border-amber-300/90 shadow-[0_0_32px_rgba(251,191,36,0.38)]'
    : isFoil
      ? 'border-2 border-cyan-300/80 shadow-[0_0_24px_rgba(56,189,248,0.32)]'
      : `border-2 ${rarity.borderClass} shadow-[0_12px_28px_rgba(0,0,0,0.65)]`;

  const dynamicStyle = {
    transform: interactive
      ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.active ? 1.03 : 1})`
      : undefined,
    '--mx': `${tilt.mx}%`,
    '--my': `${tilt.my}%`,
    '--angle': `${tilt.angle}deg`,
    boxShadow: tilt.active && !locked ? `0 22px 45px -10px rgba(0,0,0,0.85), 0 0 28px ${rarity.glowColor}` : undefined,
  };

  // ========================
  // LAYOUT FULL ART (Borderless Edge-to-Edge estilo Pokémon TCG Alt Art / Full Art)
  // ========================
  if (isFullArt) {
    return wrapWithPsaSlab(
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerUp={endHold}
        onPointerCancel={endHold}
        onContextMenu={enableEngineRev ? (e) => e.preventDefault() : undefined}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          handleMouseLeave();
          endHold();
        }}
        style={dynamicStyle}
        className={`relative rounded-2xl overflow-hidden select-none transition-transform duration-150 ease-out bg-slate-950 ${sizeClasses} ${frameBorderStyle} ${
          onClick || enableEngineRev ? 'cursor-pointer' : ''
        } ${telemetry ? 'ring-2 ring-red-500/80' : ''} ${locked ? 'grayscale opacity-50' : ''} ${gradeMeta ? '' : className}`}
      >
        {renderTachometerHud()}
        {/* Arte ocupando 100% da carta */}
        <div className="absolute inset-0">
          <CardArtwork card={card} isFullArt />
        </div>

        {/* Camadas prismáticas holográficas Full Art */}
        <div
          className={`absolute inset-0 tcg-fullart-sheen pointer-events-none transition-opacity duration-300 ${
            tilt.active ? 'opacity-80' : 'opacity-45'
          }`}
        />
        <div className="absolute inset-0 tcg-fullart-sparkles pointer-events-none opacity-85" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-200/50 pointer-events-none" />

        {/* Cabeçalho flutuante transparente */}
        <div className="relative z-20 flex items-start justify-between p-2.5 bg-gradient-to-b from-black/80 via-black/35 to-transparent">
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-200/90">
                #{card.number}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${variantMeta.badgeClass}`}>
                ✦ FULL ART
              </span>
            </div>
            <h3
              className={`font-display font-black text-white leading-tight truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] ${
                size === 'sm' ? 'text-xs mt-0.5' : 'text-base mt-0.5'
              }`}
            >
              {card.marca}
            </h3>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${rarity.solidBadgeClass} shadow`}>
              {rarity.symbol}
            </span>
            <span
              className={`mt-1 font-mono font-bold text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
                size === 'sm' ? 'text-[11px]' : 'text-sm'
              }`}
            >
              {formatCurrency(marketValue)}
            </span>
          </div>
        </div>

        {/* Badges auxiliares (NOVA / Quantidade) */}
        {isNew && (
          <div className="absolute top-12 left-2.5 z-30 bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full shadow-lg animate-pulse">
            NOVA!
          </div>
        )}
        {count !== null && count > 1 && (
          <div className="absolute top-12 right-2.5 z-30 bg-slate-950/85 border border-amber-300/60 text-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
            ×{count}
          </div>
        )}

        {/* Painel Glassmorphism flutuante inferior */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-8">
          <div className="backdrop-blur-md bg-slate-950/60 border border-white/15 rounded-xl p-2">
            <div className="flex items-center justify-between gap-1">
              <p className={`text-amber-100/95 font-semibold truncate ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
                {card.tipo}
              </p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${rarity.badgeClass}`}>
                {rarity.label}
              </span>
            </div>

            {size !== 'sm' && (
              <>
                <div className="grid grid-cols-3 gap-1.5 mt-2 text-[9px] font-mono">
                  <div className="bg-black/40 rounded px-1.5 py-1 text-center border border-white/10">
                    <div className="text-slate-400">VEL</div>
                    <div className="text-white font-bold">{card.stats.velocidade}</div>
                  </div>
                  <div className="bg-black/40 rounded px-1.5 py-1 text-center border border-white/10">
                    <div className="text-slate-400">MAN</div>
                    <div className="text-white font-bold">{card.stats.manobra}</div>
                  </div>
                  <div className="bg-black/40 rounded px-1.5 py-1 text-center border border-white/10">
                    <div className="text-slate-400">PRS</div>
                    <div className="text-amber-300 font-bold">{card.stats.prestigio}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-300/80">
                  <span>{card.origem}</span>
                  <span className="text-amber-300 font-mono">3.8× Valor Base</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // LAYOUT NORMAL & FOIL HOLOGRÁFICA (Moldura Clássica Pokémon TCG)
  // ========================
  return wrapWithPsaSlab(
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        handleMouseLeave();
        endHold();
      }}
      style={dynamicStyle}
      className={`relative rounded-2xl overflow-hidden select-none transition-transform duration-150 ease-out bg-gradient-to-br ${rarity.frameGradient} ${sizeClasses} ${frameBorderStyle} ${
        onClick || enableEngineRev ? 'cursor-pointer' : ''
      } ${telemetry ? 'ring-2 ring-red-500/80' : ''} ${locked ? 'grayscale opacity-45' : ''} ${gradeMeta ? '' : className}`}
    >
      {renderTachometerHud()}
      {/* Textura metálica interna */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),transparent_55%)] pointer-events-none" />

      {/* Camadas Holográficas exclusivas da versão FOIL */}
      {isFoil && (
        <>
          <div
            className={`absolute inset-0 tcg-foil-sheen pointer-events-none z-20 transition-opacity duration-300 ${
              tilt.active ? 'opacity-85' : 'opacity-50'
            }`}
          />
          <div className="absolute inset-0 tcg-foil-grain pointer-events-none z-20 opacity-60" />
          {/* Faixa de reflexo animado */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-slide" />
          </div>
        </>
      )}

      {/* Conteúdo interno com moldura TCG */}
      <div className={`relative z-10 h-full flex flex-col ${size === 'sm' ? 'p-2' : 'p-3'}`}>
        {/* Header da carta (Marca + Valor de Mercado) */}
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-slate-400">#{card.number}</span>
              {isFoil && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${variantMeta.badgeClass}`}>
                  ★ FOIL
                </span>
              )}
              {!isFoil && size !== 'sm' && (
                <span className="text-[8px] uppercase tracking-wider text-slate-400 truncate">
                  {card.tag}
                </span>
              )}
            </div>
            <h3
              className={`font-display font-bold text-white leading-tight truncate ${
                size === 'sm' ? 'text-xs' : 'text-sm'
              }`}
            >
              {card.marca}
            </h3>
          </div>

          <div className="text-right shrink-0">
            <div
              className={`font-mono font-bold leading-none ${
                isFoil ? 'text-cyan-300' : 'text-amber-300'
              } ${size === 'sm' ? 'text-[11px]' : 'text-sm'}`}
            >
              {formatCurrency(marketValue)}
            </div>
            <div className={`text-[9px] font-bold mt-0.5 ${rarity.textAccent}`}>
              {rarity.symbol}
            </div>
          </div>
        </div>

        {/* Janela da Arte */}
        <div
          className={`relative rounded-xl overflow-hidden border bg-slate-950/90 ${
            isFoil ? 'border-cyan-300/60 shadow-inner' : 'border-white/15'
          } ${size === 'sm' ? 'h-32' : size === 'lg' ? 'h-56' : 'h-44'}`}
        >
          <CardArtwork card={card} isFoil={isFoil} />

          {/* Badge NOVA / Quantidade */}
          {isNew && (
            <span className="absolute top-1.5 left-1.5 z-30 bg-amber-400 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shadow">
              NOVA!
            </span>
          )}
          {count !== null && count > 1 && (
            <span className="absolute top-1.5 right-1.5 z-30 bg-slate-950/85 border border-white/20 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
              ×{count}
            </span>
          )}
        </div>

        {/* Subtítulo + Badge de Raridade */}
        <div className="flex items-center justify-between gap-1 mt-2">
          <p className={`text-slate-200 font-medium truncate ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
            {card.tipo}
          </p>
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${rarity.badgeClass}`}
          >
            {rarity.label}
          </span>
        </div>

        {/* Atributos & Flavor Text (oculto no tamanho sm para ficar limpo) */}
        {size !== 'sm' && (
          <div className="mt-auto pt-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
              <div className="bg-slate-950/60 border border-white/10 rounded-md px-1.5 py-1 flex items-center justify-between">
                <span className="text-slate-400">VEL</span>
                <span className="text-slate-100 font-bold">{card.stats.velocidade}</span>
              </div>
              <div className="bg-slate-950/60 border border-white/10 rounded-md px-1.5 py-1 flex items-center justify-between">
                <span className="text-slate-400">MAN</span>
                <span className="text-slate-100 font-bold">{card.stats.manobra}</span>
              </div>
              <div className="bg-slate-950/60 border border-white/10 rounded-md px-1.5 py-1 flex items-center justify-between">
                <span className="text-slate-400">PRS</span>
                <span className="text-amber-300 font-bold">{card.stats.prestigio}</span>
              </div>
            </div>

            {size === 'lg' && (
              <p className="text-[10px] leading-snug text-slate-300/85 italic line-clamp-2">
                “{card.flavorText}”
              </p>
            )}

            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/10">
              <span>Origem: {card.origem}</span>
              <span className="font-mono">
                {isFoil ? '2.2× Foil' : `Est. ${card.ano}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TcgCard;
