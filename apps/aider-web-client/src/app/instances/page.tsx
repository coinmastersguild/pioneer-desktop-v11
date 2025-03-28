'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import aiderApi from '@/lib/api';

interface AiderInstance {
  threadId: string;
  status: {
    state: string;
    diagnosticMessage: string;
  };
  configuration: {
    projectRoot: string;
    model: string;
  };
  lastActivity: string;
}

export default function InstancesPage() {
  const [instances, setInstances] = useState<AiderInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const router = useRouter();

  useEffect(() => {
    async function checkApiStatus() {
      try {
        await aiderApi.checkHealth();
        setApiStatus('online');
        return true;
      } catch (err) {
        console.error('API health check failed:', err);
        setApiStatus('offline');
        return false;
      }
    }

    async function fetchInstances() {
      try {
        setLoading(true);
        const isApiOnline = await checkApiStatus();
        
        if (isApiOnline) {
          const response = await aiderApi.getAllInstances();
          setInstances(response);
          setError(null);
        } else {
          setError('Failed to load instances. The Aider service is not running.');
        }
      } catch (err) {
        console.error('Error fetching instances:', err);
        setError('Failed to load instances. Please check if Aider service is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchInstances();
    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchInstances, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleDeleteInstance = async (threadId: string) => {
    if (confirm(`Are you sure you want to stop and delete the instance "${threadId}"?`)) {
      try {
        await aiderApi.stopInstance(threadId);
        setInstances(instances.filter(instance => instance.threadId !== threadId));
      } catch (err) {
        console.error('Error deleting instance:', err);
        setError('Failed to delete instance. Please try again.');
      }
    }
  };

  const getStatusBadgeClass = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HALTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-primary-700 mb-1">
                Aider Instances
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your AI pair programming sessions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-full ${
                apiStatus === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                apiStatus === 'offline' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  apiStatus === 'online' ? 'bg-green-500' : 
                  apiStatus === 'offline' ? 'bg-red-500' : 
                  'bg-yellow-500 animate-pulse'
                }`}></div>
                <span className="text-sm font-medium">
                  {apiStatus === 'online' ? 'Service Online' : 
                   apiStatus === 'offline' ? 'Service Offline' : 
                   'Checking...'}
                </span>
              </div>
              <Link 
                href="/instances/new" 
                className={`btn btn-primary flex items-center gap-2 ${apiStatus === 'offline' ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={e => {
                  if (apiStatus === 'offline') {
                    e.preventDefault();
                    alert('Please start the Aider service before creating a new instance.');
                  }
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Instance</span>
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg mb-8" role="alert">
              <div className="flex items-center mb-1">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
              {apiStatus === 'offline' && (
                <div className="mt-3 text-sm pl-7">
                  <p className="mb-2">Please ensure the Docker container is running with:</p>
                  <pre className="bg-white dark:bg-red-900/20 p-3 rounded-md overflow-auto font-mono">cd apps/aider-service && npm run dev</pre>
                  <p className="mt-2">Once the service is running, refresh this page.</p>
                </div>
              )}
            </div>
          )}
          
          {loading && instances.length === 0 ? (
            <div className="flex justify-center items-center p-16">
              <div className="flex items-center text-primary-600">
                <svg className="animate-spin h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg font-medium">Loading instances...</span>
              </div>
            </div>
          ) : instances.length === 0 && apiStatus === 'online' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-10 text-center">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">No instances found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                Get started by creating your first Aider instance to begin AI-assisted coding.
              </p>
              <Link 
                href="/instances/new" 
                className="btn btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Instance
              </Link>
            </div>
          ) : apiStatus === 'offline' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-10 text-center">
              <div className="text-red-600 text-6xl mb-4">
                <svg className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Aider Service is Offline</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                The Aider service is not running. Please start the service to view and manage instances.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg text-left mb-8 mx-auto max-w-md">
                <p className="font-medium mb-2 text-gray-700 dark:text-gray-300">Start the service with:</p>
                <pre className="bg-white dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm font-mono border border-gray-200 dark:border-gray-600">cd apps/aider-service && npm run dev</pre>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {instances.map((instance) => (
                <div 
                  key={instance.threadId} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400 mr-3">{instance.threadId}</h2>
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(instance.status.state)}`}>
                            {instance.status.state}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-gray-600 dark:text-gray-300 text-sm mb-4">
                          <div className="flex items-start">
                            <svg className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <div>
                              <span className="font-medium block mb-1">Project:</span>
                              <span className="text-xs break-all">{instance.configuration.projectRoot}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <span className="font-medium block mb-1">Model:</span>
                              <span>{instance.configuration.model}</span>
                            </div>
                          </div>
                          <div className="flex items-center sm:col-span-2">
                            <svg className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <span className="font-medium block mb-1">Last Activity:</span>
                              <span>{formatDate(instance.lastActivity)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link 
                          href={`/instances/${instance.threadId}`}
                          className="btn btn-primary text-center flex items-center justify-center gap-2"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Open Chat</span>
                        </Link>
                        <button 
                          onClick={() => handleDeleteInstance(instance.threadId)}
                          className="btn btn-secondary text-center flex items-center justify-center gap-2"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Stop & Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>© {new Date().getFullYear()} Aider Web Client</p>
        </div>
      </footer>
    </div>
  );
} 