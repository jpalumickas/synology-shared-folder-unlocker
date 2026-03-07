import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { store } from './store.js';
import {
  saveConfig,
  loadConfig,
  configExists,
} from './crypto.js';
import {
  startPoller,
  restartPoller,
  pollOnce,
} from './poller.js';
import { unlockShare } from './ssh.js';
import type { AppConfig, NasDevice, EncryptedShare } from '../shared/types.js';

const app = new Hono();
const api = new Hono();

const requireUnlocked = createMiddleware(async (c, next) => {
  if (!store.isUnlocked) {
    return c.json({ error: 'App is locked' }, 403);
  }
  await next();
});

const requireSession = createMiddleware(async (c, next) => {
  if (!store.isUnlocked) {
    return c.json({ error: 'App is locked' }, 403);
  }
  const token = getCookie(c, 'session');
  if (!store.isSessionValid(token)) {
    return c.json({ error: 'Session expired' }, 401);
  }
  await next();
});

// --- Public routes ---

api.get('/status', async (c) => {
  const initialized = await configExists();
  const unlocked = store.isUnlocked;
  const token = getCookie(c, 'session');
  const sessionValid = store.isSessionValid(token);
  return c.json({ initialized, unlocked, sessionValid });
});

api.post('/init', async (c) => {
  if (await configExists()) {
    return c.json({ error: 'Already initialized' }, 400);
  }

  const { password } = await c.req.json<{ password: string }>();
  if (!password || password.length < 8) {
    return c.json(
      { error: 'Password must be at least 8 characters' },
      400,
    );
  }

  const config: AppConfig = { pollingInterval: 120, nasList: [] };
  await saveConfig(config, password);
  const sessionToken = store.unlock(config, password);

  setCookie(c, 'session', sessionToken, {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.json({ success: true });
});

api.post('/unlock', async (c) => {
  if (!(await configExists())) {
    return c.json({ error: 'Not initialized' }, 400);
  }

  const { password } = await c.req.json<{ password: string }>();

  try {
    const config = (await loadConfig(password)) as AppConfig;
    const sessionToken = store.unlock(config, password);

    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    startPoller();
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Invalid password' }, 401);
  }
});

api.post('/lock', (c) => {
  store.lockUI();
  deleteCookie(c, 'session', { path: '/' });
  return c.json({ success: true });
});

// --- Routes requiring app unlocked (no session needed) ---

api.get('/shares/status', requireUnlocked, (c) => {
  return c.json(store.getShareStatuses());
});

api.post('/shares/poll', requireUnlocked, async (c) => {
  await pollOnce();
  return c.json({ success: true, statuses: store.getShareStatuses() });
});

// --- Routes requiring valid session ---

api.get('/nas', requireSession, (c) => {
  const config = store.getConfig()!;
  return c.json(config.nasList);
});

api.post('/nas', requireSession, async (c) => {
  const body = await c.req.json<Omit<NasDevice, 'id' | 'shares'>>();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  const nas: NasDevice = {
    id: randomUUID(),
    name: body.name,
    host: body.host,
    port: body.port || 22,
    username: body.username,
    password: body.password,
    shares: [],
  };

  config.nasList.push(nas);
  store.updateConfig(config);
  await saveConfig(config, password);

  return c.json(nas, 201);
});

api.put('/nas/:id', requireSession, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<Partial<NasDevice>>();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  const nas = config.nasList.find((n) => n.id === id);
  if (!nas) return c.json({ error: 'NAS not found' }, 404);

  if (body.name !== undefined) nas.name = body.name;
  if (body.host !== undefined) nas.host = body.host;
  if (body.port !== undefined) nas.port = body.port;
  if (body.username !== undefined) nas.username = body.username;
  if (body.password !== undefined) nas.password = body.password;

  store.updateConfig(config);
  await saveConfig(config, password);

  return c.json(nas);
});

api.delete('/nas/:id', requireSession, async (c) => {
  const { id } = c.req.param();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  config.nasList = config.nasList.filter((n) => n.id !== id);
  store.removeNasStatuses(id);
  store.updateConfig(config);
  await saveConfig(config, password);
  restartPoller();

  return c.json({ success: true });
});

api.post('/nas/:nasId/shares', requireSession, async (c) => {
  const { nasId } = c.req.param();
  const body = await c.req.json<Omit<EncryptedShare, 'id'>>();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  const nas = config.nasList.find((n) => n.id === nasId);
  if (!nas) return c.json({ error: 'NAS not found' }, 404);

  const share: EncryptedShare = {
    id: randomUUID(),
    name: body.name,
    password: body.password,
  };

  nas.shares.push(share);
  store.setShareStatus(nasId, share, 'unknown');
  store.updateConfig(config);
  await saveConfig(config, password);
  restartPoller();

  return c.json(share, 201);
});

api.put('/nas/:nasId/shares/:shareId', requireSession, async (c) => {
  const { nasId, shareId } = c.req.param();
  const body = await c.req.json<Partial<EncryptedShare>>();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  const nas = config.nasList.find((n) => n.id === nasId);
  if (!nas) return c.json({ error: 'NAS not found' }, 404);

  const share = nas.shares.find((s) => s.id === shareId);
  if (!share) return c.json({ error: 'Share not found' }, 404);

  if (body.name !== undefined) share.name = body.name;
  if (body.password !== undefined) share.password = body.password;

  store.updateConfig(config);
  await saveConfig(config, password);

  return c.json(share);
});

api.delete('/nas/:nasId/shares/:shareId', requireSession, async (c) => {
  const { nasId, shareId } = c.req.param();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  const nas = config.nasList.find((n) => n.id === nasId);
  if (!nas) return c.json({ error: 'NAS not found' }, 404);

  nas.shares = nas.shares.filter((s) => s.id !== shareId);
  store.removeShareStatus(nasId, shareId);
  store.updateConfig(config);
  await saveConfig(config, password);

  return c.json({ success: true });
});

api.post(
  '/nas/:nasId/shares/:shareId/unlock',
  requireSession,
  async (c) => {
    const { nasId, shareId } = c.req.param();
    const config = store.getConfig()!;

    const nas = config.nasList.find((n) => n.id === nasId);
    if (!nas) return c.json({ error: 'NAS not found' }, 404);

    const share = nas.shares.find((s) => s.id === shareId);
    if (!share) return c.json({ error: 'Share not found' }, 404);

    const result = await unlockShare(nas, share);
    store.updateShareStatus(
      nasId,
      shareId,
      result.success ? 'unlocked' : 'error',
      result.success ? undefined : result.message,
    );

    return c.json(result);
  },
);

api.get('/settings', requireSession, (c) => {
  const config = store.getConfig()!;
  return c.json({ pollingInterval: config.pollingInterval });
});

api.put('/settings', requireSession, async (c) => {
  const body = await c.req.json<{ pollingInterval?: number }>();
  const config = store.getConfig()!;
  const password = store.getMasterPassword()!;

  if (body.pollingInterval !== undefined) {
    config.pollingInterval = Math.max(10, body.pollingInterval);
  }

  store.updateConfig(config);
  await saveConfig(config, password);
  restartPoller();

  return c.json({ pollingInterval: config.pollingInterval });
});

// Mount API
app.route('/api', api);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('*', serveStatic({ root: './dist/client' }));
  app.get('*', async (c) => {
    const html = await readFile('./dist/client/index.html', 'utf8');
    return c.html(html);
  });
}

export { app };
