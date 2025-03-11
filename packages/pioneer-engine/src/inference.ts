import ollama from 'ollama';
import { get_encoding } from "tiktoken";
const TAG = " | Inference | ";
import { zodToJsonSchema } from 'zod-to-json-schema';
const log = require('@pioneer-platform/loggerdog')()

// Configure logging
process.env.DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';
process.env.LOG_LEVEL_INFERENCE = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUGV';

export interface ChatMessage {
    role: string;
    content: string;
}

export interface ChatOptions {
    model: string;
    messages: ChatMessage[];
    tools?: any[];
    format?: any;
    options?: {
        temperature?: number;
        num_ctx?: number;
    };
}

export interface EmbedOptions {
    model: string;
    input: string | string[];
    options?: {
        num_ctx?: number;
    };
}

let USE_OLLAMA = false

export async function chunkTextByTokens(text: string, maxTokens = 3000): Promise<string[]> {
    const tag = TAG + " | chunkTextByTokens | ";
    try {
        const encoding = get_encoding('cl100k_base');
        const allTokens = encoding.encode(text);

        const chunks: string[] = [];
        let startIndex = 0;
        while (startIndex < allTokens.length) {
            const endIndex = Math.min(startIndex + maxTokens, allTokens.length);
            const chunkTokens = allTokens.slice(startIndex, endIndex);
            const chunkText = encoding.decode(chunkTokens);
            chunks.push(chunkText.toString());
            startIndex = endIndex;
        }

        encoding.free();
        log.debug(tag, "Chunks created", chunks.length);
        return chunks;
    } catch (e) {
        log.error(tag, "Chunking error", e);
        throw e;
    }
}

export async function createEmbedding(app:any, params: EmbedOptions): Promise<{ data: { data: { embedding: number[] }[] } }> {
    const tag = TAG + " | createEmbedding | ";
    try {
        if (!app) throw Error('Failed to pass app!')
        if (!app.pioneer) throw Error('Failed to initialize app.pioneer!')
        
        const messages = Array.isArray(params.input) ? params.input : [params.input];
        let result = await app.pioneer.Embedding({messages})
        
        if (result?.data?.data?.[0]?.embedding) {
            const sampleEmbedding = result.data.data[0].embedding.slice(0, 5);
            log.debug(tag, "Embedding created", {
                sample: sampleEmbedding,
                inputLength: messages.length
            });
        }
        
        if (!result?.data?.data?.[0]?.embedding) {
            log.error(tag, "Invalid embedding response", "Missing embedding data");
            throw new Error('Invalid embedding response format');
        }
        return result;
    } catch (e) {
        log.error(tag, "Embedding creation failed", e);
        throw e;
    }
}

export async function chat(app: any, params: any): Promise<any> {
    const tag = TAG + " | chat | ";
    try {
        if(USE_OLLAMA){
            log.debug(tag, "Using Ollama for chat");
            return await ollama.chat({
                model: params.model,
                messages: params.messages,
                format: params.schema,
                options: params.options || { temperature: 0 }
            });
        } else {
            if(!app) throw Error('Failed to pass app!')
            let messages = [
                {
                    role: 'system',
                    content: " output JSON in format: " + JSON.stringify(params.schema)
                }
            ]
            params.messages = [...params.messages, ...messages];
            
            log.debug(tag, "Initiating chat request", {
                messageCount: params.messages.length,
                hasSchema: !!params.schema
            });
            
            let result = await app.pioneer.Chat({
                messages: params.messages,
                functions: [],
                isJson: true,
            });
            
            try {
                const output = JSON.parse(result.data.choices[0]?.message?.content);
                log.debug(tag, "Chat completed", {
                    success: true,
                    outputType: typeof output
                });
                return output;
            } catch(e: any) {
                log.error(tag, "Chat parsing failed", {
                    error: e.message,
                    responseType: typeof result.data.choices[0]?.message?.content
                });
                throw e;
            }
        }
    } catch (e) {
        log.error(tag, "Chat error", e);
        throw e;
    }
}

export async function inference(app: any, messages: any, tools: any, schema: any) {
    const tag = TAG + " | inference | ";
    try {
        if(!app) throw Error('Failed to initialize app!')
        const jsonSchema = zodToJsonSchema(schema);
        
        log.debug(tag, "Starting inference", {
            messageCount: messages.length,
            hasTools: !!tools,
            schemaType: schema?.constructor?.name
        });

        if(USE_OLLAMA || !app.pioneer) {
            log.debug(tag, "Using Ollama for inference");
            const models = ['mistral', 'deepseek-r1'];
            const response = await ollama.chat({
                model: models[0],
                messages: messages,
                format: jsonSchema,
                options: { temperature: 0 }
            });

            try {
                const parsedResponse = schema.parse(JSON.parse(response.message.content));
                log.debug(tag, "Ollama inference completed", {
                    success: true,
                    responseType: typeof parsedResponse
                });
                return {
                    data: {
                        choices: [{
                            message: {
                                content: JSON.stringify(parsedResponse)
                            }
                        }]
                    }
                };
            } catch (error) {
                log.error(tag, "Ollama response validation failed", error);
                throw error;
            }
        } else {
            const systemMsg = {
                role: 'system',
                content: "output JSON in format: " + JSON.stringify(jsonSchema)
            };
            const fullMessages = [systemMsg, ...messages];
            
            log.debug(tag, "Starting Pioneer chat", {
                totalMessages: fullMessages.length,
                hasTools: !!tools
            });
            
            const result = await app.pioneer.Chat({
                messages: fullMessages,
                functions: tools || [],
                isJson: true
            });

            try {
                if (!result?.data?.choices?.[0]?.message?.content) {
                    log.error(tag, "Invalid API response", "Missing content in response");
                    throw new Error('Invalid response format from Chat API');
                }
                
                const output = JSON.parse(result.data.choices[0].message.content);
                const parsedResponse = schema.parse(output);
                
                log.debug(tag, "Pioneer inference completed", {
                    success: true,
                    responseType: typeof parsedResponse
                });
                
                return {
                    data: {
                        choices: [{
                            message: {
                                content: JSON.stringify(parsedResponse)
                            }
                        }]
                    }
                };
            } catch (error) {
                log.error(tag, "Response parsing/validation failed", error);
                throw error;
            }
        }
    } catch (e) {
        log.error(tag, "Inference failed", e);
        throw e;
    }
}