import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersistenceService } from './persistence-service';
import { DocumentService } from './document-service';

describe('DocumentService metadata extraction', () => {
  let dir: string;
  let svc: DocumentService;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-sol-meta-'));
    svc = new DocumentService(new PersistenceService(dir));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function writeSample(name: string, content: string): string {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content, 'utf-8');
    return p;
  }

  it('extracts word/line/paragraph counts and file type on import', () => {
    const content = 'First paragraph here.\n\nSecond one has more words.\n\nThird paragraph.';
    const doc = svc.importDocument(writeSample('notes.md', content));

    expect(doc.metadata).toBeDefined();
    expect(doc.metadata!.fileType).toBe('markdown');
    expect(doc.metadata!.paragraphCount).toBe(3);
    expect(doc.metadata!.charCount).toBe(content.length);
    // split('\n') yields 5 lines
    expect(doc.metadata!.lineCount).toBe(5);
  });

  it('classifies .txt as plaintext', () => {
    const doc = svc.importDocument(writeSample('readme.txt', 'hello world'));
    expect(doc.metadata!.fileType).toBe('plaintext');
  });

  it('persists metadata so it survives a reload', () => {
    svc.importDocument(writeSample('a.txt', 'one two three'));
    const reloaded = new DocumentService(new PersistenceService(dir));
    const docs = reloaded.listDocuments();
    expect(docs[0].metadata?.wordCount).toBe(3);
  });

  it('exposes extractMetadata as a public method', () => {
    const m = svc.extractMetadata('a b c\n\nd e', 'doc.md');
    expect(m.wordCount).toBe(5);
    expect(m.fileType).toBe('markdown');
  });
});
