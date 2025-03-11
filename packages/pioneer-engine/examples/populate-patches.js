// Example script to populate the database with fake patch data
const { PioneerApp } = require('../dist/index');

async function populateFakePatches() {
  console.log('Initializing Pioneer Engine...');
  const pioneer = new PioneerApp();
  
  try {
    await pioneer.init();
    
    // Sample patch data
    const patchFiles = [
      {
        title: 'Fix navigation bug in header',
        description: 'Resolves an issue where clicking the logo doesn\'t redirect to home page',
        content: `diff --git a/src/components/Header.tsx b/src/components/Header.tsx
index 1234567..abcdefg 100644
--- a/src/components/Header.tsx
+++ b/src/components/Header.tsx
@@ -24,7 +24,7 @@ const Header = () => {
   return (
     <header className="app-header">
-      <div className="logo">
+      <div className="logo" onClick={() => navigate('/')}>
         <img src={logoImage} alt="Company Logo" />
       </div>
       <nav>`,
        filePath: 'src/components/Header.tsx',
        repository: 'main-app',
        branch: 'fix/nav-bug',
        author: 'jane.doe@example.com',
        status: 'pending',
        metadata: {
          type: 'bugfix',
          priority: 'high',
          tickets: ['NAV-123']
        }
      },
      {
        title: 'Add dark mode support',
        description: 'Implements dark mode toggle and associated styles',
        content: `diff --git a/src/styles/theme.css b/src/styles/theme.css
index 2468ace..13579bd 100644
--- a/src/styles/theme.css
+++ b/src/styles/theme.css
@@ -1,5 +1,15 @@
 :root {
   --primary-color: #4285f4;
   --secondary-color: #34a853;
+  --background-color: #ffffff;
+  --text-color: #202124;
+}
+
+[data-theme="dark"] {
+  --primary-color: #8ab4f8;
+  --secondary-color: #81c995;
+  --background-color: #202124;
+  --text-color: #e8eaed;
 }`,
        filePath: 'src/styles/theme.css',
        repository: 'main-app',
        branch: 'feature/dark-mode',
        author: 'john.smith@example.com',
        status: 'applied',
        appliedAt: Date.now() - 86400000, // 1 day ago
        metadata: {
          type: 'feature',
          priority: 'medium',
          tickets: ['UI-456']
        }
      },
      {
        title: 'Update dependencies',
        description: 'Updates React and related packages to the latest version',
        content: `diff --git a/package.json b/package.json
index 9876543..fedcba0 100644
--- a/package.json
+++ b/package.json
@@ -8,11 +8,11 @@
   },
   "dependencies": {
-    "react": "^17.0.2",
-    "react-dom": "^17.0.2",
+    "react": "^18.2.0",
+    "react-dom": "^18.2.0",
     "react-router-dom": "^6.2.1"
   },
   "devDependencies": {
-    "@types/react": "^17.0.38",
-    "@types/react-dom": "^17.0.11"
+    "@types/react": "^18.0.28",
+    "@types/react-dom": "^18.0.11"
   }`,
        filePath: 'package.json',
        repository: 'main-app',
        branch: 'chore/update-deps',
        author: 'alex.developer@example.com',
        status: 'rejected',
        metadata: {
          type: 'chore',
          priority: 'low',
          tickets: ['DEP-789'],
          rejectionReason: 'Waiting for more testing on React 18 compatibility'
        }
      },
      {
        title: 'Implement user settings page',
        description: 'Creates a new page for user settings with account management options',
        content: `diff --git a/src/App.tsx b/src/App.tsx
index abcdef1..2345678 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -5,6 +5,7 @@ import Home from './pages/Home';
 import About from './pages/About';
 import Dashboard from './pages/Dashboard';
 import Profile from './pages/Profile';
+import Settings from './pages/Settings';
 
 function App() {
   return (
@@ -14,6 +15,7 @@ function App() {
         <Route path="/about" element={<About />} />
         <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/profile" element={<Profile />} />
+        <Route path="/settings" element={<Settings />} />
       </Routes>
     </Router>
   );`,
        filePath: 'src/App.tsx',
        repository: 'main-app',
        branch: 'feature/user-settings',
        author: 'sarah.developer@example.com',
        status: 'created',
        metadata: {
          type: 'feature',
          priority: 'medium',
          tickets: ['USER-567']
        }
      },
      {
        title: 'Fix API error handling',
        description: 'Improves error handling in API requests and adds better user feedback',
        content: `diff --git a/src/api/client.ts b/src/api/client.ts
index 11223344..55667788 100644
--- a/src/api/client.ts
+++ b/src/api/client.ts
@@ -10,8 +10,15 @@ async function apiRequest(url, options) {
     const response = await fetch(baseUrl + url, {
       ...defaultOptions,
       ...options,
     });
-    return await response.json();
+    
+    const data = await response.json();
+    
+    if (!response.ok) {
+      throw new APIError(data.message || 'An unknown error occurred', response.status, data);
+    }
+    
+    return data;
   } catch (error) {
-    console.error('API request failed:', error);
+    notifyUser('error', error.message || 'Failed to communicate with the server');
+    throw error;
   }`,
        filePath: 'src/api/client.ts',
        repository: 'main-app',
        branch: 'fix/api-errors',
        author: 'mark.senior@example.com',
        status: 'pending',
        metadata: {
          type: 'bugfix',
          priority: 'high',
          tickets: ['API-234'],
          reviewers: ['john.smith@example.com', 'sarah.developer@example.com']
        }
      }
    ];
    
    console.log(`Adding ${patchFiles.length} fake patch files to the database...`);
    
    // Add each patch file to the database
    for (const patch of patchFiles) {
      const id = await pioneer.savePatchFile(patch);
      console.log(`Added patch: "${patch.title}" with ID: ${id}`);
    }
    
    // Retrieve and display all patches to verify
    const savedPatches = await pioneer.getPatchFiles();
    console.log(`\nVerification: Retrieved ${savedPatches.length} patch files from database:`);
    
    savedPatches.forEach((patch, index) => {
      console.log(`\n[${index + 1}] ${patch.title} (ID: ${patch.id})`);
      console.log(`Status: ${patch.status}`);
      console.log(`Description: ${patch.description}`);
    });
    
    console.log('\nFake patch data population complete!');
  } catch (error) {
    console.error('Error populating patch data:', error);
  }
}

populateFakePatches().catch(console.error); 