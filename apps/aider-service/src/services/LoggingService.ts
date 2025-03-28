import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for LogMessage
 */
interface LogMessage {
  id: string;
  timestamp: Date;
  threadId: string;
  content: string;
  level: 'info' | 'error' | 'debug';
}

/**
 * Interface for socket join data
 */
interface JoinData {
  threadId: string;
}

/**
 * Service for collecting and broadcasting logs
 */
export class LoggingService {
  private io: SocketServer;
  private clients: Map<string, Set<Socket>> = new Map();
  
  // In-memory log buffer (could be replaced with a persistent store)
  private messageBuffer: Map<string, LogMessage[]> = new Map();
  private bufferSize = 500; // Max messages per thread
  
  /**
   * Create a new logging service
   * @param server HTTP server to attach socket.io to
   */
  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3100'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    console.log('LoggingService initialized with WebSocket server');
    
    this.setupSocketHandlers();
  }
  
  /**
   * Set up socket.io event handlers
   */
  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('New WebSocket connection established, total clients:', this.getTotalClients() + 1);
      
      socket.on('join', (data: JoinData) => {
        if (!data.threadId) {
          console.error('Join request missing threadId');
          return;
        }
        
        const threadId = data.threadId;
        
        // Add socket to client set for this thread
        if (!this.clients.has(threadId)) {
          this.clients.set(threadId, new Set());
        }
        
        this.clients.get(threadId)?.add(socket);
        
        console.log(`Client joined thread: ${threadId}, clients for thread: ${this.clients.get(threadId)?.size}`);
        
        // Send welcome message
        socket.emit('log', {
          source: 'system',
          message: `Connected to thread: ${threadId}`
        });
      });
      
      socket.on('disconnect', () => {
        // Remove socket from all thread client sets
        for (const [threadId, clients] of this.clients.entries()) {
          if (clients.has(socket)) {
            clients.delete(socket);
            console.log(`Client removed from thread: ${threadId}, remaining clients: ${clients.size}`);
            
            // Clean up empty sets
            if (clients.size === 0) {
              this.clients.delete(threadId);
            }
          }
        }
        
        console.log('WebSocket connection closed, remaining clients:', this.getTotalClients());
      });
    });
  }
  
  /**
   * Broadcast a log message to all clients for a thread
   * @param threadId Thread to broadcast to
   * @param message Log message
   * @param source Source of the message (user, aider, error, system, info)
   */
  public broadcastLog(threadId: string, message: string, source: 'user' | 'aider' | 'error' | 'system' | 'info' = 'aider') {
    const clients = this.clients.get(threadId);
    
    if (!clients || clients.size === 0) {
      // No clients connected for this thread
      return;
    }
    
    const logMessage = {
      source,
      message
    };
    
    // Broadcast to all clients for this thread
    for (const client of clients) {
      client.emit('log', logMessage);
    }

    // Also store in the buffer
    this.addToBuffer(threadId, {
      id: uuidv4(),
      timestamp: new Date(),
      threadId,
      content: message,
      level: source === 'error' ? 'error' : 'info'
    });
  }
  
  /**
   * Get the total number of connected clients across all threads
   * @returns Total client count
   */
  private getTotalClients(): number {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.size;
    }
    return total;
  }

  /**
   * Add a message to the buffer for a thread
   * @param threadId Thread ID
   * @param message Message to add
   */
  private addToBuffer(threadId: string, message: LogMessage): void {
    // Get or create buffer for this thread
    let threadBuffer = this.messageBuffer.get(threadId) || [];
    
    // Add message to beginning for newest-first order
    threadBuffer.unshift(message);
    
    // Trim buffer if needed
    if (threadBuffer.length > this.bufferSize) {
      threadBuffer = threadBuffer.slice(0, this.bufferSize);
    }
    
    // Update buffer
    this.messageBuffer.set(threadId, threadBuffer);
  }
}
