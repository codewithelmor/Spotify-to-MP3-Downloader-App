// Records journey J1 (Spotify track link -> 128 kbps MP3) for the demo video.
// Segment 1: the app, recorded by Playwright with an on-screen cursor.
// Segment 2: the Explorer window the app opens, recorded with FFmpeg gdigrab.
// Usage: node record.js   (from this folder; needs app/out built and python + ffmpeg on PATH)
const { _electron } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '../../../../../app');
const DEMO = path.resolve(__dirname, '..');
const REC = path.join(DEMO, 'recordings');
const PROFILE = 'C:/demo/spotify-profile';        // neutral short path, nothing personal on screen
const MUSIC = 'C:\\demo\\spotify-music';
const URL = 'https://open.spotify.com/track/3rSzz97Bk9GCEgEBbQPzyd?si=34cf043065c4408d';
const durations = JSON.parse(fs.readFileSync(path.join(DEMO, 'audio/durations.json'), 'utf8'));
const LEAD = 0.3;
// Minimum scene length = voice-over + lead + hold on the result
const minLen = (id, hold) => (durations[id] || 0) + LEAD + hold;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
function check(ok, what) { if (!ok) throw new Error(`STEP FAILED: ${what}`); log('ok -', what); }

function reset() {
  fs.rmSync(MUSIC, { recursive: true, force: true });   // folder created by this demo only
  fs.mkdirSync(MUSIC, { recursive: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  fs.writeFileSync(path.join(PROFILE, 'settings.json'), JSON.stringify({ folder: MUSIC, bitrate: '192', enrich: true }));
  fs.rmSync(path.join(REC, 'j1-app'), { recursive: true, force: true });
  fs.rmSync(path.join(REC, 'j1-explorer'), { recursive: true, force: true });
  fs.mkdirSync(path.join(REC, 'j1-explorer'), { recursive: true });
}

// ---- on-screen cursor for the app video --------------------------------------
async function injectCursor(page) {
  await page.evaluate(() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 22 32">'
      + '<path d="M2 2 L2 26 L8 20.5 L12 30 L16 28.5 L12 19 L20 19 Z" fill="white" stroke="black" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    const c = document.createElement('img');
    c.id = 'demo-cursor';
    c.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: '22px', height: '32px', zIndex: '2147483647',
      pointerEvents: 'none', transform: 'translate(900px, 520px)', transition: 'transform 0.75s cubic-bezier(.4,0,.2,1)' });
    const r = document.createElement('div');
    r.id = 'demo-ripple';
    Object.assign(r.style, { position: 'fixed', left: '0', top: '0', width: '40px', height: '40px', borderRadius: '50%',
      background: 'rgba(255, 210, 0, 0.5)', zIndex: '2147483646', pointerEvents: 'none', opacity: '0',
      transition: 'opacity 0.4s, transform 0.4s' });
    document.body.append(r, c);
  });
}
async function moveTo(page, sel) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const b = el.getBoundingClientRect();
    const x = b.left + Math.min(b.width / 2, 60), y = b.top + b.height / 2;
    document.getElementById('demo-cursor').style.transform = `translate(${x}px, ${y}px)`;
    window.__demoXY = [x, y];
  }, sel);
  await sleep(850);
}
async function ripple(page) {
  await page.evaluate(() => {
    const [x, y] = window.__demoXY, r = document.getElementById('demo-ripple');
    r.style.transition = 'none'; r.style.opacity = '1'; r.style.transform = `translate(${x - 20}px, ${y - 20}px) scale(0.4)`;
    r.getBoundingClientRect();
    r.style.transition = 'opacity 0.45s, transform 0.45s'; r.style.opacity = '0'; r.style.transform = `translate(${x - 20}px, ${y - 20}px) scale(1.4)`;
  });
  await sleep(250);
}
async function scrollTo(page, sel) {
  await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'smooth' }), sel);
  await sleep(700);
}

// ---- main ---------------------------------------------------------------------
(async () => {
  reset();
  const app = await _electron.launch({
    executablePath: path.join(APP, 'node_modules/electron/dist/electron.exe'),
    args: [APP, `--user-data-dir=${PROFILE}`], cwd: APP,
    recordVideo: { dir: path.join(REC, 'j1-app'), size: { width: 1920, height: 1080 } },
  });
  const page = await app.firstWindow();
  const t0 = Date.now();
  const now = () => (Date.now() - t0) / 1000;
  const markers = [];
  const mark = (id) => { markers.push({ id, start: now() }); log('scene', id); };
  const endMark = () => { markers[markers.length - 1].end = now(); };
  const holdUntil = async (id, seconds) => { const m = markers.find((x) => x.id === id); const wait = (m.start + seconds - now()) * 1000; if (wait > 0) await sleep(wait); };

  await page.waitForLoadState('domcontentloaded');
  await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    w.setContentSize(1920, 1080); w.setPosition(0, 0); w.webContents.setZoomFactor(1.5);
  });
  await page.waitForSelector('#url');
  await injectCursor(page);
  check((await page.textContent('#folder')).trim() === MUSIC, `demo profile loaded (folder ${MUSIC})`);
  check((await page.textContent('h1')).trim() === 'Spotify to MP3', 'app title "Spotify to MP3"');
  await sleep(1500);

  // s01 - the problem: empty app
  mark('s01');
  await holdUntil('s01', minLen('s01', 0.8)); endMark();

  // s02 - paste the link, Load
  mark('s02');
  await moveTo(page, '#url'); await ripple(page);
  await page.fill('#url', URL);
  await sleep(500);
  await moveTo(page, '#previewBtn'); await ripple(page);
  await page.click('#previewBtn');
  await page.waitForSelector('#listSection:not([hidden])', { timeout: 60000 });
  const row = await page.textContent('#tracks');
  check(row.includes('Tumatakbo') && row.includes('Mojofly') && row.includes('4:15'), `preview row: ${row.replace(/\s+/g, ' ').trim()}`);
  await page.waitForFunction(() => [...document.querySelectorAll('#tracks img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
  check(true, 'cover image loaded in the list');
  await holdUntil('s02', minLen('s02', 1.2)); endMark();

  // s03 - 128 kbps, output folder
  mark('s03');
  await scrollTo(page, '.options');
  await moveTo(page, '#bitrate'); await ripple(page);
  await page.selectOption('#bitrate', '128');
  check(await page.inputValue('#bitrate') === '128', 'bitrate 128');
  await sleep(500);
  await moveTo(page, '#folder');
  check((await page.textContent('#folder')).trim() === MUSIC, 'output folder shown: ' + MUSIC);
  await holdUntil('s03', minLen('s03', 0.8)); endMark();

  // s04 - Download
  mark('s04');
  await moveTo(page, '#downloadBtn'); await ripple(page);
  await page.click('#downloadBtn');
  await page.waitForSelector('#progressSection:not([hidden])', { timeout: 10000 });
  await scrollTo(page, '#progressSection');
  await moveTo(page, '#overallText');
  await page.waitForSelector('#summary:not([hidden])', { timeout: 240000 });
  const summary = (await page.textContent('#summaryText')).trim();
  const overall = (await page.textContent('#overallText')).trim();
  check(summary === '1 of 1 track(s) saved.' && overall === 'Finished', `result: "${overall}" / "${summary}"`);
  const mp3s = fs.readdirSync(MUSIC).filter((f) => f.endsWith('.mp3'));
  check(mp3s.length === 1 && mp3s[0].includes('Mojofly'), `file exists: ${mp3s.join(', ')}`);
  const FILE = mp3s[0];
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,codec_type,bit_rate:format=bit_rate,duration:format_tags', '-of', 'json', path.join(MUSIC, FILE)]).toString());
  fs.writeFileSync(path.join(REC, 'j1-app', 'ffprobe.json'), JSON.stringify(probe, null, 2));
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  const br = parseInt(audio.bit_rate, 10);
  check(audio.codec_name === 'mp3' && Math.abs(br - 128000) < 2000, `ffprobe: mp3 at ${br} bps`);
  check(probe.streams.some((s) => s.codec_type === 'video'), 'cover art stream embedded');
  await sleep(1800);
  await holdUntil('s04', minLen('s04', 1.5));
  await scrollTo(page, '#openBtn');
  await moveTo(page, '#openBtn'); await ripple(page);
  await page.click('#openBtn');
  await sleep(500); endMark();
  const tClose = now();
  await app.close();

  // Match markers to the video clock (recording starts slightly before firstWindow resolves)
  const video = fs.readdirSync(path.join(REC, 'j1-app')).find((f) => f.endsWith('.webm'));
  fs.renameSync(path.join(REC, 'j1-app', video), path.join(REC, 'j1-app', 'raw.webm'));
  const vdur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(REC, 'j1-app', 'raw.webm')]).toString());
  const offset = Math.max(0, vdur - tClose);
  const round = (x) => Math.round((x + offset) * 1000) / 1000;
  fs.writeFileSync(path.join(REC, 'j1-app', 'markers.json'), JSON.stringify({
    offset, videoSeconds: vdur, scenes: markers.map((m) => ({ id: m.id, start: round(m.start), end: m.end && round(m.end) })),
  }, null, 2));
  log(`app video ${vdur.toFixed(2)}s, offset ${offset.toFixed(2)}s`);

  // s05 - the file in Explorer (window opened by "Open folder")
  const rect = execFileSync('powershell', ['-NoProfile', '-File', path.join(__dirname, 'explorer.ps1'),
    '-Folder', MUSIC, '-File', FILE, '-X', '152', '-Y', '100', '-W', '1616', '-H', '908']).toString().trim();
  check(rect.startsWith('152 100'), `Explorer arranged (${rect})`);
  await sleep(1200);
  const out = path.join(REC, 'j1-explorer', 'raw.mp4');
  if (process.env.SHOT) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'gdigrab', '-offset_x', '160', '-offset_y', '100', '-video_size', '1600x900', '-i', 'desktop', '-frames:v', '1', path.join(REC, 'explorer-shot.png')]);
  }
  // Visible window area: 1600x900 at (160,100)
  const ff = spawn('ffmpeg', ['-y', '-f', 'gdigrab', '-framerate', '30', '-draw_mouse', '1', '-offset_x', '160', '-offset_y', '100',
    '-video_size', '1600x900', '-i', 'desktop', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', out],
    { stdio: ['pipe', 'ignore', 'ignore'] });
  const s05len = minLen('s05', 2.2);
  // Cursor: from the empty file area to the file, then to the Bit rate row in the Details pane
  const cursor = spawn('powershell', ['-NoProfile', '-File', path.join(__dirname, 'cursor.ps1'),
    '-Path', process.env.CURSOR_PATH || '900,700,500;515,370,1400;1500,886,1500']);
  await new Promise((r) => cursor.on('exit', r));
  await sleep(Math.max(0, s05len * 1000 - 5200));
  ff.stdin.write('q');
  await new Promise((r) => ff.on('exit', r));
  check(fs.existsSync(out), 'Explorer clip recorded');
  fs.writeFileSync(path.join(REC, 'j1-explorer', 'markers.json'), JSON.stringify({ scenes: [{ id: 's05', start: 0, end: s05len }] }, null, 2));
  log('JOURNEY PASS');
})().catch((e) => { console.error(e); console.log('JOURNEY FAIL'); process.exit(1); });
