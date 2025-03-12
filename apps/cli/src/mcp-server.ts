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

// Custom resources registry
const resources: Record<string, {content: string, metadata: any}> = {};

// Function to add a resource
const addResource = (resourceId: string, content: string, metadata: any) => {
  resources[resourceId] = {
    content,
    metadata
  };
  log(`Added resource: ${resourceId}`);
};

// Load the rules document as a resource
const rulesFilePath = path.resolve(process.cwd(), '../../.rules/rules.md');
if (fs.existsSync(rulesFilePath)) {
  const rulesContent = fs.readFileSync(rulesFilePath, 'utf-8');
  
  // Add the rules content to our resources registry
  addResource(
    "project-rules", 
    rulesContent, 
    {
      name: "Pioneer Desktop Development Rules",
      description: "Development guidelines and rules for the Pioneer Desktop project",
      type: "markdown"
    }
  );
} else {
  log(`Rules file not found at: ${rulesFilePath}`);
}

// Add an example Cursor rules file as a resource
const cursorRulesContent = `# Cursor Rules Example File

## Code Style
- Use 2 space indentation for all files
- Use camelCase for variable and function names
- Use PascalCase for class names and React components
- Include JSDoc comments for all public functions

## Project Organization
- Keep components in the components directory
- Keep utilities in the utils directory
- Test files should be adjacent to the files they test with .test.js suffix

## Performance Guidelines
- Avoid unnecessary re-renders in React components
- Use React.memo and useCallback where appropriate
- Minimize bundle size by avoiding large dependencies

## Git Rules
- Write descriptive commit messages
- Create feature branches for new features
- Always pull before pushing to main branch
`;

// Add the cursor rules content to our resources registry
addResource(
  "cursorules", 
  cursorRulesContent, 
  {
    name: "Example Cursor Rules",
    description: "Example rule set for configuring Cursor IDE behavior",
    type: "markdown"
  }
);

/* 
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
*/

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

// Tool to access resources by ID
server.tool(
  "getResource",
  { resourceId: z.string() },
  async ({ resourceId }: { resourceId: string }, _extra: any) => {
    log(`getResource tool called with ID: ${resourceId}`);
    
    // Check if the requested resource exists
    if (resources[resourceId]) {
      return {
        content: [{ 
          type: "text" as const,
          text: resources[resourceId].content
        }]
      };
    } else {
      return {
        content: [{ 
          type: "text" as const,
          text: `Resource with ID '${resourceId}' not found. Available resources: ${Object.keys(resources).join(', ')}`
        }]
      };
    }
  }
);

// Tool to list available resources
server.tool(
  "listResources",
  {}, // No parameters needed
  async (_args: {}, _extra: any) => {
    log(`listResources tool called`);
    
    const resourcesList = Object.keys(resources).map(id => ({
      id,
      name: resources[id].metadata.name,
      description: resources[id].metadata.description,
      type: resources[id].metadata.type
    }));
    
    return {
      content: [{ 
        type: "text" as const,
        text: `Available resources: ${JSON.stringify(resourcesList, null, 2)}`
      }]
    };
  }
);

/*
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
*/

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