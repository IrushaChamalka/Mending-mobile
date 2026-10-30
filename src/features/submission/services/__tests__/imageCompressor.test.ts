import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { compressPhoto, MAX_PHOTO_BYTES } from '../imageCompressor';
import { deleteFile } from '../photoFiles';

interface FakeImage {
  saveAsync: jest.Mock;
  release: jest.Mock;
}
interface FakeContext {
  resize: jest.Mock;
  renderAsync: jest.Mock;
  release: jest.Mock;
  image: FakeImage;
}

const mockContexts: FakeContext[] = [];
const mockFileSizes = new Map<string, number>();

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => {
      const index = mockContexts.length + 1;
      const image = {
        saveAsync: jest.fn(() =>
          Promise.resolve({
            uri: `file:///cache/compressed-${index}.jpg`,
            width: 1280,
            height: 960,
          }),
        ),
        release: jest.fn(),
      };
      const context = {
        resize: jest.fn(),
        renderAsync: jest.fn(() => Promise.resolve(image)),
        release: jest.fn(),
        image,
      };
      mockContexts.push(context);
      return context;
    }),
  },
}));
jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    constructor(fileUri: string) {
      this.uri = fileUri;
    }
    get size(): number {
      return mockFileSizes.get(this.uri) ?? 1_000;
    }
  },
}));
jest.mock('../photoFiles', () => ({ deleteFile: jest.fn() }));

const manipulate = jest.mocked(ImageManipulator.manipulate);

function context(index: number): FakeContext {
  const found = mockContexts[index];
  if (!found) throw new Error(`No manipulator context ${index}`);
  return found;
}

describe('compressPhoto', () => {
  afterEach(() => {
    mockContexts.length = 0;
    mockFileSizes.clear();
    jest.clearAllMocks();
  });

  it('resizes a landscape photo to 1280 px wide and saves a 0.7 JPEG', async () => {
    const result = await compressPhoto({
      uri: 'file:///cache/camera.jpg',
      width: 4000,
      height: 3000,
    });

    expect(manipulate).toHaveBeenCalledWith('file:///cache/camera.jpg');
    expect(context(0).resize).toHaveBeenCalledWith({ width: 1280 });
    expect(context(0).image.saveAsync).toHaveBeenCalledWith({
      format: SaveFormat.JPEG,
      compress: 0.7,
    });
    expect(result).toEqual({ uri: 'file:///cache/compressed-1.jpg', width: 1280, height: 960 });
  });

  it('limits a portrait photo by its height', async () => {
    await compressPhoto({ uri: 'file:///cache/camera.jpg', width: 3000, height: 4000 });
    expect(context(0).resize).toHaveBeenCalledWith({ height: 1280 });
  });

  it('does not upscale a small photo', async () => {
    await compressPhoto({ uri: 'file:///cache/camera.jpg', width: 800, height: 600 });
    expect(context(0).resize).not.toHaveBeenCalled();
  });

  it('releases the native image memory', async () => {
    await compressPhoto({ uri: 'file:///cache/camera.jpg', width: 4000, height: 3000 });
    expect(context(0).image.release).toHaveBeenCalled();
    expect(context(0).release).toHaveBeenCalled();
  });

  it('releases the native image memory when saving fails', async () => {
    manipulate.mockImplementationOnce(() => {
      const image = {
        saveAsync: jest.fn(() => Promise.reject(new Error('disk full'))),
        release: jest.fn(),
      };
      const failing = {
        resize: jest.fn(),
        renderAsync: jest.fn(() => Promise.resolve(image)),
        release: jest.fn(),
        image,
      };
      mockContexts.push(failing);
      return failing as unknown as ReturnType<typeof ImageManipulator.manipulate>;
    });

    await expect(
      compressPhoto({ uri: 'file:///cache/camera.jpg', width: 4000, height: 3000 }),
    ).rejects.toThrow('disk full');
    expect(context(0).image.release).toHaveBeenCalled();
    expect(context(0).release).toHaveBeenCalled();
  });

  it('re-encodes at a lower quality when the result is still over 5 MB', async () => {
    mockFileSizes.set('file:///cache/compressed-1.jpg', MAX_PHOTO_BYTES + 1);

    const result = await compressPhoto({
      uri: 'file:///cache/camera.jpg',
      width: 4000,
      height: 3000,
    });

    expect(manipulate).toHaveBeenLastCalledWith('file:///cache/compressed-1.jpg');
    expect(context(1).resize).not.toHaveBeenCalled();
    expect(context(1).image.saveAsync).toHaveBeenCalledWith({
      format: SaveFormat.JPEG,
      compress: 0.5,
    });
    expect(deleteFile).toHaveBeenCalledWith('file:///cache/compressed-1.jpg');
    expect(result.uri).toBe('file:///cache/compressed-2.jpg');
  });
});
