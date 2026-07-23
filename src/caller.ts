import { fileURLToPath } from 'node:url';

export interface CallerInfo {
  file: string;
  filePath: string;
  line: number;
  column: number;
  functionName: string;
  callerLocation: string;
}

/**
 * Capture stack frames and extract caller details.
 * Optimized by skipping internal library frames and returning parsed details lazily.
 */
export function getCallerInfo(): CallerInfo | null {
  const err = new Error();
  const stack = err.stack;
  if (!stack) return null;

  const lines = stack.split('\n');
  
  // Start from index 1 (index 0 is "Error")
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Skip internal library frames
    if (
      line.includes('caller.ts') || 
      line.includes('caller.js') || 
      line.includes('logger.ts') || 
      line.includes('logger.js') || 
      line.includes('trace.ts') || 
      line.includes('trace.js') ||
      line.includes('context.ts') || 
      line.includes('context.js') ||
      line.includes('node:internal') ||
      line.includes('node_modules')
    ) {
      continue;
    }
    
    // Matches V8 stack frames:
    // 1. "at functionName (path/file.ts:line:col)"
    // 2. "at path/file.ts:line:col"
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || 
                  line.match(/at\s+(.+?):(\d+):(\d+)/);
                  
    if (match) {
      let functionName = 'anonymous';
      let filePath = '';
      let lineNo = 0;
      let colNo = 0;

      if (match[4]) {
        functionName = match[1];
        filePath = match[2];
        lineNo = parseInt(match[3], 10);
        colNo = parseInt(match[4], 10);
      } else {
        filePath = match[1];
        lineNo = parseInt(match[2], 10);
        colNo = parseInt(match[3], 10);
      }

      // Normalize file URLs to local absolute paths
      let cleanPath = filePath;
      if (cleanPath.startsWith('file://')) {
        try {
          cleanPath = fileURLToPath(cleanPath);
        } catch {
          // fallback
        }
      }

      const file = cleanPath.split(/[/\\]/).pop() || cleanPath;
      const callerLocation = `${cleanPath}:${lineNo}:${colNo}`;

      return {
        file,
        filePath: cleanPath,
        line: lineNo,
        column: colNo,
        functionName,
        callerLocation
      };
    }
  }
  
  return null;
}
