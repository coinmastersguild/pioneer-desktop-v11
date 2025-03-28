# Milestone 3 - Sprint 3: Connection Troubleshooting Plan

## Background

During v2 and continuing into v3, there have been persistent connectivity issues with the game client connecting to the server. The issues manifest as:
- Silent failures with no error messages
- "The cursor and single dot no errors messages"
- Game server POST methods failing

This document outlines a systematic approach to identify, troubleshoot, and fix these connectivity issues.

## Objectives

1. **Server Visibility**: Add server selection indicator in the bottom left corner of the game UI
2. **Endpoint Analysis**: Identify critical connection endpoints for game client-server communication
3. **Enhanced Health Checks**: Add comprehensive health checks for all critical endpoints
4. **Error Handling**: Implement proper error reporting and logging
5. **Fix Connection Issues**: Resolve the underlying connectivity problems

## 1. Server Selection UI Enhancement

### Tasks:
- Add persistent server indicator in bottom left corner of game UI
- Show connection status (connected/disconnected)
- Display server name and region
- Show latency information

### Implementation:
```typescript
// Add to UserInterface.ts
private _createServerIndicator(): void {
    // Create container in bottom left
    const serverContainer = new Rectangle("serverIndicator");
    serverContainer.width = "200px";
    serverContainer.height = "40px";
    serverContainer.cornerRadius = 5;
    serverContainer.color = "white";
    serverContainer.thickness = 1;
    serverContainer.background = "rgba(0,0,0,0.6)";
    serverContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    serverContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    serverContainer.paddingBottomInPixels = 10;
    serverContainer.paddingLeftInPixels = 10;
    
    // Server name text
    const serverNameText = new TextBlock("serverName");
    serverNameText.text = "Server: " + this._game.config.serverHost;
    serverNameText.color = "white";
    serverNameText.fontSize = 14;
    serverNameText.paddingTopInPixels = 5;
    serverNameText.paddingLeftInPixels = 10;
    
    // Connection status indicator
    const statusIndicator = new Ellipse("connectionStatus");
    statusIndicator.width = "10px";
    statusIndicator.height = "10px";
    statusIndicator.background = "green"; // Online
    statusIndicator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    
    // Add to container
    serverContainer.addControl(statusIndicator);
    serverContainer.addControl(serverNameText);
    
    // Add to UI
    this._fullScreenUI.addControl(serverContainer);
    
    // Update status periodically
    setInterval(() => this._updateConnectionStatus(), 5000);
}

private _updateConnectionStatus(): void {
    const statusIndicator = this._fullScreenUI.getControlByName("connectionStatus") as Ellipse;
    const serverNameText = this._fullScreenUI.getControlByName("serverName") as TextBlock;
    
    if (this._game.client && this._game.client._client.connection && this._game.client._client.connection.isOpen) {
        statusIndicator.background = "green";
        serverNameText.color = "white";
    } else {
        statusIndicator.background = "red";
        serverNameText.color = "red";
    }
}
```

## 2. Critical Connection Endpoints Identification

### Game Client Connectivity Flow:
1. Initial health check: `GET /health`
2. Authentication: `POST /login` or `GET /loginWithToken`
3. Data loading: `GET /load_game_data`
4. WebSocket connection: `ws://server:port`
5. Room joining: `game_room` and `chat_room` (via Colyseus)

### Critical Endpoints:
- **REST API Endpoints**:
  - `/health`: Server health check
  - `/login`: User authentication
  - `/loginWithToken`: Token-based authentication
  - `/check`: Token validation
  - `/load_game_data`: Game data loading
  - `/create_character`: Character creation
  - `/get_character`: Character data retrieval

- **WebSocket Endpoints**:
  - Colyseus room connection: `ws://server:port`
  - `game_room`: Main game room
  - `chat_room`: Chat functionality

## 3. Enhanced Health Checks

### Implementation Plan:
1. Create dedicated health check endpoint that tests all critical services:

```typescript
// Add to server/index.ts
app.get('/api/system/health', async (req, res) => {
    try {
        // Database health
        let dbStatus = 'error';
        let dbMessage = '';
        try {
            const dbResult = await this.database.testConnection();
            dbStatus = dbResult ? 'ok' : 'error';
        } catch (err) {
            dbStatus = 'error';
            dbMessage = err.message;
        }
        
        // Colyseus health
        const colyseusStatus = gameServer.presence ? 'ok' : 'error';
        
        // Room availability
        const rooms = await gameServer.presence.smembers('rooms');
        const roomsStatus = rooms && rooms.length > 0 ? 'ok' : 'warning';
        
        // Overall status
        const overallStatus = (dbStatus === 'ok' && colyseusStatus === 'ok') ? 'ok' : 'error';
        
        res.json({
            status: overallStatus,
            timestamp: Date.now(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '0.4.0',
            services: {
                server: {
                    status: 'ok',
                    name: process.env.SERVER_NAME || 'DegenQuest Game Server'
                },
                database: {
                    status: dbStatus,
                    message: dbMessage
                },
                colyseus: {
                    status: colyseusStatus
                },
                rooms: {
                    status: roomsStatus,
                    count: rooms ? rooms.length : 0
                }
            },
            playerCount: 0,
            maxPlayers: parseInt(process.env.MAX_PLAYERS || '100')
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});
```

2. Add client-side health check before connection attempt:

```typescript
// Add to Network.ts
public async checkServerHealth(): Promise<boolean> {
    try {
        const url = this._client.endpoint.replace('ws://', 'http://').replace('wss://', 'https://');
        const response = await fetch(`${url}/api/system/health`);
        
        if (!response.ok) {
            console.error(`Server health check failed: HTTP ${response.status}`);
            return false;
        }
        
        const data = await response.json();
        if (data.status !== 'ok') {
            console.error(`Server health check failed: ${data.status}`, data);
            return false;
        }
        
        console.log('Server health check passed:', data);
        return true;
    } catch (error) {
        console.error('Server health check error:', error);
        return false;
    }
}
```

## 4. Error Handling Improvement

### Client-Side Error Handling:

1. Enhance the Network class with better error reporting:

```typescript
// Add to Network.ts
public async joinRoomWithErrorHandling(roomId, token, character_id): Promise<any> {
    try {
        return await this._client.joinById(roomId, {
            token: token,
            character_id: character_id,
        });
    } catch (error) {
        console.error('Failed to join room:', error);
        if (error.code) {
            switch(error.code) {
                case 4212:
                    throw new Error('Room is full');
                case 4213:
                    throw new Error('Room not found');
                case 4214:
                    throw new Error('Invalid authentication');
                default:
                    throw new Error(`Connection error: ${error.message}`);
            }
        }
        throw error;
    }
}
```

2. Add a user-facing error display system:

```typescript
// Add to UserInterface.ts
public showError(message: string, duration: number = 5000): void {
    // Create error container
    const errorContainer = new Rectangle("errorContainer");
    errorContainer.width = "400px";
    errorContainer.height = "60px";
    errorContainer.cornerRadius = 5;
    errorContainer.color = "red";
    errorContainer.thickness = 1;
    errorContainer.background = "rgba(0,0,0,0.8)";
    errorContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    errorContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    errorContainer.top = "20px";
    
    // Error text
    const errorText = new TextBlock("errorText");
    errorText.text = message;
    errorText.color = "white";
    errorText.fontSize = 16;
    errorText.textWrapping = true;
    
    // Add to container
    errorContainer.addControl(errorText);
    
    // Add to UI
    this._fullScreenUI.addControl(errorContainer);
    
    // Remove after duration
    setTimeout(() => {
        this._fullScreenUI.removeControl(errorContainer);
    }, duration);
}
```

3. Create detailed logging for connection issues:

```typescript
// Add to index.ts
// Client-side logging system with verbose connection details
class ConnectionLogger {
    private static instance: ConnectionLogger;
    private logs: any[] = [];
    
    private constructor() {}
    
    public static getInstance(): ConnectionLogger {
        if (!ConnectionLogger.instance) {
            ConnectionLogger.instance = new ConnectionLogger();
        }
        return ConnectionLogger.instance;
    }
    
    public log(type: string, message: string, data?: any): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        };
        
        this.logs.push(logEntry);
        console.log(`[${type}] ${message}`, data || '');
        
        // Keep max 1000 logs
        if (this.logs.length > 1000) {
            this.logs.shift();
        }
    }
    
    public getConnectionLogs(): any[] {
        return this.logs.filter(log => 
            log.type === 'connection' || 
            log.type === 'websocket' || 
            log.type === 'colyseus'
        );
    }
    
    public downloadLogs(): void {
        const logText = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `degenquest-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export for global access
window.connectionLogger = ConnectionLogger.getInstance();
```

## 5. Fix Connection Issues

### Diagnostic Steps:
1. Verify Docker networking is configured correctly
   - Check port mappings
   - Verify WebSocket endpoints are accessible
   - Test CORS configuration

2. Check client-server protocol compatibility
   - Ensure Colyseus versions match between client and server
   - Verify WebSocket transport configuration
   - Check schema synchronization

3. Test with multiple browsers to isolate browser-specific issues

4. Add detailed connection tracing to identify exactly where failures occur

### Potential Fixes:

1. Update Docker port mappings to handle WebSocket connections:
```yaml
# docker-compose.yml
ports:
  - "2567:3000" # HTTP port
  - "2568:3000" # WebSocket fallback
```

2. Fix CORS configuration:
```typescript
// server/index.ts
app.use(cors({
  origin: '*', // In production, restrict this
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

3. Add explicit WebSocket transport configuration:
```typescript
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(app),
    pingInterval: 5000, // More frequent ping
    pingMaxRetries: 3,  // Allow more retries
  }),
});
```

4. Add connection retry logic on client:
```typescript
// Add to Network.ts
public async joinOrCreateRoomWithRetry(location, token, character_id, maxRetries = 3): Promise<any> {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            const room = await this.joinOrCreateRoom(location, token, character_id);
            console.log(`Connection successful on attempt ${attempts + 1}`);
            return room;
        } catch (error) {
            attempts++;
            console.error(`Connection attempt ${attempts} failed:`, error);
            
            if (attempts >= maxRetries) {
                throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
    }
}
```

## Implementation Timeline

### Week 1: Diagnostics and UI Improvements
- Add server selection indicator to UI
- Implement enhanced health checks
- Set up detailed connection logging

### Week 2: Error Handling and Testing
- Improve error handling in Network class
- Add user-facing error system
- Test connection with various browsers/configurations

### Week 3: Fix Implementation and Documentation
- Implement fixes based on diagnostics
- Add connection retry logic
- Document all changes and create troubleshooting guide

## Success Criteria
- Game client successfully connects to dockerized server
- Connection errors are clearly displayed to users
- All critical endpoints return appropriate status codes
- Server selection is visible and accurate
- Connection logs provide actionable information for troubleshooting

## Documentation Requirements
- Create troubleshooting guide for connection issues
- Document all API endpoints with expected status codes
- Provide network connectivity diagram
- Include Docker networking configuration guide 