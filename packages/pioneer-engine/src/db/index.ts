import DatabaseConstructor, { Database, Statement } from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import { KnowledgeItem, KnowledgeRow, Inquiry, DBConfig, KeyValueRow, IDB } from "./types";

const TAG = "Pioneer-DB";

const TABLES = {
    knowledge: `
        CREATE TABLE IF NOT EXISTS knowledge (
            id TEXT PRIMARY KEY,
            agentId TEXT,
            content TEXT,
            embedding BLOB,
            createdAt INTEGER,
            isMain INTEGER,
            originalId TEXT,
            chunkIndex INTEGER,
            isShared INTEGER
        )
    `,
    keyValueStore: `
        CREATE TABLE IF NOT EXISTS KeyValueStore (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `,
    history: `
        CREATE TABLE IF NOT EXISTS History (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input TEXT,
            output TEXT,
            logFilePath TEXT,
            sessionId TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
    inquiries: `
        CREATE TABLE IF NOT EXISTS Inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inquirie TEXT,
            topics TEXT,
            importance INTEGER,
            isDone INTEGER,
            isSkipped INTEGER,
            options TEXT,
            createdAt INTEGER
        )
    `,
    patchFiles: `
        CREATE TABLE IF NOT EXISTS PatchFiles (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            content TEXT,
            filePath TEXT,
            repository TEXT,
            branch TEXT,
            author TEXT,
            createdAt INTEGER,
            appliedAt INTEGER,
            status TEXT,
            metadata TEXT
        )
    `
};

const INDEXES = `
    CREATE INDEX IF NOT EXISTS "knowledge_agent_key" ON "knowledge" ("agentId");
    CREATE INDEX IF NOT EXISTS "knowledge_agent_main_key" ON "knowledge" ("agentId", "isMain");
    CREATE INDEX IF NOT EXISTS "knowledge_original_key" ON "knowledge" ("originalId");
    CREATE INDEX IF NOT EXISTS "knowledge_content_key" ON "knowledge"
        ((json_extract(content, '$.text')))
        WHERE json_extract(content, '$.text') IS NOT NULL;
    CREATE INDEX IF NOT EXISTS "knowledge_created_key" ON "knowledge" ("agentId", "createdAt");
    CREATE INDEX IF NOT EXISTS "knowledge_shared_key" ON "knowledge" ("isShared");
`;

export type DBType = DB;
export class DB implements IDB {
    private db: Database;
    public config: DBConfig;

    constructor(config: DBConfig = {}) {
        this.config = {
            dbName: config.dbName || 'pioneer',
            backupsDir: config.backupsDir || path.join(process.cwd(), 'backups')
        };

        // Ensure backups directory exists
        if (this.config.backupsDir) {
            fs.ensureDirSync(this.config.backupsDir);
        }

        const dbPath = `${this.config.dbName}.sqlite`;
        this.db = new DatabaseConstructor(dbPath);
        
        // Initialize database
        this.initializeDb();
    }

    private initializeDb(): void {
        // Enable foreign keys
        this.db.pragma('foreign_keys = ON');

        // Load SQLite vector extension
        try {
            sqliteVec.load(this.db);
            
            // Create the vector distance function if it doesn't exist
            this.db.function('vec_distance_L2', { deterministic: true, varargs: true }, (...params: unknown[]) => {
                const [vec1, vec2] = params as [Buffer | null, Buffer | null];
                if (!vec1 || !vec2) return null;
                try {
                    const a = new Float32Array(vec1.buffer, vec1.byteOffset, vec1.length / 4);
                    const b = new Float32Array(vec2.buffer, vec2.byteOffset, vec2.length / 4);
                    if (a.length !== b.length) return null;
                    
                    let sum = 0;
                    for (let i = 0; i < a.length; i++) {
                        const diff = a[i] - b[i];
                        sum += diff * diff;
                    }
                    return Math.sqrt(sum);
                } catch (error) {
                    console.error(`${TAG}:vec_distance_L2 Error:`, error);
                    return null;
                }
            });
        } catch (error) {
            console.error(`${TAG}:initializeDb Failed to load SQLite vector extension:`, error);
            throw error;
        }

        // Create tables
        this.db.transaction(() => {
            Object.values(TABLES).forEach(tableSQL => {
                this.db.exec(tableSQL);
            });
            this.db.exec(INDEXES);
        })();
    }

    public backup(): void {
        const tag = `${TAG}:backup`;
        try {
            const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
            const backupFile = path.join(this.config.backupsDir!, `${this.config.dbName}-${timestamp}.sqlite`);
            
            // Backup using better-sqlite3's backup feature
            this.db.backup(backupFile)
                .then(() => console.log(`Database backed up to: ${backupFile}`))
                .catch(error => {
                    console.error(tag, "Backup failed:", error);
                    throw error;
                });
        } catch (error) {
            console.error(tag, "Backup error:", error);
            throw error;
        }
    }

    public restore(backupPath: string): void {
        const tag = `${TAG}:restore`;
        try {
            // Close current connection
            this.db.close();

            // Copy backup file over current database
            const currentDbPath = `${this.config.dbName}.sqlite`;
            fs.copyFileSync(backupPath, currentDbPath);

            // Reinitialize database connection
            this.db = new DatabaseConstructor(currentDbPath);
            this.initializeDb();
        } catch (error) {
            console.error(tag, "Restore error:", error);
            throw error;
        }
    }

    public getValue(key: string): string | null {
        const tag = `${TAG}:getValue`;
        try {
            const stmt = this.db.prepare<{ key: string }>("SELECT value FROM KeyValueStore WHERE key = @key");
            const row = stmt.get({ key }) as KeyValueRow | undefined;
            return row?.value ?? null;
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public setValue(key: string, value: string): void {
        const tag = `${TAG}:setValue`;
        try {
            const stmt = this.db.prepare<{ key: string, value: string }>(
                "INSERT OR REPLACE INTO KeyValueStore (key, value) VALUES (@key, @value)"
            );
            stmt.run({ key, value });
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
        return this.db.transaction(fn);
    }

    public prepare(sql: string): Statement {
        return this.db.prepare(sql);
    }

    public close(): void {
        this.db.close();
    }

    public clearKnowledge(): void {
        const tag = `${TAG}:clearKnowledge`;
        try {
            this.db.prepare("DELETE FROM knowledge").run();
        } catch (error) {
            console.error(tag, "Error clearing knowledge:", error);
            throw error;
        }
    }

    // Knowledge management methods
    public async createKnowledgeChunks(chunks: any[], embResponse: any, item: any) {
        const tag = `${TAG}:createKnowledgeChunks`;
        try {
            console.log(tag, `Creating ${chunks.length} chunks`);
            if (embResponse?.data?.data?.[0]?.embedding) {
                console.log(tag, 'First embedding sample:', embResponse.data.data[0].embedding.slice(0, 5));
            }

            const insertStmt = this.db.prepare(`
                INSERT OR REPLACE INTO knowledge (
                    id, agentId, content, embedding, createdAt, isMain,
                    originalId, chunkIndex, isShared
                ) VALUES (
                    @id, @agentId, @content, @embedding, @createdAt, @isMain,
                    @originalId, @chunkIndex, @isShared
                )
            `);

            const transaction = this.db.transaction(() => {
                chunks.forEach((chunk, i) => {
                    const embedding = embResponse?.data?.data?.[i]?.embedding;
                    if (!embedding) {
                        console.warn(tag, `No embedding found for chunk ${i}`);
                        return;
                    }

                    // Ensure embedding is a Float32Array
                    const embeddingArray = Array.isArray(embedding) ? new Float32Array(embedding) : embedding;
                    const embeddingBuffer = Buffer.from(embeddingArray.buffer);

                    // Prepare content
                    let contentObj = {
                        ...item,
                        chunk: chunk,
                        chunkIndex: item.chunkIndex || i,
                        totalChunks: item.totalChunks || chunks.length
                    };
                    const contentStr = JSON.stringify(contentObj);

                    const params = {
                        id: `${item.id || 'chunk'}-${item.chunkIndex || i}`,
                        agentId: item.agentId || null,
                        content: contentStr,
                        embedding: embeddingBuffer,
                        createdAt: Date.now(),
                        isMain: item.isMain ? 1 : 0,
                        originalId: item.id || null,
                        chunkIndex: item.chunkIndex || i,
                        isShared: item.isShared ? 1 : 0,
                    };

                    try {
                        insertStmt.run(params);
                        console.log(tag, `Successfully inserted chunk ${i} of ${chunks.length}`);
                    } catch (e) {
                        console.error(tag, `Error inserting chunk ${i}:`, e);
                        throw e;
                    }
                });
            });

            transaction();
            return item.id;
        } catch (error) {
            console.error(tag, "Error creating knowledge chunks:", error);
            throw error;
        }
    }

    public async searchKnowledge(
        queryEmbedding: Float32Array,
        searchText: string,
        agentId: string,
        limit: number
    ): Promise<(KnowledgeItem & { score: number })[]> {
        const tag = `${TAG}:searchKnowledge`;
        try {
            if (!queryEmbedding || queryEmbedding.length === 0) {
                throw new Error('Invalid query embedding');
            }

            // Log the search parameters
            console.log(tag, 'Search params:', {
                embeddingLength: queryEmbedding.length,
                searchText,
                agentId,
                limit
            });

            // First, let's check if we have any knowledge entries at all
            const countCheck = this.db.prepare('SELECT COUNT(*) as count FROM knowledge').get() as { count: number };
            console.log(tag, `Total knowledge entries: ${countCheck.count}`);

            // Check embedding lengths in the database
            const embeddingCheck = this.db.prepare('SELECT length(embedding) as len FROM knowledge WHERE embedding IS NOT NULL LIMIT 1').get() as { len: number } | undefined;
            console.log(tag, `Sample embedding length in DB: ${embeddingCheck?.len}`);

            const sql = `
                WITH vector_distances AS (
                    SELECT
                        k.*,
                        vec_distance_L2(k.embedding, @queryVec) AS dist
                    FROM knowledge k
                    WHERE k.embedding IS NOT NULL
                      AND length(k.embedding) = @embeddingLength
                      AND (k.agentId = @agentId OR k.isShared = 1)
                      AND (
                          json_extract(k.content, '$.title') LIKE @searchPattern
                          OR json_extract(k.content, '$.heading') LIKE @searchPattern
                          OR json_extract(k.content, '$.context') LIKE @searchPattern
                          OR json_extract(k.content, '$.chunk') LIKE @searchPattern
                      )
                )
                SELECT * FROM vector_distances 
                WHERE dist < 3.0  -- Updated similarity threshold from 0.5 to 3.0
                ORDER BY dist ASC
                LIMIT @limit
            `;

            const searchWords = searchText.toLowerCase().split(/\s+/);
            const searchPattern = `%${searchWords.join('%')}%`;

            const rawRows = this.db.prepare(sql).all({
                queryVec: queryEmbedding ? Buffer.from(queryEmbedding.buffer) : null,
                agentId: agentId || null,
                searchPattern,
                limit,
                embeddingLength: queryEmbedding.length * 4
            });

            console.log(tag, `Found ${rawRows.length} results with similarity threshold`);
            
            const result = rawRows as KnowledgeRow[];
            const mappedResults = result.map((row) => {
                let content;
                try {
                    content = row.content ? JSON.parse(row.content) : {};
                    // Log the match context for debugging
                    console.log(tag, `Match found in document "${content.title}" with score ${row.dist}`);
                } catch (e) {
                    console.error(tag, 'Error parsing content for row:', row.id);
                    content = {};
                }
                
                return {
                    id: row.id,
                    agentId: row.agentId || undefined,
                    content,
                    embedding: row.embedding ? new Float32Array(row.embedding.buffer) : undefined,
                    createdAt: row.createdAt || undefined,
                    isMain: !!row.isMain,
                    originalId: row.originalId || undefined,
                    chunkIndex: row.chunkIndex || undefined,
                    isShared: row.isShared === 1,
                    score: row.dist !== undefined ? row.dist : 999999
                };
            });

            console.log(tag, `Processed ${mappedResults.length} results`);
            return mappedResults;
        } catch (error) {
            console.error(tag, "Search error:", error);
            throw error;
        }
    }

    public saveHistory(userInput: string, output: string, sessionId?: string): void {
        const tag = `${TAG}:saveHistory`;
        try {
            const stmt = this.db.prepare(
                "INSERT INTO History (input, output, sessionId) VALUES (?, ?, ?)"
            );
            stmt.run(userInput, output, sessionId || null);
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public saveHistoryWithLogs(
        userInput: string,
        output: string,
        logFilePath: string,
        sessionId?: string
    ): void {
        const tag = `${TAG}:saveHistoryWithLogs`;
        try {
            const stmt = this.db.prepare(
                "INSERT INTO History (input, output, logFilePath, sessionId) VALUES (?, ?, ?, ?)"
            );
            stmt.run(userInput, output, logFilePath, sessionId || null);
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public getHistory(page: number, pageSize: number): any[] {
        const tag = `${TAG}:getHistory`;
        try {
            const offset = (page - 1) * pageSize;
            const stmt = this.db.prepare(
                "SELECT * FROM History ORDER BY id DESC LIMIT ? OFFSET ?"
            );
            return stmt.all(pageSize, offset);
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public clearHistory(): void {
        const tag = `${TAG}:clearHistory`;
        try {
            this.db.prepare("DELETE FROM History").run();
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public listInquiries(done: boolean, skipped: boolean): Inquiry[] {
        const tag = `${TAG}:listInquiries`;
        try {
            const doneVal = done ? 1 : 0;
            const skippedVal = skipped ? 1 : 0;
            const rows = this.db.prepare(`
                SELECT * FROM Inquiries
                WHERE isDone = ? AND isSkipped = ?
            `).all(doneVal, skippedVal);

            return rows.map((r: any) => ({
                id: r.id,
                inquirie: r.inquirie,
                topics: r.topics ? JSON.parse(r.topics) : [],
                importance: r.importance,
                isDone: r.isDone === 1,
                isSkipped: r.isSkipped === 1,
                options: r.options ? JSON.parse(r.options) : [],
                createdAt: r.createdAt
            }));
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    public createInquiry(inquiry: Inquiry): number {
        const tag = `${TAG}:createInquiry`;
        try {
            const stmt = this.db.prepare(`
                INSERT INTO Inquiries (
                    inquirie, topics, importance, isDone, isSkipped, options, createdAt
                ) VALUES (
                    @inquirie, @topics, @importance, @isDone, @isSkipped, @options, @createdAt
                )
            `);

            const result = stmt.run({
                inquirie: inquiry.inquirie,
                topics: JSON.stringify(inquiry.topics),
                importance: inquiry.importance,
                isDone: inquiry.isDone ? 1 : 0,
                isSkipped: inquiry.isSkipped ? 1 : 0,
                options: JSON.stringify(inquiry.options),
                createdAt: inquiry.createdAt || Date.now(),
            });

            return Number(result.lastInsertRowid);
        } catch (error) {
            console.error(tag, "error:", error);
            throw error;
        }
    }

    /**
     * Save a patch file and its metadata
     * @param patchFile Object containing patch file data and metadata
     * @returns The ID of the saved patch file
     */
    public savePatchFile(patchFile: {
        id?: string,
        title: string,
        description: string,
        content: string,
        filePath?: string,
        repository?: string,
        branch?: string,
        author?: string,
        status?: string,
        metadata?: any
    }): string {
        const tag = `${TAG}:savePatchFile`;
        try {
            const id = patchFile.id || crypto.randomUUID();
            const now = Date.now();
            
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO PatchFiles (
                    id, title, description, content, filePath, repository,
                    branch, author, createdAt, status, metadata
                ) VALUES (
                    @id, @title, @description, @content, @filePath, @repository,
                    @branch, @author, @createdAt, @status, @metadata
                )
            `);
            
            stmt.run({
                id,
                title: patchFile.title,
                description: patchFile.description,
                content: patchFile.content,
                filePath: patchFile.filePath || null,
                repository: patchFile.repository || null,
                branch: patchFile.branch || null,
                author: patchFile.author || null,
                createdAt: now,
                status: patchFile.status || 'created',
                metadata: patchFile.metadata ? JSON.stringify(patchFile.metadata) : null
            });
            
            return id;
        } catch (error) {
            console.error(tag, "Error saving patch file:", error);
            throw error;
        }
    }
    
    /**
     * Update the status of a patch file
     * @param id Patch file ID
     * @param status New status
     * @param appliedAt Timestamp when patch was applied (optional)
     */
    public updatePatchFileStatus(id: string, status: string, appliedAt?: number): void {
        const tag = `${TAG}:updatePatchFileStatus`;
        try {
            let sql = 'UPDATE PatchFiles SET status = @status';
            const params: any = { id, status };
            
            if (appliedAt) {
                sql += ', appliedAt = @appliedAt';
                params.appliedAt = appliedAt;
            }
            
            sql += ' WHERE id = @id';
            
            const stmt = this.db.prepare(sql);
            stmt.run(params);
        } catch (error) {
            console.error(tag, "Error updating patch file status:", error);
            throw error;
        }
    }
    
    /**
     * Get a patch file by ID
     * @param id Patch file ID
     * @returns The patch file or null if not found
     */
    public getPatchFile(id: string): any {
        const tag = `${TAG}:getPatchFile`;
        try {
            const stmt = this.db.prepare('SELECT * FROM PatchFiles WHERE id = @id');
            const row = stmt.get({ id }) as any;
            
            if (!row) return null;
            
            // Parse metadata JSON if it exists
            if (row.metadata) {
                try {
                    row.metadata = JSON.parse(row.metadata);
                } catch (e) {
                    console.warn(`${tag} Failed to parse metadata JSON for row:`, row.id);
                }
            }
            
            return row;
        } catch (error) {
            console.error(tag, "Error getting patch file:", error);
            throw error;
        }
    }
    
    /**
     * Get all patch files with optional filters
     * @param filters Filter options
     * @returns Array of patch files
     */
    public getPatchFiles(filters: {
        status?: string,
        repository?: string,
        author?: string,
        limit?: number,
        offset?: number
    } = {}): any[] {
        const tag = `${TAG}:getPatchFiles`;
        try {
            let sql = 'SELECT * FROM PatchFiles';
            const params: any = {};
            const conditions: string[] = [];
            
            if (filters.status) {
                conditions.push('status = @status');
                params.status = filters.status;
            }
            
            if (filters.repository) {
                conditions.push('repository = @repository');
                params.repository = filters.repository;
            }
            
            if (filters.author) {
                conditions.push('author = @author');
                params.author = filters.author;
            }
            
            if (conditions.length > 0) {
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
            
            sql += ' ORDER BY createdAt DESC';
            
            if (filters.limit) {
                sql += ' LIMIT @limit';
                params.limit = filters.limit;
                
                if (filters.offset) {
                    sql += ' OFFSET @offset';
                    params.offset = filters.offset;
                }
            }
            
            const stmt = this.db.prepare(sql);
            const rows = stmt.all(params) as any[];
            
            // Parse metadata JSON for each row
            return rows.map(row => {
                if (row.metadata) {
                    try {
                        row.metadata = JSON.parse(row.metadata);
                    } catch (e) {
                        // Leave as string if parsing fails
                        console.warn(`${tag} Failed to parse metadata JSON for row:`, row.id);
                    }
                }
                return row;
            });
        } catch (error) {
            console.error(tag, "Error getting patch files:", error);
            throw error;
        }
    }
    
    /**
     * Delete a patch file
     * @param id Patch file ID
     * @returns Boolean indicating success
     */
    public deletePatchFile(id: string): boolean {
        const tag = `${TAG}:deletePatchFile`;
        try {
            const stmt = this.db.prepare('DELETE FROM PatchFiles WHERE id = @id');
            const result = stmt.run({ id });
            return result.changes > 0;
        } catch (error) {
            console.error(tag, "Error deleting patch file:", error);
            throw error;
        }
    }
}