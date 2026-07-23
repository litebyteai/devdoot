import express from 'express';
import devdoot, { runTraced } from 'devdoot';
import { expressTrace } from 'devdoot/plugins';

// Configure devdoot logger options
devdoot.configure({
  level: 'trace',
  format: 'console',
  captureCaller: true,
  saveTraces: true
});

const app = express();
const PORT = 3020;

// 1. Attach the Devdoot express middleware
// This automatically starts a trace for every incoming HTTP request
app.use(expressTrace());

// Simple GET endpoint
app.get('/api/users', (req, res) => {
  // We can write logs inside the request context, they will inherit request context headers automatically!
  devdoot.info('Retrieving user database snapshot');
  
  runTraced('DatabaseQuery', (dbTrace) => {
    dbTrace.info('Executing SELECT * FROM users');
    dbTrace.info('Query took 20ms');
  });

  res.json({
    success: true,
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  });
});

// GET endpoint with error
app.get('/api/error', (req, res) => {
  devdoot.info('Accessing unstable API route');
  throw new Error('Database connection failed dynamically!');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Express Tracing Demo Server started at http://localhost:${PORT}`);
  console.log(`👉 Test standard request: curl http://localhost:${PORT}/api/users`);
  console.log(`👉 Test failing request:  curl http://localhost:${PORT}/api/error`);
  console.log(`Press Ctrl+C to terminate the server.\n`);
});
