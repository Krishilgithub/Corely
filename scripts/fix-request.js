const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./app/api');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Restore request
  content = content.replace(/export async function (GET|POST|PATCH|DELETE|PUT)\(_request: NextRequest\)/g, 'export async function $1(request: NextRequest)');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
