import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { AiderState, AiderStatus } from '../models/AiderState';
import { LoggingService } from './LoggingService';
import { MongoClient } from 'mongodb';

/**
 * Configuration for Aider instances
 */
export interface AiderConfiguration {
  openAIApiKey?: string;
  githubToken?: string;
  model?: string;
  projectRoot?: string;
  githubUrl?: string;
  allowedFileTypes?: string[];
  autoCommit?: boolean;
}

/**
 * Instance state for database storage
 */
interface AiderInstanceState {
  threadId: string;
  status: AiderStatus;
  lastActivity: Date;
  configuration: AiderConfiguration;
}

/**
 * Service to manage Aider AI assistant instances
 */
export class AiderService {
  private instances: Map<string, {
    process: ChildProcess | null;
    status: AiderStatus;
    configuration: AiderConfiguration;
    lastActivity: Date;
  }> = new Map();
  
  private aiderRoot: string;
  private loggingService: LoggingService;
  private static readonly STATE_COLLECTION = 'aider_states';
  private mongoUri?: string;
  private mongoClient: MongoClient | null = null;
  private dbConnected: boolean = false;

  /**
   * Create a new AiderService
   * @param loggingService Service for logging and broadcasting messages
   * @param mongoUri Optional MongoDB connection URI for state persistence
   */
  constructor(loggingService: LoggingService, mongoUri?: string) {
    // Check possible locations for Aider
    const possiblePaths = [
      '/app/aider', // Docker mounted path
      path.resolve(__dirname, '../../../..', 'aider'), // Local dev path
      path.resolve(__dirname, '../../..', 'aider'), // Alternative path
      '/aider' // Another possible Docker path
    ];
    
    // Find the first valid path
    this.aiderRoot = possiblePaths.find(p => fs.existsSync(p)) || '';
    
    this.loggingService = loggingService;
    this.mongoUri = mongoUri;
    
    // Validate Aider installation
    if (!this.aiderRoot) {
      console.error('Tried these paths for Aider:', possiblePaths);
      throw new Error(`Aider not found. Run 'git submodule update --init --recursive'`);
    }
    
    console.log(`Using Aider installation at: ${this.aiderRoot}`);

    // Initialize database connection if URI provided
    if (mongoUri) {
      this.initDbConnection(mongoUri).catch(err => {
        console.error('Failed to initialize database connection:', err);
      });
    }
  }

  /**
   * Check and install required Python dependencies for Aider
   * @returns Promise that resolves when dependencies are installed
   */
  private async checkAndInstallDependencies(): Promise<void> {
    console.log('Checking for required Python dependencies...');
    
    return new Promise<void>((resolve, reject) => {
      const { exec } = require('child_process');
      
      // Install required packages with pip
      const cmd = `cd ${this.aiderRoot} && pip install pydub pyaudio`;
      
      console.log(`Installing dependencies: ${cmd}`);
      
      exec(cmd, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Error installing Python dependencies: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          // Continue anyway, as some systems might not need these packages
          resolve();
          return;
        }
        
        console.log(`Dependencies installed successfully: ${stdout}`);
        if (stderr) console.error(`Install stderr: ${stderr}`);
        resolve();
      });
    });
  }

  /**
   * Apply patches to the Aider source code
   * @private
   */
  private async applyPatches(): Promise<void> {
    console.log('Applying patches to Aider source code...');
    
    return new Promise<void>((resolve, reject) => {
      const { exec } = require('child_process');
      const patchScript = path.join(__dirname, '../patches/apply-patches.js');
      
      // Check if patch script exists
      if (!fs.existsSync(patchScript)) {
        console.warn(`Patch script not found: ${patchScript}`);
        resolve();
        return;
      }
      
      // Run the patch script
      exec(`node ${patchScript}`, (error: any, stdout: string, stderr: string) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        if (error) {
          console.error(`Error applying patches: ${error.message}`);
          // Continue anyway to avoid blocking the service
          resolve();
          return;
        }
        
        console.log('Patches applied successfully');
        resolve();
      });
    });
  }

  /**
   * Start Aider instance for a given thread
   * @param threadId Unique identifier for this Aider instance
   * @param config Configuration for this Aider instance
   * @returns Status of the started instance
   */
  public async startAider(threadId: string, config: AiderConfiguration): Promise<AiderStatus> {
    // Apply patches first
    try {
      await this.applyPatches();
    } catch (error) {
      console.warn('Failed to apply patches, continuing anyway:', error);
    }
    
    // Check and install dependencies
    try {
      await this.checkAndInstallDependencies();
    } catch (error) {
      console.warn('Failed to install dependencies, continuing anyway:', error);
    }
    
    // If githubUrl is provided but no projectRoot, 
    // use a standard location based on the repository name
    if (config.githubUrl && !config.projectRoot) {
      // Extract repository name from GitHub URL
      const urlParts = config.githubUrl.split('/');
      const repoName = urlParts[urlParts.length - 1];
      
      // Set standard project directory
      config.projectRoot = `/tmp/aider-repos/${repoName}`;
      
      // Clone repository if needed
      try {
        // Check if directory exists
        if (!fs.existsSync(config.projectRoot)) {
          console.log(`Cloning repository ${config.githubUrl} to ${config.projectRoot}`);
          
          // Create directory if it doesn't exist
          fs.mkdirSync('/tmp/aider-repos', { recursive: true });
          
          // Clone repository
          const { exec } = require('child_process');
          await new Promise((resolve, reject) => {
            exec(`git clone ${config.githubUrl} ${config.projectRoot}`, (error: any, stdout: string, stderr: string) => {
              if (error) {
                console.error(`Error cloning repository: ${error.message}`);
                reject(error);
                return;
              }
              console.log(`Repository cloned successfully: ${stdout}`);
              if (stderr) console.error(`Clone stderr: ${stderr}`);
              resolve(stdout);
            });
          });
        } else {
          console.log(`Repository directory already exists: ${config.projectRoot}`);
          
          // Pull latest changes
          const { exec } = require('child_process');
          await new Promise((resolve, reject) => {
            exec(`cd ${config.projectRoot} && git pull`, (error: any, stdout: string, stderr: string) => {
              if (error) {
                console.error(`Error pulling repository: ${error.message}`);
                reject(error);
                return;
              }
              console.log(`Repository updated successfully: ${stdout}`);
              if (stderr) console.error(`Pull stderr: ${stderr}`);
              resolve(stdout);
            });
          });
        }
      } catch (error) {
        console.error('Error preparing repository:', error);
        throw new Error(`Failed to prepare repository: ${error}`);
      }
    }
    
    // Use default OpenAI API key if not provided
    if (!config.openAIApiKey) {
      config.openAIApiKey = process.env.OPENAI_API_KEY || '';
      if (!config.openAIApiKey) {
        throw new Error('OpenAI API key is required but not provided');
      }
    }
    
    // Validate configuration
    this.validateConfig(config);

    // Check if instance already exists
    if (this.instances.has(threadId)) {
      const existing = this.instances.get(threadId)!;
      if (existing.process && existing.status.state === AiderState.RUNNING) {
        throw new Error(`Aider instance with ID ${threadId} is already running`);
      }
    }

    try {
      // Build command-line arguments for command interpreter
      const args = [
        '-m', 'aider.command_interpreter',  // Use our command interpreter
        config.projectRoot || '',  // Pass project root as positional argument
        '--model', config.model || 'gpt-4',
        '--verbose',
        '--no-voice'  // Disable voice support to avoid dependency issues
      ];
      
      if (config.autoCommit) {
        args.push('--auto-commit');
      }
      
      // Execute Aider with command interpreter
      const aiderProcess = spawn('python3', args, {
        cwd: this.aiderRoot,  // Run from aider directory where the module is
        env: {
          ...process.env,
          OPENAI_API_KEY: config.openAIApiKey,
          GITHUB_TOKEN: config.githubToken || '',
          AIDER_PROJECT_ROOT: config.projectRoot || '', // Also pass as environment variable
          AIDER_VOICE_DISABLED: 'True' // Force disable voice module
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Validate that the process started correctly
      if (!aiderProcess.pid) {
        throw new Error('Failed to start Aider process');
      }
      
      // Create initial status
      const status: AiderStatus = {
        state: AiderState.RUNNING,
        diagnosticMessage: 'Aider started successfully',
        threadId,
        configuration: { ...config, openAIApiKey: '***' } // Mask API key in status
      };
      
      // Store the running instance
      this.instances.set(threadId, {
        process: aiderProcess,
        status,
        configuration: config,
        lastActivity: new Date()
      });
      
      // Set up output parsers for JSON responses
      let buffer = '';
      
      aiderProcess.stdout.on('data', (data) => {
        const text = data.toString();
        buffer += text;
        
        // Check if we have complete JSON in the buffer
        if (this.isCompleteJson(buffer)) {
          try {
            const response = JSON.parse(buffer);
            // Process structured response
            this.handleStructuredResponse(threadId, response);
            // Clear buffer after successful parsing
            buffer = '';
          } catch (error) {
            // Not a JSON response or malformed JSON
            // Log the raw output and continue accumulating
            this.loggingService.broadcastLog(threadId, text);
          }
        } else if (text.includes('\n')) {
          // If we have newlines but not complete JSON, it's probably regular output
          this.loggingService.broadcastLog(threadId, text);
          buffer = ''; // Clear non-JSON buffer
        }
      });
      
      aiderProcess.stderr.on('data', (data) => {
        const errorText = data.toString();
        console.error(`Aider error (${threadId}):`, errorText);
        this.loggingService.broadcastLog(threadId, `ERROR: ${errorText}`, 'error');
      });
      
      // Handle process exit
      aiderProcess.on('exit', (code, signal) => {
        console.log(`Aider process for thread ${threadId} exited with code ${code} and signal ${signal || 'none'}`);
        
        const instance = this.instances.get(threadId);
        if (instance) {
          instance.status.state = code === 0 ? AiderState.COMPLETED : AiderState.HALTED;
          instance.status.diagnosticMessage = code === 0 
            ? 'Completed successfully' 
            : `Process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
          instance.process = null;
          
          this.loggingService.broadcastLog(
            threadId, 
            `Aider process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`,
            code === 0 ? 'system' : 'error'
          );
          
          this.persistState(threadId);
        }
      });
      
      // Wait a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Persist the initial state
      await this.persistState(threadId);
      
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const status: AiderStatus = {
        state: AiderState.HALTED,
        diagnosticMessage: `Failed to start Aider: ${errorMessage}`,
        threadId,
        configuration: config
      };
      
      // Still record the failed attempt
      this.instances.set(threadId, {
        process: null,
        status,
        configuration: config,
        lastActivity: new Date()
      });
      
      await this.persistState(threadId);
      throw error;
    }
  }
  
  /**
   * Check if a string contains a complete JSON object
   * @param str String to check
   * @private
   */
  private isCompleteJson(str: string): boolean {
    try {
      // Try to parse the string as JSON
      JSON.parse(str);
      // If parsing succeeds and the string starts with '{' and ends with '}', it's complete JSON
      return str.trim().startsWith('{') && str.trim().endsWith('}');
    } catch (e) {
      // If parsing fails, it's not complete JSON
      return false;
    }
  }

  /**
   * Handle a structured response from the command interpreter
   * @param threadId Thread ID that produced the response
   * @param response Structured response object
   * @private
   */
  private handleStructuredResponse(threadId: string, response: any): void {
    // Log the main output
    if (response.output) {
      this.loggingService.broadcastLog(threadId, response.output);
    }
    
    // Log any errors
    if (response.error) {
      this.loggingService.broadcastLog(threadId, `ERROR: ${response.error}`, 'error');
    }
    
    // Log any warnings
    if (response.warnings && response.warnings.length > 0) {
      for (const warning of response.warnings) {
        this.loggingService.broadcastLog(threadId, `WARNING: ${warning}`, 'system');
      }
    }
    
    // Log file changes
    if (response.files_changed && response.files_changed.length > 0) {
      this.loggingService.broadcastLog(
        threadId, 
        `Files changed: ${response.files_changed.join(', ')}`,
        'system'
      );
    }
  }

  /**
   * Stop a running Aider instance
   * @param threadId The thread ID to stop
   * @returns Updated status of the stopped instance
   */
  public async stopAider(threadId: string): Promise<AiderStatus> {
    const instance = this.instances.get(threadId);
    
    if (!instance) {
      throw new Error(`No Aider instance found with ID ${threadId}`);
    }
    
    try {
      // If process is running, kill it
      if (instance.process) {
        instance.process.kill();
        
        // Update status
        instance.status.state = AiderState.HALTED;
        instance.status.diagnosticMessage = 'Stopped by user request';
        instance.process = null;
        
        this.loggingService.broadcastLog(threadId, `Aider process exited with code ${0}`);
        this.persistState(threadId);
      }
      
      await this.persistState(threadId);
      return instance.status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.loggingService.broadcastLog(threadId, `Error stopping Aider: ${errorMessage}`);
      throw error;
    }
  }
  
  /**
   * Get the current status of an Aider instance
   * @param threadId Thread ID to check
   * @returns Current status of the specified instance
   */
  public getStatus(threadId: string): AiderStatus | null {
    const instance = this.instances.get(threadId);
    if (!instance) return null;
    return instance.status;
  }
  
  /**
   * Get the status of all Aider instances
   * @returns Map of thread IDs to their statuses
   */
  public getAllStatuses(): Map<string, AiderStatus> {
    const statuses = new Map<string, AiderStatus>();
    this.instances.forEach((instance, threadId) => {
      statuses.set(threadId, instance.status);
    });
    return statuses;
  }
  
  /**
   * Send a command to a running Aider instance
   * @param threadId The thread ID to send the command to
   * @param command The command text to send
   * @returns Whether the command was sent successfully
   */
  public async sendCommand(threadId: string, command: string): Promise<boolean> {
    const instance = this.instances.get(threadId);
    if (!instance?.process?.stdin) return false;
    
    return new Promise<boolean>((resolve) => {
      // Format command for our command interface
      // If it's a / command, send it directly, otherwise format as JSON
      const formattedCommand = command.startsWith('/') 
        ? command + '\n' 
        : JSON.stringify({ command }) + '\n';

      instance.process!.stdin!.write(formattedCommand, (err) => {
        if (err) {
          this.loggingService.broadcastLog(threadId, `Error sending command: ${err.message}`, 'error');
          resolve(false);
        } else {
          // Update last activity time
          instance.lastActivity = new Date();
          this.persistState(threadId);
          
          // Log the command
          this.loggingService.broadcastLog(threadId, `Command sent: ${command}`);
          resolve(true);
        }
      });
    });
  }
  
  /**
   * Load previously saved states from the database
   */
  public async restoreStates(): Promise<void> {
    if (!this.mongoUri) return;
    
    try {
      const client = new MongoClient(this.mongoUri);
      await client.connect();
      
      const states = await client.db()
        .collection<AiderInstanceState>(AiderService.STATE_COLLECTION)
        .find({})
        .toArray();
      
      for (const state of states) {
        // Restore state but mark as not running
        if (state.status.state === AiderState.RUNNING) {
          state.status.state = AiderState.HALTED;
          state.status.diagnosticMessage = 'Process terminated during service restart';
        }
        
        this.instances.set(state.threadId, {
          process: null,
          status: state.status,
          configuration: state.configuration,
          lastActivity: state.lastActivity
        });
      }
      
      await client.close();
      console.log(`Restored ${states.length} Aider instances from database`);
    } catch (error) {
      console.error('Failed to restore Aider states:', error);
    }
  }
  
  /**
   * Validate Aider configuration
   * @param config Configuration to validate
   */
  private validateConfig(config: AiderConfiguration): void {
    if (!config.openAIApiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    if (!config.projectRoot) {
      throw new Error('Project root is required');
    }
    
    // Check if the project root exists
    if (!fs.existsSync(config.projectRoot)) {
      throw new Error(`Project root directory does not exist: ${config.projectRoot}`);
    }
    
    // Check if it's a Git repository
    const gitDir = path.join(config.projectRoot, '.git');
    if (!fs.existsSync(gitDir)) {
      throw new Error(`Project root is not a Git repository: ${config.projectRoot}`);
    }
  }
  
  /**
   * Persist an instance state to the database
   * @param threadId Thread ID to persist
   */
  private async persistState(threadId: string): Promise<void> {
    if (!this.mongoUri) return;
    
    const instance = this.instances.get(threadId);
    if (!instance) return;
    
    try {
      const client = new MongoClient(this.mongoUri);
      await client.connect();
      
      await client.db()
        .collection<AiderInstanceState>(AiderService.STATE_COLLECTION)
        .updateOne(
          { threadId },
          { 
            $set: {
              threadId,
              status: instance.status,
              configuration: instance.configuration,
              lastActivity: instance.lastActivity
            } 
          },
          { upsert: true }
        );
      
      await client.close();
    } catch (error) {
      console.error(`Failed to persist state for thread ${threadId}:`, error);
    }
  }

  /**
   * Check if the database is connected
   * @returns Whether the database is connected
   */
  public isDatabaseConnected(): boolean {
    return this.dbConnected;
  }

  /**
   * Initialize database connection
   * @param uri MongoDB connection URI
   */
  private async initDbConnection(uri: string): Promise<void> {
    try {
      this.mongoClient = new MongoClient(uri);
      await this.mongoClient.connect();
      // Test connection with a simple command
      await this.mongoClient.db().command({ ping: 1 });
      this.dbConnected = true;
      console.log('MongoDB connection established successfully');
    } catch (error) {
      this.dbConnected = false;
      console.error('MongoDB connection failed:', error);
    }
  }
}
