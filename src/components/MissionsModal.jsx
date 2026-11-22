import React from 'react';
import { MISSIONS } from '../data/rarities.js';
import { formatCurrency } from '../utils/packEngine.js';

const MissionsModal = ({ missionContext, claimedMissions, onClaimMission, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-400/35 shadow-2xl overflow-hidden animate-pop-in"
      >
        <div className="p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300">
              Conquistas & Recompensas
            </span>
            <h2 className="font-display font-black text-2xl text-white mt-0.5">
              Missões do Colecionador
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {MISSIONS.map((mission) => {
            const current = Math.min(mission.target, mission.getProgress(missionContext));
            const pct = Math.min(100, Math.round((current / mission.target) * 100));
            const completed = current >= mission.target;
            const claimed = claimedMissions.includes(mission.id);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  claimed
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-65'
                    : completed
                      ? 'bg-amber-950/30 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                      : 'bg-slate-950/75 border-slate-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{mission.title}</h3>
                    {claimed && (
                      <span className="text-[10px] font-bold text-emerald-400">✓ Resgatada</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{mission.description}</p>

                  {/* Barra de progresso */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          completed ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-sky-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {current} / {mission.target}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-[11px] font-mono text-amber-300 font-bold">
                    +{formatCurrency(mission.rewardCash)} • +{mission.rewardPoints} PT
                  </div>
                  <button
                    type="button"
                    disabled={!completed || claimed}
                    onClick={() => onClaimMission(mission)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                      claimed
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : completed
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {claimed ? 'Resgatada' : completed ? 'Resgatar ★' : 'Em Progresso'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MissionsModal;
