/**
 * Dependency-free browser check via the Chrome DevTools Protocol.
 * Uses Node's built-in WebSocket, so no puppeteer/playwright is required.
 *
 *   node scripts/browser-check.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.WEB ?? 'http://localhost:5173';
const PORT = 9222;

let pass = 0;
let fail = 0;
const ok = (label, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${label}${extra ? `  (${extra})` : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${extra ? `  (${extra})` : ''}`);
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* minimal CDP client                                                   */
/* ------------------------------------------------------------------ */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 20000);
    });
  }

  /** Evaluate in the page and return the value. */
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description ?? 'page exception');
    }
    return res.result?.value;
  }

  async goto(url) {
    await this.send('Page.navigate', { url });
    await this.waitFor('document.readyState === "complete"');
  }

  async waitFor(expression, { timeout = 15000, label = expression } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await this.eval(`!!(${expression})`)) return true;
      } catch {
        /* page may be mid-navigation */
      }
      await sleep(120);
    }
    throw new Error(`timed out waiting for: ${label}`);
  }

  text(selector = 'body') {
    return this.eval(`(document.querySelector(${JSON.stringify(selector)})?.innerText ?? '').trim()`);
  }

  async click(selector) {
    const clicked = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`click target not found: ${selector}`);
    return true;
  }

  async clickByText(tag, needle) {
    return this.eval(`(() => {
      const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
        .find(n => (n.innerText ?? '').toLowerCase().includes(${JSON.stringify(needle.toLowerCase())}));
      if (!el) return false;
      el.click();
      return true;
    })()`);
  }
}

/* ------------------------------------------------------------------ */
/* boot                                                                */
/* ------------------------------------------------------------------ */

const profile = mkdtempSync(join(tmpdir(), 'stocksense-cdp-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let cdp;
try {
  // wait for the debugger to come up
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === 'page');
    } catch {
      /* not ready */
    }
  }
  if (!target) throw new Error('Chrome debugger never became available');

  cdp = await Cdp.connect(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const errors = [];
  cdp.ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails?.exception?.description ?? 'exception');
    }
  });

  /* ---------------- 1. unauthenticated shows the sign-in screen ------- */
  console.log('\n== 1. Sign-in gate ==');
  await cdp.goto(`${BASE}/#/`);
  await cdp.waitFor(`document.body.innerText.includes('Sign in')`, { label: 'sign-in screen' });
  // The demo directory is fetched from the API, so wait for it rather than racing it.
  await cdp
    .waitFor(`document.body.innerText.includes('Rahul Sharma')`, { label: 'demo directory' })
    .catch(() => {});
  const loginText = await cdp.text('body');
  ok('unauthenticated visit shows the sign-in screen', loginText.includes('Sign in'));
  ok('sign-in screen lists demo accounts', loginText.includes('Rahul Sharma'));
  ok('workspace chrome is not rendered', !loginText.includes('Move History'));
  ok('no false zero-backend claim', !/zero.backend|without a backend|offline sync/i.test(loginText));
  ok('sign-in screen shows the real roles', /Inventory Manager/.test(loginText) && /Admin/.test(loginText));

  /* ---------------- 2. sign in with the demo manager ----------------- */
  console.log('\n== 2. Sign in ==');
  await cdp.clickByText('button', 'Continue as Inventory Manager');
  await cdp.waitFor(`document.body.innerText.includes('Move History')`, {
    label: 'workspace shell',
  });
  const appText = await cdp.text('body');
  ok('workspace renders after sign-in', appText.includes('Move History'));
  ok('sidebar shows the signed-in user', appText.includes('Rahul Sharma'));
  ok('token is persisted for the session', !!(await cdp.eval(`localStorage.getItem('stocksense.token')`)));
  ok(
    'settings is hidden for a non-admin role',
    !(await cdp.eval(`[...document.querySelectorAll('a')].some(a => a.textContent.trim() === 'Settings')`)),
  );

  /* ---------------- 3. the new blue palette is live ------------------- */
  console.log('\n== 3. Design system ==');
  const primary = await cdp.eval(
    `getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()`,
  );
  ok('primary token is the spec blue', primary === '#2563eb', primary);
  const surface = await cdp.eval(
    `getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()`,
  );
  ok('background token is the spec neutral', surface === '#f8fafc', surface);
  const bodyBg = await cdp.eval(`getComputedStyle(document.body).backgroundColor`);
  ok('body paints with no purple cast', !/rgb\(\s*8[0-9],|rgb\(\s*7[0-9], 5[0-9]/.test(bodyBg), bodyBg);

  /* ---------------- 4. command palette (Ctrl+K) ---------------------- */
  console.log('\n== 4. Command palette ==');
  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))`);
  await cdp.waitFor(`document.querySelector('[role=dialog]')`, { label: 'command palette' });
  const paletteText = await cdp.text('[role=dialog]');
  const placeholder = await cdp.eval(
    `document.querySelector('[role=dialog] input')?.getAttribute('placeholder') ?? ''`,
  );
  ok('Ctrl+K opens the palette', paletteText.includes('Dashboard'));
  ok('palette prompt invites search', /jump to a page/i.test(placeholder), placeholder);
  ok('palette offers create actions', paletteText.includes('New transfer'));
  ok('palette lists navigation targets', paletteText.includes('Dashboard') && paletteText.includes('Receipts'));

  // search for a product by SKU
  await cdp.eval(`(() => {
    const i = document.querySelector('[role=dialog] input');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(i, 'STL-ROD-12');
    i.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
  await sleep(400);
  const found = await cdp.text('[role=dialog]');
  ok('palette searches products by SKU', found.includes('STL-ROD-12'), found.includes('STL-ROD-12') ? '' : 'not found');

  await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await sleep(300);
  ok('Escape closes the palette', !(await cdp.eval(`!!document.querySelector('[role=dialog]')`)));

  /* ---------------- 5. routes all render ---------------------------- */
  console.log('\n== 5. Route render sweep ==');
  const routes = [
    ['/', 'Dashboard'],
    ['/products', 'Products'],
    ['/receipts', 'Receipts'],
    ['/deliveries', 'Deliveries'],
    ['/transfers', 'Transfers'],
    ['/counts', 'Physical Counts'],
    ['/ledger', 'Move History'],
    ['/warehouse', 'Warehouses'],
  ];
  for (const [route, needle] of routes) {
    await cdp.goto(`${BASE}/#${route}`);
    await cdp.waitFor(`document.body.innerText.length > 40`, { label: `route ${route}` });
    const body = await cdp.text('body');
    const crashed = /Something went wrong|Cannot read propert|Minified React error/i.test(body);
    ok(`${route} renders`, body.includes(needle) && !crashed, crashed ? 'render error' : '');
  }

  /* ---------------- 6. sign out returns to the gate ------------------ */
  console.log('\n== 6. Sign out ==');
  await cdp.goto(`${BASE}/#/`);
  await cdp.waitFor(`document.body.innerText.includes('Move History')`);
  await cdp.clickByText('button', 'Rahul Sharma');
  await sleep(300);
  await cdp.clickByText('button', 'Sign out');
  await cdp.waitFor(`document.body.innerText.includes('Sign in')`, { label: 'sign-in after sign-out' });
  ok('sign out returns to the sign-in screen', true);
  ok('token is cleared on sign out', !(await cdp.eval(`localStorage.getItem('stocksense.token')`)));

  /* ---------------- 7. reload keeps you signed out ------------------ */
  console.log('\n== 7. Session persistence ==');
  await cdp.goto(`${BASE}/#/`);
  await cdp.waitFor(`document.body.innerText.includes('Sign in')`);
  ok('a signed-out reload does not restore the workspace', true);

  ok('no uncaught page exceptions during the run', errors.length === 0, errors.slice(0, 2).join(' | '));
} catch (err) {
  fail += 1;
  console.log(`\n  ERROR  ${err.message}`);
} finally {
  try {
    cdp?.ws.close();
  } catch {
    /* ignore */
  }
  chrome.kill();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
