import { useEffect, useState } from 'react';
import type { Chunk, Document } from '../../shared/types';

interface Props {
  document: Document;
  onDelete?: (id: string) => void;
  onIndex?: (documentId?: string) => void;
}

export function DocumentDetail({ document, onDelete, onIndex }: Props) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    setChunks([]);
    setShowChunks(false);
    window.knowledgeBase.indexing.chunks(document.id).then(setChunks);
  }, [document.id]);

  // Load document content when requested
  const loadContent = async () => {
    if (content) {
      setShowContent(!showContent);
      return;
    }
    setLoadingContent(true);
    try {
      const text = await window.knowledgeBase.documents.getContent(document.id);
      setContent(text);
      setShowContent(true);
    } catch (err) {
      console.error('Failed to load document content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleIndex = async () => {
    if (!onIndex) return;
    await onIndex(document.id);
    const refreshed = await window.knowledgeBase.indexing.chunks(document.id);
    setChunks(refreshed);
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
        {document.title}
      </h2>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
        <div>Filename: {document.filename}</div>
        <div>Imported: {new Date(document.importedAt).toLocaleString()}</div>
        <div>Size: {(document.size / 1024).toFixed(1)} KB</div>
        <div>Status: {document.status}</div>
        {document.chunks !== undefined && <div>Chunks: {document.chunks}</div>}
        {document.metadata && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #1a1a4e' }}>
            <div>File type: {document.metadata.fileType}</div>
            <div>Words: {document.metadata.wordCount}</div>
            <div>Lines: {document.metadata.lineCount}</div>
            <div>Paragraphs: {document.metadata.paragraphCount}</div>
            <div>Characters: {document.metadata.charCount}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={loadContent}
          disabled={loadingContent}
          style={{
            padding: '6px 12px',
            background: '#0f3460',
            color: '#e0e0e0',
            border: '1px solid #1a1a4e',
            borderRadius: '4px',
            cursor: loadingContent ? 'wait' : 'pointer',
            fontSize: '12px',
          }}
        >
          {loadingContent ? 'Loading...' : showContent ? 'Hide Content' : 'View Content'}
        </button>
        <button
          onClick={() => setShowChunks(!showChunks)}
          style={{
            padding: '6px 12px',
            background: '#0f3460',
            color: '#e0e0e0',
            border: '1px solid #1a1a4e',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {showChunks ? 'Hide' : 'Show'} Chunks ({chunks.length})
        </button>
        {document.status !== 'indexed' && onIndex && (
          <button
            onClick={handleIndex}
            style={{
              padding: '6px 12px',
              background: '#533483',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Index Document
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(document.id)}
            style={{
              padding: '6px 12px',
              background: '#8b2252',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Document content viewer */}
      {showContent && content && (
        <div style={{
          padding: '16px',
          background: '#1a1a3e',
          borderRadius: '6px',
          border: '1px solid #0f3460',
          fontSize: '13px',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflow: 'auto',
          marginBottom: '16px',
        }}>
          {content}
        </div>
      )}

      {showChunks && (
        <div>
          {chunks.map(chunk => (
            <div
              key={chunk.id}
              style={{
                padding: '10px',
                marginBottom: '8px',
                background: '#1a1a3e',
                borderRadius: '4px',
                borderLeft: '3px solid #533483',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                Chunk {chunk.index} ({chunk.metadata.charCount} chars, {chunk.metadata.wordCount} words)
              </div>
              {chunk.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
