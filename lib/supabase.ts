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
 * (Or public upload URL if bucket is public)
 */
export async function getSupabaseUploadUrl(
  path: string,
  bucketName: string = defaultBucket
): Promise<{ uploadUrl: string; storagePath: string; bucket: string; isLiveStorage: boolean; token?: string }> {
  const { url, serviceKey, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    // Fallback simulation URL when Supabase credentials are not set yet
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
    // Request signed upload URL from Supabase Storage API
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
      const signedUploadUrl = `${url}/storage/v1${data.url}`;
      return {
        uploadUrl: signedUploadUrl,
        token: data.token,
        storagePath: sanitizedPath,
        bucket: bucketName,
        isLiveStorage: true,
      };
    } else {
      // Fallback to direct REST upload endpoint: POST /storage/v1/object/:bucket/:path
      return {
        uploadUrl: `${url}/storage/v1/object/${bucketName}/${sanitizedPath}`,
        storagePath: sanitizedPath,
        bucket: bucketName,
        isLiveStorage: true,
      };
    }
  } catch (err) {
    console.warn("Error creating Supabase signed upload URL:", err);
    return {
      uploadUrl: `${url}/storage/v1/object/${bucketName}/${sanitizedPath}`,
      storagePath: sanitizedPath,
      bucket: bucketName,
      isLiveStorage: true,
    };
  }
}

/**
 * Generate a signed read URL for private video playback, or public URL for public buckets
 */
export async function getSupabaseReadUrl(
  path: string,
  bucketName: string = defaultBucket,
  expiresInSeconds: number = 86400 // 24 hours
): Promise<string> {
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
      return `${url}/storage/v1${data.signedURL || data.url}`;
    }
  } catch (err) {
    console.warn("Error generating Supabase signed read URL:", err);
  }

  // Fallback to public URL format
  return `${url}/storage/v1/object/public/${bucketName}/${sanitizedPath}`;
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
      body: buffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Supabase upload failed: ${response.status} - ${errText}`);
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
