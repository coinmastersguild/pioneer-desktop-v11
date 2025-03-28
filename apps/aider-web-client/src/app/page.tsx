'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import aiderApi from '@/lib/api';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [instanceCount, setInstanceCount] = useState<number | null>(null);

  useEffect(() => {
    async function checkApiStatus() {
      try {
        await aiderApi.checkHealth();
        setApiStatus('online');
        
        // If API is online, get instance count
        try {
          const instances = await aiderApi.getAllInstances();
          setInstanceCount(instances.length);
        } catch (err) {
          console.error('Error fetching instances:', err);
        }
      } catch (err) {
        console.error('API health check failed:', err);
        setApiStatus('offline');
      }
    }
    
    checkApiStatus();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 text-white py-24">
          <div className="container mx-auto px-4 text-center max-w-5xl">
            <div className="mb-8">
              <svg className="mx-auto h-24 w-24 mb-4 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                Aider Web Client
              </h1>
            </div>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-gray-100 leading-relaxed">
              A modern web interface for interacting with Aider AI coding assistant—bringing the power of AI pair programming to your browser.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link href="/instances/new" className="btn btn-light text-primary-700 font-semibold text-lg px-10 py-4 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                Create New Instance
              </Link>
              <Link href="/instances" className="btn btn-outline-light font-semibold text-lg px-10 py-4 rounded-lg hover:bg-white/20 transition transform hover:-translate-y-1">
                View All Instances
              </Link>
            </div>
          </div>
        </section>
        
        {/* Status Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-primary-700 mb-12">System Status</h2>
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-700 rounded-xl shadow-xl p-8 border border-gray-100 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center mb-4">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      apiStatus === 'online' ? 'bg-green-500' : 
                      apiStatus === 'offline' ? 'bg-red-500' : 
                      'bg-yellow-500 animate-pulse'
                    }`}></div>
                    <h3 className="text-xl font-semibold">Aider API Service</h3>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                      {apiStatus === 'online' ? 'Online' : 
                       apiStatus === 'offline' ? 'Offline' : 
                       'Checking...'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    <p className="mb-2 flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Service URL:</span> 
                      <code className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">http://localhost:3100</code>
                    </p>
                    <p className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">Docs:</span> 
                      <a href="http://localhost:3100/docs" target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-600 hover:underline flex items-center">
                        API Documentation
                        <svg className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </p>
                  </div>
                  
                  {apiStatus === 'offline' && (
                    <div className="mt-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-sm">
                      <p className="text-red-600 dark:text-red-400 font-medium mb-2 flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        The Aider API service is not responding
                      </p>
                      <p className="text-red-600 dark:text-red-400 mb-2">
                        Please ensure the Docker container is running with:
                      </p>
                      <pre className="mt-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto text-xs font-mono">
                        cd apps/aider-service && npm run dev
                      </pre>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
                  <h3 className="text-xl font-semibold mb-4">Active Instances</h3>
                  {apiStatus === 'online' ? (
                    instanceCount !== null ? (
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-4xl font-bold text-primary-600 mr-3">
                            {instanceCount}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 text-lg">
                            {instanceCount === 1 ? 'instance' : 'instances'} running
                          </span>
                        </div>
                        <div className="mt-6">
                          <Link href="/instances" className="text-primary-600 hover:text-primary-700 font-medium flex items-center group">
                            <span>View all instances</span>
                            <svg className="h-5 w-5 ml-1.5 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-primary-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-500">Loading instance data...</span>
                      </div>
                    )
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Cannot retrieve instances while service is offline
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-primary-700 mb-16">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-primary-600">Create Instances</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Start new Aider instances with custom configurations to work on your projects. Configure API keys, model selection, and project paths.
                </p>
                <Link href="/instances/new" className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center group">
                  <span>Create Instance</span>
                  <svg className="h-5 w-5 ml-1.5 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-primary-600">Manage Instances</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  View, monitor, and manage all your running Aider instances from a central dashboard. Check status, access logs, and control instances.
                </p>
                <Link href="/instances" className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center group">
                  <span>View Instances</span>
                  <svg className="h-5 w-5 ml-1.5 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-primary-600">Chat with Aider</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Interact with Aider through a user-friendly chat interface to build your projects. Get real-time responses and code changes via AI.
                </p>
                <Link href="/instances" className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center group">
                  <span>Start Chatting</span>
                  <svg className="h-5 w-5 ml-1.5 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>© {new Date().getFullYear()} Aider Web Client</p>
        </div>
      </footer>
    </div>
  );
}
