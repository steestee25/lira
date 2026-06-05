const STOP_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le',
  'un', 'uno', 'una', 'un\'',
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'del', 'dello', 'della', 'dei', 'degli', 'delle',
  'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'col', 'coi', 'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
  'mi', 'ti', 'si', 'ci', 'vi', 'gli', 'le', 'ne',
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
  'qualcosa', 'qualcuno', 'niente', 'nulla', 'tutto',
  'e', 'o', 'ma', 'per\u00f2', 'anche', 'pure', 'oppure',
  'se', 'perch\u00e9', 'poich\u00e9', 'mentre', 'quando',
  'qui', 'qua', 'l\u00ec', 'l\u00e0', 'gi\u00e0', 'ancora',
  'sempre', 'mai', 'spesso', 'solo', 'invece',
  'essere', 'sono', 'sei', '\u00e8', 'siamo', 'siete', 'era', 'erano',
  'avere', 'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'c\'\u00e8', 'ci', 'vi', 'ne', 'non',
]);

type EmbeddingState = {
  vocab: string[];
  vocabIndex: Record<string, number>;
  idf: number[];
  docVectors: number[][];
  docLengths: number[];
  avgDocLength: number;
};

let state: EmbeddingState = {
  vocab: [],
  vocabIndex: {},
  idf: [],
  docVectors: [],
  docLengths: [],
  avgDocLength: 0,
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\W_]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

export function buildIndex(docs: string[]) {
  const df: Record<string, number> = {};
  const termFreqs = docs.map(d => tokenize(d));

  state.docLengths = termFreqs.map(tf => tf.length);
  state.avgDocLength = state.docLengths.reduce((sum, length) => sum + length, 0) / (state.docLengths.length || 1);

  for (const terms of termFreqs) {
    const seen: Record<string, boolean> = {};
    for (const t of terms) {
      if (!seen[t]) {
        df[t] = (df[t] || 0) + 1;
        seen[t] = true;
      }
    }
  }

  state.vocab = Object.keys(df).sort();
  state.vocabIndex = state.vocab.reduce<Record<string, number>>((acc, token, idx) => {
    acc[token] = idx;
    return acc;
  }, {});

  const N = docs.length;
  state.idf = state.vocab.map(token => {
    const dfValue = df[token] || 1;
    return Math.log((N - dfValue + 0.5) / (dfValue + 0.5) + 1);
  });

  const BM25_K1 = 1.5;
  const BM25_B = 0.75;

  state.docVectors = termFreqs.map((terms, docIdx) => {
    const vec = new Array(state.vocab.length).fill(0);
    const tf: Record<number, number> = {};

    for (const t of terms) {
      const index = state.vocabIndex[t];
      if (index !== undefined) {
        tf[index] = (tf[index] || 0) + 1;
      }
    }

    for (const indexString in tf) {
      const index = Number(indexString);
      const rawTf = tf[index];
      const docLen = state.docLengths[docIdx];
      const bm25Score = state.idf[index] * ((rawTf * (BM25_K1 + 1)) / (rawTf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / state.avgDocLength))));
      vec[index] = bm25Score;
    }

    const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vec.map(value => value / norm);
  });

  return { vocab: state.vocab, idf: state.idf, docVectors: state.docVectors };
}

export function embed(text: string): number[] {
  const terms = tokenize(text);
  if (state.vocab.length === 0) {
    const counts: Record<number, number> = {};
    for (const t of terms) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) {
        hash = ((hash << 5) - hash) + t.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % 1000;
      counts[idx] = (counts[idx] || 0) + 1;
    }

    const vec = new Array(1000).fill(0);
    Object.entries(counts).forEach(([key, value]) => {
      vec[Number(key)] = value;
    });

    const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vec.map(value => value / norm);
  }

  const vec = new Array(state.vocab.length).fill(0);
  const tf: Record<number, number> = {};

  for (const t of terms) {
    const index = state.vocabIndex[t];
    if (index !== undefined) {
      tf[index] = (tf[index] || 0) + 1;
    }
  }

  const BM25_K1 = 1.5;
  const BM25_B = 0.75;
  const queryLen = terms.length || 1;

  for (const indexString in tf) {
    const index = Number(indexString);
    const rawTf = tf[index];
    const idfValue = state.idf[index] ?? Math.log((state.docVectors.length + 0.5) / 0.5 + 1);
    const bm25Score = idfValue * ((rawTf * (BM25_K1 + 1)) / (rawTf + BM25_K1 * (1 - BM25_B + BM25_B * (queryLen / state.avgDocLength))));
    vec[index] = bm25Score;
  }

  const norm = Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vec.map(value => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (na === 0 || nb === 0) return 0;
  return Math.max(-1, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb))));
}

export function getIndexState() {
  return { ...state };
}

export function loadIndexState(newState: EmbeddingState) {
  state = {
    vocab: Array.isArray(newState.vocab) ? newState.vocab : [],
    vocabIndex: newState.vocabIndex ? { ...newState.vocabIndex } : {},
    idf: Array.isArray(newState.idf) ? newState.idf : [],
    docVectors: Array.isArray(newState.docVectors) ? newState.docVectors.map(vec => Array.isArray(vec) ? [...vec] : []) : [],
    docLengths: Array.isArray(newState.docLengths) ? [...newState.docLengths] : [],
    avgDocLength: typeof newState.avgDocLength === 'number' ? newState.avgDocLength : 0,
  };
}