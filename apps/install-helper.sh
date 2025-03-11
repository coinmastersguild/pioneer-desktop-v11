#!/bin/bash

# Pioneer CLI Installation Helper Script
# This script helps diagnose and fix common issues with the Pioneer CLI installation

set -e
echo "Pioneer CLI Installation Helper"
echo "=============================="

# Determine OS
OS=$(uname -s)
echo "Detected OS: $OS"

NPM_BIN_DIR=$(npm bin -g)
echo "NPM global bin directory: $NPM_BIN_DIR"

# Check if the CLI is installed
if [ -f "$NPM_BIN_DIR/pioneer" ]; then
  echo "✅ Pioneer CLI binary found at $NPM_BIN_DIR/pioneer"
else
  echo "❌ Pioneer CLI binary not found at $NPM_BIN_DIR/pioneer"
fi

# Check permissions on the binary
if [ -f "$NPM_BIN_DIR/pioneer" ]; then
  PERMISSIONS=$(ls -la "$NPM_BIN_DIR/pioneer" | awk '{print $1}')
  echo "Current permissions: $PERMISSIONS"
  
  if [[ "$PERMISSIONS" != *"x"* ]]; then
    echo "❌ Binary is not executable, fixing permissions..."
    chmod +x "$NPM_BIN_DIR/pioneer"
    echo "✅ Permissions fixed"
  else
    echo "✅ Binary has executable permissions"
  fi
fi

# Check if NPM bin directory is in PATH
if echo "$PATH" | grep -q "$NPM_BIN_DIR"; then
  echo "✅ NPM bin directory is in PATH"
else
  echo "❌ NPM bin directory is not in PATH"
  
  # Suggest fix based on OS
  if [ "$OS" = "Darwin" ]; then
    echo "🔧 Fix: Add the following to your ~/.zshrc or ~/.bash_profile:"
    echo "   export PATH=\"$NPM_BIN_DIR:\$PATH\""
    
    # Offer to fix automatically
    read -p "Would you like to add this to your ~/.zshrc automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "export PATH=\"$NPM_BIN_DIR:\$PATH\"" >> ~/.zshrc
      echo "✅ Added to ~/.zshrc. Please run 'source ~/.zshrc' to apply changes."
    fi
  elif [ "$OS" = "Linux" ]; then
    echo "🔧 Fix: Add the following to your ~/.bashrc:"
    echo "   export PATH=\"$NPM_BIN_DIR:\$PATH\""
  fi
fi

# Check node version
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"

# Debug symlink
if [ -L "$NPM_BIN_DIR/pioneer" ]; then
  SYMLINK_TARGET=$(readlink "$NPM_BIN_DIR/pioneer")
  echo "Symlink target: $SYMLINK_TARGET"
  
  # Check if the target file exists
  if [ -f "$SYMLINK_TARGET" ]; then
    echo "✅ Symlink target exists"
  else
    echo "❌ Symlink target does not exist"
  fi
  
  # Check if shebang line exists in the target file
  if [ -f "$SYMLINK_TARGET" ] && head -n 1 "$SYMLINK_TARGET" | grep -q "#!/usr/bin/env node"; then
    echo "✅ Shebang line exists in the target file"
  else
    echo "❌ Shebang line missing from the target file"
  fi
fi

# Attempt to diagnose command not found issues
echo -e "\nVerifying command resolution:"
command -v pioneer || echo "❌ 'pioneer' command not found in PATH"

# Provide instructions for running with debug logging
echo -e "\nTo run with debug logging:"
echo "DEBUG=1 pioneer [command]"

echo -e "\nInstallation helper complete. If issues persist, please report them with the output of:"
echo "DEBUG=1 pioneer diagnose"
