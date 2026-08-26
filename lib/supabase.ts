/**
 * Supabase Client & Storage Provider for AIVideo Studio
 * Supports direct REST Storage API, Signed URLs, and S3-compatible endpoints.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey;
const defaultBucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.AWS_S3_BUCKET_NAME || "videos";

export const hasSupabaseConfig = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

/**
 * Get Supabase Storage configuration info
 */
export function getSupabaseConfig() {
  return {
    url: supabaseUrl.replace(/\/$/, ""),
    anonKey: supabaseAnonKey,
    serviceKey: supabaseServiceKey,
    bucket: defaultBucket,
    isConfigured: hasSupabaseConfig,
  };
}

/**
 * Generate a signed upload URL using Supabase Storage REST API
 */
export async function getSupabaseUploadUrl(
  path: string,
  bucketName: string = defaultBucket
): Promise<{ uploadUrl: string; storagePath: string; bucket: string; isLiveStorage: boolean; token?: string; apiKey?: string }> {
  const { url, serviceKey, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return {
      uploadUrl: `https://mock-supabase-storage.local/${bucketName}/${path}`,
      storagePath: path,
      bucket: bucketName,
      isLiveStorage: false,
    };
  }

  const apiKey = serviceKey || anonKey;
  const sanitizedPath = path.replace(/^\/+/, "");

  try {
    const response = await fetch(`${url}/storage/v1/object/upload/sign/${bucketName}/${sanitizedPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawUrl = data.url || "";
      const signedUploadUrl = rawUrl.startsWith("/storage/v1")
        ? `${url}${rawUrl}`
        : `${url}/storage/v1${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
      return {
        uploadUrl: signedUploadUrl,
        token: data.token,
        storagePath: sanitizedPath,
        bucket: bucketName,
        isLiveStorage: true,
        apiKey,
      };
    } else {
      return {
        uploadUrl: `${url}/storage/v1/object/${bucketName}/${sanitizedPath}`,
        storagePath: sanitizedPath,
        bucket: bucketName,
        isLiveStorage: true,
        apiKey,
      };
    }
  } catch (err) {
    console.warn("Error creating Supabase signed upload URL:", err);
    return {
      uploadUrl: `${url}/storage/v1/object/${bucketName}/${sanitizedPath}`,
      storagePath: sanitizedPath,
      bucket: bucketName,
      isLiveStorage: true,
      apiKey,
    };
  }
}

/**
 * Generate a signed read URL for private video playback, or authenticated URL for private buckets
 */
export async function getSupabaseReadUrl(
  path: string,
  bucketName: string = defaultBucket,
  expiresInSeconds: number = 86400 // 24 hours
): Promise<string> {
  // If path is already a full URL (e.g. pasted remote link or sample), return directly
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const { url, serviceKey, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`;
  }

  const apiKey = serviceKey || anonKey;
  const sanitizedPath = path.replace(/^\/+/, "");

  try {
    const response = await fetch(`${url}/storage/v1/object/sign/${bucketName}/${sanitizedPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (response.ok) {
      const data = await response.json();
      const signedPath = data.signedURL || data.url || "";
      if (signedPath.startsWith("http://") || signedPath.startsWith("https://")) {
        return signedPath;
      }
      if (signedPath.startsWith("/storage/v1")) {
        return `${url}${signedPath}`;
      }
      return `${url}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
    }
  } catch (err) {
    console.warn("Error generating Supabase signed read URL:", err);
  }

  // Fallback to authenticated endpoint for private buckets
  return `${url}/storage/v1/object/authenticated/${bucketName}/${sanitizedPath}`;
}

/**
 * Download a file buffer directly from Supabase Storage using server credentials
 */
export async function downloadSupabaseBuffer(
  path: string,
  bucketName: string = defaultBucket
): Promise<Buffer | null> {
  const { url, serviceKey, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const apiKey = serviceKey || anonKey;
  const sanitizedPath = path.replace(/^\/+/, "");

  try {
    const res = await fetch(`${url}/storage/v1/object/authenticated/${bucketName}/${sanitizedPath}`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (res.ok) {
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    }
  } catch {
    // continue
  }

  return null;
}

/**
 * Upload a video buffer or Blob directly to Supabase Storage from the server
 */
export async function uploadBufferToSupabase(
  path: string,
  buffer: Buffer | Uint8Array,
  contentType: string = "video/mp4",
  bucketName: string = defaultBucket
): Promise<{ success: boolean; storagePath: string; publicUrl: string; error?: string }> {
  const { url, serviceKey, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return {
      success: false,
      storagePath: path,
      publicUrl: "",
      error: "Supabase credentials are not configured",
    };
  }

  const apiKey = serviceKey || anonKey;
  const sanitizedPath = path.replace(/^\/+/, "");

  try {
    const response = await fetch(`${url}/storage/v1/object/${bucketName}/${sanitizedPath}`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = errText || `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.message || parsed.error || detail;
        // Supabase wraps the 413 "Payload too large" inside an HTTP 400 body
        if (parsed.code === "EntityTooLarge" || parsed.statusCode === "413") {
          detail =
            "File exceeds the Supabase Storage bucket's per-file size limit. " +
            "Raise the limit in Supabase Dashboard → Storage → your bucket → Settings (file size limit).";
        }
      } catch {
        // keep raw text
      }
      throw new Error(`Supabase upload failed (${response.status}): ${detail}`);
    }

    const publicUrl = `${url}/storage/v1/object/public/${bucketName}/${sanitizedPath}`;
    return {
      success: true,
      storagePath: sanitizedPath,
      publicUrl,
    };
  } catch (err: any) {
    console.error("Supabase buffer upload error:", err);
    return {
      success: false,
      storagePath: path,
      publicUrl: "",
      error: err.message || "Failed to upload to Supabase storage",
    };
  }
}
