import devdoot from 'devdoot';

console.log('=== Running Devdoot TS from NPM Registry ===');

// 1. Log simple messages
devdoot.log('TS App started successfully.');

// 2. Create isolated group logger
const dbLog = devdoot.newGroup('Database');
dbLog.log('Connected to TS DB Instance.');

// 3. Info message
devdoot.info('Process heartbeat active.');
