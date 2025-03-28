'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import aiderApi from '@/lib/api';

export default function NewInstancePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    threadId: '',
    openAIApiKey: '',
    projectRoot: '',
    model: 'gpt-4',
    autoCommit: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    async function checkApiStatus() {
      try {
        await aiderApi.checkHealth();
        setApiStatus('online');
      } catch (err) {
        console.error('API health check failed:', err);
        setApiStatus('offline');
        setError('The Aider service is currently offline. Please start the service before creating a new instance.');
      }
    }
    
    checkApiStatus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (apiStatus !== 'online') {
      setError('Cannot create an instance while the Aider service is offline.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await aiderApi.startInstance(formData);
      router.push(`/instances/${formData.threadId}`);
    } catch (err: any) {
      console.error('Error starting instance:', err);
      setError(err?.response?.data?.error || 'Failed to start Aider instance. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-primary-700">
              Create New Aider Instance
            </h1>
            
            <div className={`flex items-center ${apiStatus === 'offline' ? 'text-red-600' : 'text-green-600'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${
                apiStatus === 'online' ? 'bg-green-500' : 
                apiStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-500 animate-pulse'
              }`}></div>
              <span className="text-sm">
                {apiStatus === 'online' ? 'Service Online' : 
                 apiStatus === 'offline' ? 'Service Offline' : 
                 'Checking...'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <p className="font-medium">{error}</p>
              {apiStatus === 'offline' && (
                <div className="mt-3 text-sm">
                  <p className="mb-2">Please ensure the Docker container is running with:</p>
                  <pre className="bg-red-50 p-2 rounded overflow-auto mb-2">cd apps/aider-service && npm run dev</pre>
                  <p>Service URL: <span className="font-mono">http://localhost:3100</span></p>
                </div>
              )}
            </div>
          )}
          
          {apiStatus === 'offline' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="text-red-600 text-5xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-4">Cannot Create Instance While Service is Offline</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The Aider service (Docker container) must be running to create new instances.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-left mb-6 mx-auto max-w-md">
                <p className="font-medium mb-2">Start the service with:</p>
                <pre className="bg-gray-200 dark:bg-gray-800 p-3 rounded overflow-auto text-sm">cd apps/aider-service && npm run dev</pre>
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary"
                >
                  Refresh Page
                </button>
                <Link href="/instances" className="btn btn-secondary">
                  Back to Instances
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="threadId" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    Thread ID
                  </label>
                  <input
                    type="text"
                    id="threadId"
                    name="threadId"
                    value={formData.threadId}
                    onChange={handleChange}
                    placeholder="E.g., my-project-thread"
                    required
                    className="input w-full"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    A unique identifier for this Aider instance
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="openAIApiKey" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    id="openAIApiKey"
                    name="openAIApiKey"
                    value={formData.openAIApiKey}
                    onChange={handleChange}
                    placeholder="sk-..."
                    required
                    className="input w-full"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Your OpenAI API key for GPT-4 access
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="projectRoot" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    Project Root
                  </label>
                  <input
                    type="text"
                    id="projectRoot"
                    name="projectRoot"
                    value={formData.projectRoot}
                    onChange={handleChange}
                    placeholder="/path/to/your/project"
                    required
                    className="input w-full"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Absolute path to your project directory (must be a Git repository)
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="model" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    Model
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoCommit"
                      checked={formData.autoCommit}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-200">
                      Auto-commit changes
                    </span>
                  </label>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Automatically commit changes made by Aider
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Link
                    href="/instances"
                    className="btn btn-secondary mr-4"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || apiStatus !== 'online'}
                  >
                    {loading ? 'Starting...' : 'Create Instance'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-800 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>© {new Date().getFullYear()} Aider Web Client</p>
        </div>
      </footer>
    </div>
  );
} 