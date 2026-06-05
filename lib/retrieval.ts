import { Platform } from 'react-native';
import * as embeddings from './docStore';
import { KNOWLEDGE_BASE } from './knowledgeBase_qa';

let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
} catch (e) {
  // RNFS not available on web
}

export type Doc = {
  id: string;
  text: string;
  embedding?: number[];
  score?: number;
  keywordMatches?: number;
  metadata?: {
    source_title?: string;
    source_url?: string;
    answer?: string;
  };
};

const CACHE_FILE = RNFS ? `${RNFS.DocumentDirectoryPath}/ft_embeddings_cache.json` : null;
const CACHE_VERSION = 4;
const MAX_SAFE_READ_BYTES = 2 * 1024 * 1024; // 2 MB

function computeDocsFingerprint(docs: Doc[]): string {
  let hash = 0;
  for (const doc of docs) {
    const str = `${doc.id}:${doc.text}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
  }
  return hash.toString(36);
}

async function canReadFileSafely(filePath: string, limitBytes: number): Promise<boolean> {
  try {
    const stats = await RNFS.stat(filePath);
    const size = Number((stats as any).size || 0);
    if (size > limitBytes) {
      if (Platform.OS === 'web') {
        console.warn(`Skipping read of ${filePath}: file is too large (${size} bytes)`);
      }
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

async function docsFromFtJson(): Promise<Doc[] | null> {
  if (!RNFS) return null;
  
  const ftPath = `${RNFS.DocumentDirectoryPath}/ft.jsonl`;
  try {
    const exists = await RNFS.exists(ftPath);
    if (!exists) return null;

    if (!(await canReadFileSafely(ftPath, MAX_SAFE_READ_BYTES))) {
      if (Platform.OS === 'web') {
        console.warn('ft.jsonl is too large to read safely on this device, using embedded knowledge base only.');
      }
      return null;
    }

    const content = await RNFS.readFile(ftPath, 'utf8');
    const lines: string[] = content.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
    const docs: Doc[] = lines.map((line: string, idx: number) => {
      try {
        const parsed = JSON.parse(line) as any;
        const id = parsed.id || parsed.chunk_id || parsed.chunkId || `ft_${idx}`;
        const question = parsed.question || parsed.prompt || parsed.domanda || '';
        const answer = parsed.answer || parsed.risposta || parsed.testo || '';
        const sourceTitle = parsed.source_title || parsed.metadata?.source_title || parsed.meta?.source_title || parsed.source || parsed.sorgente;
        const sourceUrl = parsed.source_url || parsed.metadata?.source_url || parsed.meta?.source_url || parsed.url || parsed.link;

        let text = '';
        if (question && answer) {
          text = `${question}\n\n${answer}`;
        } else if (parsed.testo) {
          text = parsed.testo;
        } else if (parsed.text) {
          text = parsed.text;
        } else if (question) {
          text = question;
        } else if (answer) {
          text = answer;
        }

        const metadata: Doc['metadata'] = {};
        if (answer && question) {
          metadata.answer = answer;
        }
        if (sourceTitle) {
          metadata.source_title = sourceTitle;
        }
        if (sourceUrl) {
          metadata.source_url = sourceUrl;
        }

        return {
          id,
          text,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        };
      } catch (error) {
        console.warn('Skipping invalid ft.jsonl line', idx, error);
        return { id: `ft_invalid_${idx}`, text: '' };
      }
    }).filter((doc: Doc) => doc.text && doc.text.length > 0);

    if (docs.length === 0) return null;
    console.log('Loaded', docs.length, 'documents from ft.jsonl');
    return docs;
  } catch (error) {
    console.warn('Failed to read ft.jsonl from document directory', error);
    return null;
  }
}

async function docsFromKnowledge(): Promise<Doc[]> {
  return KNOWLEDGE_BASE.map(entry => ({
    id: entry.id,
    text: `${entry.question}\n\n${entry.answer}`,
    metadata: {
      source_title: entry.metadata?.source_title,
      source_url: entry.metadata?.source_url,
      answer: entry.answer,
    },
  }));
}

function mergeDocuments(primary: Doc[], fallback: Doc[]): Doc[] {
  const seen = new Set<string>(primary.map(doc => doc.id));
  const merged = [...primary];
  for (const doc of fallback) {
    if (!seen.has(doc.id)) {
      merged.push(doc);
      seen.add(doc.id);
    }
  }
  return merged;
}

let cachedIndexedDocs: Doc[] | null = null;

export async function ensureIndexed(): Promise<Doc[]> {
  if (cachedIndexedDocs) {
    return cachedIndexedDocs;
  }
  try {
    if (RNFS && CACHE_FILE) {
      const cachedExists = await RNFS.exists(CACHE_FILE);
      if (cachedExists) {
        console.log('Loading embeddings from cache');
        if (!(await canReadFileSafely(CACHE_FILE, MAX_SAFE_READ_BYTES))) {
          if (Platform.OS === 'web') {
            console.warn('Cache file is too large to read safely. Rebuilding index without cache.');
          }
        } else {
          const raw = await RNFS.readFile(CACHE_FILE, 'utf8');
          const parsed = JSON.parse(raw) as any;

          if (parsed.version !== CACHE_VERSION) {
            console.log('Cache version mismatch, rebuilding');
            await RNFS.unlink(CACHE_FILE).catch(() => {});
          } else {
            const docs = parsed.docs as Doc[];
            const cachedFingerprint = parsed.fingerprint as string | undefined;
            const currentDocs = await (async () => {
              const ftDocs = await docsFromFtJson();
              const kbDocs = await docsFromKnowledge();
              return ftDocs ? mergeDocuments(ftDocs, kbDocs) : kbDocs;
            })();
            const currentFingerprint = computeDocsFingerprint(currentDocs);

            if (!cachedFingerprint || cachedFingerprint !== currentFingerprint) {
              console.log('Cache fingerprint mismatch, rebuilding');
              await RNFS.unlink(CACHE_FILE).catch(() => {});
            } else {
              const texts = docs.map(doc => doc.text);
              const { docVectors } = embeddings.buildIndex(texts);
              for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                if (doc && (!doc.embedding || doc.embedding.length === 0)) {
                  doc.embedding = docVectors[i];
                }
              }
              console.log('Rebuilt index from cache');
              cachedIndexedDocs = docs;
              return docs;
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Cache miss or read failed, rebuilding index', error);
  }

  try {
    console.log('Looking for ft.jsonl in document directory...');
    const ftDocs = await docsFromFtJson();
    const kbDocs = await docsFromKnowledge();
    let docs = ftDocs ? mergeDocuments(ftDocs, kbDocs) : kbDocs;

    if (!docs || docs.length === 0) {
      console.warn('No documents available for retrieval');
      return [];
    }
    if (ftDocs) {
      console.log(`Merged ${kbDocs.length} embedded KB docs with ${ftDocs.length} ft.jsonl docs => ${docs.length} total`);
    }

    const texts = docs.map(doc => doc.text);
    try {
      const { docVectors } = embeddings.buildIndex(texts);
      for (let i = 0; i < docs.length; i++) {
        docs[i].embedding = docVectors[i];
      }
      console.log('Built index for', docs.length, 'documents');
    } catch (error) {
      console.warn('Local embedding build failed, falling back to simple embeddings', error);
      for (let i = 0; i < docs.length; i++) {
        docs[i].embedding = embeddings.embed(docs[i].text);
      }
    }

    try {
      if (RNFS && CACHE_FILE) {
        const cacheData = {
          version: CACHE_VERSION,
          fingerprint: computeDocsFingerprint(docs),
          docs,
          timestamp: new Date().toISOString(),
        };
        await RNFS.writeFile(CACHE_FILE, JSON.stringify(cacheData), 'utf8');
        console.log('Wrote embeddings cache (v' + CACHE_VERSION + ')');
      }
    } catch (error) {
      console.warn('Failed to write embeddings cache', error);
    }

    cachedIndexedDocs = docs;
    return docs;
  } catch (error) {
    console.error('ensureIndexed failed completely:', error);
    return [];
  }
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u017F]+/gi, ' ')
    .trim();
}

export async function retrieveRelevant(
  query: string,
  options: { k?: number; minScore?: number } = {}
): Promise<Doc[]> {
  const { k = 6, minScore = 0.0 } = options;

  try {
    const docs = await ensureIndexed();
    if (!docs || docs.length === 0) {
      console.warn('No documents indexed');
      return [];
    }

    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      console.log('retrieveRelevant got empty query, returning no documents');
      return [];
    }
    const queryTerms = normalizedQuery
      .split(/\s+/)
      .filter(term => term.length > 2 && !['quando','possiamo','dire','che','per','con','di','e','o','ma','non','se'].includes(term));
    const queryPhrase = queryTerms.join(' ');
    const qEmb = embeddings.embed(normalizedQuery);

    const scored = docs.map(doc => {
      const docText = normalizeSearchText(doc.text);
      const docTokens = docText.split(/\s+/).filter(token => token.length > 0);
      let keywordMatches = 0;

      for (const term of queryTerms) {
        if (docText.includes(term)) {
          keywordMatches += 1;
          const regex = new RegExp(`\\b${term}\\b`, 'u');
          if (regex.test(docText)) {
            keywordMatches += 0.5;
          }
        }
      }

      if (queryPhrase && docText.includes(queryPhrase)) {
        keywordMatches += 2;
      }

      let semanticScore = 0;
      if (doc.embedding && doc.embedding.length > 0) {
        semanticScore = embeddings.cosineSimilarity(qEmb, doc.embedding) || 0;
      }

      const avgLength = 15;
      const lengthFactor = Math.min(1, docTokens.length / (avgLength * 2));
      const score = semanticScore * 0.65 + keywordMatches * 0.25 + lengthFactor * 0.1;

      return {
        ...doc,
        score,
        keywordMatches,
      };
    });

    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    let result = scored.slice(0, k);

    if ((scored[0]?.score ?? 0) < 0.1) {
      result = scored.slice(0, Math.min(k, docs.length));
    } else {
      result = result.filter(item => (item.score ?? 0) > minScore || (item.keywordMatches ?? 0) > 0);
      if (result.length === 0) {
        result = scored.slice(0, Math.min(3, k));
      }
    }

    const finalDocs = result.map(d => ({
      id: d.id,
      text: d.text,
      metadata: d.metadata,
    }));

    console.log('=== RAG RETRIEVAL ===');
    console.log(`Query: "${query}"`);
    console.log(`Query terms: [${queryTerms.join(', ')}]`);
    console.log(`Retrieved ${finalDocs.length} documents`);
    result.forEach((doc, idx) => {
      console.log(`\n[Doc ${idx + 1}] ID: ${doc.id} | Score: ${(doc.score ?? 0).toFixed(4)} | Keywords: ${doc.keywordMatches ?? 0}`);
      console.log(`Text: ${doc.text.substring(0, 80)}...`);
    });
    console.log('=== END RETRIEVAL ===');

    return finalDocs;
  } catch (error) {
    console.error('retrieveRelevant failed:', error);
    return [];
  }
}

export default { ensureIndexed, retrieveRelevant };