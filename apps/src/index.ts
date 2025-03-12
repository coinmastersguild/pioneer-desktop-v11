/**
 * Pioneer CLI - MCP Server for Cursor Integration
 */

// Get package version from package.json
import fs from 'fs';
import path from 'path';

// Load the package.json for version information
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const CLI_VERSION = packageJson.version || '0.3.1';

/**
 * Get CLI version
 */
export const getVersion = (): string => {
  return CLI_VERSION;
};

/**
 * Export for module usage
 */
export default {
  getVersion
}; 