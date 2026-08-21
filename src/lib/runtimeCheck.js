export function checkRuntime() {
  return {
    browser: typeof window !== "undefined",
    timestamp: new Date().toISOString()
  };
}
