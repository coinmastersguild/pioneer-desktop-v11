// Example script to demonstrate the skill creation functionality of Pioneer Engine
const { PioneerApp } = require('../dist/index');

async function runSkillExample() {
  console.log('Initializing Pioneer Engine...');
  const pioneer = new PioneerApp();
  
  try {
    await pioneer.init();
    
    const objective = process.argv[2] || 'Create a skill to find the best exchanges for trading Bitcoin';
    console.log(`Creating skill with objective: ${objective}`);
    
    const result = await pioneer.skillCreate(objective);
    console.log('Skill Creation Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error during skill creation:', error);
  }
}

runSkillExample().catch(console.error); 