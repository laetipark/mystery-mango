import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const source = process.env.API_SCHEMA_URL || 'http://localhost:8081/api/openapi';
const output = fileURLToPath(new URL('../src/common/api.generated.ts', import.meta.url));
const nodes = await openapiTS(new URL(source), { alphabetize: true });
const generated = '// Generated from the Java server OpenAPI schema. Run npm run generate:api to update.\n' + astToString(nodes);
if (process.argv.includes('--check')) {
  const current = await fs.readFile(output, 'utf8').catch(() => '');
  if (current.replace(/\r\n/g, '\n') !== generated.replace(/\r\n/g, '\n')) {
    console.error('API types differ from the Java OpenAPI schema. Run npm run generate:api and review the changes.');
    process.exitCode = 1;
  } else console.log('API types match the Java OpenAPI schema.');
} else {
  await fs.writeFile(output, generated, 'utf8');
  console.log('Updated src/common/api.generated.ts from ' + source);
}
