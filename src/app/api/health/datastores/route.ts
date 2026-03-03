import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logDatastoreError } from '@/lib/logging/db-errors';

export async function GET() {
  const startedAt = Date.now();

  const [neonCheck] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1 as ok`,
  ]);

  const neon =
    neonCheck.status === 'fulfilled'
      ? { ok: true }
      : { ok: false, error: String((neonCheck.reason as any)?.message || 'Unknown error') };

  if (!neon.ok) {
    logDatastoreError('neon', 'health/datastores', neon.error);
  }

  const healthy = neon.ok;

  return NextResponse.json(
    {
      healthy,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      datastores: {
        neon,
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
