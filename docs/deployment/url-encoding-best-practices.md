# URL Encoding Best Practices

## Overview

This document outlines best practices for URL encoding and handling throughout the DegenQuest application. Proper URL handling is critical for server connectivity, health checks, and seamless integration between the web portal and game client.

## Common URL Issues

Recent deployment failures have highlighted several common issues with URL handling:

1. **Missing Protocols**: URLs stored without proper protocols (http://, https://, ws://) can cause connection failures
2. **Inconsistent Formatting**: Different components handling URLs differently leads to integration problems
3. **Base64 Encoding Challenges**: Encoded URLs losing critical information during encoding/decoding
4. **Parameter Passing**: Inconsistent URL parameter handling between components

## Best Practices

### 1. URL Storage and Configuration

- **Always Include Protocol**: Store complete URLs with protocols in configuration
  ```typescript
  // CORRECT
  const serverUrl = 'http://134.199.184.182:80';
  
  // INCORRECT
  const serverUrl = '134.199.184.182:80';
  ```

- **Use Environment-Appropriate Protocols**:
  ```typescript
  // Development
  const localUrl = 'http://localhost:3000';
  
  // Production
  const prodUrl = 'https://api.degenquest.com';
  
  // WebSockets
  const wsUrl = 'ws://gameserver.degenquest.com/socket';
  ```

- **Standardize Port Usage**:
  ```typescript
  // HTTP standard ports
  const httpUrl = 'http://example.com'; // Port 80 is implicit
  const httpsUrl = 'https://example.com'; // Port 443 is implicit
  
  // Non-standard ports should be explicit
  const devUrl = 'http://localhost:3000';
  ```

### 2. URL Formatting and Validation

- **Implement a Central URL Utility Class**:
  ```typescript
  class UrlUtility {
    // Ensure URL has proper protocol
    static ensureProtocol(url: string): string {
      if (!url.includes('://')) {
        // Default to http for regular URLs
        if (url.includes('/ws') || url.includes('/socket')) {
          return `ws://${url}`;
        }
        return `http://${url}`;
      }
      return url;
    }
    
    // Validate URL structure
    static isValidUrl(url: string): boolean {
      try {
        new URL(this.ensureProtocol(url));
        return true;
      } catch {
        return false;
      }
    }
    
    // Get appropriate health check URL
    static getHealthUrl(baseUrl: string): string {
      const url = this.ensureProtocol(baseUrl);
      return `${url}/health`;
    }
  }
  ```

- **Validate URLs Before Usage**:
  ```typescript
  function connectToServer(url: string) {
    if (!UrlUtility.isValidUrl(url)) {
      console.error(`Invalid URL: ${url}`);
      return false;
    }
    
    const formattedUrl = UrlUtility.ensureProtocol(url);
    // Connect logic here
  }
  ```

### 3. Base64 Encoding/Decoding

- **Include All URL Components in Encoding**:
  ```typescript
  // CORRECT: Include protocol in encoded data
  const serverUrl = 'http://134.199.184.182:80';
  const encodedUrl = btoa(serverUrl);
  
  // INCORRECT: Encoding only hostname and port
  const serverUrl = '134.199.184.182:80';
  const encodedUrl = btoa(serverUrl);
  ```

- **Add Protocol During Decoding If Missing**:
  ```typescript
  try {
    let decodedUrl = atob(encodedServerParam);
    
    // Add protocol if missing
    if (!decodedUrl.includes('://')) {
      decodedUrl = `http://${decodedUrl}`;
    }
    
    // Now use the URL
    connectToServer(decodedUrl);
  } catch (error) {
    console.error('Failed to decode URL:', error);
  }
  ```

- **Consider Structured Data for Complex Parameters**:
  ```typescript
  // Encode structured data instead of just URL
  const serverData = {
    id: 'production',
    url: 'http://134.199.184.182:80',
    region: 'US-East'
  };
  
  const encodedData = btoa(JSON.stringify(serverData));
  
  // And when decoding:
  try {
    const decodedJson = atob(encodedData);
    const serverData = JSON.parse(decodedJson);
    connectToServer(serverData.url);
  } catch (error) {
    console.error('Failed to decode server data:', error);
  }
  ```

### 4. URL Parameters Handling

- **Use Consistent Parameter Names**:
  ```typescript
  // CORRECT: Use the same parameter names across components
  const params = {
    server: 'production',
    encodedServer: btoa('http://134.199.184.182:80'),
    token: 'demo-12345'
  };
  
  // INCORRECT: Inconsistent naming
  const params = {
    serverId: 'production',  // Different from 'server' used elsewhere
    encodedUrl: btoa('134.199.184.182:80'),  // Different from 'encodedServer'
    auth: 'demo-12345'  // Different from 'token'
  };
  ```

- **Document URL Parameter Structure**:
  ```typescript
  /**
   * Game client URL parameters
   * 
   * @param server - Server ID string (e.g., 'production')
   * @param encodedServer - Base64 encoded full server URL including protocol
   * @param token - Authentication token
   * @param showServerSelect - 'true' or 'false' to control server selection screen
   */
  ```

- **Prioritize Parameters Clearly**:
  ```typescript
  function resolveServerUrl() {
    // Clear order of precedence
    if (urlParams.get('encodedServer')) {
      // First priority: Encoded URL from parameters
      return decodeEncodedServer(urlParams.get('encodedServer'));
    }
    
    if (urlParams.get('server')) {
      // Second priority: Server ID from parameters with lookup
      return lookupServerById(urlParams.get('server'));
    }
    
    // Third priority: Stored preferences
    const savedServer = localStorage.getItem('selectedServer');
    if (savedServer) {
      return savedServer;
    }
    
    // Final fallback
    return DEFAULT_SERVER_URL;
  }
  ```

## Integration Testing

Always test URL handling with these scenarios:

1. **Direct Access**: Access with no parameters (e.g., `http://localhost:8080/`)
2. **Server ID Only**: Access with server ID (e.g., `http://localhost:8080/?server=production`)
3. **Encoded URL**: Access with encoded URL (e.g., `http://localhost:8080/?encodedServer=aHR0cDovLzEzNC4xOTkuMTg0LjE4Mjo4MA==`)
4. **Full Parameters**: Access with all parameters (e.g., `http://localhost:8080/?server=production&encodedServer=aHR0cDovLzEzNC4xOTkuMTg0LjE4Mjo4MA==&token=demo-12345&showServerSelect=false`)
5. **Cross-Origin**: Test access from different origins (web portal to game client)

## Health Check Considerations

When performing health checks on URLs:

1. **Always Use Full URL**: Include protocol, hostname, port, and path
2. **Set Appropriate Timeouts**: Use short timeouts (3-5 seconds) to avoid blocking UI
3. **Handle CORS**: Ensure CORS is configured properly for cross-origin requests
4. **Add Retry Logic**: Implement exponential backoff for transient failures

## Summary

Consistent URL handling is critical for reliable application behavior. By following these best practices for URL formatting, encoding, and validation, we can avoid the connection issues that led to previous deployment failures. Remember to always test the full connection path from web portal to game client with various parameter combinations before deploying to production. 