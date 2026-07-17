import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Define upload path inside the public folder
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  
  // Ensure the directory exists
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // Already exists or can't write (will error on write if permission issue)
  }

  // Create unique filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filename = `${Date.now()}-${cleanName}`;
  const filepath = join(uploadDir, filename);

  // Write file
  await writeFile(filepath, buffer);
  
  // Return the web-accessible path
  return `/uploads/${filename}`;
}
