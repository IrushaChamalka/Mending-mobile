import { isApiError } from '@/shared/api/apiError';

import { submissionApi } from '../../api';
import { submissionRepository } from '../submissionRepository';

jest.mock('../../api', () => ({
  submissionApi: { uploadPhoto: jest.fn(), submitWork: jest.fn() },
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

const uploadPhoto = jest.mocked(submissionApi.uploadPhoto);
const submitWork = jest.mocked(submissionApi.submitWork);
const TASK_ID = '33333333-3333-4333-8333-333333333333';

describe('submissionRepository', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uploads the photo as a JPEG file and returns its URL', async () => {
    uploadPhoto.mockResolvedValue({ url: 'https://bucket.s3/photo.jpg' });
    const onProgress = jest.fn();

    const url = await submissionRepository.uploadPhoto(TASK_ID, 'file:///docs/sub-1.jpg', {
      onProgress,
    });

    expect(url).toBe('https://bucket.s3/photo.jpg');
    expect(uploadPhoto).toHaveBeenCalledWith(
      TASK_ID,
      { uri: 'file:///docs/sub-1.jpg', name: 'tally-sheet.jpg', type: 'image/jpeg' },
      { onProgress },
    );
  });

  it('sends only the fields the worker filled in', async () => {
    submitWork.mockResolvedValue({ id: TASK_ID, status: 'SUBMITTED' });

    await submissionRepository.submitWork(TASK_ID, {
      completedQuantity: 120,
      acceptedQuantity: null,
      note: null,
      photoUrl: 'https://bucket.s3/photo.jpg',
    });

    // The backend keeps the stored value of an omitted field and rejects unknown ones.
    expect(submitWork).toHaveBeenCalledWith(
      TASK_ID,
      { completedQuantity: 120, customerSignatureUrl: 'https://bucket.s3/photo.jpg' },
      {},
    );
  });

  it('sends the accepted quantity and the note when given', async () => {
    submitWork.mockResolvedValue({ id: TASK_ID, status: 'SUBMITTED' });

    await submissionRepository.submitWork(TASK_ID, {
      completedQuantity: 120,
      acceptedQuantity: 118,
      note: 'Two collars re-stitched.',
      photoUrl: 'https://bucket.s3/photo.jpg',
    });

    expect(submitWork).toHaveBeenCalledWith(
      TASK_ID,
      {
        completedQuantity: 120,
        acceptedQuantity: 118,
        customerSignatureUrl: 'https://bucket.s3/photo.jpg',
        workerNotes: 'Two collars re-stitched.',
      },
      {},
    );
  });

  it('rejects an upload response without a URL as a non-retryable error', async () => {
    uploadPhoto.mockResolvedValue({ location: 'somewhere' });

    const error: unknown = await submissionRepository
      .uploadPhoto(TASK_ID, 'file:///docs/sub-1.jpg')
      .catch((caught: unknown) => caught);

    expect(isApiError(error) && error.isRetryable).toBe(false);
  });
});
