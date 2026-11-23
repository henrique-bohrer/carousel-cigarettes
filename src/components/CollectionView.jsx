import React, { useMemo, useState } from 'react';
import { CARDS } from '../data/cards.js';
import { CATEGORIES, CATEGORY_ORDER } from '../data/categories.js';
import { DISPLAY_THEMES, RARITIES, RARITY_ORDER, VARIANTS } from '../data/rarities.js';
import { calculateCardValue, formatCurrency } from '../utils/packEngine.js';
import soundEngine from '../utils/soundEngine.js';
import CustomSelect from './CustomSelect.jsx';
import TcgCard from './TcgCard.jsx';

const SORT_OPTIONS = [
  { value: 'value-desc', label: 'Maior Valor', icon: 'R$' },
  { value: 'rarity-desc', label: 'Maior Raridade', icon: '★' },
  { value: 'recent', label: 'Mais Recentes', icon: '✦' },
  { value: 'number', label: 'Número (#)', icon: '#' },
];

export function makeEntryKey(cardId, variant, grade = null) {
  return `${cardId}::${variant}::${grade || 'raw'}`;
}

const CollectionView = ({
  collection,
  displayBoard,
  onChangeDisplayTheme,
  onRemoveDisplaySlot,
  onInspectEntry,
  onSellDuplicates,
  onOpenTradeUp,
  onGoToPacks,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [rarityFilter, setRarityFilter] = useState('Todas');
  const [variantFilter, setVariantFilter] = useState('Todas');
  const [sortBy, setSortBy] = useState('value-desc');

  // Agrupa a coleção por (cardId + variant + grade)
  const groupedEntries = useMemo(() => {
    const map = new Map();
    const cardById = new Map(CARDS.map((c) => [c.id, c]));

    for (const item of collection) {
      const card = cardById.get(item.cardId);
      if (!card) continue;
      const grade = item.grade || null;
      const key = makeEntryKey(item.cardId, item.variant, grade);
      const existing = map.get(key);
      const value = calculateCardValue(card, item.variant, grade);

      if (existing) {
        existing.count += 1;
        existing.latestPulledAt = Math.max(existing.latestPulledAt, item.pulledAt || 0);
      } else {
        map.set(key, {
          key,
          card,
          variant: item.variant,
          grade,
          value,
          count: 1,
          latestPulledAt: item.pulledAt || 0,
        });
      }
    }

    return Array.from(map.values());
  }, [collection]);

  const entryMap = useMemo(() => {
    return new Map(groupedEntries.map((e) => [e.key, e]));
  }, [groupedEntries]);

  // Estatísticas do Álbum
  const stats = useMemo(() => {
    let totalValue = 0;
    let foilCount = 0;
    let fullArtCount = 0;
    let gradedCount = 0;
    let duplicateCount = 0;
    let duplicateValue = 0;
    const uniqueBaseEditions = new Set();

    for (const entry of groupedEntries) {
      totalValue += entry.value * entry.count;
      uniqueBaseEditions.add(`${entry.card.id}::${entry.variant}`);
      if (entry.variant === 'foil') foilCount += entry.count;
      if (entry.variant === 'full-art') fullArtCount += entry.count;
      if (entry.grade) gradedCount += entry.count;
      if (entry.count > 1) {
        const extras = entry.count - 1;
        duplicateCount += extras;
        duplicateValue += extras * entry.value;
      }
    }

    const totalPossibleEditions = CARDS.reduce(
      (sum, c) => sum + (RARITIES[c.raridade]?.hasSpecialEditions ? 3 : 1),
      0
    );

    return {
      totalCards: collection.length,
      uniqueEditions: uniqueBaseEditions.size,
      totalPossibleEditions,
      totalValue,
      foilCount,
      fullArtCount,
      gradedCount,
      duplicateCount,
      duplicateValue,
    };
  }, [collection, groupedEntries]);

  // Progresso de carros únicos desbloqueados por categoria
  const categoryProgress = useMemo(() => {
    const ownedCardIds = new Set(collection.map((i) => i.cardId));
    return CATEGORY_ORDER.map((catId) => {
      const catCards = CARDS.filter((c) => c.category === catId);
      const owned = catCards.filter((c) => ownedCardIds.has(c.id)).length;
      return {
        ...CATEGORIES[catId],
        owned,
        total: catCards.length,
      };
    });
  }, [collection]);

  // Filtragem e Ordenação
  const filteredEntries = useMemo(() => {
    return groupedEntries
      .filter((e) => (categoryFilter === 'Todas' ? true : e.card.category === categoryFilter))
      .filter((e) => (rarityFilter === 'Todas' ? true : e.card.raridade === rarityFilter))
      .filter((e) => (variantFilter === 'Todas' ? true : e.variant === variantFilter))
      .sort((a, b) => {
        if (sortBy === 'value-desc') return b.value - a.value;
        if (sortBy === 'rarity-desc') {
          const diff = (RARITIES[b.card.raridade]?.tier || 0) - (RARITIES[a.card.raridade]?.tier || 0);
          return diff !== 0 ? diff : b.value - a.value;
        }
        if (sortBy === 'recent') return b.latestPulledAt - a.latestPulledAt;
        return a.card.number.localeCompare(b.card.number);
      });
  }, [groupedEntries, categoryFilter, rarityFilter, variantFilter, sortBy]);

  if (collection.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center bg-slate-900/70 border border-slate-800 rounded-3xl p-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center text-3xl text-amber-300 mb-4">
          ❖
        </div>
        <h2 className="font-display font-bold text-2xl text-white">Seu Álbum está vazio</h2>
        <p className="text-sm text-slate-400 mt-2">
          Abra pacotes de eventos ou colaborações para começar a colecionar cartas normais, Foil e Full Art!
        </p>
        <button
          type="button"
          onClick={onGoToPacks}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-yellow-400 transition-all"
        >
          Abrir Meu Primeiro Pacote →
        </button>
      </div>
    );
  }

  const activeTheme = DISPLAY_THEMES[displayBoard?.theme] || DISPLAY_THEMES.velvet;
  const pinnedEntries = (displayBoard?.slots || [])
    .map((key) => (key ? entryMap.get(key) : null))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Estante de Exibição Personalizável (Display Board) */}
      <section
        className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${activeTheme.bgClass} p-5 sm:p-6 shadow-2xl`}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${activeTheme.glow}, transparent 70%)`,
          }}
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300">
              Quadro de Exibição • Display Board
            </span>
            <h2 className="font-display font-bold text-xl text-white">
              Suas 3 Joias em Destaque
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-black/35 p-1 rounded-xl border border-white/10">
            {Object.values(DISPLAY_THEMES).map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onChangeDisplayTheme(theme.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  activeTheme.id === theme.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 py-2">
          {[0, 1, 2].map((slotIdx) => {
            const entry = pinnedEntries[slotIdx];
            if (!entry) {
              return (
                <div
                  key={slotIdx}
                  className="w-44 h-[16.5rem] rounded-2xl border-2 border-dashed border-white/15 bg-black/25 flex flex-col items-center justify-center p-4 text-center"
                >
                  <span className="text-2xl text-slate-600">☆</span>
                  <span className="text-[11px] text-slate-400 mt-2">
                    Clique em qualquer carta abaixo e selecione <strong>Fixar na Estante</strong>
                  </span>
                </div>
              );
            }
            return (
              <div key={entry.key} className="relative group flex flex-col items-center">
                <TcgCard
                  card={entry.card}
                  variant={entry.variant}
                  grade={entry.grade}
                  size="sm"
                  enableEngineRev
                  onClick={() => onInspectEntry(entry)}
                />
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onRemoveDisplaySlot(entry.key);
                  }}
                  title="Remover da estante"
                  className="mt-2 text-[10px] font-semibold text-slate-400 hover:text-rose-300 transition-colors"
                >
                  Remover da estante
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPIs da Coleção + Botões de Fusão Trade-Up e Venda de Duplicatas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Valor do Álbum</div>
          <div className="font-mono font-black text-2xl text-amber-300 mt-1">
            {formatCurrency(stats.totalValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.totalCards} cartas • {stats.gradedCount} PSA
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Completude Dex</div>
          <div className="font-mono font-black text-2xl text-white mt-1">
            {stats.uniqueEditions}
            <span className="text-sm font-normal text-slate-500"> / {stats.totalPossibleEditions}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-rose-400"
              style={{ width: `${Math.min(100, (stats.uniqueEditions / stats.totalPossibleEditions) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Fusão Alquímica</div>
            <div className="text-xs text-slate-300 mt-1">
              Troque cartas sobrando por raridades maiores!
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenTradeUp();
            }}
            className="mt-2 w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:brightness-110 text-white text-xs font-black transition-all"
          >
            ⚗ Abrir Trade-Up
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Duplicatas</div>
            <div className="font-mono font-black text-xl text-emerald-300 mt-1">
              {stats.duplicateCount > 0 ? `+${formatCurrency(stats.duplicateValue)}` : 'Nenhuma'}
            </div>
          </div>
          <button
            type="button"
            disabled={stats.duplicateCount === 0}
            onClick={onSellDuplicates}
            className={`mt-2 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
              stats.duplicateCount > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {stats.duplicateCount > 0
              ? `Vender ${stats.duplicateCount} Duplicata${stats.duplicateCount > 1 ? 's' : ''}`
              : 'Sem Duplicatas'}
          </button>
        </div>
      </div>

      {/* Progresso por Categoria (clique para filtrar diretamente) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            setCategoryFilter('Todas');
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            categoryFilter === 'Todas'
              ? 'bg-amber-400/15 border-amber-400 text-white'
              : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-600'
          }`}
        >
          <div className="text-xs font-bold">Todas</div>
          <div className="text-[10px] font-mono text-amber-300 mt-1">
            {categoryProgress.reduce((s, c) => s + c.owned, 0)} / {CARDS.length} carros
          </div>
        </button>

        {categoryProgress.map((cat) => {
          const active = categoryFilter === cat.id;
          const pct = Math.round((cat.owned / Math.max(1, cat.total)) * 100);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setCategoryFilter(cat.id);
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                active
                  ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/40 text-white'
                  : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-xs font-bold">
                <span className="truncate">
                  {cat.icon} {cat.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>
                  {cat.owned}/{cat.total}
                </span>
                <span className="text-amber-300">{pct}%</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros & Ordenação */}
      <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 mr-1">Raridade:</span>
          {['Todas', ...RARITY_ORDER].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setRarityFilter(r);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                rarityFilter === r
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-950/60 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase font-bold text-slate-500">Edição:</span>
            {['Todas', 'normal', 'foil', 'full-art'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setVariantFilter(v);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  variantFilter === v
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                    : 'bg-slate-950/60 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {v === 'Todas' ? 'Todas' : VARIANTS[v].shortLabel}
              </button>
            ))}
          </div>

          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            label="Ordenar por"
            ariaLabel="Ordenar coleção"
          />
        </div>
      </div>

      {/* Dica interativa do som de motor */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-red-950/30 border border-amber-400/25 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-amber-300 text-sm">🏁</span>
          <span>
            <strong className="text-white">Clique rápido</strong> em qualquer carro para dar uma acelerada •{' '}
            <strong className="text-amber-300">Segure pressionado</strong> no card para acelerar forte e trocar de marcha!
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">RPM & Marchas em tempo real</span>
      </div>

      {/* Grade do Álbum */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          Nenhuma carta corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center items-start">
          {filteredEntries.map((entry) => (
            <div key={entry.key} className="flex flex-col items-center gap-2">
              <TcgCard
                card={entry.card}
                variant={entry.variant}
                grade={entry.grade}
                size="md"
                count={entry.count}
                enableEngineRev
                onClick={() => onInspectEntry(entry)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionView;
