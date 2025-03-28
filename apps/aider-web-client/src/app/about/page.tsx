'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary-700 mb-8">
            About Aider Web Client
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">What is Aider?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Aider is an AI pair programming tool that lets you collaborate with GPT-4 on code in your local Git repository. 
              It enables you to edit code with GPT-4 using natural language, while maintaining full control over your codebase.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Key Benefits</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>Ask GPT to make changes to your codebase using natural language</li>
              <li>Collaborate on complex coding tasks through conversation</li>
              <li>Maintain full control over code edits while leveraging AI assistance</li>
              <li>Work with Git-tracked code without uploading your entire codebase</li>
              <li>Keeps your local context in mind when making changes</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3">Learn More</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can find more information about Aider at the following resources:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                <a 
                  href="https://github.com/paul-gauthier/aider" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://aider.chat/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Official Website
                </a>
              </li>
              <li>
                <a 
                  href="https://aider.chat/docs/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">About this Web Client</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This web client provides a convenient browser-based interface to interact with the Aider service. 
              It allows you to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>Create and configure new Aider instances</li>
              <li>Manage multiple Aider sessions in a unified dashboard</li>
              <li>Interact with Aider through a chat interface</li>
              <li>Monitor the status of your Aider instances</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3">Architecture</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              The Aider Web Client is built with:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Next.js for the frontend application</li>
              <li>A REST API service that manages Aider instances</li>
              <li>WebSocket for real-time communication</li>
              <li>Docker for containerization</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              To get started with Aider Web Client:
            </p>
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>Ensure the Aider service is running (typically as a Docker container)</li>
              <li>Create a new Aider instance with your OpenAI API key</li>
              <li>Point to the Git repository you want to work on</li>
              <li>Start communicating with Aider through the chat interface</li>
            </ol>
            
            <div className="flex justify-center mt-6">
              <Link href="/instances/new" className="btn btn-primary">
                Create Your First Instance
              </Link>
            </div>
          </div>
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