export function healthCheck() {
  return {
    app: true,
    time: new Date().toISOString()
  };
}
