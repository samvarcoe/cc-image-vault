import { spec } from 'node:test/reporters';
import { run } from 'node:test';
import process from 'node:process';
import path from 'path';
import fs from 'fs';

const testFiles = fs.readdirSync('./domain/tests/acceptance/specs')
    .filter(file => file.endsWith('.spec.ts'))
    .map(file => path.join('./domain/tests/acceptance/specs', file));

console.log(`Running tests in files: ${testFiles.join(', ')}`);
run({ 
  files: testFiles,
  concurrency: 1 
})
.on('test:fail', () => {
  process.exitCode = 1;
})
.compose(spec)
.pipe(process.stdout);