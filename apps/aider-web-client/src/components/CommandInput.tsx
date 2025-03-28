import React, { useState, forwardRef } from 'react';

interface CommandInputProps {
  onSendCommand: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const CommandInput = forwardRef<HTMLInputElement, CommandInputProps>(({
  onSendCommand,
  disabled = false,
  placeholder = 'Enter a command or question for Aider...',
  className = '',
}, ref) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (command.trim() && !disabled) {
      onSendCommand(command);
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex items-center shadow-md rounded-md">
        <input
          ref={ref}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-grow py-3 px-4 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          data-testid="command-input"
        />
        <button
          type="submit"
          disabled={disabled || !command.trim()}
          className="py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          data-testid="send-command-button"
        >
          Send
        </button>
      </div>
    </form>
  );
});

CommandInput.displayName = 'CommandInput';

export default CommandInput; 