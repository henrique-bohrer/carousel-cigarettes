import React, { useMemo, useState } from 'react';
import { CARDS } from '../data/cards.js';
import { PSA_GRADES, VARIANTS } from '../data/rarities.js';
import { formatCurrency, generateCpuDeck, getEffectiveStats } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import TcgCard from './TcgCard.jsx';

const STAKES = [
  {
    id: 'free',
    label: 'Treino Amistoso',
    entry: 0,
    prizeCash: 25,
    prizePoints: 8,
    difficulty: 'CPU Iniciante',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  {
    id: 'classic',
    label: 'Mesa Clássica',
    entry: 25,
    prizeCash: 65,
    prizePoints: 18,
    difficulty: 'CPU Intermediária',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  },
  {
    id: 'vip',
    label: 'High Roller VIP',
    entry: 60,
    prizeCash: 165,
    prizePoints: 40,
    difficulty: 'CPU Mestre (Foil & Full Art)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
  },
];

const STAT_META = [
  { key: 'velocidade', label: 'Velocidade', short: 'VEL', color: 'from-rose-500 to-orange-500' },
  { key: 'manobra', label: 'Manobra', short: 'MAN', color: 'from-cyan-500 to-sky-500' },
  { key: 'prestigio', label: 'Prestígio', short: 'PRS', color: 'from-amber-400 to-yellow-500' },
];

const DuelView = ({ collection, balance, onDuelFinish, onGoToPacks }) => {
  const [match, setMatch] = useState(null);
  // match = { stake, playerDeck, cpuDeck, round, playerScore, cpuScore, selectedCardIdx, lastClash, finished }

  // Constrói o melhor deck de 5 cartas distintas da coleção do jogador
  const bestPlayerDeck = useMemo(() => {
    const cardMap = new Map(CARDS.map((c) => [c.id, c]));
    const enriched = collection
      .map((item) => {
        const card = cardMap.get(item.cardId);
        if (!card) return null;
        const stats = getEffectiveStats(card, item.variant, item.grade);
        const power = stats.velocidade + stats.manobra + stats.prestigio;
        return { ...item, card, stats, power };
      })
      .filter(Boolean)
      .sort((a, b) => b.power - a.power);

    return enriched.slice(0, 5);
  }, [collection]);

  const handleStartDuel = (stake) => {
    if (bestPlayerDeck.length < 5 || balance < stake.entry) {
      soundEngine.playUiClick();
      return;
    }

    soundEngine.playLighterClick();
    const cpuDeck = generateCpuDeck(stake.id).map((item) => ({
      ...item,
      stats: getEffectiveStats(item.card, item.variant, item.grade),
    }));

    setMatch({
      stake,
      playerDeck: bestPlayerDeck.map((c) => ({ ...c, used: false })),
      cpuDeck,
      round: 0,
      playerScore: 0,
      cpuScore: 0,
      selectedCardIdx: 0,
      lastClash: null,
      finished: false,
    });
  };

  const handlePlayStat = (statKey) => {
    if (!match || match.finished) return;
    const playerEntry = match.playerDeck[match.selectedCardIdx];
    const cpuEntry = match.cpuDeck[match.round];
    if (!playerEntry || playerEntry.used || !cpuEntry) return;

    const pVal = playerEntry.stats[statKey];
    const cVal = cpuEntry.stats[statKey];
    const outcome = pVal > cVal ? 'win' : pVal < cVal ? 'lose' : 'draw';

    soundEngine.playCardFlip();
    setTimeout(() => {
      soundEngine.playDuelRound(outcome);
    }, 120);

    const nextPlayerScore = match.playerScore + (outcome === 'win' ? 1 : 0);
    const nextCpuScore = match.cpuScore + (outcome === 'lose' ? 1 : 0);
    const nextDeck = match.playerDeck.map((item, i) =>
      i === match.selectedCardIdx ? { ...item, used: true } : item
    );
    const nextRound = match.round + 1;
    const isFinished = nextRound >= 5;
    const nextAvailableIdx = nextDeck.findIndex((c) => !c.used);

    setMatch({
      ...match,
      playerDeck: nextDeck,
      round: nextRound,
      playerScore: nextPlayerScore,
      cpuScore: nextCpuScore,
      selectedCardIdx: nextAvailableIdx === -1 ? 0 : nextAvailableIdx,
      lastClash: {
        statKey,
        playerEntry,
        cpuEntry,
        pVal,
        cVal,
        outcome,
      },
      finished: isFinished,
    });

    if (isFinished) {
      const won = nextPlayerScore > nextCpuScore;
      const draw = nextPlayerScore === nextCpuScore;
      setTimeout(() => {
        if (won) soundEngine.playVictoryFanfare();
      }, 350);

      onDuelFinish({
        stake: match.stake,
        won,
        draw,
      });
    }
  };

  if (bestPlayerDeck.length < 5) {
    return (
      <div className="max-w-xl mx-auto my-14 text-center bg-slate-900/75 border border-slate-800 rounded-3xl p-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-3xl text-amber-300 mb-4">
          ⚔
        </div>
        <h2 className="font-display font-bold text-2xl text-white">
          Monte seu Deck para Duelar
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          Você precisa de pelo menos <strong className="text-white">5 cartas</strong> na coleção para entrar na
          Arena de Duelo. Abra apenas 1 pacote booster para desbloquear!
        </p>
        <button
          type="button"
          onClick={onGoToPacks}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:brightness-110 transition-all"
        >
          Abrir Pacotes →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ======================== LOBBY DO DUELO ======================== */}
      {!match && (
        <>
          <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-950 p-6 sm:p-8 shadow-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider">
              <span>⚔</span>
              <span>Arena de Atributos • Super Trunfo TCG</span>
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-2">
              Duele com suas Cartas Raras
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Seu <strong className="text-amber-300">Top 5 Deck</strong> é montado automaticamente com suas cartas mais
              fortes. Cartas <strong className="text-cyan-300">Foil (+3)</strong>,{' '}
              <strong className="text-amber-300">Full Art (+6)</strong> e{' '}
              <strong className="text-rose-300">PSA 10 (+5)</strong> ganham bônus real em todos os atributos!
            </p>
          </section>

          {/* Mesas de Aposta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STAKES.map((stake) => {
              const canAfford = balance >= stake.entry;
              return (
                <div
                  key={stake.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${stake.badgeClass}`}>
                      {stake.difficulty}
                    </span>
                    <h3 className="font-display font-bold text-xl text-white mt-2">{stake.label}</h3>
                    <div className="mt-3 space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Entrada:</span>
                        <span className="text-white font-bold">
                          {stake.entry === 0 ? 'GRÁTIS' : formatCurrency(stake.entry)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Prêmio Vitória:</span>
                        <span className="text-emerald-300 font-bold">
                          +{formatCurrency(stake.prizeCash)} & +{stake.prizePoints} PT
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleStartDuel(stake)}
                    className={`w-full py-2.5 rounded-xl font-black text-sm transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Iniciar Duelo ⚔
                  </button>
                </div>
              );
            })}
          </div>

          {/* Preview do Top 5 Deck do Jogador */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Seu Deck Titular (5 cartas mais poderosas da sua coleção)
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {bestPlayerDeck.map((entry) => (
                <div key={entry.instanceId} className="flex flex-col items-center gap-1.5">
                  <TcgCard
                    card={entry.card}
                    variant={entry.variant}
                    grade={entry.grade}
                    size="sm"
                    interactive={false}
                  />
                  <div className="text-[10px] font-mono text-slate-300">
                    VEL {entry.stats.velocidade} • MAN {entry.stats.manobra} • PRS {entry.stats.prestigio}
                    {entry.stats.bonus > 0 && (
                      <span className="ml-1 text-amber-300 font-bold">(+{entry.stats.bonus})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ======================== ARENA DE BATALHA ATIVA ======================== */}
      {match && (
        <div className="space-y-6 animate-pop-in">
          {/* Placar da Partida */}
          <div className="rounded-2xl bg-slate-900/90 border border-amber-400/30 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${match.stake.badgeClass}`}>
                {match.stake.label}
              </span>
              <div className="text-xs text-slate-400 mt-1">
                {match.finished ? 'Partida Encerrada' : `Rodada ${match.round + 1} de 5`}
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono">
              <div className="text-center">
                <div className="text-[10px] uppercase text-emerald-400">Você</div>
                <div className="text-3xl font-black text-white">{match.playerScore}</div>
              </div>
              <span className="text-slate-600 font-black text-xl">×</span>
              <div className="text-center">
                <div className="text-[10px] uppercase text-rose-400">CPU</div>
                <div className="text-3xl font-black text-white">{match.cpuScore}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setMatch(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              {match.finished ? 'Voltar ao Lobby' : 'Abandonar'}
            </button>
          </div>

          {/* Resultado do último embate ou resultado final */}
          {match.lastClash && (
            <div
              className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                match.lastClash.outcome === 'win'
                  ? 'bg-emerald-950/50 border-emerald-400/40'
                  : match.lastClash.outcome === 'lose'
                    ? 'bg-rose-950/50 border-rose-400/40'
                    : 'bg-slate-900 border-slate-700'
              }`}
            >
              <div className="text-xs sm:text-sm">
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  Última Rodada ({STAT_META.find((s) => s.key === match.lastClash.statKey)?.label}):
                </span>{' '}
                <span className="text-white font-semibold">
                  {match.lastClash.playerEntry.card.marca} ({match.lastClash.pVal})
                </span>{' '}
                vs{' '}
                <span className="text-slate-300">
                  {match.lastClash.cpuEntry.card.marca} ({match.lastClash.cVal})
                </span>
              </div>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full ${
                  match.lastClash.outcome === 'win'
                    ? 'bg-emerald-400 text-slate-950'
                    : match.lastClash.outcome === 'lose'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-700 text-white'
                }`}
              >
                {match.lastClash.outcome === 'win'
                  ? 'VITÓRIA NA RODADA!'
                  : match.lastClash.outcome === 'lose'
                    ? 'DERROTA NA RODADA'
                    : 'EMPATE'}
              </span>
            </div>
          )}

          {/* Banner de Resultado Final */}
          {match.finished ? (
            <div className="rounded-3xl bg-slate-900/90 border border-amber-400/40 p-8 text-center space-y-4">
              <div className="text-4xl">
                {match.playerScore > match.cpuScore ? '🏆' : match.playerScore === match.cpuScore ? '🤝' : '💨'}
              </div>
              <h2 className="font-display font-black text-3xl text-white">
                {match.playerScore > match.cpuScore
                  ? 'Vitória na Arena!'
                  : match.playerScore === match.cpuScore
                    ? 'Empate Técnico!'
                    : 'Derrota na Arena'}
              </h2>
              <p className="text-sm text-slate-300">
                {match.playerScore > match.cpuScore
                  ? `Você ganhou +${formatCurrency(match.stake.prizeCash)} e +${match.stake.prizePoints} Pontos de Pacote!`
                  : match.playerScore === match.cpuScore
                    ? 'Sua entrada foi devolvida intacta.'
                    : 'Aprimore seu deck com cartas Foil, Full Art ou PSA 10 e tente novamente!'}
              </p>
              <button
                type="button"
                onClick={() => setMatch(null)}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm"
              >
                Jogar Novamente
              </button>
            </div>
          ) : (
            /* Seleção de Carta + Escolha de Atributo */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Carta selecionada do jogador */}
              <div className="lg:col-span-5 flex flex-col items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">
                  Sua Carta em Campo
                </span>
                <TcgCard
                  card={match.playerDeck[match.selectedCardIdx].card}
                  variant={match.playerDeck[match.selectedCardIdx].variant}
                  grade={match.playerDeck[match.selectedCardIdx].grade}
                  size="md"
                />
                {match.playerDeck[match.selectedCardIdx].stats.bonus > 0 && (
                  <span className="text-xs font-mono text-amber-300 bg-amber-500/15 border border-amber-400/35 px-3 py-1 rounded-full">
                    ✦ Bônus de Combate: +{match.playerDeck[match.selectedCardIdx].stats.bonus} em todos os atributos (
                    {VARIANTS[match.playerDeck[match.selectedCardIdx].variant].shortLabel}
                    {match.playerDeck[match.selectedCardIdx].grade
                      ? ` + ${PSA_GRADES[match.playerDeck[match.selectedCardIdx].grade].shortLabel}`
                      : ''}
                    )
                  </span>
                )}
              </div>

              {/* Botões de Atributo (Centro) */}
              <div className="lg:col-span-3 space-y-3">
                <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  Escolha o Atributo
                </div>
                {STAT_META.map((stat) => {
                  const val = match.playerDeck[match.selectedCardIdx].stats[stat.key];
                  return (
                    <button
                      key={stat.key}
                      type="button"
                      onClick={() => handlePlayStat(stat.key)}
                      className={`w-full p-3.5 rounded-2xl bg-gradient-to-r ${stat.color} text-slate-950 font-black flex items-center justify-between shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                    >
                      <span className="text-xs uppercase tracking-wider">{stat.label}</span>
                      <span className="font-mono text-xl bg-black/20 px-2.5 py-0.5 rounded-lg">{val}</span>
                    </button>
                  );
                })}
              </div>

              {/* Carta oculta da CPU */}
              <div className="lg:col-span-4 flex flex-col items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-rose-300">
                  Oponente (CPU)
                </span>
                <div className="w-64 h-[23.5rem] rounded-2xl border-2 border-rose-500/50 bg-gradient-to-br from-slate-900 via-rose-950/60 to-slate-950 flex flex-col items-center justify-center p-6 shadow-2xl">
                  <div className="w-24 h-24 rounded-full border-2 border-rose-400/50 bg-rose-500/10 flex items-center justify-center text-4xl font-display font-black text-rose-300">
                    ?
                  </div>
                  <p className="mt-5 text-xs font-mono uppercase tracking-widest text-rose-200/80 text-center">
                    Carta Secreta #{match.round + 1}
                  </p>
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Será revelada assim que você escolher o atributo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mão do jogador para trocar qual das cartas restantes jogar */}
          {!match.finished && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Escolha qual carta da sua mão usar nesta rodada:
              </div>
              <div className="flex flex-wrap gap-2">
                {match.playerDeck.map((entry, idx) => {
                  const selected = idx === match.selectedCardIdx;
                  return (
                    <button
                      key={entry.instanceId}
                      type="button"
                      disabled={entry.used}
                      onClick={() => {
                        soundEngine.playCardSlide();
                        setMatch((m) => ({ ...m, selectedCardIdx: idx }));
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        entry.used
                          ? 'bg-slate-950/40 border-slate-800 text-slate-600 line-through cursor-not-allowed'
                          : selected
                            ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                            : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {entry.card.marca} ({VARIANTS[entry.variant].shortLabel}) •{' '}
                      <span className="font-mono text-amber-300">
                        {entry.stats.velocidade}/{entry.stats.manobra}/{entry.stats.prestigio}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DuelView;
