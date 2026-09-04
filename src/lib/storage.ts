import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Neon Object Storage.
 *
 * Storage branches with the database, so a preview or test branch gets a
 * consistent snapshot of both the rows and the files they reference — which
 * matters here because a JobProof row is meaningless without its photo.
 *
 * WHY THE CONFIG IS EXPLICIT RATHER THAN AMBIENT
 * Neon speaks S3, so it publishes its credentials under the standard AWS names
 * (AWS_REGION, AWS_ENDPOINT_URL_S3, ...) and the AWS SDK will happily pick them
 * up from the environment on its own. That works locally and breaks on Vercel:
 * Vercel presets AWS_REGION to the region of whichever Lambda the function
 * lands in — us-west-1 for sfo1 — while Neon's endpoint is us-east-2. The SDK
 * would then sign requests for the wrong region and every upload would fail,
 * with nothing in the code to point at.
 *
 * So the client is constructed from NEON_S3_* variables where they exist,
 * falling back to the AWS_* names that `neon env pull` writes locally. Nothing
 * is inherited from the ambient AWS chain.
 */

export const BUCKETS = {
  /** Generated contract documents. Written once at issue, then frozen. */
  documents: "documents",
  /** Fitter photo and video proof of posting. */
  proofs: "proofs",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * Read a configuration value, trimmed and checked.
 *
 * The trim is not defensive padding, it fixes a real failure. The access key id
 * and region are interpolated verbatim into the SigV4 `Authorization` header,
 * and pasting a value into a dashboard field very often carries a trailing
 * newline along with it. Node then rejects the whole request with
 * `ERR_INVALID_CHAR: Invalid character in header content ["authorization"]`,
 * which names the header rather than the variable and sends you looking at the
 * signing code instead of at the paste.
 *
 * Anything still illegal after trimming is reported by NAME, so the next person
 * gets a one-line diagnosis instead of that error.
 */
function required(name: string, fallback: string | undefined): string {
  const raw = process.env[name] ?? fallback;
  if (!raw) {
    throw new Error(
      `${name} is not set. Run \`neon env pull\` locally, or set the NEON_S3_* variables in Vercel.`,
    );
  }

  const value = raw.trim();

  // Printable US-ASCII is what a header value may legally contain.
  const illegal = /[^\x20-\x7e]/.exec(value);
  if (illegal) {
    throw new Error(
      `${name} contains a character that cannot go in an HTTP header ` +
        `(code point ${illegal[0].codePointAt(0)} at index ${illegal.index}). ` +
        `Re-copy the value without surrounding quotes or line breaks.`,
    );
  }

  return value;
}

/**
 * A description of a configuration value that is safe to log: shape only, never
 * content. Used by the storage spike so a misconfigured deployment can be
 * diagnosed without printing a credential into a response body.
 */
export function describeEnv(name: string, fallbackName?: string) {
  const raw = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (raw === undefined) return { name, present: false } as const;

  const trimmed = raw.trim();
  const illegal = /[^\x20-\x7e]/.exec(trimmed);

  return {
    name,
    present: true,
    source: process.env[name] !== undefined ? name : fallbackName,
    length: raw.length,
    hadSurroundingWhitespace: raw !== trimmed,
    hasSurroundingQuotes: /^["'].*["']$/.test(trimmed),
    illegalCharCodePoint: illegal ? illegal[0].codePointAt(0) : null,
  } as const;
}

let client: S3Client | undefined;

function s3(): S3Client {
  if (client) return client;

  client = new S3Client({
    region: required("NEON_S3_REGION", process.env.AWS_REGION),
    endpoint: required("NEON_S3_ENDPOINT", process.env.AWS_ENDPOINT_URL_S3),
    credentials: {
      accessKeyId: required("NEON_S3_ACCESS_KEY_ID", process.env.AWS_ACCESS_KEY_ID),
      secretAccessKey: required(
        "NEON_S3_SECRET_ACCESS_KEY",
        process.env.AWS_SECRET_ACCESS_KEY,
      ),
    },
    // Required: Neon addresses buckets by path, not by subdomain.
    forcePathStyle: true,
  });

  return client;
}

export async function putObject({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: BucketName;
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  await s3().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function getObject({
  bucket,
  key,
}: {
  bucket: BucketName;
  key: string;
}): Promise<Uint8Array> {
  const response = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error(`Object ${bucket}/${key} has no body.`);
  }
  return bytes;
}

/**
 * A short-lived URL for a private object.
 *
 * Used for proof images, which a browser has to fetch directly. The route that
 * mints one checks the session's clientId first — the signature carries no
 * authorisation of its own, it only saves us proxying the bytes.
 */
export async function presignedGetUrl({
  bucket,
  key,
  expiresIn = 900,
}: {
  bucket: BucketName;
  key: string;
  expiresIn?: number;
}): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

/**
 * The canonical, NON-public address of an object, stored alongside the key for
 * provenance. Both buckets are private, so this URL is not usable on its own —
 * reads go through presignedGetUrl or getObject.
 */
export function canonicalUrl(bucket: BucketName, key: string): string {
  const endpoint = required("NEON_S3_ENDPOINT", process.env.AWS_ENDPOINT_URL_S3);
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}
