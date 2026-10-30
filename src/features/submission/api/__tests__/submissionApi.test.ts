import { httpClient } from '@/shared/api/httpClient';

import { httpSubmissionApi } from '../submissionApi';

jest.mock('@/shared/api/httpClient', () => ({
  httpClient: { post: jest.fn(), postMultipart: jest.fn() },
}));

const postMultipart = jest.mocked(httpClient.postMultipart);
const post = jest.mocked(httpClient.post);
const TASK_ID = '33333333-3333-4333-8333-333333333333';

/**
 * Jest runs on Node, whose FormData turns a plain object into "[object Object]". React Native's
 * FormData keeps the { uri, name, type } descriptor and streams the file, so record what is appended.
 */
class RecordingFormData {
  readonly parts: [string, unknown][] = [];
  append(name: string, value: unknown): void {
    this.parts.push([name, value]);
  }
}

const NodeFormData = globalThis.FormData;

describe('httpSubmissionApi', () => {
  beforeAll(() => {
    globalThis.FormData = RecordingFormData as unknown as typeof FormData;
  });

  afterAll(() => {
    globalThis.FormData = NodeFormData;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uploads the photo as multipart form data in the "file" field (API_CONTRACT §6.1)', async () => {
    postMultipart.mockResolvedValue({ url: 'https://bucket.s3/photo.jpg' });
    const photo = { uri: 'file:///docs/sub-1.jpg', name: 'tally-sheet.jpg', type: 'image/jpeg' };

    await httpSubmissionApi.uploadPhoto(TASK_ID, photo);

    const [url, form] = postMultipart.mock.calls[0] ?? [];
    expect(url).toBe(`/api/v1/orders/daily-assignments/${TASK_ID}/signature`);
    expect(form).toBeInstanceOf(RecordingFormData);
    expect((form as unknown as RecordingFormData).parts).toEqual([['file', photo]]);
  });

  it('posts the quantities to submit-work as JSON (API_CONTRACT §6.2)', async () => {
    post.mockResolvedValue({});
    const body = { completedQuantity: 120, customerSignatureUrl: 'https://bucket.s3/photo.jpg' };

    await httpSubmissionApi.submitWork(TASK_ID, body);

    expect(post).toHaveBeenCalledWith(
      `/api/v1/orders/daily-assignments/${TASK_ID}/submit-work`,
      body,
      { signal: undefined },
    );
  });
});
