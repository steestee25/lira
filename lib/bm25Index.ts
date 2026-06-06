// BM25 with an inverted index: term → [{docIdx, tf}]

const STOP_WORDS = new Set([
  'il','lo','la','i','gli','le',
  'un','uno','una',"un'",
  'di','a','da','in','con','su','per','tra','fra',
  'del','dello','della','dei','degli','delle',
  'al','allo','alla','ai','agli','alle',
  'dal','dallo','dalla','dai','dagli','dalle',
  'nel','nello','nella','nei','negli','nelle',
  'col','coi','sul','sullo','sulla','sui','sugli','sulle',
  'io','tu','lui','lei','noi','voi','loro',
  'mi','ti','si','ci','vi','ne',
  'questo','questa','questi','queste',
  'quello','quella','quelli','quelle',
  'qualcosa','qualcuno','niente','nulla','tutto',
  'e','o','ma','però','anche','pure','oppure',
  'se','perché','poiché','mentre','quando',
  'qui','qua','lì','là','già','ancora',
  'sempre','mai','spesso','solo','invece',
  'essere','sono','sei','è','siamo','siete','era','erano',
  'avere','ho','hai','ha','abbiamo','avete','hanno',
  "c'è",'non',
]);

const K1 = 1.5;
const B  = 0.75;

type Posting = { docIdx: number; tf: number };

export type BM25Index = {
  invertedIndex: Record<string, Posting[]>; 
  idf:           Record<string, number>;    
  docLengths:    number[];                  
  avgDocLength:  number;
  numDocs:       number;
};

let idx: BM25Index = {
  invertedIndex: {},
  idf:           {},
  docLengths:    [],
  avgDocLength:  0,
  numDocs:       0,
};

// ─── Tokeniser ────────────────────────────────────────────────────────────────

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\W_]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// ─── Build inverted index ─────────────────────────────────────────────────────

export function buildIndex(docs: string[]): void {
  const N = docs.length;
  const docLengths: number[] = [];
  const postingMap: Record<string, Map<number, number>> = {};

  for (let docIdx = 0; docIdx < docs.length; docIdx++) {
    const terms = tokenize(docs[docIdx]);
    docLengths.push(terms.length);

    for (const term of terms) {
      if (!postingMap[term]) postingMap[term] = new Map();
      postingMap[term].set(docIdx, (postingMap[term].get(docIdx) ?? 0) + 1);
    }
  }

  const avgDocLength = docLengths.reduce((s, l) => s + l, 0) / (N || 1);

  const invertedIndex: Record<string, Posting[]> = {};
  const idf: Record<string, number> = {};

  for (const [term, map] of Object.entries(postingMap)) {
    const df = map.size;
    idf[term] = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    invertedIndex[term] = Array.from(map.entries()).map(([docIdx, tf]) => ({ docIdx, tf }));
  }

  idx = { invertedIndex, idf, docLengths, avgDocLength, numDocs: N };
}

// ─── Score ────────────────────────────────────────────────────────────────────

/**
 * Returns BM25 scores for ALL documents that match at least one query term.
 * Only iterates over posting lists of query terms.
 */
export function scoreAll(queryTerms: string[]): Map<number, number> {
  const scores = new Map<number, number>();
  queryTerms = [...new Set(queryTerms)];

  for (const term of queryTerms) {
    const postings = idx.invertedIndex[term];
    if (!postings) continue;

    const termIdf = idx.idf[term];

    for (const { docIdx, tf } of postings) {
      const dl  = idx.docLengths[docIdx];
      const bm25 = termIdf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (dl / idx.avgDocLength)));
      scores.set(docIdx, (scores.get(docIdx) ?? 0) + bm25);
    }
  }

  return scores;
}

// ─── State serialisation ──────────────────────────────────────────────────────

export function getIndex(): BM25Index {
  return idx;
}

export function loadIndex(saved: BM25Index): void {
  idx = {
    invertedIndex: saved.invertedIndex ?? {},
    idf:           saved.idf           ?? {},
    docLengths:    saved.docLengths    ?? [],
    avgDocLength:  saved.avgDocLength  ?? 0,
    numDocs:       saved.numDocs       ?? 0,
  };
}

export function isReady(): boolean {
  return idx.numDocs > 0 && Object.keys(idx.invertedIndex).length > 0;
}