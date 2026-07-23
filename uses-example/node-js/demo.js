import devdoot, { runTraced } from 'devdoot';

// 1. Register the global crash/exit reporter
// We configure exitOnError to false so this demo process doesn't shut down on test exceptions.
devdoot.register({
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

console.log('=== 1. Non-Invasive Grouping Demo ===');
devdoot.group('Authentication');
devdoot.info('Verifying user credentials...');
devdoot.info('User session established successfully.');

devdoot.group('PaymentGateway');
devdoot.warn('Payment API returned high latency (820ms)');
devdoot.info('Payment succeeded. Receipt generated.');

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
