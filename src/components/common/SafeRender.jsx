export default function SafeRender({children, fallback=null}) {
  try {
    return children;
  } catch {
    return fallback;
  }
}
