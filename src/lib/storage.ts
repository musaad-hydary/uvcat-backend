// ─── Supabase Storage helper ───────────────────────────────────────────────
// Uploads texture files to a public Supabase Storage bucket and returns
// the public URL for the uploaded file.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "textures";

// service_role key bypasses RLS — server-side only, never expose to frontend
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadResult {
  url: string;
  path: string;
}

// ── Upload a texture file and return its public URL ──────────────────────────
export async function uploadTexture(
  file: File,
  packId: string,
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File exceeds 5MB limit");
  }

  const ext = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `packs/${packId}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: data.publicUrl, path };
}

// ── Delete a texture file (e.g. when a pack is deleted) ───────────────────────
export async function deleteTexture(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("Failed to delete texture:", error.message);
}
