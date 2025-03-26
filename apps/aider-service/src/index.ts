import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';

import { LoggingService } from './services/LoggingService';
import { AiderService } from './services/AiderService';
import createRouter from './api/router';

// Load environment variables
dotenv.config();

// Create express app
const app = express();
const PORT = process.env.PORT || 3100;

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Load OpenAPI specification
const apiSpec = path.join(__dirname, 'api/openapi.yaml');
const openApiDocument = YAML.load(apiSpec);

// Initialize services
const loggingService = new LoggingService(server);
const aiderService = new AiderService(loggingService, process.env.MONGO_URI);

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

// Set up API routes
app.use('/api', createRouter(aiderService));

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

// Start server
server.listen(PORT, async () => {
  console.log(`Aider Service running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/docs`);
  
  // Restore previous Aider states
  try {
    await aiderService.restoreStates();
    console.log('Previous Aider instances restored from database');
  } catch (error) {
    console.error('Error restoring Aider states:', error);
  }
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
