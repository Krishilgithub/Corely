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

  // Fix catch { ... err ... } to catch (err) {
  content = content.replace(/catch\s*\{\s*const msg = \(err/g, 'catch (err) {\n    const msg = (err');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
