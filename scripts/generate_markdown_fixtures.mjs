import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'tests', 'fixtures', 'markdown');

if (!existsSync(fixturesDir)) {
  console.error('Fixtures directory not found:', fixturesDir);
  process.exit(1);
}

const { defaultMarkdownRenderer } = await import('../src/content/service.js');

const mdFiles = readdirSync(fixturesDir).filter((f) => f.endsWith('.md'));

let generated = 0;
let errors = 0;

for (const mdFile of mdFiles) {
  const mdPath = join(fixturesDir, mdFile);
  const htmlFile = mdFile.replace(/\.md$/, '.html');
  const htmlPath = join(fixturesDir, htmlFile);

  const mdContent = readFileSync(mdPath, 'utf-8');

  try {
    const htmlContent = defaultMarkdownRenderer(mdContent);
    writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`OK  ${mdFile} -> ${htmlFile}`);
    generated += 1;
  } catch (err) {
    console.error(`ERR ${mdFile}: ${err.message}`);
    errors += 1;
  }
}

console.log(`\nDone: ${generated} generated, ${errors} errors`);
