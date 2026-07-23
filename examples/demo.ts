import devdoot, { runTraced, register, globalConfig, Devdoot } from '../src/index.js';

// 1. Initialize global process event & error handlers (captures uncaught exceptions, unhandled rejections, signals, etc.)
// We set `exitOnError: false` for this demo so it does not terminate on test errors.
devdoot.register({
  exitOnError: false
});

// 2. Configure default devdoot logger options
globalConfig.update({
  level: 'trace',
  format: 'console',
  captureCaller: true,
  deepDebugging: true,
  saveTraces: true
});

console.log('--- STARTING DEVDOT DEMO ---');

// 3. Demonstrate Non-Invasive Grouping (.group)
console.log('\n--- 1. Non-Invasive Grouping Demo ---');

// Imperative Grouping
devdoot.group('AuthSystem');
devdoot.info('Authenticating user "alice"...');
devdoot.info('User authenticated successfully.');

// Chainable Grouping
devdoot.group('PaymentGateway').warn('Transaction took longer than 500ms (720ms)');
devdoot.group('PaymentGateway').info('Transaction captured successfully.');


// 4. Demonstrate Custom Isolated Logger Instances
console.log('\n--- 2. Custom Isolated Loggers Demo ---');

// Instantiate a separate logger using the Devdoot class
const serviceLogger = new Devdoot({
  level: 'warn', // Only print warnings and errors
  format: 'console'
});

// Instantiate another logger using the create() factory helper
const auditLogger = devdoot.create({
  level: 'info',
  format: 'json' // Save logs as JSON strings
});

serviceLogger.group('MailerService');
auditLogger.group('SecurityAudit');

// Default logger is set to 'trace', serviceLogger to 'warn', auditLogger to 'info' JSON format
devdoot.trace('Default Logger: trace message (Visible)');
serviceLogger.info('Service Logger: info message (Bypassed due to "warn" level)');
serviceLogger.warn('Service Logger: warning message (Visible)');
auditLogger.info('Audit Logger: info message (Visible as JSON output)');


// 5. Demonstrate Tracing and Timings
console.log('\n--- 3. Trace Context Timing Demo ---');

runTraced('MainJob', (mainTrace) => {
  mainTrace.info('Starting MainJob workflows');
  
  // Simulated subtask 1: Database action
  runTraced('DatabaseFetch', (dbTrace) => {
    dbTrace.info('Fetching query: SELECT * FROM users LIMIT 100');
    dbTrace.info('Fetched 100 rows successfully');
  });

  // Simulated subtask 2: API action
  runTraced('ExternalAPICall', (apiTrace) => {
    apiTrace.info('Sending POST to https://api.example.com/sync');
    apiTrace.info('API Sync completed');
  });
});

console.log('\n--- DEMO COMPLETED SUCCESSFULLY ---');
