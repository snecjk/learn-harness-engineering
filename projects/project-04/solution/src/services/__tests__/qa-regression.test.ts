import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { PersistenceService } from '../persistence-service';
import { IndexingService } from '../indexing-service';
import { QaService } from '../qa-service';

/**
 * Regression: single-document indexing (the path taken by the UI "Index
 * Document" button) must update index-meta.json so that QaService — which
 * reads chunks via getAllChunks() — can discover the chunks. Previously the
 * single-document path wrote chunks/{id}.json but left index-meta.json stale,
 * so Q&A returned empty results (no citations, fallback answer).
 */
describe('single-document indexing feeds Q&A (regression)', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-reg-'));
  });

  it('exposes indexed chunks to getAllChunks and returns citations from ask()', async () => {
    const persistence = new PersistenceService(dataDir);
    const indexing = new IndexingService(persistence);
    const qa = new QaService(persistence, indexing);

    const docId = 'doc-1';
    persistence.writeText(
      `content/${docId}.txt`,
      'The system uses a layered architecture with clear boundaries between ' +
        'the main process, preload scripts, and the renderer. Documents are ' +
        'imported by copying the source file to the local data directory.',
    );
    persistence.writeJson('documents-meta.json', [
      { id: docId, title: 'Architecture', filename: 'arch.txt', importedAt: '', size: 100, status: 'imported' },
    ]);

    // Single-document path — what the DocumentDetail "Index Document" button calls.
    await indexing.startIndexing(docId);

    const allChunks = indexing.getAllChunks();
    expect(allChunks.length).toBeGreaterThan(0);

    const response = await qa.ask('design architecture pattern');
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.answer).not.toContain('No relevant documents');
  });

  it('exposes chunks after batch indexing too', async () => {
    const persistence = new PersistenceService(dataDir);
    const indexing = new IndexingService(persistence);
    const qa = new QaService(persistence, indexing);

    const docId = 'doc-2';
    persistence.writeText(
      `content/${docId}.txt`,
      'Indexing splits documents into chunks. Retrieval matches query keywords against indexed chunks.',
    );
    persistence.writeJson('documents-meta.json', [
      { id: docId, title: 'Indexing', filename: 'idx.txt', importedAt: '', size: 100, status: 'imported' },
    ]);

    await indexing.startIndexing(); // batch path

    expect(indexing.getAllChunks().length).toBeGreaterThan(0);
    const response = await qa.ask('retrieval search query');
    expect(response.citations.length).toBeGreaterThan(0);
  });
});
