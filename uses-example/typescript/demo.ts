import devdoot, { runTraced } from 'devdoot';

// 1. Start global process tracking
// We configure exitOnError to false so this demo process doesn't shut down on test exceptions.
devdoot.startGlobalTracking({
  exitOnError: false
});

// 2. Configure devdoot options
devdoot.configure({
  level: 'trace',
  format: 'console',
  captureCaller: true,
  deepDebugging: true,
  saveTraces: true // Writes completed traces to storage/devdoot/traces/*.txt
});

console.log('=== 1a. Non-Invasive Grouping Demo ===');
devdoot.group('Authentication');
devdoot.info('Verifying user credentials...');
devdoot.info('User session established successfully.');

console.log('\n=== 1b. Scoped Group Logger Demo ===');
// Returns a new isolated logger instance bound to the group name!
const dbLogger = devdoot.group('Database');
const paymentLogger = devdoot.group('PaymentGateway');

dbLogger.info('Verifying connection pool...');
paymentLogger.warn('Payment API returned high latency (820ms)');
dbLogger.info('Database query executed successfully.');
paymentLogger.info('Payment succeeded. Receipt generated.');

console.log('\n=== 2. Hierarchical Tracing timing Demo ===');
runTraced('CheckoutProcess', (checkoutTrace) => {
  checkoutTrace.info('Validating shopping cart items');
  
  runTraced('ApplyDiscount', (discountTrace) => {
    discountTrace.info('Checking coupon: SUMMER25');
    discountTrace.info('15% Discount applied successfully');
  });

  runTraced('ChargeCreditCard', (chargeTrace) => {
    chargeTrace.info('Sending authorization to Stripe');
    chargeTrace.info('Stripe token authorized');
  });
});

console.log('\n=== 3. Global Exception Safety Check ===');
// Throwing an uncaught exception (the registered devdoot handler will catch it and write a report)
setTimeout(() => {
  throw new Error('Test Uncaught Exception - check your storage/devdoot/reports/ folder for the report!');
}, 100);
