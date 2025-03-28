import axios from 'axios';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// API URL - hardcoded to Docker service
// Since we can't use window on the server side, we'll use a default URL
// and update it on the client side
const DEFAULT_API_URL = 'http://localhost:3100/api';
let API_URL = DEFAULT_API_URL;

// Update the API URL on the client side
if (typeof window !== 'undefined') {
  // In development, always use the absolute URL to avoid CORS issues with different ports
  API_URL = 'http://localhost:3100/api';
  
  // For production or when served from the same domain
  // API_URL = window.location.pathname.startsWith('/app') 
  //   ? '/api' // When served from /app path, use relative URL
  //   : 'http://localhost:3100/api'; // Direct access
}

// Ensure axios always sends credentials
axios.defaults.withCredentials = true;

// Interface for instance creation
export interface StartInstanceParams {
  threadId: string;
  githubUrl?: string;
  openAIApiKey?: string;
  projectRoot?: string;
  model?: string;
  autoCommit?: boolean;
}

// API client for the Aider service
export const aiderApi = {
  /**
   * Start a new Aider instance
   */
  startInstance: async (params: StartInstanceParams) => {
    try {
      const response = await axios.post(`${API_URL}/instances`, params);
      return response.data;
    } catch (error) {
      console.error('Error starting Aider instance:', error);
      throw error;
    }
  },

  /**
   * Get the status of an Aider instance
   */
  getInstanceStatus: async (threadId: string) => {
    try {
      const response = await axios.get(`${API_URL}/instances/${threadId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Aider instance status:', error);
      throw error;
    }
  },

  /**
   * Send a command to an Aider instance
   */
  sendCommand: async (threadId: string, command: string) => {
    try {
      const response = await axios.post(`${API_URL}/instances/${threadId}/command`, {
        command,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending command to Aider instance:', error);
      throw error;
    }
  },

  /**
   * Stop an Aider instance
   */
  stopInstance: async (threadId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/instances/${threadId}`);
      return response.data;
    } catch (error) {
      console.error('Error stopping Aider instance:', error);
      throw error;
    }
  },

  /**
   * Get list of all Aider instances
   */
  getAllInstances: async () => {
    try {
      const response = await axios.get(`${API_URL}/instances`);
      return response.data;
    } catch (error) {
      console.error('Error getting all Aider instances:', error);
      throw error;
    }
  },

  /**
   * Check if the Aider service is healthy
   */
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking Aider service health:', error);
      throw error;
    }
  },

  /**
   * Connect to the WebSocket server for real-time logs
   */
  connectWebSocket: (threadId: string, onLog: (data: any) => void) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.warn('WebSocket connection can only be established on the client side');
      return () => {}; // Return empty cleanup function for server side
    }

    if (socket) {
      socket.disconnect();
    }

    // Determine the WebSocket URL based on the current path
    const wsUrl = 'http://localhost:3100'; // Always use direct access in development
    console.log(`Connecting to WebSocket at ${wsUrl} for thread ${threadId}`);

    // Connect to the WebSocket server with retry
    socket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Add event listeners for connection status
    socket.on('connect', () => {
      console.log(`WebSocket connected successfully to ${wsUrl}`);
      // Join the room for this thread
      if (socket) {
        socket.emit('join', { threadId });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      onLog({
        source: 'system',
        message: `Connection error: ${err.message}. Trying to reconnect...`
      });
    });

    socket.on('disconnect', (reason) => {
      console.warn(`WebSocket disconnected: ${reason}`);
      onLog({
        source: 'system',
        message: `Disconnected from server: ${reason}`
      });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      // Re-join the room after reconnection
      if (socket) {
        socket.emit('join', { threadId });
      }
      onLog({
        source: 'system',
        message: `Reconnected to server`
      });
    });

    // Listen for logs
    socket.on('log', onLog);

    return () => {
      if (socket) {
        socket.off('log');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.disconnect();
        socket = null;
      }
    };
  },
};

export default aiderApi; 