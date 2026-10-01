import { safetyRequest } from "./safety";
async function uploadOwnedFile(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file no larger than 10 MB.");
  if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"].includes(file.type)) throw new Error("Choose a photo or PDF.");
  const ticket = await safetyRequest("/api/media", { type: file.type, size: file.size });
  const form = new FormData(); form.set("file", file);
  for (const [key, value] of Object.entries({ allowed_formats: ticket.allowedFormats, overwrite: ticket.overwrite, folder: ticket.folder, public_id: ticket.publicId, timestamp: ticket.timestamp, api_key: ticket.apiKey, signature: ticket.signature })) form.set(key, String(value));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${ticket.cloud}/auto/upload`, { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok || !data.secure_url) throw new Error("Upload failed. Please try again.");
  const verified = await safetyRequest("/api/media", { ticket: ticket.publicId, url: data.secure_url, version: data.version, signature: data.signature, resourceType: data.resource_type }, "PATCH");
  return verified.url;
}
export const uploadToCloudinary = uploadOwnedFile;
export async function uploadFileToCloudinary(file: File, _folder?: string) { return uploadOwnedFile(file); }
