import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { LoggingService } from './services/LoggingService';
import { AiderService } from './services/AiderService';
import createRouter from './api/router';

// Load environment variables from both root and local .env files
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create express app
const app = express();
const PORT = process.env.PORT || 3100;
const NEXT_APP_PORT = process.env.NEXT_APP_PORT || 3000;

// Configuration for the default Pioneer repository
const PIONEER_REPO_URL = 'https://github.com/coinmastersguild/pioneer-desktop-v11';
const PIONEER_THREAD_ID = 'pioneer-desktop-v11';

// Set up middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3100'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Load OpenAPI specification
const apiSpec = path.join(__dirname, 'api/openapi.yaml');
const openApiDocument = YAML.load(apiSpec);

// Use MONGO_CONNECTION environment variable if available, fallback to MONGO_URI
const mongoConnectionString = process.env.MONGO_CONNECTION || process.env.MONGO_URI;
if (mongoConnectionString) {
  console.log('MongoDB connection string found');
} else {
  console.warn('No MongoDB connection string found in environment variables');
}

// Initialize services
const loggingService = new LoggingService(server);
const aiderService = new AiderService(loggingService, mongoConnectionString);

// Set up Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Serve OpenAPI spec in JSON format
app.get('/openapi.json', (req, res) => {
  res.json(openApiDocument);
});

// Set up API validation middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
  })
);

// Extend the health check endpoint to include the pioneer thread status
function extendHealthCheck(router: express.Router) {
  const originalRouter = router;
  
  const wrappedRouter = express.Router();
  
  // Wrap the health endpoint to add pioneer thread information
  wrappedRouter.use((req, res, next) => {
    const originalJson = res.json;
    
    // Only intercept the health check endpoint
    if (req.path === '/health') {
      res.json = function(body) {
        // Add pioneer thread info to response
        const pioneerStatus = aiderService.getStatus(PIONEER_THREAD_ID);
        
        if (body && typeof body === 'object') {
          body.pioneerThread = {
            status: pioneerStatus ? pioneerStatus.state : 'NOT_RUNNING',
            threadId: PIONEER_THREAD_ID
          };
          
          // If pioneer thread isn't running, set status to DEGRADED
          if (!pioneerStatus || pioneerStatus.state !== 'RUNNING') {
            body.status = 'DEGRADED';
            if (!body.components) body.components = {};
            body.components.pioneerThread = {
              status: 'DOWN',
              details: { message: 'Pioneer self-improvement thread not running' }
            };
          } else {
            if (!body.components) body.components = {};
            body.components.pioneerThread = {
              status: 'UP',
              details: { message: 'Pioneer self-improvement thread running' }
            };
          }
        }
        
        return originalJson.call(this, body);
      };
    }
    
    next();
  });
  
  // Use the original router
  wrappedRouter.use(originalRouter);
  
  return wrappedRouter;
}

// Set up API routes with extended health check
const apiRouter = createRouter(aiderService);
app.use('/api', extendHealthCheck(apiRouter));

// Proxy requests to the Next.js app
app.use(['/', '/app', '/_next', '/favicon.ico', '/static'], createProxyMiddleware({
  target: `http://localhost:${NEXT_APP_PORT}`,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/app': '', // Remove the '/app' prefix when forwarding to Next.js
    '^/$': ''    // Handle root path
  },
  // @ts-ignore - type definitions for http-proxy-middleware are not fully compatible
  onProxyReq: (proxyReq: any, req: any, res: any) => {
    // Modify the origin header to avoid CORS issues
    proxyReq.setHeader('Origin', `http://localhost:${NEXT_APP_PORT}`);
    console.log(`Proxying request: ${req.method} ${req.url} to http://localhost:${NEXT_APP_PORT}${req.url.replace(/^\/app/, '')}`);
  },
  // @ts-ignore - type definitions for http-proxy-middleware are not fully compatible
  onError: (err: Error, req: express.Request, res: express.Response) => {
    console.error('Proxy error:', err);
    res.status(500).send(`Next.js app is not running. Please start it with "npm run dev" in the aider-web-client-new directory. Error: ${err.message}`);
  },
  logLevel: 'debug'
}));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Handle validation errors
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message,
      errors: err.errors
    });
  }
  
  // Handle other errors
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Global variables for retry mechanism
let pioneerRetryCount = 0;
const MAX_PIONEER_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// Function to start the pioneer self-improvement thread
async function startPioneerThread() {
  try {
    // Check if pioneer thread already exists and is running
    const existingStatus = aiderService.getStatus(PIONEER_THREAD_ID);
    
    if (existingStatus && existingStatus.state === 'RUNNING') {
      console.log('Pioneer self-improvement thread is already running');
      // Reset retry counter when thread is running
      pioneerRetryCount = 0;
      return;
    }
    
    // If we've reached the max retries, wait longer before trying again
    if (pioneerRetryCount >= MAX_PIONEER_RETRIES) {
      console.log(`Pioneer thread has failed ${pioneerRetryCount} times. Waiting longer before retrying...`);
      setTimeout(() => {
        pioneerRetryCount = 0; // Reset counter after long wait
        startPioneerThread();
      }, RETRY_DELAY_MS * 10);
      return;
    }
    
    console.log(`Starting pioneer self-improvement thread (attempt ${pioneerRetryCount + 1})...`);
    
    // Get OpenAI API key from environment
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      console.error('Failed to start pioneer thread: OPENAI_API_KEY environment variable is not set');
      return;
    }
    
    // Start the pioneer thread
    await aiderService.startAider(PIONEER_THREAD_ID, {
      githubUrl: PIONEER_REPO_URL,
      model: 'gpt-4',
      autoCommit: true,
      openAIApiKey
    });
    
    console.log('Pioneer self-improvement thread started successfully');
    
    // Reset retry counter on successful start
    pioneerRetryCount = 0;
    
    // Send initial message to start the improvement process
    setTimeout(async () => {
      try {
        // Log a message directly to terminal
        console.log('Sending initial command to Pioneer thread...');
        
        // Broadcast the message to all connected clients for this thread
        loggingService.broadcastLog(
          PIONEER_THREAD_ID,
          'Starting Pioneer self-improvement process...',
          'system'
        );
        
        await aiderService.sendCommand(
          PIONEER_THREAD_ID, 
          'Follow guild protocol to continually improve this repository. ' +
          'Look for ways to enhance code quality, fix bugs, and improve the developer experience.'
        );
        
        console.log('Initial command sent to Pioneer thread');
      } catch (error) {
        console.error('Failed to send initial command to pioneer thread:', error);
        
        // Try to log the error to connected clients
        loggingService.broadcastLog(
          PIONEER_THREAD_ID,
          `Error sending command: ${error instanceof Error ? error.message : String(error)}`,
          'error'
        );
      }
    }, 5000); // Wait 5 seconds before sending the command
    
  } catch (error) {
    console.error('Failed to start pioneer thread:', error);
    
    // Try to log the error to connected clients
    loggingService.broadcastLog(
      PIONEER_THREAD_ID,
      `Error starting thread: ${error instanceof Error ? error.message : String(error)}`,
      'error'
    );
    
    // Increment retry counter and try again after delay
    pioneerRetryCount++;
    console.log(`Will retry starting Pioneer thread in ${RETRY_DELAY_MS/1000} seconds (attempt ${pioneerRetryCount + 1})`);
    setTimeout(startPioneerThread, RETRY_DELAY_MS);
  }
}

// Set up a watcher to restart the Pioneer thread if it fails
function setupPioneerThreadWatcher() {
  const checkInterval = 30000; // Check every 30 seconds
  
  console.log(`Setting up Pioneer thread watcher to check every ${checkInterval/1000} seconds`);
  
  setInterval(() => {
    const status = aiderService.getStatus(PIONEER_THREAD_ID);
    
    if (!status || status.state !== 'RUNNING') {
      console.log('Pioneer thread is not running. Attempting to restart...');
      startPioneerThread().catch(err => {
        console.error('Error in watcher when trying to restart Pioneer thread:', err);
      });
    }
  }, checkInterval);
}

// Start server
server.listen(PORT, () => {
  console.log(`Aider service listening on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/docs`);
  
  // Restore previously saved states
  aiderService.restoreStates().catch(err => {
    console.error('Failed to restore states:', err);
  });
  
  // Start the pioneer self-improvement thread
  startPioneerThread().catch(err => {
    console.error('Failed to start pioneer thread:', err);
  });
  
  // Set up watcher to restart Pioneer thread if it fails
  setupPioneerThreadWatcher();
});

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('Shutting down Aider Service...');
  // Get all instances and try to stop them gracefully
  const instances = aiderService.getAllStatuses();
  
  for (const [threadId] of instances) {
    try {
      await aiderService.stopAider(threadId);
      console.log(`Stopped Aider instance ${threadId}`);
    } catch (error) {
      console.error(`Error stopping Aider instance ${threadId}:`, error);
    }
  }
  
  console.log('Shutdown complete');
  process.exit(0);
}
