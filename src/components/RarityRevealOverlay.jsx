import React, { useEffect, useMemo, useState } from 'react';
import { VARIANTS } from '../data/rarities.js';

export function getRevealConfig(rarity) {
  switch (rarity) {
    case 'Épico':
      return { hasCinematic: true, buildupMs: 280 };
    case 'Lendário':
      return { hasCinematic: true, buildupMs: 440 };
    case 'Místico':
      return { hasCinematic: true, buildupMs: 580 };
    case 'F1 Histórica':
      return { hasCinematic: true, buildupMs: 850 };
    default:
      return { hasCinematic: false, buildupMs: 0 };
  }
}

const RARITY_THEMES = {
  Épico: {
    title: '★ ÉPICO ★',
    subtitle: 'DESCARGA AMETISTA',
    flashBg: 'radial-gradient(circle, rgba(233,213,255,0.92) 0%, rgba(168,85,247,0.5) 58%, transparent 100%)',
    borderGlow: 'shadow-[0_0_40px_rgba(192,132,252,0.9),inset_0_0_30px_rgba(216,180,254,0.85)] border-purple-300',
    bannerClass: 'from-purple-200 via-fuchsia-300 to-indigo-200 drop-shadow-[0_4px_20px_rgba(168,85,247,0.98)]',
    ring1: 'border-purple-300',
    ring2: 'border-fuchsia-300',
    sunbeamBg:
      'repeating-conic-gradient(from 0deg, rgba(192,132,252,0.58) 0deg 14deg, transparent 14deg 30deg)',
    particleColors: ['#c084fc', '#e879f9', '#a855f7', '#ffffff', '#818cf8'],
    particleShape: 'spark',
    particleCount: 18,
  },
  Lendário: {
    title: '★★ LENDÁRIO ★★',
    subtitle: 'PRISMA ARCO-ÍRIS',
    flashBg: 'radial-gradient(circle, rgba(255,251,235,0.96) 0%, rgba(251,191,36,0.52) 55%, transparent 100%)',
    borderGlow: 'shadow-[0_0_45px_rgba(251,191,36,0.95),inset_0_0_34px_rgba(253,224,71,0.9)] border-amber-200',
    bannerClass: 'from-amber-200 via-yellow-300 to-orange-300 drop-shadow-[0_4px_24px_rgba(251,191,36,0.98)]',
    ring1: 'border-amber-300',
    ring2: 'border-cyan-300',
    sunbeamBg:
      'repeating-conic-gradient(from 0deg, rgba(251,191,36,0.62) 0deg 12deg, rgba(244,114,182,0.52) 12deg 24deg, rgba(56,189,248,0.55) 24deg 36deg, rgba(52,211,153,0.52) 36deg 48deg, rgba(167,139,250,0.55) 48deg 60deg)',
    particleColors: ['#fde047', '#fbbf24', '#38bdf8', '#f472b6', '#34d399', '#ffffff'],
    particleShape: 'diamond',
    particleCount: 24,
  },
  Místico: {
    title: '★★★ MÍSTICO ★★★',
    subtitle: 'SUPERNOVA PRISMÁTICA',
    flashBg: 'radial-gradient(circle, rgba(255,241,242,0.96) 0%, rgba(244,63,94,0.58) 50%, rgba(168,85,247,0.32) 78%, transparent 100%)',
    borderGlow: 'shadow-[0_0_50px_rgba(244,63,94,0.95),inset_0_0_38px_rgba(251,113,133,0.9)] border-rose-300',
    bannerClass: 'from-rose-200 via-fuchsia-300 to-amber-200 drop-shadow-[0_4px_28px_rgba(244,63,94,0.98)]',
    ring1: 'border-rose-400',
    ring2: 'border-amber-300',
    sunbeamBg:
      'repeating-conic-gradient(from 0deg, rgba(244,63,94,0.62) 0deg 10deg, transparent 10deg 20deg, rgba(217,70,239,0.54) 20deg 30deg, transparent 30deg 40deg)',
    particleColors: ['#fb7185', '#f43f5e', '#e879f9', '#fbbf24', '#22d3ee', '#ffffff'],
    particleShape: 'star',
    particleCount: 28,
  },
  'F1 Histórica': {
    title: '♛ F1 HISTÓRICA ♛',
    subtitle: 'LIGHTS OUT • CAMPEÃ MUNDIAL',
    flashBg: 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(239,68,68,0.6) 48%, rgba(251,191,36,0.42) 76%, transparent 100%)',
    borderGlow: 'shadow-[0_0_55px_rgba(239,68,68,1),inset_0_0_40px_rgba(253,224,71,0.95)] border-amber-200',
    bannerClass: 'from-yellow-200 via-amber-300 to-red-400 drop-shadow-[0_4px_30px_rgba(239,68,68,1)]',
    ring1: 'border-red-500',
    ring2: 'border-amber-300',
    sunbeamBg:
      'repeating-conic-gradient(from 0deg, rgba(239,68,68,0.64) 0deg 10deg, rgba(251,191,36,0.58) 10deg 18deg, transparent 18deg 30deg)',
    particleColors: ['#ef4444', '#facc15', '#ffffff', '#fbbf24', '#f97316', '#18181b'],
    particleShape: 'checkered',
    particleCount: 30,
  },
};

function buildParticles(count, colors, shape) {
  return Array.from({ length: count }, (_, idx) => {
    const angle = (idx / count) * Math.PI * 2 + (idx % 3) * 0.14;
    const distance = 120 + ((idx * 37) % 150);
    const tx = `${Math.round(Math.cos(angle) * distance)}px`;
    const ty = `${Math.round(Math.sin(angle) * distance)}px`;
    const size = shape === 'checkered' ? 9 + (idx % 6) : 6 + (idx % 7);
    const dur = `${0.82 + (idx % 5) * 0.12}s`;
    const delay = `${(idx % 4) * 0.03}s`;
    const rot = `${(idx % 2 === 0 ? 1 : -1) * (140 + (idx % 5) * 45)}deg`;
    const color = colors[idx % colors.length];
    return { id: idx, tx, ty, size, dur, delay, rot, color, shape };
  });
}

/**
 * Overlay cinematográfico estilo Clash Royale com duas camadas limpas:
 * - layer="back"  (z-0):  raios de luz giratórios em LOOP INFINITO atrás do card (não poluem a foto!).
 * - layer="front" (z-50): banner, semáforo F1, raios elétricos, faixas de velocidade, ondas e partículas na frente do card!
 */
const RarityRevealOverlay = ({ rarity, variant = 'normal', phase = 'idle', layer = 'front' }) => {
  const theme = RARITY_THEMES[rarity];
  const [litLights, setLitLights] = useState(0);

  useEffect(() => {
    if (layer !== 'front' || rarity !== 'F1 Histórica' || phase !== 'buildup') {
      setLitLights(0);
      return;
    }
    setLitLights(1);
    const timers = [1, 2, 3, 4].map((step) =>
      setTimeout(() => setLitLights(step + 1), step * 150)
    );
    return () => timers.forEach(clearTimeout);
  }, [layer, rarity, phase]);

  const particles = useMemo(() => {
    if (!theme || layer !== 'front') return [];
    return buildParticles(theme.particleCount, theme.particleColors, theme.particleShape);
  }, [theme, layer]);

  if (!theme || phase === 'idle') return null;

  const isBuildup = phase === 'buildup';
  const isBurst = phase === 'burst';
  const variantMeta = variant !== 'normal' ? VARIANTS[variant] : null;

  // ======================== CAMADA TRASEIRA (ATRÁS DO CARD — LOOP INFINITO DE LUZES!) ========================
  if (layer === 'back') {
    return (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-visible">
        {isBuildup && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] rounded-full blur-2xl animate-pulse opacity-80"
            style={{ background: theme.flashBg }}
          />
        )}

        {isBurst && (
          <>
            {/* Halo suave contínuo atrás da carta */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] rounded-full blur-2xl opacity-55"
              style={{ background: theme.flashBg }}
            />

            {/* Raios de luz principais em LOOP INFINITO atrás do card */}
            <div
              className="absolute top-1/2 left-1/2 w-[42rem] h-[42rem] animate-cr-sunbeam-wrap"
              style={{
                maskImage: 'radial-gradient(circle, black 22%, transparent 66%)',
                WebkitMaskImage: 'radial-gradient(circle, black 22%, transparent 66%)',
              }}
            >
              <div
                className="w-full h-full rounded-full animate-cr-sunbeam-loop"
                style={{ backgroundImage: theme.sunbeamBg }}
              />
            </div>

            {/* Segundo anel de luz em contra-rotação infinita para Místico e F1 Histórica */}
            {(rarity === 'Místico' || rarity === 'F1 Histórica') && (
              <div
                className="absolute top-1/2 left-1/2 w-[36rem] h-[36rem] animate-cr-sunbeam-wrap"
                style={{
                  maskImage: 'radial-gradient(circle, black 18%, transparent 64%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 64%)',
                }}
              >
                <div
                  className="w-full h-full rounded-full animate-cr-sunbeam-loop-rev opacity-75"
                  style={{
                    backgroundImage:
                      rarity === 'F1 Histórica'
                        ? 'repeating-conic-gradient(from 5deg, rgba(255,255,255,0.42) 0deg 6deg, transparent 6deg 24deg)'
                        : 'repeating-conic-gradient(from 10deg, rgba(56,189,248,0.48) 0deg 8deg, transparent 8deg 28deg)',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ======================== CAMADA FRONTAL (EM CIMA DO CARD) ========================
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
      {isBuildup && (
        <>
          <div
            className={`absolute inset-0 rounded-2xl border-2 animate-pulse ${theme.borderGlow}`}
            style={{ background: theme.flashBg, mixBlendMode: 'screen', opacity: 0.5 }}
          />

          {rarity === 'F1 Histórica' && (
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-pop-in whitespace-nowrap">
              <div className="px-3.5 py-2 rounded-xl bg-zinc-950/95 border-2 border-zinc-600 shadow-[0_12px_35px_rgba(0,0,0,0.95)] flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = litLights >= n;
                  return (
                    <div key={n} className="flex flex-col gap-1 bg-zinc-900 p-1 rounded border border-zinc-800">
                      <div
                        className={`w-4 h-4 rounded-full transition-all duration-100 ${
                          on
                            ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,1),0_0_32px_rgba(239,68,68,0.9)]'
                            : 'bg-zinc-800'
                        }`}
                      />
                      <div
                        className={`w-4 h-4 rounded-full transition-all duration-100 ${
                          on
                            ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,1),0_0_32px_rgba(239,68,68,0.9)]'
                            : 'bg-zinc-800'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="mt-1 text-[10px] font-mono font-black tracking-[0.26em] text-red-400 uppercase animate-pulse drop-shadow">
                LARGADA F1...
              </span>
            </div>
          )}

          {rarity !== 'F1 Histórica' && (
            <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
              <span className="px-3 py-1 rounded-full bg-slate-950/90 border border-white/20 text-[11px] font-mono font-black tracking-[0.22em] uppercase text-white animate-pulse shadow-lg">
                {rarity === 'Místico'
                  ? '✦ ENERGIA MÍSTICA ✦'
                  : rarity === 'Lendário'
                    ? '✦ BRILHO LENDÁRIO ✦'
                    : '⚡ CARGA ÉPICA ⚡'}
              </span>
            </div>
          )}
        </>
      )}

      {isBurst && (
        <>
          {/* Clarão rápido de impacto na face do card (desaparece em 0.65s) */}
          <div
            className="absolute -inset-4 rounded-3xl animate-cr-flash"
            style={{ background: theme.flashBg, mixBlendMode: 'screen' }}
          />

          {/* Ondas de choque (Shockwaves) nascendo do centro do card */}
          <div
            className={`absolute top-1/2 left-1/2 w-44 h-44 rounded-full animate-cr-shockwave ${theme.ring1}`}
          />
          <div
            className={`absolute top-1/2 left-1/2 w-28 h-28 rounded-full animate-cr-shockwave ${theme.ring2}`}
            style={{ animationDelay: '0.12s' }}
          />

          {/* Raios Elétricos SVG estalando sobre o card ÉPICO */}
          {rarity === 'Épico' && (
            <svg
              viewBox="0 0 320 440"
              className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] animate-cr-lightning"
              fill="none"
            >
              <polyline
                points="160,8 132,90 176,108 118,210"
                stroke="#f0abfc"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 12px #c084fc)' }}
              />
              <polyline
                points="310,130 225,175 245,205 168,235"
                stroke="#c084fc"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 12px #a855f7)' }}
              />
              <polyline
                points="10,270 98,230 80,202 158,215"
                stroke="#e879f9"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 12px #c084fc)' }}
              />
              <polyline
                points="175,432 204,340 162,324 192,240"
                stroke="#d8b4fe"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 12px #e879f9)' }}
              />
            </svg>
          )}

          {/* Faixas de Alta Velocidade & Bandeira Quadriculada cortando por cima do card F1 HISTÓRICA */}
          {rarity === 'F1 Histórica' && (
            <div className="absolute -inset-x-24 inset-y-0 overflow-hidden pointer-events-none">
              {[12, 30, 50, 70, 86].map((topPct, i) => (
                <div
                  key={topPct}
                  className="absolute left-0 h-2.5 w-64 rounded-full animate-cr-streak"
                  style={{
                    top: `${topPct}%`,
                    animationDelay: `${i * 0.045}s`,
                    background:
                      i % 2 === 0
                        ? 'linear-gradient(90deg, transparent, #ef4444, #facc15, #ffffff)'
                        : 'repeating-linear-gradient(90deg, #ffffff 0 12px, #09090b 12px 24px)',
                    boxShadow: '0 0 18px rgba(239,68,68,0.9)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Partículas explodindo por cima e para fora do card */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute top-1/2 left-1/2 animate-cr-particle"
              style={{
                '--tx': p.tx,
                '--ty': p.ty,
                '--dur': p.dur,
                '--rot': p.rot,
                animationDelay: p.delay,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius:
                  p.shape === 'diamond' || p.shape === 'checkered'
                    ? '2px'
                    : p.shape === 'star'
                      ? '9999px'
                      : '1px',
                boxShadow: `0 0 14px ${p.color}`,
              }}
            />
          ))}

          {/* Banner Cinematográfico limpo no topo do card */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 text-center whitespace-nowrap">
            <div className="px-4 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/15 shadow-2xl">
              <div
                className={`font-display font-black text-xl sm:text-2xl tracking-[0.2em] bg-gradient-to-r bg-clip-text text-transparent animate-cr-banner ${theme.bannerClass}`}
              >
                {theme.title}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-mono font-bold tracking-[0.22em] text-white/90 uppercase">
                  {theme.subtitle}
                </span>
                {variantMeta && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${variantMeta.badgeClass}`}>
                    ✦ {variantMeta.shortLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RarityRevealOverlay;
