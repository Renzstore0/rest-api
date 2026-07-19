#!/usr/bin/env node

'use strict';

const { execSync }                                    = require('child_process');
const { readdirSync, statSync, existsSync,
        mkdirSync }                                    = require('fs');
const { join, relative }                              = require('path');

const ROOT  = __dirname;
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const YELL  = '\x1b[33m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const BOLD  = '\x1b[1m';

const ok   = (msg) => console.log(`  ${GREEN}✓${RESET}  ${msg}`);
const fail = (msg) => console.error(`  ${RED}✗${RESET}  ${msg}`);
const warn = (msg) => console.warn(`  ${YELL}!${RESET}  ${msg}`);
const info = (msg) => console.log(`  ${CYAN}→${RESET}  ${msg}`);

(async () => {

// ─── 1. .env setup ────────────────────────────────────────────────────────────

console.log(`\n${BOLD}[Lumpo] Build - pre-flight${RESET}\n`);

if (!existsSync(join(ROOT, '.env'))) {
  fail('.env not found.');
  fail(`${BOLD}Create .env with your actual values before running npm run build again${RESET}`);
  process.exit(1);
}
ok('.env present');

// ─── 2. Required directories ──────────────────────────────────────────────────

for (const dir of ['public/uploads', 'public/uploads/.tmp', 'public/avatars']) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) { mkdirSync(full, { recursive: true }); ok(`Created ${dir}`); }
  else ok(`${dir} exists`);
}

// ─── 3. Font assets ───────────────────────────────────────────────────────────

const FONT_DIR = join(ROOT, 'assets/fonts');
if (!existsSync(FONT_DIR)) mkdirSync(FONT_DIR, { recursive: true });

const requiredFonts = ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Bold.ttf'];
for (const f of requiredFonts) existsSync(join(FONT_DIR, f)) ? ok(`${f} present`) : warn(`${f} missing - bundled fonts should ship in assets/fonts`);

// AppleColorEmoji auto-downloads and registers on first use instead of at
// build time - see services/fontManagerService.js / emojiCanvasService.js.

// ─── 3b. Fake FF / Fake ML card assets ────────────────────────────────────────

console.log(`\n${BOLD}[Lumpo] Build - maker card assets${RESET}\n`);

const { ensureFakeFFAssets, ensureFakeMLAssets } = require('./utils/fakeCardAssets');

try {
  const { downloaded, total } = await ensureFakeFFAssets();
  ok(downloaded ? `fake-ff assets downloaded (${total} files)` : `fake-ff assets present (${total} files)`);
} catch (err) {
  warn(`fake-ff asset download failed - feature will fail until network is available (${err.message})`);
}

try {
  const { downloaded, total } = await ensureFakeMLAssets();
  ok(downloaded ? `fake-ml assets downloaded (${total} files)` : `fake-ml assets present (${total} files)`);
} catch (err) {
  warn(`fake-ml asset download failed - feature will fail until network is available (${err.message})`);
}

// ─── 4. System dependency check ───────────────────────────────────────────────

function hasCmd(cmd) {
  try { execSync(`which ${cmd}`, { stdio: 'pipe' }); return true; }
  catch { return false; }
}

if (hasCmd('ffmpeg')) ok('ffmpeg found');
else warn('ffmpeg not found - audio conversion will fail (apt install ffmpeg)');

if (hasCmd(process.env.YTDLP_PATH || 'yt-dlp')) ok('yt-dlp found');
else warn('yt-dlp not found - YouTube download will fail (pip install yt-dlp or set YTDLP_PATH)');

// ─── 5. Syntax verification ───────────────────────────────────────────────────

console.log(`\n${BOLD}[Lumpo] Build - syntax check${RESET}\n`);

const SKIP    = new Set(['node_modules', '.git', 'build.js']);
let checked   = 0;
let errored   = 0;

function checkDir(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { checkDir(full); continue; }
    if (!entry.endsWith('.js')) continue;
    const rel = relative(ROOT, full);
    try {
      execSync(`node --check "${full}"`, { stdio: 'pipe' });
      console.log(`  ${GREEN}✓${RESET}  ${DIM}${rel}${RESET}`);
      checked++;
    } catch (err) {
      console.error(`  ${RED}✗${RESET}  ${rel}`);
      console.error(`     ${err.stderr?.toString().trim() || err.message}`);
      errored++;
    }
  }
}

checkDir(ROOT);

console.log(`\n${BOLD}[Lumpo]${RESET} ${checked} file(s) checked, ${errored === 0 ? GREEN : RED}${errored} error(s)${RESET}\n`);

if (errored > 0) process.exit(1);

})();
