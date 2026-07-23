import { describe, it } from 'vitest';
import logger, { globalConfig } from '../src/index.js';

describe('Performance Benchmarks', () => {
  it('should verify speed of disabled log statements', () => {
    // Set logger level to info so debug logs are ignored (disabled)
    globalConfig.update({ level: 'info', enabled: true });

    const iterations = 1000000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      logger.debug('This message is ignored');
    }
    
    const end = performance.now();
    const duration = end - start;
    const opsPerSec = Math.round(iterations / (duration / 1000));
    
    console.log(`\n⚡️ [Benchmark] 1,000,000 disabled logs completed in ${duration.toFixed(2)}ms (${opsPerSec.toLocaleString()} ops/sec)`);
  });

  it('should verify speed of lazy callback evaluation', () => {
    globalConfig.update({ level: 'info', enabled: true });

    let callbackExecuted = false;
    const lazyMsg = () => {
      callbackExecuted = true;
      return 'expensive computed string';
    };

    // 1. Double check that callback is NOT executed when debug is disabled
    logger.debug(lazyMsg);
    if (callbackExecuted) {
      throw new Error('Lazy callback was executed while log statement was disabled');
    }

    // 2. Measure speed of callback bypass
    const iterations = 1000000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      logger.debug(lazyMsg);
    }
    
    const end = performance.now();
    const duration = end - start;
    const opsPerSec = Math.round(iterations / (duration / 1000));
    
    console.log(`⚡️ [Benchmark] 1,000,000 lazy callback checks completed in ${duration.toFixed(2)}ms (${opsPerSec.toLocaleString()} ops/sec)`);
  });
});
