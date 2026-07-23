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
    workflowTrace.info('Fetching posts from mock API');
    
    // This call is intercepted and will propagate span/trace headers to jsonplaceholder
    const response = await client.get('https://jsonplaceholder.typicode.com/posts/1');
    
    workflowTrace.info(`Fetched post successfully. Title: "${response.data.title}"`);
  } catch (error) {
    workflowTrace.error(error);
  }
});
