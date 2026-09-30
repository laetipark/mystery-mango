import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const definitions = path.join(root, 'backend/src/main/resources/scenarios');
const privateText = [];
for (const name of await fs.readdir(definitions)) {
  if (!name.endsWith('.json')) continue;
  const story = JSON.parse(await fs.readFile(path.join(definitions, name), 'utf8'));
  privateText.push(...story.roles.map(role => role.secret), ...story.clues.map(clue => clue.text), ...story.endings.map(ending => ending.text));
}
async function files(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(filename));
    else if (/\.(?:js|css|html|json|map)$/.test(entry.name)) result.push(filename);
  }
  return result;
}
const targets = await files(path.join(root, 'frontend/dist'));
assert.ok(targets.length > 0, 'Build the frontend before scanning it');
if (process.env.VERIFY_SERVER_LOG) targets.push(path.resolve(process.env.VERIFY_SERVER_LOG));
for (const file of targets) {
  const content = await fs.readFile(file, 'utf8');
  for (const secret of privateText) {
    assert.ok(typeof secret === 'string' && secret.length > 10, 'Fixture secret must be meaningful text');
    const escaped = JSON.stringify(secret).slice(1, -1);
    assert.ok(!content.includes(secret) && !content.includes(escaped), `Scenario private text found in ${path.relative(root, file)}`);
  }
}
console.log(`Checked ${targets.length} public assets/logs against ${privateText.length} private scenario texts: no matches.`);
