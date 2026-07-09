import { AppStatus } from '../../shared/types';

interface Props {
  status: AppStatus;
}

const STATUS_COLORS: Record<AppStatus['indexStatus'], string> = {
  idle: '#888',
  indexing: '#f0ad4e',
  ready: '#5cb85c',
  error: '#d9534f',
};

const STATUS_LABELS: Record<AppStatus['indexStatus'], string> = {
  idle: 'Idle',
  indexing: 'Indexing...',
  ready: 'Ready',
  error: 'Error',
};

export function StatusBar({ status }: Props) {
  const statusColor = STATUS_COLORS[status.indexStatus] ?? '#888';
  const statusLabel = STATUS_LABELS[status.indexStatus] ?? status.indexStatus;

  return (
    <div style={{
      padding: '4px 20px',
      background: '#0f1729',
      borderTop: '1px solid #0f3460',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontSize: '11px',
      color: '#888',
    }}>
      <span>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColor,
          marginRight: '6px',
        }} />
        Index: {statusLabel}
      </span>
      <span>Documents: {status.documentsLoaded}</span>
      <span>Indexed: {status.indexedCount}/{status.documentsLoaded}</span>
      <span>Chunks: {status.totalChunks}</span>
      {status.lastActivity && (
        <span>Last activity: {new Date(status.lastActivity).toLocaleTimeString()}</span>
      )}
    </div>
  );
}
