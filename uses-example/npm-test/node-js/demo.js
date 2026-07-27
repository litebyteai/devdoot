import devdoot from 'devdoot';

console.log('=== Running Devdoot JS from NPM Registry ===');

// 1. Log simple messages
devdoot.log('JS App started successfully.');

// 2. Create isolated group logger
const dbLog = devdoot.group('Database');
dbLog.log('Connected to JS DB Instance.');

// 3. Info message
devdoot.info('Process heartbeat active.');
