const fs = require("fs");
const path = require("path");

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walk(filepath, filelist);
    } else {
      if (filepath.endsWith(".tsx") || filepath.endsWith(".ts") || filepath.endsWith(".css")) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const files = walk(path.join(__dirname, "app/dashboard"));
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  const original = content;

  // Replace var(--db-border-light) with var(--db-shadow) inside box-shadows
  content = content.replace(/(box-shadow\s*:[^;]+)var\(--db-border-light\)/gi, '$1var(--db-shadow)');
  
  // Replace var(--db-border-light) with var(--db-shadow) inside TSX string inline shadows
  content = content.replace(/(boxShadow\s*:\s*['"][^'"]+)var\(--db-border-light\)/gi, '$1var(--db-shadow)');

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log("Fixed shadows in: " + file);
  }
}

console.log(`Updated ${count} files for shadows.`);
