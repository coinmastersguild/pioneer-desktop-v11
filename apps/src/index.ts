/**
 * Pioneer CLI utility functions
 */

/**
 * Simple placeholder for version check
 */
export const getVersion = (): string => {
  return '0.2.2';
};

/**
 * Export empty class to maintain compatibility
 */
export class PioneerCLI {
  constructor(_options: any = {}) {
    // No initialization needed for simplified version
    // Parameter prefixed with underscore to indicate it's intentionally unused
  }
  
  getEngineVersion(): string {
    return 'Not available in standalone mode';
  }
}

export default PioneerCLI; 