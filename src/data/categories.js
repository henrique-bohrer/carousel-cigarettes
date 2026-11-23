export const CATEGORIES = {
  'street-muscle': {
    id: 'street-muscle',
    name: 'Street & Muscle',
    shortName: 'STREET',
    icon: '🔥',
    description: 'Clássicos de rua, hot hatches e V8 americanos do Comum ao Místico.',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/45',
    accentColor: '#f97316',
    packId: 'pack-street-muscle',
  },
  jdm: {
    id: 'jdm',
    name: 'Tokyo JDM',
    shortName: 'JDM',
    icon: '🇯🇵',
    description: 'Ícones japoneses das serras e rodovias noturnas de Tóquio.',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/45',
    accentColor: '#e879f9',
    packId: 'pack-jdm',
  },
  gt3: {
    id: 'gt3',
    name: 'Corrida GT3',
    shortName: 'GT3',
    icon: '🏁',
    description: 'Máquinas de endurance e pista GT3/ALMS — coroadas pela BMW M3 GTR Most Wanted.',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
    accentColor: '#38bdf8',
    packId: 'pack-gt3',
  },
  supercars: {
    id: 'supercars',
    name: 'Hypercars',
    shortName: 'HYPER',
    icon: '⚡',
    description: 'Supercarros analógicos e hypercars extremos acima de 350–500 km/h.',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    accentColor: '#fbbf24',
    packId: 'pack-supercars',
  },
  f1: {
    id: 'f1',
    name: 'Fórmula 1',
    shortName: 'F1',
    icon: '♛',
    description: 'A categoria suprema do automobilismo — dos clássicos de grid às lendas F1 Históricas.',
    badgeClass: 'bg-red-600/25 text-amber-200 border-amber-300/70',
    accentColor: '#ef4444',
    packId: 'pack-f1',
  },
};

export const CATEGORY_ORDER = ['street-muscle', 'jdm', 'gt3', 'supercars', 'f1'];

export default CATEGORIES;
