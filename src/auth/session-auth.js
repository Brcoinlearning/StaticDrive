import crypto from 'node:crypto';

function parseCookieHeader(cookieHeader) {
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separator = part.indexOf('=');
      if (separator === -1) {
        return acc;
      }

      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});
}

function createSessionCookieValue(token) {
  return encodeURIComponent(token);
}

export function createSessionStore() {
  const sessions = new Map();

  return {
    createSession({ user, apiKey, maxAgeMs }) {
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, {
        user,
        apiKey,
        expiresAt: Date.now() + maxAgeMs
      });
      return token;
    },
    getSession(token) {
      const session = sessions.get(token);
      if (!session) {
        return null;
      }

      if (session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return null;
      }

      return session;
    },
    deleteSession(token) {
      sessions.delete(token);
    }
  };
}

export function createSessionAuth({ cookieName, sessionStore }) {
  return async function sessionAuth(request) {
    const cookies = parseCookieHeader(request.headers.cookie);
    const token = cookies[cookieName];
    if (!token) {
      return null;
    }

    const session = sessionStore.getSession(token);
    if (!session) {
      return null;
    }

    return {
      sessionToken: token,
      apiKey: session.apiKey,
      user: session.user
    };
  };
}

export function buildSessionCookie({ cookieName, token, maxAgeSeconds }) {
  return cookieName + '=' + createSessionCookieValue(token) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAgeSeconds;
}

export function buildExpiredSessionCookie(cookieName) {
  return cookieName + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
