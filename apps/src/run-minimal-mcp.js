#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file and directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the path to the minimal-mcp.js file
const serverPath = path.join(__dirname, 'minimal-mcp.js');
const logFile = path.join(__dirname, 'mcp-server-debug.log');

console.log(`Starting minimal MCP server: ${serverPath}`);
console.log(`Log file will be at: ${logFile}`);

// Delete any existing log file
if (fs.existsSync(logFile)) {
  console.log('Deleting existing log file...');
  fs.unlinkSync(logFile);
}

// Start the MCP server
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log(`Server process started with PID: ${serverProcess.pid}`);

// Pipe process.stdin to serverProcess.stdin
process.stdin.pipe(serverProcess.stdin);

// Pipe serverProcess.stdout to process.stdout
serverProcess.stdout.pipe(process.stdout);

// Log serverProcess.stderr
serverProcess.stderr.on('data', (data) => {
  process.stderr.write(`[SERVER] ${data}`);
});

// Check for log file creation
const checkInterval = setInterval(() => {
  if (fs.existsSync(logFile)) {
    const logContents = fs.readFileSync(logFile, 'utf8');
    console.log('\n--- LOG FILE CONTENTS ---');
    console.log(logContents);
    console.log('--- END LOG FILE CONTENTS ---\n');
  } else {
    console.log('Log file not created yet...');
  }
}, 3000);

// Handle server process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code || 0}`);
  clearInterval(checkInterval);
  
  // Final log check
  if (fs.existsSync(logFile)) {
    const logContents = fs.readFileSync(logFile, 'utf8');
    console.log('\n--- FINAL LOG FILE CONTENTS ---');
    console.log(logContents);
    console.log('--- END FINAL LOG FILE CONTENTS ---\n');
  } else {
    console.log('Log file was never created!');
  }
  
  process.exit(code || 0);
});

// Forward signals to the child process
process.on('SIGINT', () => {
  console.log('Stopping MCP server...');
  serverProcess.kill('SIGINT');
});

console.log('MCP server running. Press Ctrl+C to stop.'); 