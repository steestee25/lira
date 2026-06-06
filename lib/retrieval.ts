// ─── retrieval.ts ─────────────────────────────────────────────────────────────
// Retrieves relevant documents from the knowledge base using BM25.

import * as bm25 from './bm25Index';
import { KNOWLEDGE_BASE } from './knowledgeBase_qa';

let RNFS: any = null;
try { RNFS = require('react-native-fs'); } catch { /* not available on web */ }

// ─── Types ────────────────────────────────────────────────────────────────────

export type Doc = {
  id:       string;
  text:     string;
  metadata?: {
    source_title?: string;
    source_url?:   string;
    answer?:       string;
  };
};

type DiskCache = {
  version:    number;
  fingerprint: string;
  docs:       Doc[];
  bm25Index:  bm25.BM25Index;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_VERSION   = 1;
const CACHE_FILE      = RNFS
  ? `${RNFS.DocumentDirectoryPath}/bm25_index.json`
  : null;

// ─── In-memory state ──────────────────────────────────────────────────────────

let indexedDocs: Doc[] | null = null;

// ─── Knowledge base loader ───────────────────────────────────────────────────

function loadDocs(): Doc[] {
  return KNOWLEDGE_BASE.map(e => ({
    id:   e.id,
    text: `${e.question}\n\n${e.answer}`,
    metadata: {
      source_title: e.metadata?.source_title,
      source_url:   e.metadata?.source_url,
      answer:       e.answer,
    },
  }));
}

// ─── Fingerprint ─────────────────────────────────────────────────────────────
// Changes whenever knowledge base content changes → cache invalidation.

function fingerprint(docs: Doc[]): string {
  let h = 0;
  for (const d of docs) {
    const s = `${d.id}:${d.text}`;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  }
  return h.toString(36);
}

// ─── Index management ─────────────────────────────────────────────────────────

/**
 * Ensures the BM25 index is ready.
 *
 * Load order:
 *   1. Already in memory this session → return immediately.
 *   2. On-disk cache valid (version + fingerprint match) → restore index, no rebuild.
 *   3. Build from scratch + write cache to disk.
 */
export async function ensureIndexed(): Promise<Doc[]> {
  // 1. Already ready
  if (indexedDocs && bm25.isReady()) return indexedDocs;

  const docs = loadDocs();
  const fp   = fingerprint(docs);

  // 2. Try disk cache
  if (RNFS && CACHE_FILE) {
    try {
      const exists = await RNFS.exists(CACHE_FILE);
      if (exists) {
        const raw: DiskCache = JSON.parse(await RNFS.readFile(CACHE_FILE, 'utf8'));

        if (raw.version === CACHE_VERSION && raw.fingerprint === fp) {
          bm25.loadIndex(raw.bm25Index);
          indexedDocs = raw.docs;
          console.log(`[BM25] Index loaded from cache (${indexedDocs.length} docs)`);
          return indexedDocs;
        }

        // stale cache
        console.log('[BM25] Cache stale, rebuilding');
        await RNFS.unlink(CACHE_FILE).catch(() => {});
      }
    } catch (e) {
      console.warn('[BM25] Cache read failed, rebuilding:', e);
    }
  }

  // 3. Build from scratch
  bm25.buildIndex(docs.map(d => d.text));
  console.log(`[BM25] Index built for ${docs.length} documents`);

  // Persist
  if (RNFS && CACHE_FILE) {
    try {
      const cache: DiskCache = {
        version:    CACHE_VERSION,
        fingerprint: fp,
        docs,
        bm25Index:  bm25.getIndex(),
      };
      await RNFS.writeFile(CACHE_FILE, JSON.stringify(cache), 'utf8');
      console.log('[BM25] Cache written to disk');
    } catch (e) {
      console.warn('[BM25] Failed to write cache:', e);
    }
  }

  indexedDocs = docs;
  return docs;
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export async function retrieveRelevant(
  query:   string,
  options: { k?: number; minScore?: number } = {},
): Promise<Doc[]> {
  const { k = 6, minScore = 0.0 } = options;

  const docs = await ensureIndexed();
  if (!docs.length) return [];

  const queryTerms = bm25.tokenize(query);
  if (!queryTerms.length) return [];

  // Score only documents that share at least one term with the query (inverted index)
  const scoreMap = bm25.scoreAll(queryTerms);
  if (!scoreMap.size) return [];

  // Sort by score descending
  const ranked = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k);

  const filtered = minScore > 0
    ? ranked.filter(([, s]) => s >= minScore)
    : ranked;

  // Guarantee at least 3 results so the LLM always has context
  const final = filtered.length >= 3 ? filtered : ranked.slice(0, Math.min(3, ranked.length));

  console.log(`[BM25] query="${query}" terms=[${queryTerms.join(', ')}]`);
  final.forEach(([docIdx, s], i) =>
    console.log(`  [${i+1}] score=${s.toFixed(3)} id=${docs[docIdx].id} "${docs[docIdx].text.slice(0,60).replace(/\n/g,' ')}…"`)
  );

  return final.map(([docIdx]) => ({
    id:       docs[docIdx].id,
    text:     docs[docIdx].text,
    metadata: docs[docIdx].metadata,
  }));
}

export default { ensureIndexed, retrieveRelevant };