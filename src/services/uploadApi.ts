import {
  API_BASE_URL,
  buildApiFetchUrl,
  coerceBrowserFetchUrl,
  refreshStoredAccessToken,
} from './api';
import { normalizeMediaPath } from '../utils/mediaUrl';

export type UploadFolder = 'catalog' | 'categories' | 'brands' | 'landing' | 'avatars';

export interface UploadImageResult {
  url: string;
  path?: string;
}

/** Rasm faylini Django API ga yuklash */
export async function uploadImageFile(
  file: File,
  folder: UploadFolder = 'catalog'
): Promise<UploadImageResult> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Rasm yuklash uchun tizimga kiring (JWT).');
  }

  const doUpload = async (accessToken: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    let url = buildApiFetchUrl(API_BASE_URL, '/upload/image/');
    url = coerceBrowserFetchUrl(url);
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    return res;
  };

  let res = await doUpload(token);
  if (res.status === 401) {
    const refreshed = await refreshStoredAccessToken();
    const next = localStorage.getItem('auth_token');
    if (refreshed && next) {
      res = await doUpload(next);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { detail?: string }).detail || `Yuklash xatosi (${res.status})`;
    throw new Error(detail);
  }

  const data = (await res.json()) as UploadImageResult;
  const path = normalizeMediaPath(data.path || data.url);
  return { url: path, path };
}
