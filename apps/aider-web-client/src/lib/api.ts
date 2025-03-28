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
  API_URL = window.location.pathname.startsWith('/app') 
    ? '/api' // When served from /app path, use relative URL
    : 'http://localhost:3100/api'; // Direct access
}

// API client for the Aider service
export const aiderApi = {
  /**
   * Start a new Aider instance
   */
  startInstance: async (params: {
    threadId: string;
    openAIApiKey: string;
    projectRoot: string;
    model?: string;
    autoCommit?: boolean;
  }) => {
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
    const wsUrl = window.location.pathname.startsWith('/app')
      ? window.location.origin // When served from /app, use the same origin
      : 'http://localhost:3100'; // Direct access

    // Connect to the WebSocket server
    socket = io(wsUrl);

    // Join the room for this thread
    socket.emit('join', { threadId });

    // Listen for logs
    socket.on('log', onLog);

    return () => {
      if (socket) {
        socket.off('log');
        socket.disconnect();
        socket = null;
      }
    };
  },
};

export default aiderApi; 