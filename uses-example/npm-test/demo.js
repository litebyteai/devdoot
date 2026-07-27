import devdoot from 'devdoot';

console.log('=== Running Devdoot from NPM Registry ===');

// 1. Log simple messages
devdoot.log('Application started successfully.');

// 2. Create isolated group logger
const dbLog = devdoot.group('Database');
dbLog.log('Connected to remote PostgreSQL instance.');

// 3. Info message
devdoot.info('Process heartbeat active.');
