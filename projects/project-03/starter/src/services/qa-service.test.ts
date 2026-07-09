import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceService } from './persistence-service';
import { DocumentService } from './document-service';
import { IndexingService } from './indexing-service';
import { QaService } from './qa-service';

describe('QaService grounded answers', () => {
  let dir: string;
  let persistence: PersistenceService;
  let qa: QaService;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-qa-'));
    persistence = new PersistenceService(dir);
    const docs = new DocumentService(persistence);
    const indexing = new IndexingService(persistence);
    qa = new QaService(persistence, indexing);

    // Import and index a document whose chunks will match question keywords
    const content =
      'The system uses a layered architecture with clear boundaries.\n\n' +
      'Documents are imported by copying the source file to a local directory.';
    const p = path.join(dir, 'architecture.md');
    fs.writeFileSync(p, content, 'utf-8');
    const doc = docs.importDocument(p);
    indexing.startIndexing(doc.id);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns citations pointing to indexed chunks with high confidence', async () => {
    const res = await qa.ask('what is the architecture?');

    expect(res.citations.length).toBeGreaterThan(0);
    const first = res.citations[0];
    expect(first.documentId).toBeTruthy();
    expect(first.documentTitle).toBe('architecture');
    expect(first.excerpt.length).toBeGreaterThan(0);
    expect(first.chunkIndex).toBeGreaterThanOrEqual(0);
    expect(res.confidence).toBe(0.85);
  });

  it('keeps low confidence when no chunks match the question', async () => {
    const res = await qa.ask('xyzzy nonsense');
    expect(res.citations.length).toBe(0);
    expect(res.confidence).toBe(0.3);
  });

  it('records each question in persisted history', async () => {
    await qa.ask('describe the architecture');
    const history = qa.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].response.citations.length).toBeGreaterThan(0);
  });
});
