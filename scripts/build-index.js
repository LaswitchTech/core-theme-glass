import fs from 'node:fs';
import path from 'node:path';

function buildIndex(dir) {
  const abs = path.resolve(dir);
  const files = fs.readdirSync(abs)
    .filter(f => f.startsWith('_') && f.endsWith('.scss') && f !== '_index.scss')
    .map(f => `@forward "${path.basename(f, '.scss')}";`)
    .join('\n');

  fs.writeFileSync(path.join(abs, '_index.scss'), files + '\n');
}

buildIndex('src/scss/components');
buildIndex('src/scss/utilities');
buildIndex('src/scss/forms');
buildIndex('src/scss/templates');
buildIndex('src/scss/views');
console.log('Indexes rebuilt!');
