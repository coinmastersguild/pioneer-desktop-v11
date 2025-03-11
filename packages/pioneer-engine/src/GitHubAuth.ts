import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execPromise = (cmd: string, args: string[]): Promise<{stdout: string, stderr: string}> => {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    
    const process = spawn(cmd, args);
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Dummy GitHubAuth implementation for development
 */
export class GitHubAuth {
  private tokenStoragePath: string;
  private keyPrefix: string = 'pioneer';
  
  constructor(options: { appName?: string; storagePath?: string } = {}) {
    this.keyPrefix = options.appName || 'pioneer';
    this.tokenStoragePath = options.storagePath || '/tmp';
  }
  
  public async isGitConfigured(): Promise<boolean> {
    return true;
  }
  
  public async getGitUsername(): Promise<string> {
    return 'example-user';
  }
  
  public async getGitEmail(): Promise<string> {
    return 'example@example.com';
  }
  
  public async configureGitUser(name: string, email: string): Promise<boolean> {
    return true;
  }
  
  public hasGitHubToken(): boolean {
    return true;
  }
  
  public async saveGitHubToken(token: string, username: string): Promise<void> {
    // No-op for dummy implementation
  }
  
  public getGitHubToken(): { token: string, username: string } | null {
    return { token: 'fake-token', username: 'example-user' };
  }
  
  public async verifyGitHubToken(token: string): Promise<boolean> {
    return true;
  }
  
  public removeGitHubToken(): boolean {
    return true;
  }
  
  public async getGitStatus(): Promise<{ isRepo: boolean, status: string }> {
    try {
      return { isRepo: true, status: 'Clean working directory' };
    } catch (err: any) {
      // Explicit type annotation for err to avoid TS errors
      return { isRepo: false, status: err.message || 'Unknown error' };
    }
  }
} 