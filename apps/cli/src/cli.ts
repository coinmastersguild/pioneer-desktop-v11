#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// Load the package.json for version information
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const CLI_VERSION = packageJson.version || '0.3.1';

// Add debug logging function
function debug(message: string, ...args: any[]) {
  if (process.env.DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

// Run MCP server with stdio transport
function runMcpStdioServer(): void {
  const serverPath = path.join(__dirname, 'mcp-server.js');
  
  // Check if the server file exists
  if (!fs.existsSync(serverPath)) {
    console.error(`Error: MCP server file not found at ${serverPath}`);
    process.exit(1);
  }
  
  // Enable debug mode with environment variable
  const debugMode = process.env.DEBUG === 'true';
  
  if (debugMode) {
    console.log('Running in DEBUG mode');
    console.log(`Server path: ${serverPath}`);
    console.log(`Current directory: ${process.cwd()}`);
    console.log(`Node version: ${process.version}`);
  }
  
  console.log('Starting MCP server with stdio transport...');
  
  // Prepare arguments for the server
  const nodeArgs = debugMode ? ['--trace-warnings', '--inspect'] : [];
  const serverArgs = debugMode ? ['--debug'] : [];
  
  // Spawn the server process with exact stdio configuration for MCP
  const serverProcess = spawn('node', [...nodeArgs, serverPath, ...serverArgs], {
    stdio: ['pipe', 'pipe', 'pipe'], // Use pipe for all channels to capture errors too
    env: {
      ...process.env,
      DEBUG: debugMode ? 'true' : undefined,
    }
  });
  
  if (debugMode) {
    console.log(`Server process PID: ${serverProcess.pid}`);
  }
  
  // Pipe stdin to the server's stdin (critical for MCP)
  process.stdin.pipe(serverProcess.stdin);
  
  // Pipe server's stdout to our stdout (critical for MCP)
  serverProcess.stdout.pipe(process.stdout);
  
  // Log stderr for debugging
  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });
  
  // Handle server process exit
  serverProcess.on('exit', (code) => {
    console.error(`MCP server exited with code ${code || 0}`);
    process.exit(code || 0);
  });
  
  // Handle server process errors
  serverProcess.on('error', (error) => {
    console.error(`Error in MCP server process: ${error.message}`);
    process.exit(1);
  });
  
  // Forward signals to child process
  process.on('SIGINT', () => serverProcess.kill('SIGINT'));
  process.on('SIGTERM', () => serverProcess.kill('SIGTERM'));
}

async function main() {
  debug('Starting CLI initialization');
  
  try {
    const program = new Command();
    
    program
      .name('pioneer')
      .description('Pioneer CLI - MCP server for Cursor integration')
      .version(CLI_VERSION);
    
    // MCP server with stdio - the only command
    program
      .command('mcp-stdio')
      .description('Run an MCP server with stdio transport for Cursor integration')
      .action(() => {
        debug('Starting MCP server with stdio transport');
        runMcpStdioServer();
      });
    
    // Add a version command for easy version checking
    program
      .command('version')
      .description('Display detailed version information')
      .action(() => {
        console.log(`Pioneer CLI v${CLI_VERSION}`);
        console.log(`Node Version: ${process.version}`);
        console.log(`Platform: ${process.platform}`);
      });
    
    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    debug('Error occurred during execution:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
}

// Start the CLI
debug('Starting main CLI function');
main().catch(error => {
  debug('Unhandled error in main:', error);
  console.error('Unhandled error:', error);
  process.exit(1);
});