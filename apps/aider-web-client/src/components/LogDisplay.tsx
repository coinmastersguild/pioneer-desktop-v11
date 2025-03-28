import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface LogDisplayProps {
  logs: Array<{
    timestamp: string;
    message: string;
    type?: 'info' | 'error' | 'success';
  }>;
  loading?: boolean;
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs, loading = false }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLogTypeStyles = (type?: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'error':
        return 'text-red-500 border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'success':
        return 'text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20';
      case 'info':
      default:
        return 'text-gray-800 border-gray-200 bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:bg-gray-800/50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden h-full flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
        <span>Logs</span>
        {loading && (
          <span className="inline-block animate-pulse text-primary-500">
            Processing...
          </span>
        )}
      </div>
      <div className="overflow-y-auto flex-grow p-4 space-y-2 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 italic">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`p-2 rounded border ${getLogTypeStyles(log.type)}`}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {formatTimestamp(log.timestamp)}
              </div>
              <ReactMarkdown>{log.message}</ReactMarkdown>
            </div>
          ))
        )}
        {/* This div is used for auto-scrolling to the bottom */}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default LogDisplay; 