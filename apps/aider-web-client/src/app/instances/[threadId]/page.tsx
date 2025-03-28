'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import aiderApi from '@/lib/api';

interface InstanceProps {
  params: {
    threadId: string;
  };
}

interface LogMessage {
  type: 'user' | 'system' | 'aider';
  content: string;
  timestamp: string;
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
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch instance details
  useEffect(() => {
    async function fetchInstanceDetails() {
      try {
        setLoading(true);
        const data = await aiderApi.getInstanceStatus(threadId);
        setInstance(data);
        setIsInstanceRunning(data.status.state === 'RUNNING');
        setError(null);
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
        content: 'Connected to Aider instance. Waiting for logs...',
        timestamp: new Date().toISOString(),
      },
    ]);

    // Connect to WebSocket
    const disconnect = aiderApi.connectWebSocket(threadId, (data) => {
      const newLog: LogMessage = {
        type: data.source === 'user' ? 'user' : 'aider',
        content: data.message,
        timestamp: new Date().toISOString(),
      };
      
      setLogs((prevLogs) => [...prevLogs, newLog]);
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

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <div key={i}>{line || ' '}</div>
    ));
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
      
      <main className="flex-grow container mx-auto px-4 py-8">
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
          <div className="max-w-4xl mx-auto flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-primary-700">
                {threadId}
              </h1>
              <div className="flex space-x-3">
                <Link href="/instances" className="btn btn-secondary">
                  Back to Instances
                </Link>
                <button 
                  onClick={handleStopInstance}
                  className="btn btn-warning"
                >
                  Stop Instance
                </button>
              </div>
            </div>
            
            {instance && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={
                      instance.status.state === 'RUNNING' ? 'text-green-600' :
                      instance.status.state === 'COMPLETED' ? 'text-blue-600' :
                      'text-red-600'
                    }>
                      {instance.status.state}
                    </span>
                  </div>
                  
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
            
            <div className="flex-grow flex flex-col overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
              <div 
                ref={logContainerRef}
                className="flex-grow overflow-y-auto p-4 font-mono text-sm whitespace-pre-wrap"
                style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '400px' }}
              >
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`mb-2 ${
                      log.type === 'user' ? 'text-blue-600 dark:text-blue-400' : 
                      log.type === 'system' ? 'text-gray-500 dark:text-gray-400 italic' : 
                      'text-black dark:text-white'
                    }`}
                  >
                    {formatMessage(log.content)}
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSubmitCommand} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder={isInstanceRunning ? "Type your command or request..." : "Instance is not running"}
                    disabled={!isInstanceRunning}
                    className="flex-grow py-2 px-4 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={!isInstanceRunning || !command.trim()}
                    className="py-2 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-800 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>© {new Date().getFullYear()} Aider Web Client</p>
        </div>
      </footer>
    </div>
  );
} 