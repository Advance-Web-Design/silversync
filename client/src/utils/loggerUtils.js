const isDevelopment = import.meta.env.DEV; // gets the environment mode from the build tool

export const logger = {
  info: isDevelopment ? console.log : () => {}, // Always show for debugging
  debug: isDevelopment ? console.log : () => {}, // Always show for debugging
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