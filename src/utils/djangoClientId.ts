import { djangoUserIdFromClientId } from './djangoUsers';

/** Django mijoz PK — `django_123` / `b2b_123` yoki sessiyadan. */
export async function resolveDjangoClientId(
  clientId: string,
  djangoUserIdFromSession?: number
): Promise<number | null> {
  const fromId = djangoUserIdFromClientId(clientId);
  if (fromId != null) return fromId;
  const legacy = /^b2b_(\d+)$/.exec(clientId);
  if (legacy) {
    const id = Number(legacy[1]);
    if (Number.isFinite(id) && id > 0) return id;
  }
  if (djangoUserIdFromSession != null && djangoUserIdFromSession > 0) {
    return djangoUserIdFromSession;
  }
  return null;
}
