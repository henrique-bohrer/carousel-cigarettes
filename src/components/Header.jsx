import React from 'react';
import { formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import { useCarImages } from '../context/CarImageContext.jsx';

const TABS = [
  { id: 'packs', label: 'Pacotes', icon: '✦' },
  { id: 'wonder', label: 'Wonder Pick', icon: '✧' },
  { id: 'duel', label: 'Duelo', icon: '⚔' },
  { id: 'collection', label: 'Coleção', icon: '❖' },
  { id: 'showcase', label: 'Vitrine', icon: '◈' },
];

const Header = ({
  activeTab,
  onChangeTab,
  balance,
  packPoints,
  totalCards,
  claimableMissionsCount,
  onOpenMissions,
  onClaimBonus,
  soundEnabled,
  onToggleSound,
}) => {
  const { artMode, toggleArtMode } = useCarImages();

  const handleTabClick = (tabId) => {
    soundEngine.playUiClick();
    onChangeTab(tabId);
  };

  const handleToggleArtMode = () => {
    soundEngine.playUiClick();
    toggleArtMode();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Marca / Logo */}
        <button
          type="button"
          onClick={() => handleTabClick('packs')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 via-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] group-hover:scale-105 transition-transform">
            <span className="font-display font-black text-slate-950 text-base">A</span>
          </div>
          <div>
            <div className="font-display font-black text-base leading-none text-white tracking-wider">
              APEX <span className="text-amber-400">TCG</span>
            </div>
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 mt-0.5">
              Motorsport & F1 Edition
            </div>
          </div>
        </button>

        {/* Navegação */}
        <nav className="flex items-center flex-wrap bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-0.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'collection' && totalCards > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-300'
                    }`}
                  >
                    {totalCards}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Missões, Som, Pontos & Carteira */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenMissions();
            }}
            className="relative px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/35 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Abrir Missões & Conquistas"
          >
            <span>🏆</span>
            <span className="hidden xl:inline">Missões</span>
            {claimableMissionsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow">
                {claimableMissionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleArtMode}
            title={
              artMode === 'photo'
                ? 'Exibindo fotos reais (Wikipédia/Wikimedia) — clique para Arte Vetorial'
                : 'Exibindo Arte Vetorial — clique para Fotos Reais (Wikipédia/Wikimedia)'
            }
            className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              artMode === 'photo'
                ? 'bg-slate-900 border-sky-400/45 text-sky-300 hover:bg-slate-800'
                : 'bg-slate-900 border-fuchsia-400/45 text-fuchsia-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-sm leading-none">{artMode === 'photo' ? '📷' : '🎨'}</span>
            <span className="hidden xl:inline">{artMode === 'photo' ? 'Fotos' : 'Vetor'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
            aria-label={soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
            className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              soundEnabled
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-sm leading-none">{soundEnabled ? '🔊' : '🔇'}</span>
          </button>

          <div className="hidden sm:flex flex-col items-end px-2.5 py-1 rounded-xl bg-slate-900 border border-purple-400/30">
            <span className="text-[8px] uppercase tracking-wider text-slate-400 leading-none">
              Pontos
            </span>
            <span className="font-mono text-xs font-black text-purple-300 leading-tight">
              {packPoints} PT
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-400/35 rounded-xl px-2.5 py-1.5 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 leading-none">
                Saldo
              </span>
              <span className="font-mono font-black text-xs sm:text-sm text-amber-300 leading-tight">
                {formatCurrency(balance)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClaimBonus}
              title="Resgatar bônus gratuito de R$ 100"
              className="ml-0.5 px-1.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/40 text-amber-200 text-[10px] font-mono font-bold transition-colors"
            >
              +100
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
