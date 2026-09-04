import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { BUCKETS, describeEnv, getObject, presignedGetUrl, putObject } from "@/lib/storage";

/**
 * SPIKE C — Neon Object Storage from a deployed function.
 *
 * Not in the original brief; added because it fails on Vercel rather than
 * locally, which is the same trap §3 flags for the .docx template.
 *
 * Neon publishes its S3 credentials under the standard AWS_* names, and Vercel
 * presets AWS_REGION to its own Lambda region. An SDK client that reads the
 * ambient environment therefore signs for the wrong region in production while
 * working perfectly in dev. src/lib/storage.ts passes region, endpoint and
 * credentials explicitly to avoid it; this route proves that holds where it
 * actually matters.
 *
 * Round-trips a small object: write, read back, compare hashes, presign.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const key = `spike/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.txt`;
  const payload = new TextEncoder().encode(
    `Island Media Co storage spike at ${new Date().toISOString()}`,
  );
  const writtenHash = createHash("sha256").update(payload).digest("hex");

  try {
    await putObject({
      bucket: BUCKETS.documents,
      key,
      body: payload,
      contentType: "text/plain",
    });

    const readBack = await getObject({ bucket: BUCKETS.documents, key });
    const readHash = createHash("sha256").update(readBack).digest("hex");

    const url = await presignedGetUrl({ bucket: BUCKETS.documents, key, expiresIn: 300 });

    const passed = writtenHash === readHash;

    return NextResponse.json(
      {
        spike: "C — Neon object storage",
        passed,
        bucket: BUCKETS.documents,
        key,
        bytes: payload.byteLength,
        writtenHash,
        readHash,
        // Host only: the query string carries the signature, which should not
        // be echoed into logs.
        presignedHost: new URL(url).host,
        region: process.env.NEON_S3_REGION ?? process.env.AWS_REGION ?? null,
        note: "Region and endpoint are passed explicitly, never inherited from the ambient AWS environment.",
      },
      { status: passed ? 200 : 500 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        spike: "C — Neon object storage",
        passed: false,
        key,
        error: String(error),
        // Shape only, never content: enough to spot a bad paste without
        // printing a credential into a response body.
        config: [
          describeEnv("NEON_S3_REGION", "AWS_REGION"),
          describeEnv("NEON_S3_ENDPOINT", "AWS_ENDPOINT_URL_S3"),
          describeEnv("NEON_S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"),
          describeEnv("NEON_S3_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"),
        ],
        hints: {
          ERR_INVALID_CHAR:
            "A value carries a newline or control character into the Authorization header. Look for hadSurroundingWhitespace or illegalCharCodePoint below.",
          SignatureDoesNotMatch:
            "The secret is wrong, or was pasted with surrounding quotes. Check hasSurroundingQuotes.",
          region:
            "If source says AWS_REGION on Vercel, the NEON_S3_* variable is missing and the client fell back to Vercel's own region.",
        },
      },
      { status: 500 },
    );
  }
}
