/// <reference types="react" />
/// <reference types="react-dom" />

import type {
  AppStatus,
  Chunk,
  Document,
  QAHistory,
  QAResponse,
} from '../shared/types';

declare global {
  interface Window {
    knowledgeBase: {
      documents: {
        list: () => Promise<Document[]>;
        import: (filePath: string) => Promise<Document>;
        get: (id: string) => Promise<Document | null>;
        getContent: (id: string) => Promise<string | null>;
        delete: (id: string) => Promise<boolean>;
      };
      indexing: {
        start: (documentId?: string) => Promise<AppStatus>;
        status: () => Promise<AppStatus>;
        chunks: (documentId: string) => Promise<Chunk[]>;
      };
      qa: {
        ask: (question: string) => Promise<QAResponse>;
        history: () => Promise<QAHistory[]>;
      };
      app: {
        status: () => Promise<AppStatus>;
      };
    };
  }
}

export {};
