import { Command } from 'commander';
import { createInterface } from 'readline';
import { GitHubAuth } from 'pioneer-engine';
import chalk from 'chalk';

/**
 * Create a readline interface for user input
 */
function createPrompt() {
  return createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Register the auth command with Commander
 */
export function registerAuthCommand(program: Command) {
  const auth = program
    .command('auth')
    .description('Manage GitHub authentication');

  auth
    .command('status')
    .description('Check GitHub authentication status')
    .action(async () => {
      await checkAuthStatus();
    });

  auth
    .command('login')
    .description('Login with GitHub')
    .action(async () => {
      await loginWithGitHub();
    });

  auth
    .command('logout')
    .description('Logout from GitHub')
    .action(async () => {
      await logoutFromGitHub();
    });

  auth
    .command('setup-git')
    .description('Setup Git user configuration')
    .action(async () => {
      await setupGitConfig();
    });
}

/**
 * Check the authentication status of Git and GitHub
 */
async function checkAuthStatus() {
  const auth = new GitHubAuth();
  
  // Check Git configuration
  const isGitConfigured = await auth.isGitConfigured();
  
  if (isGitConfigured) {
    const username = await auth.getGitUsername();
    const email = await auth.getGitEmail();
    
    console.log(chalk.green('✓ Git is configured'));
    console.log(`  Username: ${chalk.blue(username)}`);
    console.log(`  Email: ${chalk.blue(email)}`);
  } else {
    console.log(chalk.red('✗ Git is not configured'));
    console.log(`  Run ${chalk.yellow('pnpm pioneer-cli auth setup-git')} to set up Git`);
  }
  
  // Check GitHub token
  const hasToken = auth.hasGitHubToken();
  const tokenInfo = auth.getGitHubToken();
  
  if (hasToken && tokenInfo) {
    console.log(chalk.green('✓ GitHub authentication is set up'));
    console.log(`  Authenticated as: ${chalk.blue(tokenInfo.username)}`);
    
    // Verify token is still valid
    const isValid = await auth.verifyGitHubToken(tokenInfo.token);
    if (isValid) {
      console.log(chalk.green('✓ GitHub token is valid'));
    } else {
      console.log(chalk.red('✗ GitHub token is invalid or expired'));
      console.log(`  Run ${chalk.yellow('pnpm pioneer-cli auth login')} to log in again`);
    }
  } else {
    console.log(chalk.red('✗ GitHub authentication is not set up'));
    console.log(`  Run ${chalk.yellow('pnpm pioneer-cli auth login')} to log in`);
  }
  
  // Check if in Git repository
  const { isRepo } = await auth.getGitStatus();
  console.log(`In Git repository: ${isRepo ? 'Yes' : 'No'}`);
}

/**
 * Login with GitHub by asking for a personal access token
 */
async function loginWithGitHub() {
  const auth = new GitHubAuth();
  const rl = createPrompt();
  
  console.log(chalk.blue('GitHub Authentication'));
  console.log('To authenticate with GitHub, you need a Personal Access Token.');
  console.log('You can create one at: https://github.com/settings/tokens');
  console.log('Make sure it has the following scopes: repo, read:user\n');
  
  // First check if Git is configured
  const isGitConfigured = await auth.isGitConfigured();
  if (!isGitConfigured) {
    console.log(chalk.yellow('! Git user configuration not found'));
    const setupGit = await new Promise<string>(resolve => {
      rl.question('Do you want to set up Git configuration now? (Y/n): ', resolve);
    });
    
    if (setupGit.toLowerCase() !== 'n') {
      await setupGitConfig();
    }
  }
  
  // Ask for the token
  const token = await new Promise<string>(resolve => {
    rl.question('Enter your GitHub token: ', resolve);
  });
  
  if (!token.trim()) {
    console.log(chalk.red('No token provided. Authentication canceled.'));
    rl.close();
    return;
  }
  
  // Verify the token
  console.log('Verifying token...');
  const isValid = await auth.verifyGitHubToken(token);
  
  if (!isValid) {
    console.log(chalk.red('Invalid GitHub token.'));
    rl.close();
    return;
  }
  
  // Get username from GitHub
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'PioneerCLI'
    }
  });
  
  const userData = await response.json() as { login: string };
  const username = userData.login;
  
  // Save the token
  await auth.saveGitHubToken(token, username);
  
  console.log(chalk.green(`Successfully authenticated as ${username}`));
  rl.close();
}

/**
 * Logout from GitHub by removing the token
 */
async function logoutFromGitHub() {
  const auth = new GitHubAuth();
  
  const tokenInfo = auth.getGitHubToken();
  if (!tokenInfo) {
    console.log(chalk.yellow('You are not logged in to GitHub.'));
    return;
  }
  
  const rl = createPrompt();
  const confirm = await new Promise<string>(resolve => {
    rl.question(`Are you sure you want to log out from GitHub as ${tokenInfo.username}? (y/N): `, resolve);
  });
  
  if (confirm.toLowerCase() === 'y') {
    auth.removeGitHubToken();
    console.log(chalk.green('Successfully logged out from GitHub.'));
  } else {
    console.log('Logout canceled.');
  }
  
  rl.close();
}

/**
 * Setup Git user configuration
 */
async function setupGitConfig() {
  const auth = new GitHubAuth();
  const rl = createPrompt();
  
  console.log(chalk.blue('Git Configuration Setup'));
  
  // Get current values (if any)
  const currentName = await auth.getGitUsername();
  const currentEmail = await auth.getGitEmail();
  
  // Ask for name
  const namePrompt = currentName 
    ? `Enter your name (current: ${currentName}): ` 
    : 'Enter your name: ';
    
  const name = await new Promise<string>(resolve => {
    rl.question(namePrompt, resolve);
  });
  
  // Use current name if none provided
  const newName = name.trim() || currentName;
  
  if (!newName) {
    console.log(chalk.red('Name is required.'));
    rl.close();
    return;
  }
  
  // Ask for email
  const emailPrompt = currentEmail 
    ? `Enter your email (current: ${currentEmail}): ` 
    : 'Enter your email: ';
    
  const email = await new Promise<string>(resolve => {
    rl.question(emailPrompt, resolve);
  });
  
  // Use current email if none provided
  const newEmail = email.trim() || currentEmail;
  
  if (!newEmail) {
    console.log(chalk.red('Email is required.'));
    rl.close();
    return;
  }
  
  // Configure Git
  const success = await auth.configureGitUser(newName, newEmail);
  
  if (success) {
    console.log(chalk.green('Git user configuration successfully updated.'));
    console.log(`  Name: ${chalk.blue(newName)}`);
    console.log(`  Email: ${chalk.blue(newEmail)}`);
  } else {
    console.log(chalk.red('Failed to update Git user configuration.'));
  }
  
  rl.close();
} 