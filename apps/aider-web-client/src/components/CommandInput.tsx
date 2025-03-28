import React, { useState } from 'react';

interface CommandInputProps {
  onSendCommand: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CommandInput: React.FC<CommandInputProps> = ({
  onSendCommand,
  disabled = false,
  placeholder = 'Enter a command or question for Aider...',
}) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (command.trim() && !disabled) {
      onSendCommand(command);
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="input flex-grow mr-2"
          data-testid="command-input"
        />
        <button
          type="submit"
          disabled={disabled || !command.trim()}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="send-command-button"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default CommandInput; 