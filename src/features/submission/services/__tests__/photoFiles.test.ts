import { isCapturedPhotoUri } from '../photoFiles';

jest.mock('expo-file-system', () => ({
  Directory: class {},
  File: class {},
  Paths: { cache: { uri: 'file:///var/mobile/Containers/Data/Application/APP/Library/Caches/' } },
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const CACHE = 'file:///var/mobile/Containers/Data/Application/APP/Library/Caches';

describe('isCapturedPhotoUri', () => {
  it('accepts a compressed photo in the cache directory', () => {
    expect(isCapturedPhotoUri(`${CACHE}/ImageManipulator/1A2B.jpg`)).toBe(true);
  });

  it('accepts the same folder spelled through /private', () => {
    expect(
      isCapturedPhotoUri(
        'file:///private/var/mobile/Containers/Data/Application/APP/Library/Caches/ImageManipulator/1A2B.jpg',
      ),
    ).toBe(true);
  });

  it('rejects files outside the cache, such as a queued photo in the documents folder', () => {
    expect(
      isCapturedPhotoUri(
        'file:///var/mobile/Containers/Data/Application/APP/Documents/submissions/sub-1.jpg',
      ),
    ).toBe(false);
  });

  it('rejects paths that climb out of the cache', () => {
    expect(isCapturedPhotoUri(`${CACHE}/../Documents/submissions/sub-1.jpg`)).toBe(false);
  });

  it('rejects other file types, non-file URIs and malformed URIs', () => {
    expect(isCapturedPhotoUri(`${CACHE}/ImageManipulator/notes.txt`)).toBe(false);
    expect(isCapturedPhotoUri('https://example.com/photo.jpg')).toBe(false);
    expect(isCapturedPhotoUri(`${CACHE}/%E0%A4%A.jpg`)).toBe(false);
  });
});
