const isDevelopment = true; // Temporarily enable for debugging
const isVerbose = true; // Temporarily enable for debugging

export const logger = {
  info: console.log, // Always show for debugging
  debug: console.log, // Always show for debugging
  warn: console.warn, // Always show warnings
  error: console.error, // Always show errors
  
  // Performance timing utilities
  time: console.time,
  timeEnd: console.timeEnd,
  
  // Batch logging for performance
  batch: (items, label) => {
    console.log(`📊 ${label}: ${items.length} items`);
    console.table(items.slice(0, 5)); // Show only first 5 items
  }
};