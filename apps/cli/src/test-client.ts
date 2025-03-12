#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Create a log file path in the user's home directory
const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
const logDir = path.join(homeDir, '.pioneer-logs');
const clientLogPath = path.join(logDir, 'mcp-client-debug.log');

// Ensure log directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error(`Failed to create log directory: ${err}`);
}

// Create a log file stream
const logStream = fs.createWriteStream(clientLogPath, { flags: 'a' });

// Track if the log stream is closed
let logStreamClosed = false;

// Helper function to log to both console and file
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  if (!logStreamClosed) {
    logStream.write(logMessage + '\n');
  }
}

// Log errors to both console and file
function logError(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message}`;
  console.error(logMessage);
  if (!logStreamClosed) {
    logStream.write(logMessage + '\n');
  }
}

// Start with some system info
log(`Test client starting - Node.js ${process.version}`);
log(`Process ID: ${process.pid}`);
log(`Working directory: ${process.cwd()}`);
log(`Log file: ${clientLogPath}`);

// Path to the MCP server script
const serverPath = path.join(__dirname, 'mcp-server.js');
log(`Server path: ${serverPath}`);

// Create a child process running our server
log('Spawning server process...');
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'] // Capture stderr too for logging
});

log(`Server process spawned with PID: ${serverProcess.pid}`);

// Log server stderr output
serverProcess.stderr.on('data', (data) => {
  logError(`Server stderr: ${data.toString().trim()}`);
});

// Create a transport that connects to our child process
log('Creating StdioClientTransport...');
const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath]
});

// Create a new client
log('Creating MCP client...');
const client = new Client(
  {
    name: "test-client",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {} // Enable tools capability
    }
  }
);

async function main() {
  try {
    // Connect to the server
    log("Connecting to server...");
    await client.connect(transport);
    log("Connected to server.");

    // List available tools
    log("Listing available tools:");
    const tools = await client.listTools();
    log(JSON.stringify(tools, null, 2));

    /* Commenting out these calls as these tools are not available
    // Call the getPassword tool
    log("\nCalling getPassword tool:");
    const passwordResult = await client.callTool({
      name: "getPassword",
      arguments: {}
    });
    
    // Type assertion for accessing the response content
    const passwordContent = (passwordResult as any).content;
    if (passwordContent && Array.isArray(passwordContent) && passwordContent.length > 0) {
      log(`Password: ${passwordContent[0].text}`);
    } else {
      logError(`Unexpected password result format: ${JSON.stringify(passwordResult)}`);
    }

    // Call the echo tool
    log("\nCalling echo tool:");
    const echoResult = await client.callTool({
      name: "echo",
      arguments: {
        message: "Hello from MCP client!"
      }
    });
    
    // Type assertion for accessing the response content
    const echoContent = (echoResult as any).content;
    if (echoContent && Array.isArray(echoContent) && echoContent.length > 0) {
      log(`Echo Response: ${echoContent[0].text}`);
    } else {
      logError(`Unexpected echo result format: ${JSON.stringify(echoResult)}`);
    }
    */

    // Test listResources tool
    log("\nCalling listResources tool:");
    const resourcesResult = await client.callTool({
      name: "listResources",
      arguments: {}
    });
    
    // Type assertion for accessing the response content
    const resourcesContent = (resourcesResult as any).content;
    if (resourcesContent && Array.isArray(resourcesContent) && resourcesContent.length > 0) {
      log(`Available Resources: ${resourcesContent[0].text}`);
    } else {
      logError(`Unexpected resources result format: ${JSON.stringify(resourcesResult)}`);
    }

    // Test getResource tool for cursorules
    log("\nCalling getResource tool for cursorules:");
    const cursorRulesResult = await client.callTool({
      name: "getResource",
      arguments: {
        resourceId: "cursorules"
      }
    });
    
    // Type assertion for accessing the response content
    const cursorRulesContent = (cursorRulesResult as any).content;
    if (cursorRulesContent && Array.isArray(cursorRulesContent) && cursorRulesContent.length > 0) {
      log(`Cursor Rules Content:\n${cursorRulesContent[0].text}`);
    } else {
      logError(`Unexpected cursor rules result format: ${JSON.stringify(cursorRulesResult)}`);
    }

    log("\nTest completed successfully!");
  } catch (error) {
    logError(`Error during MCP test: ${error}`);
    // Log more details about the error
    if (error instanceof Error) {
      logError(`Error stack: ${error.stack}`);
    }
  } finally {
    // Clean up
    log("Closing connection and terminating server...");
    transport.close();
    serverProcess.kill();
    
    // Close the log file
    logStreamClosed = true;
    logStream.end();
    console.log(`Log file closed: ${clientLogPath}`);
  }
}

// Run the test
log('Starting main test function...');
main(); 