#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import http from 'http';
import express from 'express';
import { spawn } from 'child_process';
import { PioneerApp } from '@pioneer-platform/pioneer-engine';

// The CLI version may be different from the engine version
const CLI_VERSION = '0.2.2';

// Initialize the Pioneer Engine
let pioneerApp: PioneerApp | null = null;

// Add debug logging function
function debug(message: string, ...args: any[]) {
  if (process.env.DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

// Function to get password securely from the command line
function getPassword(prompt: string): Promise<string> {
  debug('Calling getPassword function');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    // Check if we're in an environment that supports raw mode
    const supportsRawMode = process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';
    
    if (supportsRawMode) {
      // Use custom prompt that doesn't echo input
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let password = '';
      
      process.stdin.on('data', (chunk) => {
        // Convert Buffer to string for easier handling
        const char = Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk);
        
        // Handle special cases
        switch (char) {
          case "\n": 
          case "\r": 
          case "\u0004": // End of transmission
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write('\n');
            rl.close();
            resolve(password);
            break;
          case "\u0003": // Ctrl+C
            process.stdout.write('\n');
            process.exit(0);
            break;
          case "\b": // Backspace
          case "\u007F": // Delete
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            // Ignore control characters and only add printable characters
            const code = char.charCodeAt(0);
            if (code >= 32) {
              password += char;
              process.stdout.write('*');
            }
            break;
        }
      });
    } else {
      // Fallback for environments without raw mode support
      console.log("Warning: Running in an environment without full terminal support.");
      debug('Environment does not support raw mode, using fallback');
      // Just return a default password for non-interactive environments
      resolve("foobar");
    }
  });
}

// Run an MCP server
async function runMCPServer(port: number): Promise<void> {
  const app = express();
  app.use(express.json());
  
  // MCP API endpoint for getPassword
  app.post('/mcp/getPassword', async (_req: express.Request, res: express.Response) => {
    debug('MCP getPassword request received');
    
    try {
      console.log('Password requested by Cursor. Please enter password:');
      const password = await getPassword('Password: ');
      
      // Send password back in MCP format
      res.json({
        content: [{ type: 'text', text: password }]
      });
    } catch (error) {
      console.error('Error handling password request:', error);
      res.status(500).json({
        error: 'Failed to get password'
      });
    }
  });
  
  // MCP echo endpoint
  app.post('/mcp/echo', (req: express.Request, res: express.Response) => {
    debug('MCP echo request received:', req.body);
    
    const message = req.body.message || 'No message provided';
    console.log('Echo from Cursor:', message);
    
    res.json({
      content: [{ type: 'text', text: `Echoed: ${message}` }]
    });
  });
  
  // Health check endpoint
  app.get('/health', (_req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', version: CLI_VERSION });
  });
  
  // Start the server
  const server = http.createServer(app);
  
  server.listen(port, () => {
    console.log(`MCP server running on http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server');
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    debug('SIGINT received, shutting down server');
    console.log('Shutting down MCP server...');
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  });
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
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PATH: process.env.PATH?.substring(0, 50) + '...',
    });
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
      DEBUG: 'true', // Always send DEBUG=true to the server process
    }
  });
  
  if (debugMode) {
    console.log(`Server process PID: ${serverProcess.pid}`);
  }
  
  // Pipe stdin to the server's stdin (critical for MCP)
  process.stdin.pipe(serverProcess.stdin);
  
  // Pipe server's stdout to our stdout (critical for MCP)
  serverProcess.stdout.pipe(process.stdout);
  
  // Log raw data in debug mode
  if (debugMode) {
    process.stdin.on('data', (data) => {
      console.error(`[DEBUG STDIN] ${data.toString().trim()}`);
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.error(`[DEBUG STDOUT] ${data.toString().trim()}`);
    });
  }
  
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
  debug('Process argv:', process.argv);
  debug('Current working directory:', process.cwd());
  debug('Environment:', {
    NODE_PATH: process.env.NODE_PATH,
    PATH: process.env.PATH,
    NODE_ENV: process.env.NODE_ENV
  });

  const program = new Command();
  
  try {
    debug('Setting up command program');
    program
      .name('pioneer')
      .description('Pioneer CLI - A command-line interface for the Pioneer platform')
      .version(CLI_VERSION);
    
    // Add getPassword command
    program
      .command('getPassword')
      .description('Securely input a password')
      .action(async () => {
        debug('Executing getPassword command');
        console.log('Testing password input:');
        const password = await getPassword('Enter password: ');
        console.log(`Password received (length: ${password.length})`);
      });
    
    // Add MCP server command
    program
      .command('mcp-server')
      .description('Run an MCP server for Cursor integration')
      .option('-p, --port <number>', 'Port to run the server on', '3000')
      .action(async (options) => {
        debug('Starting MCP server on port', options.port);
        const port = parseInt(options.port, 10);
        
        if (isNaN(port) || port < 1 || port > 65535) {
          console.error('Invalid port number. Please specify a port between 1 and 65535.');
          process.exit(1);
        }
        
        console.log(`Starting MCP server on port ${port}...`);
        await runMCPServer(port);
      });
    
    // Add MCP server with stdio command
    program
      .command('mcp-stdio')
      .description('Run an MCP server with stdio transport for Cursor integration')
      .action(() => {
        debug('Starting MCP server with stdio transport');
        runMcpStdioServer();
      });
    
    // Add test-client command
    program
      .command('test-mcp')
      .description('Run a test against the MCP server to verify functionality')
      .action(() => {
        const testClientPath = path.join(__dirname, 'test-client.js');
        
        // Check if the test client file exists
        if (!fs.existsSync(testClientPath)) {
          console.error(`Error: Test client file not found at ${testClientPath}`);
          process.exit(1);
        }
        
        console.log('Starting MCP test client...');
        
        // Run the test client
        const testProcess = spawn('node', [testClientPath], {
          stdio: 'inherit'
        });
        
        testProcess.on('exit', (code) => {
          if (code !== 0) {
            console.error(`Test client exited with code ${code}`);
          }
          process.exit(code || 0);
        });
      });
    
    // Add diagnostic command
    program
      .command('diagnose')
      .description('Run diagnostics to troubleshoot CLI installation issues')
      .action(() => {
        console.log('Pioneer CLI Diagnostics:');
        console.log('-----------------------');
        
        // Check binary location
        const npmRoot = require('child_process').execSync('npm root -g').toString().trim();
        const expectedPath = path.join(npmRoot, '@pioneer-platform/pioneer-cli/dist/cli.js');
        console.log(`Expected binary location: ${expectedPath}`);
        console.log(`Binary exists: ${fs.existsSync(expectedPath) ? 'Yes' : 'No'}`);
        
        // Check executable permissions
        if (fs.existsSync(expectedPath)) {
          try {
            const stats = fs.statSync(expectedPath);
            const permissions = stats.mode.toString(8);
            console.log(`Binary permissions: ${permissions}`);
            if (!(stats.mode & 0o111)) {
              console.log('WARNING: Binary does not have executable permissions');
            }
          } catch (error) {
            console.log(`Error checking permissions: ${error}`);
          }
        }
        
        // Check PATH
        const pathEnv = process.env.PATH || '';
        const pathDirs = pathEnv.split(':');
        const npmBinDir = require('child_process').execSync('npm bin -g').toString().trim();
        console.log(`NPM bin directory: ${npmBinDir}`);
        console.log(`PATH includes npm bin: ${pathDirs.includes(npmBinDir) ? 'Yes' : 'No'}`);
        
        // Check node version
        console.log(`Node version: ${process.version}`);
        
        // Check for symlinks
        try {
          const binDir = require('child_process').execSync('npm bin -g').toString().trim();
          const symlinkPath = path.join(binDir, 'pioneer');
          console.log(`Symlink path: ${symlinkPath}`);
          if (fs.existsSync(symlinkPath)) {
            const linkTarget = fs.readlinkSync(symlinkPath);
            console.log(`Symlink target: ${linkTarget}`);
          } else {
            console.log('Symlink does not exist');
          }
        } catch (error) {
          console.log(`Error checking symlink: ${error}`);
        }
      });
    
    program
      .command('info')
      .description('Display system information')
      .action(async () => {
        debug('Executing info command');
        console.log('Pioneer CLI Information:');
        console.log(`CLI version: ${CLI_VERSION}`);
        console.log(`Node version: ${process.version}`);
        console.log(`Platform: ${process.platform}`);
      });

    // Add search command
    program
      .command('search')
      .description('Search for information using Pioneer Engine')
      .argument('<query>', 'Search query')
      .action(async (query) => {
        try {
          console.log(`Searching for: ${query}`);
          
          // Initialize Pioneer Engine if not already initialized
          if (!pioneerApp) {
            pioneerApp = new PioneerApp();
            await pioneerApp.init();
          }
          
          const results = await pioneerApp.search([query]);
          console.log('Search Results:');
          console.log(JSON.stringify(results, null, 2));
        } catch (error) {
          console.error('Error during search:', error);
        }
      });

    // Add skill creation command
    program
      .command('skill')
      .description('Create a new skill using Pioneer Engine')
      .argument('<objective>', 'Skill objective description')
      .action(async (objective) => {
        try {
          console.log(`Creating skill with objective: ${objective}`);
          
          // Initialize Pioneer Engine if not already initialized
          if (!pioneerApp) {
            pioneerApp = new PioneerApp();
            await pioneerApp.init();
          }
          
          const result = await pioneerApp.skillCreate(objective);
          console.log('Skill created successfully:');
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error('Error creating skill:', error);
        }
      });

    // Add chat command
    program
      .command('chat')
      .description('Chat with Pioneer Engine')
      .argument('<message>', 'Message to send')
      .action(async (message) => {
        try {
          console.log(`Sending message: ${message}`);
          
          // Initialize Pioneer Engine if not already initialized
          if (!pioneerApp) {
            pioneerApp = new PioneerApp();
            await pioneerApp.init();
          }
          
          const response = await pioneerApp.chat(message);
          console.log('Response:');
          console.log(response);
        } catch (error) {
          console.error('Error during chat:', error);
        }
      });
    
    // Add patch file commands
    program
      .command('patch')
      .description('Manage patch files')
      .addCommand(
        new Command('save')
          .description('Save a patch file')
          .requiredOption('-t, --title <title>', 'Title of the patch')
          .requiredOption('-d, --description <description>', 'Description of the patch')
          .requiredOption('-c, --content <content>', 'Content of the patch (or @file to read from file)')
          .option('-f, --file-path <filePath>', 'Path to the file being patched')
          .option('-r, --repository <repository>', 'Repository name')
          .option('-b, --branch <branch>', 'Branch name')
          .option('-a, --author <author>', 'Author name')
          .option('-m, --metadata <metadata>', 'JSON metadata')
          .action(async (options) => {
            try {
              debug('Executing patch save command with options:', options);
              
              // Initialize Pioneer Engine if not already initialized
              if (!pioneerApp) {
                pioneerApp = new PioneerApp();
                await pioneerApp.init();
              }
              
              // Handle file content loading
              let content = options.content;
              if (content.startsWith('@')) {
                const filePath = content.substring(1);
                debug(`Loading content from file: ${filePath}`);
                content = fs.readFileSync(filePath, 'utf8');
              }
              
              // Parse metadata if provided
              let metadata = undefined;
              if (options.metadata) {
                try {
                  metadata = JSON.parse(options.metadata);
                } catch (e) {
                  console.error('Error parsing metadata JSON:', e.message);
                  process.exit(1);
                }
              }
              
              const patchFile = {
                title: options.title,
                description: options.description,
                content,
                filePath: options.filePath,
                repository: options.repository,
                branch: options.branch,
                author: options.author,
                metadata
              };
              
              const id = await pioneerApp.savePatchFile(patchFile);
              console.log(`Patch file saved with ID: ${id}`);
            } catch (error) {
              console.error('Error saving patch file:', error);
              process.exit(1);
            }
          })
      )
      .addCommand(
        new Command('list')
          .description('List patch files')
          .option('-s, --status <status>', 'Filter by status')
          .option('-r, --repository <repository>', 'Filter by repository')
          .option('-a, --author <author>', 'Filter by author')
          .option('-l, --limit <limit>', 'Limit number of results', '10')
          .option('-o, --offset <offset>', 'Offset for pagination', '0')
          .action(async (options) => {
            try {
              debug('Executing patch list command with options:', options);
              
              // Initialize Pioneer Engine if not already initialized
              if (!pioneerApp) {
                pioneerApp = new PioneerApp();
                await pioneerApp.init();
              }
              
              const filters = {
                status: options.status,
                repository: options.repository,
                author: options.author,
                limit: parseInt(options.limit, 10),
                offset: parseInt(options.offset, 10)
              };
              
              const patchFiles = await pioneerApp.getPatchFiles(filters);
              
              if (patchFiles.length === 0) {
                console.log('No patch files found');
                return;
              }
              
              console.log(`Found ${patchFiles.length} patch files:`);
              patchFiles.forEach((patch, index) => {
                console.log(`\n[${index + 1}] ${patch.title} (ID: ${patch.id})`);
                console.log(`Status: ${patch.status}`);
                console.log(`Description: ${patch.description}`);
                console.log(`Created: ${new Date(patch.createdAt).toLocaleString()}`);
                if (patch.repository) console.log(`Repository: ${patch.repository}`);
                if (patch.branch) console.log(`Branch: ${patch.branch}`);
                if (patch.author) console.log(`Author: ${patch.author}`);
              });
            } catch (error) {
              console.error('Error listing patch files:', error);
              process.exit(1);
            }
          })
      )
      .addCommand(
        new Command('show')
          .description('Show a patch file')
          .argument('<id>', 'Patch file ID')
          .option('--content', 'Show full content')
          .action(async (id, options) => {
            try {
              debug(`Executing patch show command for ID: ${id}`);
              
              // Initialize Pioneer Engine if not already initialized
              if (!pioneerApp) {
                pioneerApp = new PioneerApp();
                await pioneerApp.init();
              }
              
              const patchFile = await pioneerApp.getPatchFile(id);
              
              if (!patchFile) {
                console.error(`Patch file with ID ${id} not found`);
                process.exit(1);
              }
              
              console.log(`Title: ${patchFile.title}`);
              console.log(`ID: ${patchFile.id}`);
              console.log(`Status: ${patchFile.status}`);
              console.log(`Description: ${patchFile.description}`);
              console.log(`Created: ${new Date(patchFile.createdAt).toLocaleString()}`);
              
              if (patchFile.appliedAt) {
                console.log(`Applied: ${new Date(patchFile.appliedAt).toLocaleString()}`);
              }
              
              if (patchFile.filePath) console.log(`File Path: ${patchFile.filePath}`);
              if (patchFile.repository) console.log(`Repository: ${patchFile.repository}`);
              if (patchFile.branch) console.log(`Branch: ${patchFile.branch}`);
              if (patchFile.author) console.log(`Author: ${patchFile.author}`);
              
              if (patchFile.metadata) {
                console.log('\nMetadata:');
                console.log(JSON.stringify(patchFile.metadata, null, 2));
              }
              
              if (options.content) {
                console.log('\nContent:');
                console.log(patchFile.content);
              }
            } catch (error) {
              console.error('Error showing patch file:', error);
              process.exit(1);
            }
          })
      )
      .addCommand(
        new Command('update-status')
          .description('Update the status of a patch file')
          .argument('<id>', 'Patch file ID')
          .argument('<status>', 'New status (e.g., applied, rejected)')
          .option('--applied', 'Mark as applied now')
          .action(async (id, status, options) => {
            try {
              debug(`Executing patch update-status command for ID: ${id}, status: ${status}`);
              
              // Initialize Pioneer Engine if not already initialized
              if (!pioneerApp) {
                pioneerApp = new PioneerApp();
                await pioneerApp.init();
              }
              
              const appliedAt = options.applied ? Date.now() : undefined;
              await pioneerApp.updatePatchFileStatus(id, status, appliedAt);
              
              console.log(`Patch file ${id} status updated to: ${status}`);
              if (appliedAt) {
                console.log(`Marked as applied at: ${new Date(appliedAt).toLocaleString()}`);
              }
            } catch (error) {
              console.error('Error updating patch file status:', error);
              process.exit(1);
            }
          })
      )
      .addCommand(
        new Command('delete')
          .description('Delete a patch file')
          .argument('<id>', 'Patch file ID')
          .action(async (id) => {
            try {
              debug(`Executing patch delete command for ID: ${id}`);
              
              // Initialize Pioneer Engine if not already initialized
              if (!pioneerApp) {
                pioneerApp = new PioneerApp();
                await pioneerApp.init();
              }
              
              const result = await pioneerApp.deletePatchFile(id);
              
              if (result) {
                console.log(`Patch file ${id} deleted successfully`);
              } else {
                console.error(`Patch file ${id} not found or could not be deleted`);
                process.exit(1);
              }
            } catch (error) {
              console.error('Error deleting patch file:', error);
              process.exit(1);
            }
          })
      );

    debug('Parsing command line arguments');
    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    debug('Error occurred during execution:', error);
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

// Start the CLI with error handling
debug('Starting main CLI function');
main().catch(error => {
  debug('Unhandled error in main:', error);
  console.error('Unhandled error:', error);
  process.exit(1);
});