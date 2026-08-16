const sessionStore = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function sessionMiddleware() {
  return async (ctx, next) => {
    if (!ctx.from) {
      return next();
    }

    const userId = ctx.from.id;
    const now = Date.now();

    // Check expiration
    const existing = sessionStore.get(userId);
    if (existing && now - existing.updatedAt > SESSION_TTL_MS) {
      sessionStore.delete(userId);
    }

    ctx.userSession = {
      get() {
        const s = sessionStore.get(userId);
        return s ? s.data : null;
      },
      set(data) {
        sessionStore.set(userId, { data, updatedAt: Date.now() });
      },
      clear() {
        sessionStore.delete(userId);
      }
    };

    return next();
  };
}

export const activeSessions = sessionStore;
