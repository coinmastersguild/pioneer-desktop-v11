// Example script to demonstrate the search functionality of Pioneer Engine
const { PioneerApp } = require('../dist/index');

async function runSearchExample() {
  console.log('Initializing Pioneer Engine...');
  const pioneer = new PioneerApp();
  
  try {
    await pioneer.init();
    
    const query = process.argv[2] || 'What is cryptocurrency?';
    console.log(`Searching for: ${query}`);
    
    const results = await pioneer.search([query]);
    console.log('Search Results:');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error during search:', error);
  }
}

runSearchExample().catch(console.error); 