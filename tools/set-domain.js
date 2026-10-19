/*
  PlayNova - set-domain.js  (optional helper, needs Node.js)

  Swaps the placeholder web address in every page, the sitemap and robots.txt
  for your real address, so search engines and social sites see the right links.

  Usage (run from the project folder):
      node tools/set-domain.js https://your-site.pages.dev

  No Node.js? You can do the same thing with your editor's "Find and Replace in
  all files": replace  https://YOUR-DOMAIN-HERE.example  with your address.
*/
const fs = require('fs');
const path = require('path');

const PLACEHOLDER = 'https://YOUR-DOMAIN-HERE.example';
const input = process.argv[2];

if (!input || !/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(input)) {
  console.log('Please give your full web address, for example:');
  console.log('  node tools/set-domain.js https://my-playnova.pages.dev');
  process.exit(1);
}

const address = input.replace(/\/+$/, ''); // no trailing slash
const root = path.join(__dirname, '..');
const extensions = new Set(['.html', '.xml', '.txt']);
let changedFiles = 0;

function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) replaceIn(full);
  }
}

function replaceIn(file) {
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes(PLACEHOLDER)) return;
  fs.writeFileSync(file, before.split(PLACEHOLDER).join(address));
  changedFiles++;
}

walk(root);
console.log('Updated ' + changedFiles + ' files to use ' + address);
if (changedFiles === 0) console.log('(Nothing to change: the placeholder was not found. Did you already run this?)');
