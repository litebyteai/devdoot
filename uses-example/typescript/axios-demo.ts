import axios from 'axios';
import devdoot, { runTraced } from 'devdoot';
import { axiosTrace } from 'devdoot/plugins';

// Configure devdoot logger options
devdoot.configure({
  level: 'trace',
  format: 'console',
  captureCaller: true,
  saveTraces: true
});

// Create an Axios client
const client = axios.create();

// 1. Intercept outbound HTTP calls with Devdoot axiosTrace
// This propagates x-trace-id and x-span-id headers to the target service
axiosTrace(client);

console.log('=== Axios Outbound Request Tracing Demo ===\n');

runTraced('ExternalServicesWorkflow', async (workflowTrace) => {
  workflowTrace.info('Starting external API workflows');

  try {
    workflowTrace.info('Fetching users from local Express server (requires npm run express to be running)');
    
    // This call is intercepted and will propagate span/trace headers to the local service
    const response = await client.get('http://localhost:3010/api/users');
    
    workflowTrace.info(`Fetched users successfully. Count: ${response.data.users.length}`);
  } catch (error: any) {
    workflowTrace.error(`Failed to fetch from local Express server: ${error.message}. (Did you start it using 'npm run express'?)`);
  }
});
