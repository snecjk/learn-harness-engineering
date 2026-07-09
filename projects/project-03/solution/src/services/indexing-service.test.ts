import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceService } from './persistence-service';
import { DocumentService } from './document-service';
import { IndexingService } from './indexing-service';

describe('IndexingService chunking', () => {
  let dir: string;
  let persistence: PersistenceService;
  let docs: DocumentService;
  let indexing: IndexingService;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-sol-chunk-'));
    persistence = new PersistenceService(dir);
    docs = new DocumentService(persistence);
    indexing = new IndexingService(persistence, docs);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function importText(name: string, content: string): string {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content, 'utf-8');
    return docs.importDocument(p).id;
  }

  it('splits at paragraph boundaries keeping chunks near 500 chars', () => {
    // Each paragraph is ~120 chars; 5 paragraphs -> ~600 chars -> 2 chunks
    const para = 'word '.repeat(24).trim();
    const content = [para, para, para, para, para].join('\n\n');
    const id = importText('big.md', content);

    indexing.startIndexing(id);
    const chunks = indexing.getChunksForDocument(id);

    expect(chunks.length).toBe(2);
    for (const c of chunks) {
      expect(c.content.length).toBeLessThanOrEqual(500);
    }
    expect(chunks[0].index).toBe(0);
    expect(chunks[1].index).toBe(1);
    expect(chunks[0].metadata.charCount).toBe(String(chunks[0].content.length));
  });

  it('marks the document indexed and records chunk count', async () => {
    const id = importText('doc.txt', 'a single short paragraph');
    await indexing.startIndexing(id);
    const doc = docs.getDocument(id);
    expect(doc?.status).toBe('indexed');
    expect(doc?.chunks).toBe(indexing.getChunksForDocument(id).length);
  });

  it('reports indexedCount and totalChunks in app status', async () => {
    const id = importText('doc.txt', 'alpha beta gamma');
    const before = indexing.getAppStatus();
    expect(before.indexedCount).toBe(0);

    await indexing.startIndexing(id);

    const after = indexing.getAppStatus();
    expect(after.indexedCount).toBe(1);
    expect(after.totalChunks).toBeGreaterThan(0);
    expect(after.indexStatus).toBe('ready');
    expect(after.documentsLoaded).toBe(1);
  });

  it('produces one chunk for content under the size limit', () => {
    const id = importText('tiny.txt', 'just a few words');
    indexing.startIndexing(id);
    expect(indexing.getChunksForDocument(id).length).toBe(1);
  });
});
