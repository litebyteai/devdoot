import { runTraced, TraceNode } from '../trace.js';
import { getActiveTraceContext } from '../context.js';

/**
 * Express middleware to automatically trace requests.
 * Uses the request method and path to create a diagnostic TraceNode.
 */
export function expressTrace() {
  return (req: any, res: any, next: () => void) => {
    const traceName = `Express: ${req.method} ${req.path}`;
    
    runTraced(traceName, (trace) => {
      trace.metadata = {
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get?.('user-agent') || 'unknown',
      };
      
      // Attach to response object for access in handlers if needed
      res._devdootTrace = trace;
      
      res.on('finish', () => {
        const status = res.statusCode;
        trace.metadata.statusCode = status;
        
        if (status >= 500) {
          trace.error(new Error(`Express request failed with status code ${status}`));
        } else if (status >= 400) {
          trace.warn(`Express request completed with client error ${status}`);
        } else {
          trace.info(`Express request completed with status ${status}`);
        }
      });
      
      next();
    });
  };
}

/**
 * Axios interceptor plugin to automatically trace outbound network requests.
 * Links the request to any current active TraceNode context.
 */
export function axiosTrace(axiosInstance: any) {
  if (!axiosInstance || typeof axiosInstance.interceptors !== 'object') {
    throw new Error('Invalid Axios instance passed to axiosTrace');
  }

  axiosInstance.interceptors.request.use((config: any) => {
    const traceName = `Axios: ${config.method?.toUpperCase() || 'GET'} ${config.url || '/'}`;
    
    // Automatically link to active asynchronous parent context
    const parentContext = getActiveTraceContext();
    const trace = new TraceNode(traceName, parentContext);
    
    trace.metadata = {
      url: config.url,
      method: config.method,
      params: config.params,
    };

    // Inject headers for distributed tracing propagation
    config.headers = config.headers || {};
    config.headers['x-trace-id'] = trace.traceId;
    config.headers['x-span-id'] = trace.id;

    config._devdootTrace = trace;
    return config;
  }, (error: any) => {
    return Promise.reject(error);
  });

  axiosInstance.interceptors.response.use((response: any) => {
    const trace = response.config?._devdootTrace;
    if (trace instanceof TraceNode) {
      trace.metadata.statusCode = response.status;
      trace.info(`Response received successfully (${response.status})`);
      trace.end();
    }
    return response;
  }, (error: any) => {
    const trace = error.config?._devdootTrace;
    if (trace instanceof TraceNode) {
      trace.error(error);
      trace.end();
    }
    return Promise.reject(error);
  });
}

/**
 * Playwright browser action helper. Wraps browser execution routines in dynamic spans.
 */
export function playwrightTrace<T>(actionName: string, fn: (trace: TraceNode) => Promise<T>): Promise<T> {
  return runTraced(`Playwright: ${actionName}`, async (trace) => {
    trace.info(`Starting Playwright action: ${actionName}`);
    try {
      const result = await fn(trace);
      trace.info(`Completed Playwright action: ${actionName}`);
      return result;
    } catch (err) {
      trace.error(err);
      throw err;
    }
  });
}
