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

  // For TSX inline styles (single and double quotes)
  const replacePatternsTsx = [
    { regex: /(background(?:Color)?\s*:\s*)(['"])#ffffff\2/gi, rep: '$1$2var(--db-panel)$2' },
    { regex: /(background(?:Color)?\s*:\s*)(['"])#fff\2/gi, rep: '$1$2var(--db-panel)$2' },
    { regex: /(background(?:Color)?\s*:\s*)(['"])#fafafa\2/gi, rep: '$1$2var(--db-bg)$2' },
    { regex: /(color\s*:\s*)(['"])#111111\2/gi, rep: '$1$2var(--db-text)$2' },
    { regex: /(color\s*:\s*)(['"])#111\2/gi, rep: '$1$2var(--db-text)$2' },
    { regex: /(color\s*:\s*)(['"])#71717a\2/gi, rep: '$1$2var(--db-text-muted)$2' },
    { regex: /(border(?:Color|Top|Bottom|Left|Right)?\s*:\s*.*)(['"])#e4e4e7\2/gi, rep: '$1$2var(--db-border)$2' },
    { regex: /(border(?:Color|Top|Bottom|Left|Right)?\s*:\s*.*)(['"])#f0f0f0\2/gi, rep: '$1$2var(--db-border)$2' },
    // Also replace exact hex strings inside template literals or general strings if they are obvious layout colors
    // But be careful. It's safer to just replace them generally if they match exactly.
    { regex: /(["'])#fafafa\1/gi, rep: '$1var(--db-bg)$1' },
    { regex: /(["'])#f5f5f5\1/gi, rep: '$1var(--db-hover)$1' },
    { regex: /(["'])#111111\1/gi, rep: '$1var(--db-text)$1' },
    { regex: /(["'])#71717a\1/gi, rep: '$1var(--db-text-muted)$1' },
    { regex: /(["'])#e4e4e7\1/gi, rep: '$1var(--db-border)$1' },
    { regex: /(["'])#f0f0f0\1/gi, rep: '$1var(--db-border)$1' },
    // Revert any incorrect color: var(--db-panel) just in case
    { regex: /color:\s*(['"])var\(--db-panel\)\1/gi, rep: 'color: $1#ffffff$1' },
    { regex: /color:\s*var\(--db-panel\)/gi, rep: 'color: #ffffff' },
  ];

  // For CSS files
  const replacePatternsCss = [
    { regex: /(background(?:-color)?\s*:\s*)#ffffff/gi, rep: '$1var(--db-panel)' },
    { regex: /(background(?:-color)?\s*:\s*)#fff(?![\w])/gi, rep: '$1var(--db-panel)' },
    { regex: /(background(?:-color)?\s*:\s*)#fafafa/gi, rep: '$1var(--db-bg)' },
    { regex: /(color\s*:\s*)#111111/gi, rep: '$1var(--db-text)' },
    { regex: /(color\s*:\s*)#111(?![\w])/gi, rep: '$1var(--db-text)' },
    { regex: /(color\s*:\s*)#71717a/gi, rep: '$1var(--db-text-muted)' },
    { regex: /(border(?:-color|-top|-bottom|-left|-right)?\s*:\s*.*?)#e4e4e7/gi, rep: '$1var(--db-border)' },
    { regex: /(border(?:-color|-top|-bottom|-left|-right)?\s*:\s*.*?)#f0f0f0/gi, rep: '$1var(--db-border)' },
    { regex: /#fafafa/gi, rep: 'var(--db-bg)' },
    { regex: /#f5f5f5/gi, rep: 'var(--db-hover)' },
    { regex: /#111111/gi, rep: 'var(--db-text)' },
    { regex: /#71717a/gi, rep: 'var(--db-text-muted)' },
    { regex: /#e4e4e7/gi, rep: 'var(--db-border)' },
    { regex: /#f0f0f0/gi, rep: 'var(--db-border)' },
  ];

  const patterns = file.endsWith(".css") ? replacePatternsCss : replacePatternsTsx;

  for (const { regex, rep } of patterns) {
    content = content.replace(regex, rep);
  }

  // Common transparent borders (optional, but good for dark mode)
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.04\)/g, 'var(--db-border-light)');
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.05\)/g, 'var(--db-border-light)');
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.06\)/g, 'var(--db-border-light)');
  content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.08\)/g, 'var(--db-border-light)');

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log("Updated: " + file);
  }
}

console.log(`Updated ${count} files.`);
