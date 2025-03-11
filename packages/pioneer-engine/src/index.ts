import path from "path";
import fs from "fs";
const TAG = " | Pioneer-engine | ";
import {get_encoding} from "tiktoken";
import {DB} from "./db";
import { TextEncoder, TextDecoder } from 'util';
import { PROMPTS_SYSTEM } from './prompts';
import { createEmbedding, chunkTextByTokens, chat } from './inference';
import { onStartPioneer } from './pioneer';
import { engine_run, initEngine } from './engine/index';
const log = require('@pioneer-platform/loggerdog')()
import {
    create_skill,
    get_skills_with_descriptions
} from "./skills";
import os from "os";

const userHome = os.homedir();
const pioneerDir = path.join(userHome, '.pioneer'); // Use .pioneer directory in the user's home directory
//@ts-ignore
const brainDir = path.join(process.env.HOME, '.pioneer', 'brain');
const folioDir = path.join(pioneerDir, "folio");
const scriptorumDir = path.join(pioneerDir, "scriptorum");
const inquiriesDir = path.join(pioneerDir, "inquiries");



export interface PioneerConfig {
    ollamaHost?: string;
    ollamaApiKey?: string;
    defaultModel?: string;
}

export class PioneerApp {
    private pioneer: any;
    private tools: any;
    private config: PioneerConfig;
    private db = new DB();
    private cryptr: any;
    private username: any;
    private secrets: { [p: string]: string; } | undefined;
    private skills: Array<{
        file: string;
        function: {
            name: string;
            description: string;
            parameters: { type: string; properties: Record<string, any>; required: string[]; };
        };
    }> | undefined;

    constructor(config: any = {}) {
        this.tools = [];
        this.config = {
            ...config,
            defaultModel: 'deepseek-r1:32b'
        };
        if (!config.username) {
            throw new Error("username required!");
        }
        this.username = config.username;
        // Initialize Cryptr with a secure key
        if (process.env.LOCAL_PASSWORD) {
            const Cryptr = require('cryptr');
            this.cryptr = new Cryptr(process.env.LOCAL_PASSWORD);
        } else {
            console.warn('No LOCAL_PASSWORD found in environment, secrets will be stored unencrypted');
        }
    }

    public async init(config: PioneerConfig = {}, username?: string) {
        const tag = TAG + " | init | ";
        try {
            // Initialize Pioneer SDK
            this.pioneer = await onStartPioneer(this.db);
            
            // Get database statistics
            const knowledgeCount = this.db.prepare('SELECT COUNT(*) as count FROM knowledge').get() as { count: number };
            const dbSize = this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get() as { size: number };
            const embeddingStats = this.db.prepare('SELECT COUNT(*) as count, AVG(length(embedding)) as avgSize FROM knowledge WHERE embedding IS NOT NULL').get() as { count: number, avgSize: number };
            
            log.info(tag, "Database Statistics:", {
                totalKnowledgeEntries: knowledgeCount.count,
                databaseSizeMB: (dbSize.size / (1024 * 1024)).toFixed(2),
                embeddingsCount: embeddingStats.count,
                averageEmbeddingSizeBytes: Math.round(embeddingStats.avgSize || 0)
            });

            // Load skills
            const skills = await get_skills_with_descriptions();
            log.info(tag, "Skills loaded:", skills);

            this.secrets = await this.getAllSecrets();
            log.info(tag, "this.secrets:", this.secrets);

            this.skills = skills;
            return this.skills
        } catch (e) {
            //log.error(tag, "initialization error:", e);
            throw e;  // Re-throw to ensure errors are properly handled
        }
    }

    private async improve(): Promise<any> {
        const tag = TAG + " | improve | ";
        try {
            // Initialize the engine with the proper app and db
            initEngine(this.pioneer, this.db);

            // Start the engine on init to log the engine process steps
            log.info(tag, "Starting engine process...");
            engine_run();

            //todo return event stream? ux
            return true
        } catch (e) {
            //log.error(tag, "error loading skills:", e);
            throw e;
        }
    }

    private async loadSkills(): Promise<any> {
        const tag = TAG + " | loadSkills | ";
        try {
            // Load skills from a directory or configuration
            // This is a placeholder - implement actual skill loading logic
            return this.tools;
        } catch (e) {
            //log.error(tag, "error loading skills:", e);
            throw e;
        }
    }

    public async skillCreate(objective: string) {
        return await create_skill(this, objective);
    }

    /**
     * Encrypt and store a secret value in the DB.
     */
    public async setSecret(name: string, secretValue: string): Promise<void> {
        const tag = TAG + " | setSecret | ";
        try {
            // Encrypt the value if encryption is available
            const valueToStore = this.cryptr ? 
                this.cryptr.encrypt(secretValue) : 
                secretValue;
            
            // Store in the DB
            this.db.setValue(name, valueToStore);
        } catch (error) {
            console.error(tag, "Failed to set secret:", error);
            throw error;
        }
    }

    public async getAllSecrets(): Promise<{ [key: string]: string }> {
        const tag = TAG + " | getAllSecrets | ";
        try {
            const secrets: { [key: string]: string } = {};
            
            // Get all keys that look like secrets (you might want to add a prefix or pattern)
            const keys = ['OPENAI_API_KEY', 'TAVILY_API_KEY']; // Add more known secret keys as needed
            
            for (const key of keys) {
                const encryptedValue = this.db.getValue(key);
                if (encryptedValue) {
                    try {
                        // Decrypt if encryption is available
                        secrets[key] = this.cryptr ? 
                            this.cryptr.decrypt(encryptedValue) : 
                            encryptedValue;
                    } catch (err) {
                        console.warn(tag, `Failed to decrypt secret "${key}"`, err);
                    }
                }
            }
            
            return secrets;
        } catch (error) {
            console.error(tag, "Failed to get secrets:", error);
            throw error;
        }
    }

    public async chunkTextByTokens(text: string, maxTokens = 3000): Promise<string[]> {
        return chunkTextByTokens(text, maxTokens);
    }

    public async createEmbedding(inputs: string | string[]): Promise<{ data: { data: { embedding: number[] }[] } }> {
        if(!this.pioneer) throw Error('Fialed to init!')
        return createEmbedding(this.pioneer, {
            model: this.config.defaultModel || 'deepseek-r1:32b',
            input: inputs,
            options: {
                num_ctx: 4096
            }
        });
    }

    public async createKnowledge(item: any): Promise<string> {
        const tag = TAG + " | createKnowledge | ";
        try {
            if (!item.index || !item.content) {
                throw new Error('Missing required fields');
            }

            const searchableText = `
                ${item.content.title || ''}
                ${item.content.heading || ''}
                ${item.content.context || ''}
                ${item.content.type || ''}
            `.toLowerCase();

            const chunks = await this.chunkTextByTokens(searchableText, 1500);
            console.log(tag, `Created ${chunks.length} chunks`);

            const enrichedContexts = chunks.map(chunk => `${item.index}\n${chunk}`);
            
            const embResponse = await this.createEmbedding(enrichedContexts);
            
            if (!embResponse?.data) {
                throw new Error('Failed to generate embeddings');
            }
            log.info(tag,'embResponse: ', embResponse.data);
            return await this.db.createKnowledgeChunks(chunks, embResponse, item);

        } catch (e) {
            console.error(tag, "Knowledge creation error:", e);
            throw e;
        }
    }

    async searchKnowledge(
        queryEmbedding: Float32Array,
        searchText: string,
        agentId: string,
        limit: number
    ) {
        return this.db.searchKnowledge(queryEmbedding, searchText, agentId, limit);
    }

    async search(search: string[]) {
        const tag = TAG + " | search | ";
        try {
            log.info(tag, "search terms:", search);
            // Create a single Map to track all unique results across all searches
            const globalContentMap = new Map();
            
            for (let searchParam of search) {
                log.info(tag, "searching for:", searchParam);
                
                const embeddingResponse = await this.createEmbedding(searchParam);
                log.info(tag, "Got embedding response:", embeddingResponse);
                
                if (!embeddingResponse?.data?.data?.[0]?.embedding) {
                    log.warn(tag, "No embedding generated for:", searchParam);
                    continue;
                }

                const embedding = new Float32Array(embeddingResponse.data.data[0].embedding);
                log.info(tag, `Got embedding of length: ${embedding.length}`);
                
                const searchResults = await this.searchKnowledge(embedding, searchParam, "codex", 5);
                log.info(tag, `Search results for "${searchParam}":`, searchResults);
                
                if (!searchResults || !Array.isArray(searchResults)) {
                    log.warn(tag, "No valid search results for:", searchParam);
                    continue;
                }

                // Add results to global map, using URL as key to avoid duplicates
                searchResults.forEach(result => {
                    if (result && result.content) {
                        try {
                            const content = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
                            if (content.url) {
                                globalContentMap.set(content.url, { ...content, score: result.score });
                            } else {
                                log.warn(tag, "Result missing URL:", content);
                            }
                        } catch (e) {
                            log.error(tag, "Error parsing result content:", e, result);
                        }
                    }
                });
            }
            
            // Convert map values to array and sort by score
            const results = Array.from(globalContentMap.values())
                .sort((a, b) => (b.score || 0) - (a.score || 0));

            log.info(tag, `Found ${results.length} unique results`);
            return results;
        } catch (e) {
            log.error(tag, "search error:", e);
            throw e;
        }
    }

    public async chat(message: string, tools?: any[]){
        let tag = TAG + " | chat | ";
        try{
            // Prepare system + user prompts
            let messages = [
                {
                    role: 'system',
                    content: PROMPTS_SYSTEM.RAG_SEARCH_PARAMS.content,
                },
                {
                    role: 'user',
                    content: "user asks: " + message
                }
            ];

            // Schema requiring a "search" array with up to three strings
            const schema = {
                type: 'object',
                properties: {
                    search: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        maxItems: 3
                    }
                },
                required: ['search']
            };

            let searchTermsResponse = await chat(this.pioneer, { messages, schema, tools})
            log.info(tag, "Search terms response:", searchTermsResponse);
            
            if (!searchTermsResponse?.search || !Array.isArray(searchTermsResponse.search)) {
                log.error(tag, "Invalid search terms response:", searchTermsResponse);
                return {
                    response: "I apologize, but I encountered an error processing your request. Please try again.",
                    sources: []
                };
            }

            const results = await this.search(searchTermsResponse.search);
            if (!results || results.length === 0) {
                log.info(tag, "No relevant knowledge found");
                return {
                    response: "I apologize, but I couldn't find any relevant information to answer your question. Please try rephrasing your question or ask something else.",
                    sources: []
                };
            }

            let references: string[] = [];
            // Process results to ensure content is properly parsed
            const processedResults = results.map(result => {
                try {
                    if (result.content?.url) {
                        references.push(result.content.url);
                    }
                    return result;
                } catch (e) {
                    log.error(tag, "Error processing result:", e);
                    return result;
                }
            });

            // Prepare final messages for RAG response
            let messagesFinal = [
                {
                    role: 'system',
                    content: PROMPTS_SYSTEM.RAG_FINAL_RESPONSE.content,
                },
                {
                    role: 'system',
                    content: `RAG Results: ${JSON.stringify(processedResults)}`
                },
                {
                    role: 'user',
                    content: `User question: ${message}`
                }
            ];

            // Define final response schema
            const finalSchema = {
                type: 'object',
                properties: {
                    response: {
                        type: 'string',
                        description: 'The formatted response to the user'
                    },
                    sources: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: 'List of sources referenced in the response'
                    }
                },
                required: ['response', 'sources']
            };

            let finalResponse = await chat(this.pioneer, { messages: messagesFinal, schema: finalSchema, tools});
            log.info(tag, "Final response:", finalResponse);

            if (!finalResponse?.response) {
                log.error(tag, "Invalid final response format:", finalResponse);
                return {
                    response: "I apologize, but I encountered an error processing the response. Please try again.",
                    sources: references
                };
            }

            // Clean and format the response
            let output = {
                response: finalResponse.response,
                sources: references
            };

            // Add sources reference if we have any
            if (output.sources.length > 0) {
                output.response += "\n\nFor more detailed information, please refer to the documentation sources listed below.";
            } else {
                output.response += "\n\nNote: This response is based on general knowledge. For specific details, please refer to the official documentation.";
            }

            return output;
        } catch(error){
            log.error(tag, "Chat error:", error);
            return {
                response: "I apologize, but I encountered an error processing your request. Please try again.",
                sources: []
            };
        }
    }

    public async clearKnowledge() {
        const tag = TAG + " | clearKnowledge | ";
        try {
            this.db.clearKnowledge();
        } catch (e) {
            console.error(tag, "Error clearing knowledge:", e);
            throw e;
        }
    }

    /**
     * Save a patch file to the database
     * @param patchFile Object containing patch file data
     * @returns The ID of the saved patch file
     */
    public async savePatchFile(patchFile: {
        title: string,
        description: string,
        content: string,
        filePath?: string,
        repository?: string,
        branch?: string,
        author?: string,
        status?: string,
        metadata?: any
    }): Promise<string> {
        return this.db.savePatchFile(patchFile);
    }

    /**
     * Update the status of a patch file
     * @param id Patch file ID
     * @param status New status
     * @param appliedAt Optional timestamp when patch was applied
     */
    public async updatePatchFileStatus(id: string, status: string, appliedAt?: number): Promise<void> {
        this.db.updatePatchFileStatus(id, status, appliedAt);
    }

    /**
     * Get a patch file by ID
     * @param id Patch file ID
     * @returns The patch file or null if not found
     */
    public async getPatchFile(id: string): Promise<any> {
        return this.db.getPatchFile(id);
    }

    /**
     * Get all patch files with optional filters
     * @param filters Filter options
     * @returns Array of patch files
     */
    public async getPatchFiles(filters?: {
        status?: string,
        repository?: string,
        author?: string,
        limit?: number,
        offset?: number
    }): Promise<any[]> {
        return this.db.getPatchFiles(filters || {});
    }

    /**
     * Delete a patch file
     * @param id Patch file ID
     * @returns Boolean indicating success
     */
    public async deletePatchFile(id: string): Promise<boolean> {
        return this.db.deletePatchFile(id);
    }
}