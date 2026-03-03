export function isNeonUnavailableError(error: unknown): boolean {
  const message = String((error as any)?.message || '');
  return (
    (error as any)?.name === 'PrismaClientInitializationError' ||
    message.includes("Can't reach database server") ||
    message.includes('PrismaClientInitializationError')
  );
}

export function logDatastoreError(service: 'neon' | 'supabase', context: string, error: unknown) {
  const message = String((error as any)?.message || error || 'unknown error');
  console.error(`[datastore:${service}] ${context}: ${message}`);
}
