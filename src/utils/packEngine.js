import { CARDS } from '../data/cards.js';
import { PSA_GRADES, RARITIES, RARITY_ORDER, VARIANTS } from '../data/rarities.js';

/**
 * Calcula o valor de mercado final de uma carta considerando raridade, edição (Normal, Foil ou Full Art) e Graduação PSA.
 */
export function calculateCardValue(card, variantId = 'normal', grade = null) {
  if (!card) return 0;
  const rarityInfo = RARITIES[card.raridade];
  const effectiveVariant = rarityInfo?.hasSpecialEditions ? variantId : 'normal';
  const variant = VARIANTS[effectiveVariant] || VARIANTS.normal;
  const gradeMult = grade && PSA_GRADES[grade] ? PSA_GRADES[grade].multiplier : 1;
  return Math.round(card.baseValue * variant.multiplier * gradeMult);
}

/**
 * Calcula os atributos de pista de um carro com bônus de Foil, Full Art e PSA!
 */
export function getEffectiveStats(card, variantId = 'normal', grade = null) {
  if (!card) return { velocidade: 0, manobra: 0, prestigio: 0, bonus: 0 };
  const variantBonus = VARIANTS[variantId]?.duelBonus || 0;
  const gradeBonus = grade && PSA_GRADES[grade] ? PSA_GRADES[grade].duelBonus : 0;
  const bonus = variantBonus + gradeBonus;
  return {
    velocidade: card.stats.velocidade + bonus,
    manobra: card.stats.manobra + bonus,
    prestigio: card.stats.prestigio + bonus,
    bonus,
  };
}

/**
 * Calcula o custo em Pontos de Pacote (Pack Points) para forjar qualquer carta e edição.
 */
export function getCraftCost(card, variantId = 'normal') {
  if (!card) return 999;
  const rarity = RARITIES[card.raridade] || RARITIES.Comum;
  const effectiveVariant = rarity.hasSpecialEditions ? variantId : 'normal';
  const variant = VARIANTS[effectiveVariant] || VARIANTS.normal;
  return Math.round(rarity.craftPoints * variant.craftMultiplier);
}

/**
 * Sorteia uma nota PSA (8, 9 ou 10 Gem Mint).
 */
export function rollPsaGrade() {
  const roll = Math.random() * 100;
  if (roll < PSA_GRADES[10].chance) return 10;
  if (roll < PSA_GRADES[10].chance + PSA_GRADES[9].chance) return 9;
  return 8;
}

/**
 * Formata valores monetários no padrão brasileiro (R$).
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function pickWeighted(weightsObj) {
  const entries = Object.entries(weightsObj).filter(([, w]) => w > 0);
  const total = entries.reduce((acc, [, w]) => acc + w, 0);
  let roll = Math.random() * total;

  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function getCardsForPack(packId) {
  return CARDS.filter((card) => card.packIds.includes(packId));
}

function pickCardByRarity(packCards, targetRarity) {
  const exact = packCards.filter((c) => c.raridade === targetRarity);
  if (exact.length > 0) {
    return exact[Math.floor(Math.random() * exact.length)];
  }

  const targetIdx = RARITY_ORDER.indexOf(targetRarity);
  for (let offset = 1; offset < RARITY_ORDER.length; offset++) {
    const higher = RARITY_ORDER[targetIdx + offset];
    const lower = RARITY_ORDER[targetIdx - offset];
    if (higher) {
      const pool = packCards.filter((c) => c.raridade === higher);
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    }
    if (lower) {
      const pool = packCards.filter((c) => c.raridade === lower);
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return packCards[Math.floor(Math.random() * packCards.length)];
}

/**
 * Gera um pacote completo de 5 carros (com chance de God Pack incluindo F1 Histórica!).
 */
export function openBoosterPack(pack) {
  const packCards = getCardsForPack(pack.id);
  const count = pack.cardsPerPack || 5;
  const isGodPack = Math.random() < 0.025;

  const pulls = [];

  for (let i = 0; i < count; i++) {
    const isHitSlot = i === count - 1;
    let rarity;
    let variant = 'normal';

    if (isGodPack) {
      rarity = pickWeighted({ Épico: 28, Lendário: 32, Místico: 22, 'F1 Histórica': 18 });
      variant = Math.random() < 0.58 ? 'full-art' : 'foil';
    } else {
      const odds = isHitSlot ? pack.hitSlotOdds : pack.normalSlotOdds;
      rarity = pickWeighted(odds);
      const rarityMeta = RARITIES[rarity];

      if (rarityMeta?.hasSpecialEditions) {
        const variantWeights = isHitSlot
          ? {
              normal: Math.max(12, pack.variantOdds.normal - 12),
              foil: pack.variantOdds.foil + 6,
              'full-art': pack.variantOdds['full-art'] + 6,
            }
          : pack.variantOdds;
        variant = pickWeighted(variantWeights);
      }
    }

    const card = pickCardByRarity(packCards, rarity);
    const rarityMeta = RARITIES[card.raridade];
    const finalVariant = rarityMeta?.hasSpecialEditions ? variant : 'normal';
    const marketValue = calculateCardValue(card, finalVariant);

    pulls.push({
      instanceId: `${card.id}-${finalVariant}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      cardId: card.id,
      card,
      variant: finalVariant,
      grade: null,
      value: marketValue,
      packId: pack.id,
      pulledAt: Date.now(),
    });
  }

  pulls.sort((a, b) => {
    const scoreA = (RARITIES[a.card.raridade]?.tier || 0) * 100 + a.value;
    const scoreB = (RARITIES[b.card.raridade]?.tier || 0) * 100 + b.value;
    return scoreA - scoreB;
  });

  const earnedPoints = pack.price >= 80 ? 25 : pack.price >= 45 ? 15 : 10;

  return {
    pack,
    pulls,
    isGodPack,
    earnedPoints,
    totalValue: pulls.reduce((sum, p) => sum + p.value, 0),
  };
}

/**
 * Executa uma fusão Trade-Up gerando 1 carro da raridade alvo (incluindo F1 Histórica!).
 */
export function executeTradeUp(recipe) {
  const card = pickCardByRarity(CARDS, recipe.toRarity);
  const rarityMeta = RARITIES[card.raridade];
  let variant = 'normal';

  if (rarityMeta?.hasSpecialEditions) {
    const roll = Math.random() * 100;
    if (roll < recipe.fullArtChance) {
      variant = 'full-art';
    } else if (roll < recipe.fullArtChance + recipe.foilChance) {
      variant = 'foil';
    }
  }

  return {
    instanceId: `tradeup-${card.id}-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cardId: card.id,
    card,
    variant,
    grade: null,
    value: calculateCardValue(card, variant),
    packId: 'trade-up',
    pulledAt: Date.now(),
  };
}

const COLLECTOR_NAMES = [
  'SennaFan88',
  'WanganMidnight',
  'MaranelloV10',
  'SuzukaApex',
  'NurburgringPro',
  'Kaito_GT34',
  'PaddockClub',
  'Silverstone92',
];

/**
 * Gera 3 mesas de Wonder Pick (incluindo a Mesa Paddock F1 Histórica!).
 */
export function generateWonderPickTables() {
  const pickName = (exclude) => {
    const pool = COLLECTOR_NAMES.filter((n) => !exclude.includes(n));
    return pool[Math.floor(Math.random() * pool.length)] || 'Piloto';
  };

  const usedNames = [];

  const configs = [
    {
      id: 'wp-classic',
      title: 'Mesa Street & JDM',
      badge: '1 ÉPICO+ GARANTIDO',
      badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
      cost: 20,
      heroRarities: ['Épico', 'Lendário'],
      heroVariantWeights: { normal: 35, foil: 48, 'full-art': 17 },
      fillerRarities: ['Comum', 'Comum', 'Raro', 'Raro'],
    },
    {
      id: 'wp-event',
      title: 'Mesa Hypercar Foil',
      badge: 'SUPERCAR / MÍSTICO FOIL+',
      badgeStyle: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50',
      cost: 42,
      heroRarities: ['Lendário', 'Místico'],
      heroVariantWeights: { normal: 0, foil: 58, 'full-art': 42 },
      fillerRarities: ['Comum', 'Raro', 'Épico', 'Épico'],
    },
    {
      id: 'wp-f1',
      title: 'Mesa Paddock F1 Histórica',
      badge: '♛ F1 HISTÓRICA EM JOGO!',
      badgeStyle: 'bg-red-600/30 text-amber-200 border-amber-300/80',
      cost: 85,
      heroRarities: ['F1 Histórica'],
      heroVariantWeights: { normal: 20, foil: 45, 'full-art': 35 },
      fillerRarities: ['Raro', 'Épico', 'Lendário', 'Místico'],
    },
  ];

  return configs.map((cfg, idx) => {
    const owner = pickName(usedNames);
    usedNames.push(owner);

    const heroRarity = cfg.heroRarities[Math.floor(Math.random() * cfg.heroRarities.length)];
    const heroCard = pickCardByRarity(CARDS, heroRarity);
    const heroVariant = pickWeighted(cfg.heroVariantWeights);

    const slots = [
      {
        slotId: `${cfg.id}-hero-${Date.now()}-${idx}`,
        card: heroCard,
        variant: RARITIES[heroCard.raridade].hasSpecialEditions ? heroVariant : 'normal',
        isChase: true,
      },
    ];

    cfg.fillerRarities.forEach((rKey, fIdx) => {
      const c = pickCardByRarity(CARDS, rKey);
      const canSpecial = RARITIES[c.raridade].hasSpecialEditions;
      const v = canSpecial && Math.random() < 0.28 ? 'foil' : 'normal';
      slots.push({
        slotId: `${cfg.id}-f-${fIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        card: c,
        variant: v,
        isChase: false,
      });
    });

    slots.sort(() => Math.random() - 0.5);

    return {
      ...cfg,
      owner,
      slots,
    };
  });
}

/**
 * Gera um deck de 5 carros para a CPU no Duelo de Pista.
 */
export function generateCpuDeck(tier = 'classic') {
  const rarityPools = {
    free: ['Comum', 'Comum', 'Comum', 'Raro', 'Raro'],
    classic: ['Comum', 'Raro', 'Raro', 'Épico', 'Lendário'],
    vip: ['Épico', 'Lendário', 'Lendário', 'Místico', 'F1 Histórica'],
  }[tier] || ['Comum', 'Raro', 'Raro', 'Épico', 'Lendário'];

  return rarityPools.map((rKey, idx) => {
    const card = pickCardByRarity(CARDS, rKey);
    const canSpecial = RARITIES[card.raridade].hasSpecialEditions;
    let variant = 'normal';
    if (canSpecial) {
      if (tier === 'vip') variant = Math.random() < 0.4 ? 'full-art' : Math.random() < 0.72 ? 'foil' : 'normal';
      else if (tier === 'classic') variant = Math.random() < 0.25 ? 'foil' : 'normal';
    }
    return {
      instanceId: `cpu-${card.id}-${idx}-${Date.now()}`,
      cardId: card.id,
      card,
      variant,
      grade: tier === 'vip' && Math.random() < 0.25 ? 9 : null,
    };
  });
}
