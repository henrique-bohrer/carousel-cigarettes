// Serviço de busca em lote na API oficial da Wikipédia / Wikimedia Commons
// - pilimit=50 garante que todos os 24 carros venham em 1 única requisição HTTP
// - pithumbsize=500 usa tamanho padrão pré-cacheado no CDN da Wikimedia (evita HTTP 429)
// - Cache local com validação e fallback sequencial seguro

const PHOTO_CACHE_KEY = 'apex-tcg-wiki-photos-v3';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function loadCachedPhotos() {
  try {
    const raw = localStorage.getItem(PHOTO_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.photos !== 'object') return {};
    if (Date.now() - (parsed.savedAt || 0) > CACHE_TTL_MS) return {};
    return parsed.photos;
  } catch {
    return {};
  }
}

function saveCachedPhotos(photos) {
  try {
    localStorage.setItem(
      PHOTO_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), photos })
    );
  } catch {
    // ignora quota cheia
  }
}

/**
 * Busca thumbnails em 500px para todos os carros em 1 requisição (com pilimit=50 e suporte a continue).
 */
async function fetchWikipediaBatch(cardsBatch) {
  const titles = cardsBatch.map((c) => c.wikiTitle).filter(Boolean);
  if (titles.length === 0) return {};

  const normMap = new Map();
  const redirectMap = new Map();
  const thumbByCanonicalTitle = new Map();

  let continueParams = '';
  let safetyLoops = 0;

  while (safetyLoops < 5) {
    safetyLoops += 1;
    const url =
      'https://en.wikipedia.org/w/api.php' +
      `?action=query&titles=${encodeURIComponent(titles.join('|'))}` +
      '&prop=pageimages&piprop=thumbnail&pithumbsize=500&pilimit=50&redirects=1&format=json&origin=*' +
      continueParams;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wikipedia API HTTP ${res.status}`);
    const data = await res.json();
    const query = data?.query;

    if (query) {
      for (const item of query.normalized || []) {
        normMap.set(item.from, item.to);
      }
      for (const item of query.redirects || []) {
        redirectMap.set(item.from, item.to);
      }
      for (const page of Object.values(query.pages || {})) {
        if (page?.title && page?.thumbnail?.source) {
          thumbByCanonicalTitle.set(page.title, page.thumbnail.source);
        }
      }
    }

    if (data?.continue?.picontinue !== undefined) {
      continueParams = `&continue=${encodeURIComponent(data.continue.continue || '')}&picontinue=${encodeURIComponent(data.continue.picontinue)}`;
    } else {
      break;
    }
  }

  const resolved = {};
  for (const card of cardsBatch) {
    if (!card.wikiTitle) continue;
    const normalized = normMap.get(card.wikiTitle) || card.wikiTitle.replace(/_/g, ' ');
    const finalTitle = redirectMap.get(normalized) || normalized;
    const thumb =
      thumbByCanonicalTitle.get(finalTitle) ||
      thumbByCanonicalTitle.get(normalized);
    if (thumb) {
      resolved[card.id] = thumb;
    }
  }

  return resolved;
}

/**
 * Fallback 1: endpoint REST Summary da Wikipédia (usa imagem já pré-renderizada).
 */
async function fetchWikipediaSummaryFallback(card) {
  if (!card.wikiTitle) return null;
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(card.wikiTitle)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source || data?.originalimage?.source || null;
  } catch {
    return null;
  }
}

/**
 * Fallback 2: busca no Wikimedia Commons caso o artigo da Wikipédia não possua imagem de capa.
 */
async function fetchWikimediaCommonsFallback(card) {
  const searchTerm = card.commonsQuery || `${card.marca} ${card.tipo}`;
  const url =
    'https://commons.wikimedia.org/w/api.php' +
    `?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm)}` +
    '&gsrlimit=3&prop=imageinfo&iiprop=url|mime&iiurlwidth=500&format=json&origin=*';

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    for (const page of pages) {
      const info = page?.imageinfo?.[0];
      if (info?.mime && info.mime.startsWith('image/') && !info.mime.includes('svg')) {
        return info.thumburl || info.url || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Carrega todas as fotos reais dos carros com cache local e fallback sequencial (sem estourar rate limit).
 */
export async function fetchAllCarPhotos(cards, existingPhotos = {}) {
  const missingCards = cards.filter((c) => !c.imageUrl && !existingPhotos[c.id]);
  if (missingCards.length === 0) return existingPhotos;

  const merged = { ...existingPhotos };

  try {
    // 1. Lote único na Wikipédia com pilimit=50 (traz quase todos ou todos os 24 carros de uma vez)
    const batchResult = await fetchWikipediaBatch(missingCards);
    Object.assign(merged, batchResult);
  } catch {
    // Continua graciosamente para os fallbacks se necessário
  }

  // 2. Para qualquer carta ainda faltante, busca de forma sequencial suave (evita HTTP 429 da Wikimedia)
  const stillMissing = missingCards.filter((c) => !merged[c.id]);
  for (const card of stillMissing) {
    let url = await fetchWikipediaSummaryFallback(card);
    if (!url) {
      await delay(120);
      url = await fetchWikimediaCommonsFallback(card);
    }
    if (url) {
      merged[card.id] = url;
    }
    await delay(100);
  }

  if (Object.keys(merged).length > 0) {
    saveCachedPhotos(merged);
  }

  return merged;
}
