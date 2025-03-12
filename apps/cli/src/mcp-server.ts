#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

import {
  functions,
  initializeFunctions
} from './core/allFunctions';

// Set up logging to a file in the user's home directory
const logFile = path.join(process.env.HOME || '.', 'mcp-server-debug.log');
const log = (msg: string) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(logFile, logMsg);
  console.error(msg); // Also log to stderr
};

// Log startup info
log(`MCP server starting - PID: ${process.pid}`);
log(`Log file: ${logFile}`);
log(`Working directory: ${process.cwd()}`);

// Initialize the functions
initializeFunctions();

// Create a new MCP server instance
const server = new McpServer({
  name: "pioneer-server", // Use the name from working example
  version: "1.0.0"         // Use version from working example
});

// Register a getPassword tool that returns "foobar"
server.tool(
  "getPassword",
  {}, // No parameters required
  async (_args: {}, _extra: any) => {
    log("getPassword tool called");
    return {
      content: [{ 
        type: "text" as const,
        text: "foobar" 
      }]
    };
  }
);

// Register an echo tool
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }: { message: string }, _extra: any) => {
    log(`Echo tool called with message: ${message}`);
    return {
      content: [{ 
        type: "text" as const,
        text: `You said: ${message}` 
      }]
    };
  }
);

// Add more MCP tools based on our functions

// Tool to capture prompts
server.tool(
  "capturePrompt",
  { prompt: z.string() },
  async ({ prompt }: { prompt: string }, _extra: any) => {
    log(`capturePrompt tool called with: ${prompt}`);
    functions.capturePrompt(prompt);
    return {
      content: [{ 
        type: "text" as const,
        text: "Prompt captured successfully" 
      }]
    };
  }
);

// Tool to track performance metrics
server.tool(
  "trackPerformance",
  { 
    executionTime: z.number(),
    memoryUsage: z.number().optional(),
    cpuUsage: z.number().optional(),
    additionalMetrics: z.record(z.any()).optional()
  },
  async (metrics: any, _extra: any) => {
    log(`trackPerformance tool called with: ${JSON.stringify(metrics)}`);
    functions.trackPerformance(metrics);
    return {
      content: [{ 
        type: "text" as const,
        text: "Performance metrics recorded" 
      }]
    };
  }
);

// Tool to report cursor errors
server.tool(
  "reportError",
  { 
    message: z.string(),
    stack: z.string().optional() 
  },
  async ({ message, stack }: { message: string, stack?: string }, _extra: any) => {
    log(`reportError tool called with: ${message}`);
    const error = new Error(message);
    if (stack) error.stack = stack;
    functions.onCursorError(error);
    return {
      content: [{ 
        type: "text" as const,
        text: "Error reported successfully" 
      }]
    };
  }
);

// Main function to start the server
async function main() {
  // Set up the stdio transport and connect it to our server
  const transport = new StdioServerTransport();
  
  // Connect the server to the transport
  try {
    log("Connecting server to transport...");
    await server.connect(transport);
    log("Server connected to transport. Waiting for messages...");
  } catch (error) {
    log(`Error connecting server: ${error}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Error in main: ${error}`);
}); 