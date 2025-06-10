const isDevelopment = import.meta.env.MODE === 'development';
const isVerbose = import.meta.env.VITE_VERBOSE_LOGGING === 'true';

export const logger = {
  info: isDevelopment ? console.log : () => {},
  debug: (isDevelopment && isVerbose) ? console.log : () => {},
  warn: console.warn, // Always show warnings
  error: console.error, // Always show errors
  
  // Performance timing utilities
  time: isDevelopment ? console.time : () => {},
  timeEnd: isDevelopment ? console.timeEnd : () => {},
  
  // Batch logging for performance
  batch: (items, label) => {
    if (isDevelopment) {
      console.log(`📊 ${label}: ${items.length} items`);
      if (isVerbose) {
        console.table(items.slice(0, 5)); // Show only first 5 items
      }
    }
  }
};