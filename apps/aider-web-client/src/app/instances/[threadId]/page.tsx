'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import CommandInput from '@/components/CommandInput';
import aiderApi from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface InstanceProps {
  params: {
    threadId: string;
  };
}

interface LogMessage {
  type: 'user' | 'system' | 'aider';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export default function InstancePage({ params }: InstanceProps) {
  const router = useRouter();
  const { threadId } = params;
  const [instance, setInstance] = useState<any>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstanceRunning, setIsInstanceRunning] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Fetch instance details
  useEffect(() => {
    async function fetchInstanceDetails() {
      try {
        setLoading(true);
        const data = await aiderApi.getInstanceStatus(threadId);
        if (!data || !data.status) {
          console.error('Invalid instance data received:', data);
          setError('Invalid instance data received. The instance might be corrupted.');
          setIsInstanceRunning(false);
        } else {
          setInstance(data);
          setIsInstanceRunning(data.status.state === 'RUNNING');
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching instance details:', err);
        setError('Failed to load instance details. The instance might not exist or the service is not running.');
        setIsInstanceRunning(false);
      } finally {
        setLoading(false);
      }
    }

    fetchInstanceDetails();
    const intervalId = setInterval(fetchInstanceDetails, 10000);
    
    return () => clearInterval(intervalId);
  }, [threadId]);

  // Connect to WebSocket for real-time logs
  useEffect(() => {
    if (!threadId) return;

    // Add initial system message
    setLogs([
      {
        type: 'system',
        content: 'Connected to Aider instance. Ready for your commands!',
        timestamp: new Date().toISOString(),
      },
    ]);

    // Connect to WebSocket
    const disconnect = aiderApi.connectWebSocket(threadId, (data) => {
      const messageType = data.source === 'user' ? 'user' : 'aider';
      
      // If this is an aider message, check if we need to append or create new
      if (messageType === 'aider') {
        setIsStreaming(true);
        setLogs((prevLogs) => {
          // Check if we need to append to an existing aider message or create a new one
          const lastLog = prevLogs[prevLogs.length - 1];
          
          // If the last message is from aider, append to it
          if (lastLog && lastLog.type === 'aider') {
            const updatedLogs = [...prevLogs];
            updatedLogs[updatedLogs.length - 1] = {
              ...lastLog,
              content: lastLog.content + data.message,
              isStreaming: true
            };
            return updatedLogs;
          } 
          // Otherwise, create a new aider message
          else {
            return [...prevLogs, {
              type: 'aider',
              content: data.message,
              timestamp: new Date().toISOString(),
              isStreaming: true
            }];
          }
        });
      } else {
        // For user messages, just add them as is
        const newLog: LogMessage = {
          type: messageType,
          content: data.message,
          timestamp: new Date().toISOString(),
        };
        setLogs((prevLogs) => [...prevLogs, newLog]);
      }
      
      // After a short delay, mark the message as no longer streaming
      if (messageType === 'aider') {
        setTimeout(() => {
          setIsStreaming(false);
          setLogs((prevLogs) => 
            prevLogs.map((log, index) => 
              index === prevLogs.length - 1 ? { ...log, isStreaming: false } : log
            )
          );
        }, 500);
      }
    });

    return () => {
      disconnect();
    };
  }, [threadId]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Focus input field when page loads
  useEffect(() => {
    if (commandInputRef.current && isInstanceRunning && !loading) {
      commandInputRef.current.focus();
    }
  }, [isInstanceRunning, loading]);

  const handleSubmitCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim() || !isInstanceRunning) return;
    
    try {
      // Add user command to logs
      const userLog: LogMessage = {
        type: 'user',
        content: command,
        timestamp: new Date().toISOString(),
      };
      
      setLogs((prevLogs) => [...prevLogs, userLog]);
      
      // Send command to Aider
      await aiderApi.sendCommand(threadId, command);
      
      // Clear command input
      setCommand('');
    } catch (err) {
      console.error('Error sending command:', err);
      
      // Add error message to logs
      const errorLog: LogMessage = {
        type: 'system',
        content: 'Failed to send command. Please try again.',
        timestamp: new Date().toISOString(),
      };
      
      setLogs((prevLogs) => [...prevLogs, errorLog]);
    }
  };

  const handleStopInstance = async () => {
    if (confirm(`Are you sure you want to stop the instance "${threadId}"?`)) {
      try {
        await aiderApi.stopInstance(threadId);
        router.push('/instances');
      } catch (err) {
        console.error('Error stopping instance:', err);
        setError('Failed to stop instance. Please try again.');
      }
    }
  };

  const renderMessage = (log: LogMessage) => {
    // Handle system messages
    if (log.type === 'system') {
      return (
        <div className="flex justify-center my-3">
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm rounded-lg italic max-w-md">
            {log.content}
          </div>
        </div>
      );
    }

    // Handle user and aider messages
    return (
      <div className={`flex ${log.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`rounded-2xl px-4 py-3 max-w-3xl ${
            log.type === 'user' 
              ? 'bg-primary-600 text-white ml-12'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-12'
          }`}
        >
          {log.type === 'aider' && log.isStreaming && (
            <div className="flex space-x-1 mb-2">
              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-200"></div>
              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-500"></div>
            </div>
          )}
          <div className="whitespace-pre-wrap">
            <ReactMarkdown
              className="prose prose-sm dark:prose-invert max-w-none"
              components={{
                code({className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !props.node?.position?.start.line ? (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-md overflow-x-auto">
                      <pre className="p-4 text-sm">
                        <code className={match ? `language-${match[1]}` : ''} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                }
              }}
            >
              {log.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !instance) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="animate-pulse text-primary-600">Loading instance details...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-4 flex flex-col">
        {error ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <p>{error}</p>
            </div>
            <div className="flex justify-center">
              <Link href="/instances" className="btn btn-primary">
                Back to Instances
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-primary-700">
                  {threadId}
                </h1>
                {instance && (
                  <span className={`ml-3 inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    instance.status.state === 'RUNNING' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    instance.status.state === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {instance.status.state}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <Link href="/instances" className="btn btn-secondary text-sm">
                  Back to Instances
                </Link>
                <button 
                  onClick={handleStopInstance}
                  className="btn btn-warning text-sm"
                >
                  Stop Instance
                </button>
              </div>
            </div>
            
            {instance && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="font-medium">Project:</span>{' '}
                    <span className="truncate block" title={instance.configuration.projectRoot}>
                      {instance.configuration.projectRoot}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Model:</span>{' '}
                    {instance.configuration.model}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-grow flex flex-col overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4">
              <div 
                ref={logContainerRef}
                className="flex-grow overflow-y-auto p-4 space-y-1"
                style={{ maxHeight: 'calc(100vh - 250px)', minHeight: '500px' }}
              >
                {logs.map((log, index) => (
                  <div key={index}>
                    {renderMessage(log)}
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSubmitCommand} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CommandInput
                  ref={commandInputRef}
                  onSendCommand={(cmd) => {
                    setCommand(cmd);
                    handleSubmitCommand({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  disabled={!isInstanceRunning}
                  placeholder={isInstanceRunning ? "Ask Aider anything..." : "Instance is not running"}
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  {isInstanceRunning 
                    ? "Press Enter to send your command. Type 'help' for assistance."
                    : "This instance is not running. Please start a new instance."}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-800 py-4 text-sm">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>© {new Date().getFullYear()} Aider Web Client</p>
        </div>
      </footer>
    </div>
  );
} 