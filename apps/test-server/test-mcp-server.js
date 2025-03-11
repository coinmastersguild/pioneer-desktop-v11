#!/usr/bin/env node
/**
 * Simple MCP server for testing with Cursor (ESM version)
 */

// Import the required modules
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

async function main() {
  console.error('Starting test MCP server...');
  
  try {
    // Create a new MCP server instance
    const mcpServer = new McpServer({
      name: "pioneer-test-server",
      version: "0.1.0"
    });
    
    // Register the getPassword tool
    mcpServer.tool(
      "mcp__getPassword",
      { random_string: z.string() },
      async () => {
        console.error("getPassword tool called");
        return {
          content: [{ 
            type: "text", 
            text: "test-password-123" 
          }]
        };
      }
    );
    
    // Register the echo tool
    mcpServer.tool(
      "mcp__echo",
      { message: z.string() },
      async ({ message }) => {
        console.error(`Echo tool called with message: ${message}`);
        return {
          content: [{ 
            type: "text", 
            text: `You said: ${message}` 
          }]
        };
      }
    );
    
    // Set up the stdio transport and connect it to our server
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    console.error("Connecting MCP server to transport...");
    await mcpServer.connect(transport);
    console.error("MCP server connected and waiting for messages...");
    
    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error('Error running MCP server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  console.error('Fatal error running MCP server:', error);
  process.exit(1);
}); 