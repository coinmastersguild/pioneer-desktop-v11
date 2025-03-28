import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import aiderApi from '@/lib/api';

const Header: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkApiStatus() {
      try {
        await aiderApi.checkHealth();
        setApiStatus('online');
      } catch (err) {
        console.error('API health check failed:', err);
        setApiStatus('offline');
      }
    }
    
    checkApiStatus();
    // Check status every 30 seconds
    const intervalId = setInterval(checkApiStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="bg-primary-700 text-white py-5 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <div className="bg-white/10 rounded-lg p-2 mr-3">
              <svg className="h-7 w-7 text-white group-hover:text-primary-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Aider Web Client
            </span>
          </Link>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center">
            <div className="mr-8 flex items-center px-3 py-1.5 rounded-full bg-white/10">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                apiStatus === 'online' ? 'bg-green-400' : 
                apiStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-400 animate-pulse'
              }`}></div>
              <span className="text-sm font-medium">
                {apiStatus === 'online' ? 'Service Online' : 
                apiStatus === 'offline' ? 'Service Offline' : 
                'Checking...'}
              </span>
              <span className="text-xs ml-2 text-gray-300 hidden lg:inline">
                (http://localhost:3100)
              </span>
            </div>
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link href="/" className="font-medium hover:text-primary-200 transition-colors flex items-center">
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/instances" className="font-medium hover:text-primary-200 transition-colors flex items-center">
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Instances
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="font-medium hover:text-primary-200 transition-colors flex items-center">
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-white p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-3 pt-2 border-t border-white/20">
            <div className="flex items-center mb-4 px-3 py-2 rounded-md bg-white/10">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                apiStatus === 'online' ? 'bg-green-400' : 
                apiStatus === 'offline' ? 'bg-red-500' : 
                'bg-yellow-400 animate-pulse'
              }`}></div>
              <span className="text-sm">
                {apiStatus === 'online' ? 'Service Online' : 
                apiStatus === 'offline' ? 'Service Offline' : 
                'Checking...'}
              </span>
              <span className="text-xs ml-2 text-gray-300">
                (http://localhost:3100)
              </span>
            </div>
            <nav>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/instances" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Instances
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="block px-3 py-2 rounded-md hover:bg-white/10 transition-colors flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 