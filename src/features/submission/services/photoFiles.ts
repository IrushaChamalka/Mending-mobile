import { Directory, File, Paths } from 'expo-file-system';

import { logger } from '@/shared/lib/logger';

/** Queued photos live here, in the document directory, which the OS never clears. */
const SUBMISSIONS_FOLDER = 'submissions';

function submissionsDirectory(): Directory {
  return new Directory(Paths.document, SUBMISSIONS_FOLDER);
}

/** The current URI of a queued photo, resolved on every use (see UploadQueueItem.photoName). */
export function queuedPhotoUri(name: string): string {
  return new File(submissionsDirectory(), name).uri;
}

/**
 * Copies a compressed photo from the cache into the submissions folder, named after the
 * submission, then deletes the cache copy. Returns the file name to store in the queue.
 */
export async function saveQueuedPhoto(sourceUri: string, submissionId: string): Promise<string> {
  const directory = submissionsDirectory();
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  const name = `${submissionId}.jpg`;
  await new File(sourceUri).copy(new File(directory, name));
  deleteFile(sourceUri);
  return name;
}

export function queuedPhotoExists(name: string): boolean {
  try {
    return new File(submissionsDirectory(), name).exists;
  } catch {
    return false;
  }
}

export function deleteQueuedPhoto(name: string): void {
  deleteFile(queuedPhotoUri(name));
}

/** Deletes a file, such as a camera original in the cache. A missing file is not an error. */
export function deleteFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    logger.warn('Could not delete a photo file', { error });
  }
}

/** Deletes saved photos that no queue item refers to, for example after a crash while queueing. */
export function deleteUnqueuedPhotos(keep: ReadonlySet<string>): void {
  try {
    const directory = submissionsDirectory();
    if (!directory.exists) return;
    for (const entry of directory.list()) {
      if (entry instanceof File && !keep.has(entry.name)) entry.delete();
    }
  } catch (error) {
    logger.warn('Could not clean up saved photos', { error });
  }
}

/** A file URI as a plain path, so differently spelled URIs of one file compare equal. */
function comparablePath(uri: string): string | null {
  try {
    const path = decodeURI(uri.replace(/^file:\/\//, ''));
    // iOS reports the same container as /var/… or /private/var/….
    return path.replace(/^\/private\//, '/');
  } catch {
    return null;
  }
}

/**
 * True for a photo this app captured: a .jpg in its own cache directory. The submit screen takes the
 * photo's URI as a route parameter, so a crafted deep link must not make it upload (and then delete)
 * any other file, such as another submission's queued photo.
 */
export function isCapturedPhotoUri(uri: string): boolean {
  const path = comparablePath(uri);
  const cache = comparablePath(Paths.cache.uri);
  if (path === null || cache === null) return false;
  const cacheFolder = cache.endsWith('/') ? cache : `${cache}/`;
  return (
    uri.startsWith('file://') &&
    path.startsWith(cacheFolder) &&
    path.toLowerCase().endsWith('.jpg') &&
    !path.split('/').includes('..')
  );
}
