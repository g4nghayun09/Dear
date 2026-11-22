import { USE_MOCK } from '../config';
import { realApi } from './real';
import { mockApi } from './mock';

export const api = USE_MOCK ? mockApi : realApi;
export { ApiError } from './client';
