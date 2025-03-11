import os from 'os';
import path from 'path';
import fs from 'fs';
import { TextDecoder } from 'util';
import { inference, chunkTextByTokens, createEmbedding } from '../inference';
import { PROMPTS_ENGINE } from '../prompts';
import { perform_skill, create_skill } from '../skills';
import { z } from 'zod';

// Configure logging
process.env.DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';

const log = require('@pioneer-platform/loggerdog')();

const TAG = " | Engine | ";

interface ProcessingConfig {
    chunkSize: number;
    avgProcessingTimePerChunk: number;
    lastProcessedFile: string;
    lastProcessedChunk: number;
}

interface FileMetadata {
    originalPath: string;
    size: number;
    estimatedChunks: number;
    estimatedProcessingTime: number;
    status: 'pending' | 'processing' | 'completed';
    currentChunk: number;
    totalChunks: number;
}

// Define Zod schemas for our types
const KnowledgeSchema = z.object({
    content: z.string(),
    topics: z.array(z.string()),
    importance: z.number(),
    context: z.string(),
    referenceFile: z.string()
});

const ActionResponseSchema = z.object({
    option: z.number().default(1),
    scriptName: z.string().optional(),
    performParams: z.any().optional(),
    createParams: z.object({
        Objective: z.string()
    }).optional()
}).transform(data => {
    // Ensure we have a valid option
    if (data.option < 1 || data.option > 3) {
        data.option = 1;
    }
    return data;
});

interface Knowledge {
    content: string;
    topics: string[];
    importance: number;
    context: string;
    referenceFile: string;
}

interface ActionResponse {
    option: number;
    scriptName?: string;
    performParams?: any;
    createParams?: {
        Objective: string;
    };
}

class Engine {
    private pioneer: any;
    private db: any;
    private tokenBucket: number = 2;

    constructor(pioneer: any, db: any) {
        this.pioneer = pioneer;
        this.db = db;
    }

    private async analyzeContent(content: string): Promise<Knowledge> {
        try {
            const messages = [
                PROMPTS_ENGINE.ANALYZE_KNOWLEDGE,
                {
                    role: 'user',
                    content: `Analyze this content and extract key knowledge: ${content}`
                }
            ];

            const result = await inference(this.pioneer, messages, [], KnowledgeSchema);
            return JSON.parse(result.data.choices[0].message.content);
        } catch(err) {
            log.error(TAG, "Failed to analyze content:", err);
            throw err;
        }
    }

    private async determineNextActions(knowledge: Knowledge): Promise<ActionResponse> {
        try {
            const messages = [
                PROMPTS_ENGINE.DETERMINE_ACTIONS,
                {
                    role: 'user',
                    content: `Given this knowledge: ${JSON.stringify(knowledge)}, determine the next actions to take.`
                }
            ];

            const result = await inference(this.pioneer, messages, [], ActionResponseSchema);
            return JSON.parse(result.data.choices[0].message.content);
        } catch(err) {
            log.error(TAG, "Failed to determine actions:", err);
            throw err;
        }
    }

    async cycle() {
        const tag = TAG + " | cycle | ";
        try {
            log.info(tag, "Starting knowledge processing cycle");

            // Read from folio (source of truth)
            const folioDir = path.join(os.homedir(), '.pioneer', 'folio');
            const codexDir = path.join(os.homedir(), '.pioneer', 'codex');
            const files = await fs.promises.readdir(folioDir);

            for (const file of files) {
                const filePath = path.join(folioDir, file);
                const content = await fs.promises.readFile(filePath, 'utf8');
                
                // Create a sanitized base name for the source directory
                const baseName = path.parse(file).name.replace(/[^a-zA-Z0-9-]/g, '_');
                const sourceDir = path.join(codexDir, baseName);
                await fs.promises.mkdir(sourceDir, { recursive: true });

                // 1. Chunk the content first
                const chunks = await chunkTextByTokens(content, 500);
                log.info(tag, `Processing ${file}: ${chunks.length} chunks`);
                
                // 2. Add index/metadata to each chunk
                const indexedChunks = chunks.map((chunk, i) => {
                    const paddedIndex = String(i + 1).padStart(3, '0');
                    // Ensure we have proper text data
                    const textContent = typeof chunk === 'string' 
                        ? chunk 
                        : Buffer.from(chunk).toString('utf8');
                    return {
                        id: `${baseName}-${paddedIndex}`,
                        content: textContent.trim(), // Trim whitespace
                        index: i,
                        totalChunks: chunks.length
                    };
                });

                // 3. Process each chunk individually
                for (const chunk of indexedChunks) {
                    try {
                        // Ensure chunk content is valid text and not too long
                        if (!chunk.content || chunk.content.length === 0) {
                            log.warn(tag, `Skipping empty chunk ${chunk.index + 1}/${chunk.totalChunks}`);
                            continue;
                        }

                        // Truncate content if it's too long
                        const maxContentLength = 2000;
                        const truncatedContent = chunk.content.length > maxContentLength 
                            ? chunk.content.substring(0, maxContentLength) + "..."
                            : chunk.content;

                        // Get vector for single chunk
                        const embedding = await createEmbedding(this.pioneer, {
                            model: 'deepseek-r1:32b',
                            input: [truncatedContent]
                        });
                        
                        // Extract knowledge using LLM
                        const knowledge = await this.analyzeContent(truncatedContent);
                        
                        // Save the digest with metadata
                        const digest = {
                            id: chunk.id,
                            source: file,
                            chunkIndex: chunk.index + 1,
                            totalChunks: chunk.totalChunks,
                            subject: 'digest-raw pioneer-core',
                            content: truncatedContent,
                            knowledge: {
                                topics: knowledge.topics,
                                importance: knowledge.importance,
                                context: knowledge.context
                            },
                            timestamp: new Date().toISOString()
                        };

                        // Save digest to codex file
                        const digestFileName = `file-${chunk.id}.json`;
                        const digestPath = path.join(sourceDir, digestFileName);
                        await fs.promises.writeFile(digestPath, JSON.stringify(digest, null, 2), 'utf8');

                        // Save to knowledge DB with embeddings
                        await this.db.createKnowledgeChunks([truncatedContent], embedding.data.data[0], {
                            topics: knowledge.topics,
                            importance: knowledge.importance,
                            context: knowledge.context,
                            referenceFile: digestPath,
                            chunkIndex: chunk.index,
                            totalChunks: chunk.totalChunks,
                            id: chunk.id
                        });

                        // Log progress
                        if (chunk.index % 10 === 0 || chunk.index === indexedChunks.length - 1) {
                            const progress = Math.round((chunk.index + 1) / indexedChunks.length * 100);
                            log.info(tag, `Progress: ${progress}% (${chunk.index + 1}/${indexedChunks.length} chunks)`);
                            log.info(tag, `Chunk preview: "${truncatedContent.substring(0, 200)}..."`);
                        }

                        // Determine what actions to take based on this knowledge
                        const actions = await this.determineNextActions(knowledge);

                        // Execute determined actions
                        if (actions.option === 2 && actions.scriptName) {
                            try {
                                await perform_skill(this.pioneer, actions.scriptName, actions.performParams);
                            } catch (err: any) {
                                if (err.code === 'ENOENT') {
                                    log.info(tag, `Skill ${actions.scriptName} not found, creating it...`);
                                    await create_skill(this.pioneer, `Create a skill to ${actions.scriptName}`);
                                    await perform_skill(this.pioneer, actions.scriptName, actions.performParams);
                                } else {
                                    throw err;
                                }
                            }
                        } else if (actions.option === 3 && actions.createParams) {
                            await create_skill(this.pioneer, actions.createParams.Objective);
                        }
                    } catch (err) {
                        log.error(tag, `Error processing chunk ${chunk.index + 1}/${chunk.totalChunks}:`, err);
                        // Continue with next chunk instead of failing the entire process
                        continue;
                    }
                }

                // After successfully processing all chunks, remove the original file
                await fs.promises.unlink(filePath);
                log.info(tag, `Completed processing ${file}`);
            }

        } catch(err) {
            log.error(tag, err);
            throw err;
        }
    }

    async run() {
        const tag = TAG + " | run | ";
        try {
            let noTokensTime = 0;
            while(true) {
                if(this.tokenBucket > 0) {
                    noTokensTime = 0; // Reset counter when we have tokens
                    this.tokenBucket--;
                    log.info(tag, `Tokens: ${this.tokenBucket}`);
                    await this.cycle();
                } else {
                    noTokensTime++;
                    if (noTokensTime % 5 === 0) { // Only log every 5 seconds
                        log.info(tag, `Waiting for tokens (${noTokensTime}s)`);
                    }
                    if (noTokensTime >= 10) {
                        log.info(tag, "No tokens for 10s, shutting down.");
                        break;
                    }
                }
                await sleep(1000);
            }
        } catch(err) {
            log.error(tag, err);
        }
    }

    async getNextDigestId(): Promise<number> {
        const codexDir = path.join(os.homedir(), '.pioneer', 'codex');
        let files = await fs.promises.readdir(codexDir);
        let maxId = 0;
        for (const file of files) {
            const match = file.match(/^digest-raw-(\d+)\.json$/);
            if (match && match[1]) {
                const id = parseInt(match[1], 10);
                if (id > maxId) maxId = id;
            }
        }
        return maxId + 1;
    }

    async digestFolio(): Promise<void> {
        const folioDir = path.join(os.homedir(), '.pioneer', 'folio');
        const codexDir = path.join(os.homedir(), '.pioneer', 'codex');
        let files = await fs.promises.readdir(folioDir);
        // Import chunkTextByTokens from inference
        const { chunkTextByTokens } = require('../inference');

        for (const file of files) {
            const filePath = path.join(folioDir, file);
            const content = await fs.promises.readFile(filePath, 'utf8');
            const chunks: string[] = await chunkTextByTokens(content);
            for (const chunk of chunks) {
                let nextId = await this.getNextDigestId();
                const digest = {
                    id: nextId,
                    subject: 'digest-raw pioneer-core',
                    content: chunk,
                    timestamp: new Date().toISOString()
                };
                const codexFileName = `digest-raw-${nextId}.json`;
                const codexFilePath = path.join(codexDir, codexFileName);
                await fs.promises.writeFile(codexFilePath, JSON.stringify(digest, null, 2), 'utf8');
            }
            // After processing the file, remove it from folio
            await fs.promises.unlink(filePath);
        }
    }

    async verifyCodex(): Promise<void> {
        const codexDir = path.join(os.homedir(), '.pioneer', 'codex');
        let files = await fs.promises.readdir(codexDir);
        let digestEntries = [];
        for (const file of files) {
            const filePath = path.join(codexDir, file);
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const digest = JSON.parse(content);
                digestEntries.push(digest);
            } catch (e) {
                log.error(TAG, `Failed to load codex file ${file}:`, e);
            }
        }
        // If the db supports loading codex, call it
        if (this.db && typeof this.db.loadCodex === 'function') {
            await this.db.loadCodex(digestEntries);
        }
        // Verify loaded codex by checking the database count if available
        if (this.db && typeof this.db.countCodex === 'function') {
            const count = await this.db.countCodex();
            if (count === digestEntries.length) {
                log.info(TAG, 'Codex successfully verified.');
            } else {
                log.error(TAG, 'Codex verification failed: expected', digestEntries.length, 'but got', count);
            }
        } else {
            log.info(TAG, 'Database verification methods not found. Skipping DB verification.');
        }
    }

    addTokens(n: number) {
        this.tokenBucket += n;
        log.info(TAG, `Added ${n} tokens. Total tokens: ${this.tokenBucket}`);
    }

    private async loadOrCreateConfig(): Promise<ProcessingConfig> {
        const configPath = path.join(os.homedir(), '.pioneer', 'config', 'processing.json');
        try {
            const configData = await fs.promises.readFile(configPath, 'utf8');
            return JSON.parse(configData);
        } catch {
            const defaultConfig: ProcessingConfig = {
                chunkSize: 3000,
                avgProcessingTimePerChunk: 2, // default 2 seconds per chunk
                lastProcessedFile: '',
                lastProcessedChunk: 0
            };
            await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
            await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
    }

    private async saveConfig(config: ProcessingConfig): Promise<void> {
        const configPath = path.join(os.homedir(), '.pioneer', 'config', 'processing.json');
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    }

    private async updateProcessingTime(startTime: number, chunks: number): Promise<void> {
        const config = await this.loadOrCreateConfig();
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000; // convert to seconds
        const avgTime = totalTime / chunks;
        config.avgProcessingTimePerChunk = (config.avgProcessingTimePerChunk + avgTime) / 2; // rolling average
        await this.saveConfig(config);
    }

    async prepareOfflineProcessing(): Promise<{ totalSize: number; estimatedTime: number; files: FileMetadata[] }> {
        const folioDir = path.join(os.homedir(), '.pioneer', 'folio');
        const tempDir = path.join(os.homedir(), '.pioneer', 'temp');
        const config = await this.loadOrCreateConfig();
        
        // Create temp directory if it doesn't exist
        await fs.promises.mkdir(tempDir, { recursive: true });
        
        // Get all files from folio
        const files = await fs.promises.readdir(folioDir);
        let totalSize = 0;
        const fileMetadata: FileMetadata[] = [];
        
        for (const file of files) {
            const filePath = path.join(folioDir, file);
            const stats = await fs.promises.stat(filePath);
            const content = await fs.promises.readFile(filePath, 'utf8');
            const chunks = await chunkTextByTokens(content, config.chunkSize);
            
            const metadata: FileMetadata = {
                originalPath: filePath,
                size: stats.size,
                estimatedChunks: chunks.length,
                estimatedProcessingTime: chunks.length * config.avgProcessingTimePerChunk,
                status: 'pending',
                currentChunk: 0,
                totalChunks: chunks.length
            };
            
            totalSize += stats.size;
            fileMetadata.push(metadata);
            
            // Move file to temp directory
            const tempPath = path.join(tempDir, file);
            await fs.promises.rename(filePath, tempPath);
        }
        
        // Save metadata
        const metadataPath = path.join(tempDir, 'metadata.json');
        await fs.promises.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));
        
        const totalEstimatedTime = fileMetadata.reduce((acc, file) => acc + file.estimatedProcessingTime, 0);
        
        return {
            totalSize,
            estimatedTime: totalEstimatedTime,
            files: fileMetadata
        };
    }

    async processOfflineFiles(): Promise<void> {
        const tag = TAG + " | processOfflineFiles | ";
        const tempDir = path.join(os.homedir(), '.pioneer', 'temp');
        const codexDir = path.join(os.homedir(), '.pioneer', 'codex');
        const metadataPath = path.join(tempDir, 'metadata.json');
        
        // Check if we're resuming from temp directory
        const isCacheExists = await fs.promises.access(tempDir).then(() => true).catch(() => false);
        if (isCacheExists) {
            log.info(tag, "Resuming processing from cache directory");
        } else {
            log.info(tag, "Starting new processing cycle");
        }
        
        // Load metadata
        const metadataContent = await fs.promises.readFile(metadataPath, 'utf8');
        const metadata: FileMetadata[] = JSON.parse(metadataContent);
        const config = await this.loadOrCreateConfig();
        
        // Calculate total work and progress
        const totalFiles = metadata.length;
        const totalChunks = metadata.reduce((sum, file) => sum + file.totalChunks, 0);
        const completedChunks = metadata.reduce((sum, file) => sum + file.currentChunk, 0);
        
        log.info(tag, `Processing ${totalFiles} files with ${totalChunks} total chunks`);
        log.info(tag, `Progress: ${completedChunks}/${totalChunks} chunks (${Math.round(completedChunks/totalChunks*100)}%)`);
        
        // Phase 1: Build Codex
        log.info(tag, "Phase 1: Building Codex");
        for (const file of metadata) {
            if (file.status === 'completed') {
                log.debug(tag, `Skipping completed file: ${path.basename(file.originalPath)}`);
                continue;
            }
            
            const tempPath = path.join(tempDir, path.basename(file.originalPath));
            const content = await fs.promises.readFile(tempPath, 'utf8');
            const chunks = await chunkTextByTokens(content, config.chunkSize);
            
            file.status = 'processing';
            file.totalChunks = chunks.length;
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            
            const startTime = Date.now();
            const estimatedTimePerChunk = config.avgProcessingTimePerChunk;
            const estimatedTotalTime = (chunks.length - file.currentChunk) * estimatedTimePerChunk;
            
            log.info(tag, `Processing ${path.basename(file.originalPath)}: ${chunks.length} chunks`);
            log.info(tag, `Estimated time remaining: ${Math.round(estimatedTotalTime/60)} minutes`);
            
            // Create a directory in codex for this file
            const baseName = path.parse(file.originalPath).name.replace(/[^a-zA-Z0-9-]/g, '_');
            const sourceDir = path.join(codexDir, baseName);
            await fs.promises.mkdir(sourceDir, { recursive: true });
            
            // Process each chunk
            for (let i = file.currentChunk; i < chunks.length; i++) {
                const chunk = chunks[i];
                const paddedIndex = String(i + 1).padStart(3, '0');
                
                // Save digest file first (build codex)
                const digest = {
                    id: `${baseName}-${paddedIndex}`,
                    source: path.basename(file.originalPath),
                    chunkIndex: i + 1,
                    totalChunks: chunks.length,
                    content: chunk,
                    timestamp: new Date().toISOString()
                };
                
                const digestFileName = `file-${baseName}-${paddedIndex}.json`;
                const digestPath = path.join(sourceDir, digestFileName);
                await fs.promises.writeFile(digestPath, JSON.stringify(digest, null, 2), 'utf8');
                
                // Update progress
                file.currentChunk = i + 1;
                const progress = Math.round((i + 1) / chunks.length * 100);
                if (i % 10 === 0 || i === chunks.length - 1) { // Log every 10 chunks or at completion
                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = (i + 1) / elapsed;
                    const remaining = (chunks.length - (i + 1)) / rate;
                    log.info(tag, `File progress: ${progress}% (${i + 1}/${chunks.length} chunks)`);
                    log.info(tag, `Chunk preview: "${chunk.substring(0, 200)}..."`);
                    log.info(tag, `Estimated time remaining: ${Math.round(remaining/60)} minutes`);
                }
                await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
                
                // Update config with last processed position
                config.lastProcessedFile = file.originalPath;
                config.lastProcessedChunk = i;
                await this.saveConfig(config);
            }
            
            // Update processing time statistics
            await this.updateProcessingTime(startTime, chunks.length);
            
            // Mark as completed
            file.status = 'completed';
            await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            log.info(tag, `Completed processing ${path.basename(file.originalPath)}`);
        }
        
        // Phase 2: Process Codex into Database
        log.info(tag, "Phase 2: Processing Codex into Database");
        const codexFiles = await fs.promises.readdir(codexDir);
        let processedFiles = 0;
        
        for (const file of codexFiles) {
            const filePath = path.join(codexDir, file);
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const digest = JSON.parse(content);
                
                // Extract knowledge and create embeddings
                const knowledge = await this.analyzeContent(digest.content);
                const embedding = await createEmbedding(this.pioneer, {
                    model: 'deepseek-r1:32b',
                    input: knowledge.content
                });
                
                // Save to database with proper chunk indexing
                await this.db.createKnowledgeChunks([digest.content], embedding, {
                    topics: knowledge.topics,
                    importance: knowledge.importance,
                    context: knowledge.context,
                    referenceFile: filePath,
                    chunkIndex: digest.chunkIndex,
                    totalChunks: digest.totalChunks,
                    id: digest.id
                });
                
                processedFiles++;
                if (processedFiles % 10 === 0) {
                    const progress = Math.round(processedFiles / codexFiles.length * 100);
                    log.info(tag, `Database processing progress: ${progress}% (${processedFiles}/${codexFiles.length} files)`);
                }
                
            } catch (e) {
                log.error(tag, `Failed to process codex file ${file}:`, e);
            }
        }
        
        // Clean up temp directory if all files are processed
        const remainingFiles = metadata.filter(f => f.status !== 'completed');
        if (remainingFiles.length === 0) {
            await fs.promises.rmdir(tempDir, { recursive: true });
            log.info(tag, "All files processed, cleaned up temp directory");
        }
        
        log.info(tag, "Processing completed");
        log.info(tag, `Total files processed: ${totalFiles}`);
        log.info(tag, `Total chunks processed: ${totalChunks}`);
    }
}

// Export the Engine class
export { Engine };

// Singleton pattern
let engineInstance: Engine | null = null;

export function initEngine(pioneer: any, db: any) {
    if (!engineInstance) {
        engineInstance = new Engine(pioneer, db);
        log.info(TAG, "Engine instance created successfully");
    }
    return engineInstance;
}

export async function improve(pioneer: any, db: any) {
    const engine = initEngine(pioneer, db);
    log.info(TAG, "Engine initialized for improvement");
    return engine.run();
}

// Export the original engine_run function for backwards compatibility
export const engine_run = async () => {
    if (!engineInstance) {
        log.info(TAG, "Engine not initialized. Skipping engine run.");
        return;
    }
    return engineInstance.run();
};

// Export the addTokens function
export const addTokens = (n: number) => {
    if (!engineInstance) {
        log.info(TAG, "Engine not initialized. Skipping adding tokens.");
        return;
    }
    return engineInstance.addTokens(n);
};

// Export offline processing functions
export const prepareOfflineProcessing = async () => {
    if (!engineInstance) {
        log.info(TAG, "Engine not initialized. Skipping offline processing preparation.");
        return;
    }
    return engineInstance.prepareOfflineProcessing();
};

export const processOfflineFiles = async () => {
    if (!engineInstance) {
        log.info(TAG, "Engine not initialized. Skipping offline processing.");
        return;
    }
    return engineInstance.processOfflineFiles();
};

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}