export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID()
  }
  // Fallback for older browsers: not cryptographically strong, but fine for local-only IDs.
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

