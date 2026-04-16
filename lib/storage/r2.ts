import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/**
 * Cloudflare R2 client. Env var names mirror the sibling screenslick project
 * so both apps can share the same bucket / credentials.
 *
 *   CLOUDFLARE_BUCKET_API        — endpoint, e.g. https://{accountId}.r2.cloudflarestorage.com
 *   CLOUDFLARE_ACCESS_KEY_ID     — R2 API token access key
 *   CLOUDFLARE_SECRET_ACCESS_KEY — R2 API token secret
 *   CLOUDFLARE_BUCKET_NAME       — bucket name (shared with screenslick)
 *   CLOUDFLARE_PUBLIC_URL        — public base URL, e.g. https://files.screenslick.com
 *
 * All menugen objects are namespaced under the `menugenai/` key prefix so they
 * don't collide with screenslick's `transfer/` prefix in the shared bucket.
 */

const KEY_PREFIX = 'menugenai'

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env var: ${key}`)
  return v
}

let _client: S3Client | null = null

function client(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: 'auto',
    endpoint: requireEnv('CLOUDFLARE_BUCKET_API'),
    credentials: {
      accessKeyId: requireEnv('CLOUDFLARE_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('CLOUDFLARE_SECRET_ACCESS_KEY'),
    },
  })
  return _client
}

/** Build the public URL for a key. */
export function publicUrl(key: string): string {
  const base = requireEnv('CLOUDFLARE_PUBLIC_URL').replace(/\/+$/, '')
  return `${base}/${key}`
}

/** Stable storage key for a Replicate prediction output, under `menugenai/`. */
export function keyForPrediction(designId: string, predictionId: string, ext: string): string {
  const safeExt = ext.replace(/^\./, '').toLowerCase() || 'webp'
  return `${KEY_PREFIX}/designs/${designId}/${predictionId}.${safeExt}`
}

/**
 * Fetch an image from a source URL (e.g. Replicate's CDN) and upload it to R2.
 * Returns the public URL. Content-type is preserved from the source when
 * possible; falls back to image/webp.
 */
export async function uploadFromUrl(
  sourceUrl: string,
  key: string,
): Promise<{ key: string; url: string; contentType: string }> {
  const res = await fetch(sourceUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch source image: ${res.status} ${res.statusText}`)
  }
  const contentType = res.headers.get('content-type') ?? 'image/webp'
  const buffer = Buffer.from(await res.arrayBuffer())

  await client().send(
    new PutObjectCommand({
      Bucket: requireEnv('CLOUDFLARE_BUCKET_NAME'),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Long TTL; keys are immutable per prediction id.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return { key, url: publicUrl(key), contentType }
}

/** Guess a file extension from a URL or content-type. Defaults to 'webp'. */
export function extFromUrlOrType(url: string, contentType: string | null): string {
  const fromUrl = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (fromUrl && /^(webp|png|jpg|jpeg|gif|avif)$/.test(fromUrl)) return fromUrl
  if (contentType?.startsWith('image/')) {
    const sub = contentType.slice(6).toLowerCase()
    if (/^(webp|png|jpeg|gif|avif)$/.test(sub)) return sub === 'jpeg' ? 'jpg' : sub
  }
  return 'webp'
}
