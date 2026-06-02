export async function createAuthUserWithoutLogin(apiKey: string, email: string, password: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const body = {
    email,
    password,
    returnSecureToken: true
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = errBody.error?.message || `Failed to create user (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  // data.localId is the created user's UID
  return data;
}

// Attempts to call a server-side Admin endpoint to delete an auth user by UID.
// The endpoint URL should be provided via `VITE_FIREBASE_ADMIN_ENDPOINT` at build time
// and must accept a POST JSON body: { uid: string } and perform admin.auth().deleteUser(uid).
export async function deleteAuthUserViaAdminEndpoint(uid: string) {
  const endpoint = (import.meta as any).env?.VITE_FIREBASE_ADMIN_ENDPOINT;
  if (!endpoint) {
    console.warn('[deleteAuthUserViaAdminEndpoint] no admin endpoint configured (VITE_FIREBASE_ADMIN_ENDPOINT)');
    return { ok: false, reason: 'no-endpoint' };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[deleteAuthUserViaAdminEndpoint] failed', res.status, body);
      return { ok: false, reason: 'request-failed', status: res.status };
    }

    return { ok: true };
  } catch (err) {
    console.error('[deleteAuthUserViaAdminEndpoint] error', err);
    return { ok: false, reason: 'exception', error: err };
  }
}
