import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { fitWithin } from '../domain/photoSize';

import { deleteFile } from './photoFiles';

/** Longest side after compression (brief §13). */
export const MAX_PHOTO_SIDE = 1280;
/** JPEG quality after compression (brief §13). */
export const PHOTO_QUALITY = 0.7;
/** The backend rejects images over 5 MB (API_CONTRACT §6.1). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const FALLBACK_QUALITY = 0.5;

export interface PhotoFile {
  uri: string;
  width: number;
  height: number;
}

async function renderJpeg(
  uri: string,
  resize: ReturnType<typeof fitWithin>,
  quality: number,
): Promise<PhotoFile> {
  const context = ImageManipulator.manipulate(uri);
  if (resize) context.resize(resize);
  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: quality });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } finally {
    // Free the native bitmaps now: low-end phones have little memory to spare.
    image.release();
    context.release();
  }
}

/**
 * Resizes a camera photo so its longest side is at most 1280 px and saves it as a JPEG at quality
 * 0.7, in the cache directory. File URIs in and out, never base64. The result always fits the
 * backend's 5 MB limit. The original is left for the caller to delete.
 */
export async function compressPhoto(photo: PhotoFile): Promise<PhotoFile> {
  const compressed = await renderJpeg(
    photo.uri,
    fitWithin(photo.width, photo.height, MAX_PHOTO_SIDE),
    PHOTO_QUALITY,
  );
  if (new File(compressed.uri).size <= MAX_PHOTO_BYTES) return compressed;
  // Practically unreachable at 1280 px, but the limit must hold.
  const smaller = await renderJpeg(compressed.uri, null, FALLBACK_QUALITY);
  deleteFile(compressed.uri);
  return smaller;
}
