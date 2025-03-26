import { Router, Request, Response } from 'express';
import { AiderService } from '../services/AiderService';
import { AiderState } from '../models/AiderState';

/**
 * Create API router for Aider service
 * @param aiderService The Aider service instance
 * @returns Express router
 */
export default function createRouter(aiderService: AiderService): Router {
  const router = Router();

  /**
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '1.0.0'
    });
  });

  /**
   * Get all Aider instances
   */
  router.get('/instances', (req: Request, res: Response) => {
    const statuses = aiderService.getAllStatuses();
    const instances = Array.from(statuses.values());
    
    res.json({ instances });
  });

  /**
   * Start a new Aider instance
   */
  router.post('/instances', async (req: Request, res: Response) => {
    try {
      const config = req.body;
      const threadId = req.body.threadId || `aider-${Date.now()}`;
      
      const status = await aiderService.startAider(threadId, config);
      res.status(201).json(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: errorMessage });
    }
  });

  /**
   * Get status of a specific Aider instance
   */
  router.get('/instances/:threadId', (req: Request, res: Response) => {
    const { threadId } = req.params;
    const status = aiderService.getStatus(threadId);
    
    if (!status) {
      return res.status(404).json({ error: `No Aider instance found with ID ${threadId}` });
    }
    
    res.json(status);
  });

  /**
   * Stop an Aider instance
   */
  router.delete('/instances/:threadId', async (req: Request, res: Response) => {
    try {
      const { threadId } = req.params;
      const status = await aiderService.stopAider(threadId);
      res.json(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('No Aider instance found')) {
        return res.status(404).json({ error: errorMessage });
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * Send a command to an Aider instance
   */
  router.post('/instances/:threadId/command', async (req: Request, res: Response) => {
    try {
      const { threadId } = req.params;
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({ error: 'Command required' });
      }

      const success = await aiderService.sendCommand(threadId, command);
      
      if (success) {
        res.json({ status: 'Command sent' });
      } else {
        res.status(404).json({ error: 'Process not found or cannot receive commands' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: `Command failed: ${errorMessage}` });
    }
  });

  return router;
}
