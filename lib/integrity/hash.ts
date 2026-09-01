import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Compute SHA-256 from a stored file path (server-side only).
 * Called at upload time AND on-demand for integrity verification.
 * If the stored file has been altered, this returns a DIFFERENT hash -> FAILURE.
 * Never hard-codes a 'verified' state.
 */
export async function computeFileSha256(absolutePath: string): Promise<string> {
  const hash = createHash('sha256');
  const stream = createReadStream(absolutePath);
  await pipeline(stream, hash);
  return hash.digest('hex');
}

export function computeBufferSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}