import React, { useEffect, useMemo, useState } from 'react';
import { CARDS } from './data/cards.js';
import { PACKS } from './data/packs.js';
import {
  GRADING_FEE,
  MISSIONS,
  PSA_GRADES,
  RARITIES,
  RARITY_ORDER,
  VARIANTS,
} from './data/rarities.js';
import {
  calculateCardValue,
  executeTradeUp,
  formatCurrency,
  openBoosterPack,
  rollPsaGrade,
} from './utils/packEngine.js';
import soundEngine from './utils/soundEngine.js';
import Header from './components/Header.jsx';
import BoosterPack from './components/BoosterPack.jsx';
import PackOpeningModal from './components/PackOpeningModal.jsx';
import PackOddsModal from './components/PackOddsModal.jsx';
import CardInspectorModal from './components/CardInspectorModal.jsx';
import CollectionView, { makeEntryKey } from './components/CollectionView.jsx';
import ShowcaseCarousel from './components/ShowcaseCarousel.jsx';
import WonderPickView from './components/WonderPickView.jsx';
import DuelView from './components/DuelView.jsx';
import PackPointsModal from './components/PackPointsModal.jsx';
import MissionsModal from './components/MissionsModal.jsx';
import TradeUpModal from './components/TradeUpModal.jsx';

const STORAGE_KEY = 'apex-tcg-save-v1';
const INITIAL_BALANCE = 200;

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.balance !== 'number' || !Array.isArray(parsed.collection)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function App() {
  const saved = useMemo(() => loadSavedState(), []);
  const [activeTab, setActiveTab] = useState('packs');
  const [balance, setBalance] = useState(saved?.balance ?? INITIAL_BALANCE);
  const [collection, setCollection] = useState(saved?.collection ?? []);
  const [packsOpened, setPacksOpened] = useState(saved?.packsOpened ?? 0);
  const [packPoints, setPackPoints] = useState(saved?.packPoints ?? 0);
  const [claimedMissions, setClaimedMissions] = useState(saved?.claimedMissions ?? []);
  const [displayBoard, setDisplayBoard] = useState(
    saved?.displayBoard ?? { theme: 'velvet', slots: [] }
  );
  const [stats, setStats] = useState(
    saved?.stats ?? { wonderPicks: 0, duelsWon: 0, gradesDone: 0, tradeUpsDone: 0 }
  );

  // Modais e feedback visual
  const [openingState, setOpeningState] = useState(null);
  const [oddsPack, setOddsPack] = useState(null);
  const [inspectorState, setInspectorState] = useState(null);
  const [showPackPoints, setShowPackPoints] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showTradeUp, setShowTradeUp] = useState(false);
  const [toast, setToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEngine.isEnabled());

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance,
          collection,
          packsOpened,
          packPoints,
          claimedMissions,
          displayBoard,
          stats,
        })
      );
    } catch {
      // Ignora erro de quota do localStorage
    }
  }, [balance, collection, packsOpened, packPoints, claimedMissions, displayBoard, stats]);

  const handleToggleSound = () => {
    const next = soundEngine.toggle();
    setSoundEnabled(next);
  };

  const showToast = (message, tone = 'amber') => {
    setToast({ message, tone, id: Date.now() });
    setTimeout(() => {
      setToast((current) => (current && Date.now() - current.id >= 2900 ? null : current));
    }, 3000);
  };

  // Conjunto de chaves "cardId::variant" já possuídas
  const ownedKeys = useMemo(() => {
    return new Set(collection.map((item) => `${item.cardId}::${item.variant}`));
  }, [collection]);

  // Valor total + contagens especiais para missões
  const albumMetrics = useMemo(() => {
    const cardMap = new Map(CARDS.map((c) => [c.id, c]));
    let collectionValue = 0;
    let foilCount = 0;
    let fullArtCount = 0;
    let mysticCount = 0;
    let gt3Count = 0;
    let f1Count = 0;

    for (const item of collection) {
      const card = cardMap.get(item.cardId);
      if (!card) continue;
      collectionValue += calculateCardValue(card, item.variant, item.grade || null);
      if (item.variant === 'foil') foilCount += 1;
      if (item.variant === 'full-art') fullArtCount += 1;
      if (card.raridade === 'Místico') mysticCount += 1;
      if (card.category === 'gt3') gt3Count += 1;
      if (card.raridade === 'F1 Histórica') f1Count += 1;
    }

    return { collectionValue, foilCount, fullArtCount, mysticCount, gt3Count, f1Count };
  }, [collection]);

  const missionContext = useMemo(
    () => ({
      packsOpened,
      collectionValue: albumMetrics.collectionValue,
      foilCount: albumMetrics.foilCount,
      fullArtCount: albumMetrics.fullArtCount,
      mysticCount: albumMetrics.mysticCount,
      gt3Count: albumMetrics.gt3Count,
      f1Count: albumMetrics.f1Count,
      stats,
    }),
    [packsOpened, albumMetrics, stats]
  );

  const claimableMissionsCount = useMemo(() => {
    return MISSIONS.filter(
      (m) => !claimedMissions.includes(m.id) && m.getProgress(missionContext) >= m.target
    ).length;
  }, [claimedMissions, missionContext]);

  // Abrir Booster Pack
  const handleOpenPack = (pack) => {
    if (balance < pack.price) {
      soundEngine.playUiClick();
      showToast('Saldo insuficiente! Venda duplicatas, duele ou resgate +R$ 100.', 'rose');
      return;
    }

    soundEngine.playLighterClick();
    const previousOwnedKeys = new Set(ownedKeys);
    const result = openBoosterPack(pack);

    setBalance((prev) => prev - pack.price);
    setPacksOpened((prev) => prev + 1);
    setPackPoints((prev) => prev + result.earnedPoints);
    setCollection((prev) => [
      ...result.pulls.map((p) => ({
        instanceId: p.instanceId,
        cardId: p.cardId,
        variant: p.variant,
        grade: null,
        packId: p.packId,
        pulledAt: p.pulledAt,
      })),
      ...prev,
    ]);

    setOpeningState({ result, previousOwnedKeys });
  };

  // Completar Escolha Misteriosa (Wonder Pick)
  const handleCompleteWonderPick = ({ cost, card, variant }) => {
    setBalance((prev) => Math.max(0, prev - cost));
    setPackPoints((prev) => prev + 5);
    setStats((prev) => ({ ...prev, wonderPicks: (prev.wonderPicks || 0) + 1 }));
    setCollection((prev) => [
      {
        instanceId: `wp-${card.id}-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        cardId: card.id,
        variant,
        grade: null,
        packId: 'wonder-pick',
        pulledAt: Date.now(),
      },
      ...prev,
    ]);
  };

  // Finalizar Duelo de Atributos
  const handleDuelFinish = ({ stake, won, draw }) => {
    if (won) {
      setBalance((prev) => prev - stake.entry + stake.prizeCash);
      setPackPoints((prev) => prev + stake.prizePoints);
      setStats((prev) => ({ ...prev, duelsWon: (prev.duelsWon || 0) + 1 }));
      showToast(
        `Vitória no Duelo! +${formatCurrency(stake.prizeCash)} e +${stake.prizePoints} PT!`,
        'emerald'
      );
    } else if (!draw) {
      setBalance((prev) => Math.max(0, prev - stake.entry));
    }
  };

  // Forjar carta via Pontos de Pacote (Pack Points)
  const handleCraftCard = (card, variant, cost) => {
    if (packPoints < cost) return;
    soundEngine.playRarityReveal(card.raridade, variant);
    setPackPoints((prev) => prev - cost);
    setCollection((prev) => [
      {
        instanceId: `craft-${card.id}-${variant}-${Date.now()}`,
        cardId: card.id,
        variant,
        grade: null,
        packId: 'pack-points',
        pulledAt: Date.now(),
      },
      ...prev,
    ]);
    showToast(
      `Carta forjada: ${card.marca} (${VARIANTS[variant].shortLabel})!`,
      'emerald'
    );
  };

  // Resgatar recompensa de Missão
  const handleClaimMission = (mission) => {
    if (claimedMissions.includes(mission.id)) return;
    soundEngine.playVictoryFanfare();
    setClaimedMissions((prev) => [...prev, mission.id]);
    setBalance((prev) => prev + mission.rewardCash);
    setPackPoints((prev) => prev + mission.rewardPoints);
    showToast(
      `Missão concluída! +${formatCurrency(mission.rewardCash)} e +${mission.rewardPoints} PT!`,
      'emerald'
    );
  };

  // Graduação PSA de 1 cópia não graduada
  const handleGradeCard = (cardId, variant) => {
    if (balance < GRADING_FEE) return null;
    const targetIdx = collection.findIndex(
      (item) => item.cardId === cardId && item.variant === variant && !item.grade
    );
    if (targetIdx === -1) return null;

    const assignedGrade = rollPsaGrade();
    setBalance((prev) => prev - GRADING_FEE);
    setStats((prev) => ({ ...prev, gradesDone: (prev.gradesDone || 0) + 1 }));
    setCollection((prev) => {
      const next = [...prev];
      next[targetIdx] = { ...next[targetIdx], grade: assignedGrade };
      return next;
    });

    // Atualiza o inspetor para refletir a versão graduada
    setInspectorState((curr) => (curr ? { ...curr, grade: assignedGrade } : null));
    showToast(
      `Graduação concluída: ${PSA_GRADES[assignedGrade].label} (${PSA_GRADES[assignedGrade].multiplier}×)!`,
      assignedGrade === 10 ? 'amber' : 'emerald'
    );
    return assignedGrade;
  };

  // Fusão Trade-Up
  const handleExecuteTradeUp = (recipe) => {
    const cardMap = new Map(CARDS.map((c) => [c.id, c]));
    // Prioriza consumir cartas não graduadas e de variante Normal primeiro
    const candidates = collection
      .map((item, idx) => ({ item, idx, card: cardMap.get(item.cardId) }))
      .filter((x) => x.card && x.card.raridade === recipe.fromRarity && !x.item.grade)
      .sort((a, b) => {
        const order = { normal: 0, foil: 1, 'full-art': 2 };
        return (order[a.item.variant] || 0) - (order[b.item.variant] || 0);
      });

    if (candidates.length < recipe.requiredCount) return null;

    const indicesToRemove = new Set(
      candidates.slice(0, recipe.requiredCount).map((c) => c.idx)
    );
    const forged = executeTradeUp(recipe);

    setCollection((prev) => [
      {
        instanceId: forged.instanceId,
        cardId: forged.cardId,
        variant: forged.variant,
        grade: null,
        packId: 'trade-up',
        pulledAt: forged.pulledAt,
      },
      ...prev.filter((_, idx) => !indicesToRemove.has(idx)),
    ]);
    setStats((prev) => ({ ...prev, tradeUpsDone: (prev.tradeUpsDone || 0) + 1 }));
    return forged;
  };

  // Fixar/Remover carta da Estante de Exibição (Display Board)
  const handleTogglePin = (cardId, variant, grade = null) => {
    const key = makeEntryKey(cardId, variant, grade);
    setDisplayBoard((prev) => {
      const slots = prev.slots || [];
      if (slots.includes(key)) {
        showToast('Carta removida da Estante de Exibição.', 'amber');
        return { ...prev, slots: slots.filter((k) => k !== key) };
      }
      const nextSlots = [...slots, key].slice(-3);
      showToast('Carta fixada na Estante de Exibição!', 'emerald');
      return { ...prev, slots: nextSlots };
    });
  };

  // Resgatar bônus gratuito
  const handleClaimBonus = () => {
    soundEngine.playCoinSound();
    setBalance((prev) => prev + 100);
    showToast('Você recebeu +R$ 100 em fichas de colecionador!', 'emerald');
  };

  // Vender 1 unidade de uma carta específica
  const handleSellOne = (cardId, variant, grade = null) => {
    const card = CARDS.find((c) => c.id === cardId);
    if (!card) return;
    const idx = collection.findIndex(
      (item) =>
        item.cardId === cardId &&
        item.variant === variant &&
        (item.grade || null) === (grade || null)
    );
    if (idx === -1) return;

    const saleValue = calculateCardValue(card, variant, grade);
    soundEngine.playCoinSound();
    setCollection((prev) => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    setBalance((prev) => prev + saleValue);
    showToast(
      `Vendida 1× ${card.marca} (${VARIANTS[variant]?.shortLabel}${grade ? ` PSA ${grade}` : ''}) por +${formatCurrency(saleValue)}!`,
      'emerald'
    );
  };

  // Vender todas as duplicatas mantendo 1 cópia de cada (cardId + variant + grade)
  const handleSellDuplicates = () => {
    const seen = new Set();
    const kept = [];
    const cardMap = new Map(CARDS.map((c) => [c.id, c]));
    let earned = 0;
    let soldCount = 0;

    for (const item of collection) {
      const key = makeEntryKey(item.cardId, item.variant, item.grade || null);
      if (!seen.has(key)) {
        seen.add(key);
        kept.push(item);
      } else {
        const card = cardMap.get(item.cardId);
        if (card) {
          earned += calculateCardValue(card, item.variant, item.grade || null);
          soldCount += 1;
        }
      }
    }

    if (soldCount === 0) return;

    soundEngine.playCoinSound();
    setCollection(kept);
    setBalance((prev) => prev + earned);
    showToast(
      `${soldCount} duplicata${soldCount > 1 ? 's vendidas' : ' vendida'} por +${formatCurrency(earned)}!`,
      'emerald'
    );
  };

  const inspectedOwnedCount = useMemo(() => {
    if (!inspectorState) return 0;
    return collection.filter(
      (i) =>
        i.cardId === inspectorState.card.id &&
        i.variant === inspectorState.variant &&
        (i.grade || null) === (inspectorState.grade || null)
    ).length;
  }, [collection, inspectorState]);

  const inspectedIsPinned = useMemo(() => {
    if (!inspectorState) return false;
    const key = makeEntryKey(
      inspectorState.card.id,
      inspectorState.variant,
      inspectorState.grade || null
    );
    return (displayBoard?.slots || []).includes(key);
  }, [displayBoard, inspectorState]);

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        balance={balance}
        packPoints={packPoints}
        totalCards={collection.length}
        claimableMissionsCount={claimableMissionsCount}
        onOpenMissions={() => setShowMissions(true)}
        onClaimBonus={handleClaimBonus}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ======================== ABA 1: LOJA DE PACOTES ======================== */}
        {activeTab === 'packs' && (
          <div className="space-y-10">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-indigo-950/60 to-slate-950 p-6 sm:p-10 shadow-2xl">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/45 text-sky-200 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <span>🏁</span>
                    <span>5 Categorias com Ranking Próprio • Nova Categoria Corrida GT3!</span>
                  </div>
                  <h1 className="font-display font-black text-3xl sm:text-5xl text-white leading-tight">
                    Pacotes por Categoria:{' '}
                    <span className="bg-gradient-to-r from-sky-300 via-amber-300 to-red-400 bg-clip-text text-transparent">
                      Street, JDM, GT3, Hyper & F1
                    </span>
                    .
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Cada categoria tem seu <strong className="text-white">pacote exclusivo</strong> e ranking completo do{' '}
                    <strong className="text-emerald-300">Comum</strong> ao <strong className="text-rose-300">Místico</strong> —
                    incluindo a nova <strong className="text-sky-300">Corrida GT3</strong> liderada pela{' '}
                    <strong className="text-amber-300">BMW M3 GTR Most Wanted</strong> e o Paddock{' '}
                    <strong className="text-red-300">♛ F1 Histórica</strong>!
                  </p>
                </div>

                {/* Painel de Estatísticas + Atalho Pack Points */}
                <div className="flex flex-col gap-2.5 shrink-0 min-w-[250px]">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-950/75 border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Pacotes</div>
                      <div className="font-mono font-black text-2xl text-white mt-0.5">{packsOpened}</div>
                    </div>
                    <div className="bg-slate-950/75 border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Álbum</div>
                      <div className="font-mono font-black text-lg text-amber-300 mt-0.5">
                        {formatCurrency(albumMetrics.collectionValue)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setShowPackPoints(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:brightness-110 border border-purple-400/40 text-white text-xs font-black flex items-center justify-between transition-all shadow-lg"
                  >
                    <span>✨ Trocar Pontos de Pacote</span>
                    <span className="font-mono bg-black/30 px-2 py-0.5 rounded-md text-amber-300">
                      {packPoints} PT
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Vitrine dos 4 Booster Packs */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white">
                    Escolha seu Pacote Booster
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Cada pacote contém 5 cartas com a última carta garantida como Raro+ e gera +10 a +20 PT.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab('showcase');
                  }}
                  className="text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-4"
                >
                  Explorar todas as {CARDS.length} cartas na Vitrine →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 justify-items-center pt-2">
                {PACKS.map((pack) => (
                  <BoosterPack
                    key={pack.id}
                    pack={pack}
                    balance={balance}
                    onOpen={handleOpenPack}
                    onShowOdds={setOddsPack}
                  />
                ))}
              </div>
            </section>

            {/* Legenda de Raridades & Multiplicadores */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
              <div className="lg:col-span-2 bg-slate-900/75 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tabela de Raridades & Valores Base
                  </h3>
                  <span className="text-[10px] font-mono text-amber-300/80">
                    🔊 Clique na raridade para ouvir o som
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                  {RARITY_ORDER.map((rKey) => {
                    const r = RARITIES[rKey];
                    const cardsOfRarity = CARDS.filter((c) => c.raridade === rKey);
                    const minVal = Math.min(...cardsOfRarity.map((c) => c.baseValue));
                    const maxVal = Math.max(...cardsOfRarity.map((c) => c.baseValue));
                    return (
                      <button
                        type="button"
                        key={rKey}
                        onClick={() => soundEngine.playRarityReveal(rKey, 'normal')}
                        className={`p-3 rounded-xl border bg-slate-950/70 hover:bg-slate-800/80 active:scale-95 transition-all ${r.borderClass}`}
                      >
                        <div className={`text-sm font-black ${r.textAccent}`}>{r.symbol}</div>
                        <div className="text-xs font-bold text-white mt-0.5">{r.label}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          {formatCurrency(minVal)}–{formatCurrency(maxVal)}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {r.hasSpecialEditions ? 'Foil & Full Art' : 'Apenas Normal'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Multiplicadores Especiais
                </h3>
                <div className="space-y-2.5">
                  {Object.values(VARIANTS).map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => soundEngine.playSwitchEdition(v.id)}
                      className="w-full flex items-center justify-between gap-2 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-xl px-3 py-2 transition-colors active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${v.badgeClass}`}>
                          {v.shortLabel}
                        </span>
                        <span className="text-xs text-slate-300 truncate">{v.label}</span>
                      </div>
                      <span className="font-mono font-black text-sm text-amber-300 shrink-0">
                        {v.multiplier}×
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================== ABA 2: WONDER PICK ======================== */}
        {activeTab === 'wonder' && (
          <WonderPickView
            balance={balance}
            onCompleteWonderPick={handleCompleteWonderPick}
          />
        )}

        {/* ======================== ABA 3: DUELO ======================== */}
        {activeTab === 'duel' && (
          <DuelView
            collection={collection}
            balance={balance}
            onDuelFinish={handleDuelFinish}
            onGoToPacks={() => setActiveTab('packs')}
          />
        )}

        {/* ======================== ABA 4: COLEÇÃO (ÁLBUM) ======================== */}
        {activeTab === 'collection' && (
          <CollectionView
            collection={collection}
            displayBoard={displayBoard}
            onChangeDisplayTheme={(theme) =>
              setDisplayBoard((prev) => ({ ...prev, theme }))
            }
            onRemoveDisplaySlot={(key) =>
              setDisplayBoard((prev) => ({
                ...prev,
                slots: (prev.slots || []).filter((k) => k !== key),
              }))
            }
            onInspectEntry={(entry) => {
              setInspectorState({
                card: entry.card,
                variant: entry.variant,
                grade: entry.grade || null,
                canSell: true,
              });
            }}
            onSellDuplicates={handleSellDuplicates}
            onOpenTradeUp={() => setShowTradeUp(true)}
            onGoToPacks={() => setActiveTab('packs')}
          />
        )}

        {/* ======================== ABA 5: VITRINE (CARROSSEL) ======================== */}
        {activeTab === 'showcase' && <ShowcaseCarousel ownedKeys={ownedKeys} />}
      </main>

      <footer className="border-t border-white/5 py-5 px-4 text-center text-xs text-slate-500">
        Apex TCG • Carros Lendários, JDM, Hypercars & F1 Histórica • Wonder Pick, Duelo de Pista, PSA 10 & Trade-Up.
      </footer>

      {/* Modal: Abertura de Pacote */}
      {openingState && (
        <PackOpeningModal
          key={openingState.result.pulls[0]?.instanceId}
          openingResult={openingState.result}
          previousOwnedKeys={openingState.previousOwnedKeys}
          balance={balance}
          onOpenAnother={handleOpenPack}
          onClose={() => setOpeningState(null)}
        />
      )}

      {/* Modal: Odds e Cartas do Pacote */}
      {oddsPack && (
        <PackOddsModal
          pack={oddsPack}
          onClose={() => setOddsPack(null)}
          onInspectCard={(card, variant) => {
            setOddsPack(null);
            setInspectorState({ card, variant, grade: null, canSell: false });
          }}
        />
      )}

      {/* Modal: Inspetor 3D + Graduação PSA + Fixar na Estante */}
      {inspectorState && (
        <CardInspectorModal
          card={inspectorState.card}
          initialVariant={inspectorState.variant}
          initialGrade={inspectorState.grade}
          ownedCount={inspectedOwnedCount}
          canSell={inspectorState.canSell}
          balance={balance}
          isPinned={inspectedIsPinned}
          onTogglePin={handleTogglePin}
          onGradeCard={handleGradeCard}
          onSellOne={handleSellOne}
          onClose={() => setInspectorState(null)}
        />
      )}

      {/* Modal: Troca de Pontos de Pacote (Pack Points) */}
      {showPackPoints && (
        <PackPointsModal
          packPoints={packPoints}
          ownedKeys={ownedKeys}
          onCraftCard={handleCraftCard}
          onClose={() => setShowPackPoints(false)}
        />
      )}

      {/* Modal: Missões & Conquistas */}
      {showMissions && (
        <MissionsModal
          missionContext={missionContext}
          claimedMissions={claimedMissions}
          onClaimMission={handleClaimMission}
          onClose={() => setShowMissions(false)}
        />
      )}

      {/* Modal: Fusão Trade-Up */}
      {showTradeUp && (
        <TradeUpModal
          collection={collection}
          onExecuteTradeUp={handleExecuteTradeUp}
          onClose={() => setShowTradeUp(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-pop-in">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl text-xs sm:text-sm font-bold backdrop-blur-md ${
              toast.tone === 'emerald'
                ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200'
                : toast.tone === 'rose'
                  ? 'bg-rose-950/90 border-rose-400/50 text-rose-200'
                  : 'bg-slate-900/95 border-amber-400/50 text-amber-200'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
