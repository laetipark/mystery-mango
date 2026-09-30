import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A real process restart check: no in-memory service recreation and no timestamp edits.
// Uses a dedicated local PostgreSQL database; leaves its evidence in place and always
// terminates only the JVM launched by this script. No Discord credentials are needed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.join(root, '.tools');
mkdirSync(work, { recursive: true });
const java = process.env.JAVA_EXECUTABLE || (process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java');
const jar = process.env.RESTART_JAR || path.join(root, 'backend', 'build', 'libs', 'mystery-mango-0.1.0.jar');
const port = Number(process.env.RESTART_PORT || '8082');
const phaseSeconds = Number(process.env.RESTART_PHASE_SECONDS || '30');
const databaseUrl = process.env.DATABASE_URL || 'jdbc:postgresql://127.0.0.1:55432/mystery_mango_restart';
const database = new URL(databaseUrl.replace(/^jdbc:/, ''));
const databaseName = decodeURIComponent(database.pathname.slice(1));
const databaseUser = process.env.DATABASE_USER || 'mango';
const databasePassword = process.env.DATABASE_PASSWORD || '';
const pgBin = process.env.PG_BIN || path.join(root, '.tools', 'pgsql', 'bin');
const suffix = process.platform === 'win32' ? '.exe' : '';
const base = `http://127.0.0.1:${port}`;
const runId = randomUUID();
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let jvm;
let crashAt;
const evidence = { runId, startedAt: new Date().toISOString(), database: databaseName, port, phaseSeconds, voiceProvider: 'disabled', passed: false };

assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(database.hostname), 'Restart verification requires a local PostgreSQL host');
assert.match(databaseName, /^mystery_mango_restart(?:_[a-z0-9_]+)?$/, 'Use a dedicated mystery_mango_restart database');
assert.ok(Number.isInteger(port) && port > 1024 && port < 65536, 'Invalid restart port');
assert.ok(Number.isInteger(phaseSeconds) && phaseSeconds >= 20 && phaseSeconds <= 120, 'Phase duration must be 20–120 seconds');
assert.ok(existsSync(jar), 'Build the executable backend jar first');

function pg(executable, args) {
  const result = spawnSync(path.join(pgBin, executable + suffix), args, {
    cwd: root, windowsHide: true, encoding: 'utf8',
    env: { ...process.env, PGHOST: database.hostname, PGPORT: database.port || '5432', PGUSER: databaseUser, PGPASSWORD: databasePassword },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${executable} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}
function sql(query) {
  return pg('psql', ['--no-psqlrc', '--no-password', '--tuples-only', '--no-align', '--dbname', databaseName, '--command', query]);
}
function prepareDatabase() {
  const existing = pg('psql', ['--no-psqlrc', '--no-password', '--tuples-only', '--no-align', '--dbname', 'postgres', '--command', `select 1 from pg_database where datname='${databaseName}'`]);
  if (existing !== '1') pg('createdb', ['--no-password', '--maintenance-db=postgres', databaseName]);
}
async function requireFreePort() {
  await new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); reject(new Error(`Port ${port} is already occupied; no existing server will be stopped`)); });
    socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(error));
  });
}
async function startJvm(label) {
  await requireFreePort();
  const out = openSync(path.join(work, `restart-${label}.stdout.log`), 'w');
  const err = openSync(path.join(work, `restart-${label}.stderr.log`), 'w');
  jvm = spawn(java, ['-jar', jar], {
    cwd: root, windowsHide: true, stdio: ['ignore', out, err],
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_USER: databaseUser, DATABASE_PASSWORD: databasePassword,
      PORT: String(port), VOICE_PROVIDER: 'disabled', GAME_PHASE_SECONDS: String(phaseSeconds),
      SPRING_PROFILES_ACTIVE: '', COOKIE_SECURE: 'false', EMPTY_GAME_ABORT_SECONDS: '1800' },
  });
  closeSync(out); closeSync(err);
  const current = jvm;
  let launchError;
  current.once('error', error => { launchError = error; });
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (current.exitCode !== null) throw new Error(`JVM exited during ${label} startup; inspect .tools/restart-${label}.stderr.log`);
    try {
      const response = await fetch(`${base}/actuator/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok && (await response.json()).status === 'UP') return;
    } catch { /* Wait for this newly launched process to become available. */ }
    await pause(250);
  }
  throw new Error(`JVM startup timed out (${label})`);
}
async function stopJvm() {
  const current = jvm;
  jvm = undefined;
  if (!current || current.exitCode !== null || current.signalCode !== null) return;
  const stopped = new Promise(resolve => current.once('exit', resolve));
  current.kill('SIGKILL');
  await stopped;
}
process.on('exit', () => { if (jvm && jvm.exitCode === null) jvm.kill('SIGKILL'); });
process.on('SIGINT', () => { if (jvm) jvm.kill('SIGKILL'); process.exit(130); });
process.on('SIGTERM', () => { if (jvm) jvm.kill('SIGKILL'); process.exit(143); });

class BrowserSession {
  cookies = new Map();
  csrf;
  async request(url, method = 'GET', body) {
    const headers = { Cookie: [...this.cookies].map(([name, value]) => `${name}=${value}`).join(';') };
    if (method !== 'GET') { headers['Idempotency-Key'] = randomUUID(); if (this.csrf) headers[this.csrf.headerName] = this.csrf.token; }
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + '/api/v1' + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const values = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get('set-cookie')].filter(Boolean);
    for (const value of values) { const [pair] = value.split(';'); const separator = pair.indexOf('='); this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1)); }
    const text = await response.text();
    let json; try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`${method} ${url} returned non-JSON (${response.status})`); }
    if (!response.ok) throw new Error(`${method} ${url} failed (${response.status}, ${json.code || 'unknown'})`);
    return json;
  }
  async register(index) {
    this.csrf = await this.request('/auth/csrf');
    this.user = await this.request('/auth/register', 'POST', { email: `${runId}-${index}@restart.invalid`, displayName: `재시작 검사 ${index}`, password: 'Restart!' + randomUUID() });
    this.csrf = await this.request('/auth/csrf');
    assert.ok(this.cookies.get('SESSION'), 'HTTP session cookie was not issued');
  }
}

function databaseEvidence(gameId) {
  assert.match(gameId, /^[0-9a-f-]{36}$/i);
  return JSON.parse(sql(`select json_build_object('phaseCount',(select count(*) from phase_instance where game_id=g.id),'ordinal',p.ordinal,'phaseSeconds',extract(epoch from(p.ends_at-p.started_at)),'startedAt',p.started_at,'endsAt',p.ends_at,'investigationCount',(select count(*) from game_investigation where game_id=g.id),'sessionCount',(select count(*) from spring_session)) from game_session g join phase_instance p on p.id=g.current_phase_id where g.id='${gameId}'`));
}

try {
  prepareDatabase();
  await startJvm('before');
  const clients = Array.from({ length: 4 }, () => new BrowserSession());
  for (let index = 0; index < clients.length; index++) await clients[index].register(index + 1);
  const scenarioSource = JSON.parse(readFileSync(path.join(root, 'backend/src/main/resources/scenarios/after-hours-gallery.json'), 'utf8'));
  const cards = await clients[0].request('/scenarios');
  const scenario = cards.items.find(item => item.title === scenarioSource.title);
  assert.ok(scenario, 'Seeded gallery scenario is missing');
  const room = await clients[0].request('/rooms', 'POST', { scenarioVersionId: scenario.versionId, visibility: 'PUBLIC', mode: 'TEXT' });
  for (const client of clients.slice(1)) await client.request(`/rooms/${room.roomId}/join`, 'POST', {});
  for (const client of clients) await client.request(`/rooms/${room.roomId}/ready`, 'PUT', { ready: true });
  const { gameId } = await clients[0].request(`/rooms/${room.roomId}/start`, 'POST');
  for (const client of clients) await client.request(`/games/${gameId}/phase-ready`, 'POST');
  const investigation = await clients[0].request(`/games/${gameId}/investigations`, 'POST', { targetId: 'target-invoice' });
  const before = [];
  for (const client of clients) before.push(await client.request(`/games/${gameId}/snapshot`));
  assert.equal(before[0].phase.definitionId, 'investigation-1');
  assert.ok(before[0].clues.some(clue => clue.id === 'invoice' && clue.owned), 'Investigation did not grant the expected clue');
  const beforeDatabase = databaseEvidence(gameId);
  assert.equal(beforeDatabase.ordinal, 1);
  assert.equal(beforeDatabase.phaseCount, 2);
  assert.equal(beforeDatabase.investigationCount, 1);
  const cookiesBefore = clients.map(client => client.cookies.get('SESSION'));
  crashAt = Date.now();
  await stopJvm();
  console.log(`JVM forcibly stopped after committed investigation; waiting ${phaseSeconds + 5} seconds with the process absent.`);
  await pause((phaseSeconds + 5) * 1000);
  const restartStartedAt = Date.now();
  await startJvm('after');

  // Reuse cookies and CSRF tokens retained in memory; never log in again.
  for (let index = 0; index < clients.length; index++) {
    const user = await clients[index].request('/auth/me');
    assert.equal(user.id, clients[index].user.id, 'JDBC session did not survive process restart');
    assert.equal(clients[index].cookies.get('SESSION'), cookiesBefore[index], 'Restoration unexpectedly replaced the authenticated session');
  }
  let afterFirst;
  const recoveryDeadline = Date.now() + 10000;
  do {
    afterFirst = await clients[0].request(`/games/${gameId}/snapshot`);
    if (afterFirst.phase.definitionId !== 'investigation-1') break;
    await pause(200);
  } while (Date.now() < recoveryDeadline);
  assert.equal(afterFirst.phase.definitionId, 'discussion-1', 'Restart must advance exactly the expired current phase');
  const remaining = (Date.parse(afterFirst.phase.endsAt) - Date.parse(afterFirst.serverTime)) / 1000;
  assert.ok(remaining >= phaseSeconds - 10 && remaining <= phaseSeconds + 1, 'The next phase did not receive a fresh normal duration');
  for (let index = 0; index < clients.length; index++) {
    const after = index === 0 ? afterFirst : await clients[index].request(`/games/${gameId}/snapshot`);
    assert.deepEqual(after.myRole, before[index].myRole, 'Assigned role/private material changed across restart');
    assert.deepEqual(after.clues, before[index].clues, 'Investigated clues changed across restart');
    await clients[index].request(`/games/${gameId}/heartbeat`, 'POST');
  }
  const afterDatabase = databaseEvidence(gameId);
  assert.equal(afterDatabase.phaseCount, beforeDatabase.phaseCount + 1);
  assert.equal(afterDatabase.ordinal, beforeDatabase.ordinal + 1);
  assert.equal(afterDatabase.phaseSeconds, phaseSeconds);
  assert.ok(Date.parse(afterDatabase.startedAt) >= restartStartedAt, 'Next phase was backdated to the expired deadline');
  assert.equal(afterDatabase.investigationCount, beforeDatabase.investigationCount);
  assert.ok(afterDatabase.sessionCount >= clients.length);
  Object.assign(evidence, { passed: true, finishedAt: new Date().toISOString(), gameId, investigationId: investigation.investigationId,
    jdbcSessionsRestored: clients.length, rolesAndCluesPreserved: true, csrfStillValid: true,
    stoppedForSeconds: (restartStartedAt - crashAt) / 1000, before: beforeDatabase, after: afterDatabase,
    nextPhaseRemainingSeconds: remaining, finalPhase: afterFirst.phase.definitionId });
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  evidence.error = error.message;
  console.error(`Restart verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await stopJvm();
  evidence.testJvmStopped = true;
  writeFileSync(path.join(work, 'verify-restart-result.json'), JSON.stringify(evidence, null, 2) + '\n');
}
