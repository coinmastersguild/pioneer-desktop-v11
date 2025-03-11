import { Database, Statement } from "better-sqlite3";

export interface DBConfig {
    dbName?: string;
    backupsDir?: string;
}

export interface KnowledgeItem {
    id: string;
    agentId?: string;
    content: any;  // store as JSON
    embedding?: Float32Array;
    createdAt?: number;
    isMain?: boolean;
    originalId?: string;
    chunkIndex?: number;
    isShared?: boolean;
}

export interface KnowledgeRow {
    id: string;
    agentId: string | null;
    content: string | null;
    embedding: Uint8Array | null;
    createdAt: number | null;
    isMain: number | null;
    originalId: string | null;
    chunkIndex: number | null;
    isShared: number | null;
    dist?: number;
}

export interface Inquiry {
    id?: number;
    inquirie: string;
    topics: string[];    // store as JSON in DB
    importance: number;  // 1 - 10
    isDone: boolean;
    isSkipped: boolean;
    options?: string[];
    createdAt?: number;
}

export interface KeyValueRow {
    key: string;
    value: string;
}

export interface IDB {
    config: DBConfig;
    getValue(key: string): string | null;
    setValue(key: string, value: string): void;
    transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T;
    prepare(sql: string): Statement;
    close(): void;
    clearKnowledge(): void;
    createKnowledgeChunks(chunks: any[], embResponse: any, item: any): Promise<any>;
    searchKnowledge(queryEmbedding: Float32Array, searchText: string, agentId: string, limit: number): Promise<(KnowledgeItem & { score: number })[]>;
    saveHistory(userInput: string, output: string, sessionId?: string): void;
    saveHistoryWithLogs(userInput: string, output: string, logFilePath: string, sessionId?: string): void;
    getHistory(page: number, pageSize: number): any[];
    clearHistory(): void;
    listInquiries(done: boolean, skipped: boolean): Inquiry[];
    createInquiry(inquiry: Inquiry): number;
} 