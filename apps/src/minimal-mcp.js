#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up logging to a file in the same directory as this script
const logFile = path.join(__dirname, 'mcp-server-debug.log');

// Create/clear the log file on startup
fs.writeFileSync(logFile, `=== MCP SERVER LOG STARTED AT ${new Date().toISOString()} ===\n`);
console.error(`Logging to: ${logFile}`);

// Helper function to log to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMsg);
  console.error(message);
}

// Log system info
log(`MCP server starting - PID: ${process.pid}`);
log(`Working directory: ${process.cwd()}`);
log(`Server file location: ${__filename}`);

// Create a new MCP server instance
const server = new McpServer({
  name: "password-server",
  version: "1.0.0"
});

// Register a getPassword tool that returns "foobar"
server.tool(
  "getPassword",
  {}, // No parameters required
  async () => {
    log("getPassword tool called");
    return {
      content: [{ 
        type: "text", 
        text: "foobar" 
      }]
    };
  }
);

// Register an echo tool
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => {
    log(`Echo tool called with message: ${message}`);
    return {
      content: [{ 
        type: "text", 
        text: `You said: ${message}` 
      }]
    };
  }
);

// Log any stdin data for debugging
process.stdin.on('data', (data) => {
  try {
    log(`STDIN: ${data.toString().trim()}`);
  } catch (e) {
    log(`Error logging stdin: ${e}`);
  }
});

// Set up the stdio transport and connect it to our server
const transport = new StdioServerTransport();

// Connect the server to the transport
log("Starting MCP server with stdio transport...");
server.connect(transport).then(() => {
  log("Server connected to transport. Waiting for messages...");
}).catch(error => {
  log(`Error connecting server: ${error}`);
  if (error instanceof Error && error.stack) {
    log(`Error stack: ${error.stack}`);
  }
});

// Add error handlers
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error}`);
  if (error instanceof Error && error.stack) {
    log(`Error stack: ${error.stack}`);
  }
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`);
}); 