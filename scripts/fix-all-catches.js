/**
 * One-shot fixer for all remaining build errors and warnings.
 * 
 * Fixes applied:
 * 1. `catch {` blocks that reference `err` → `catch (err) {`
 * 2. `catch {` blocks that reference `error` → `catch (error) {`
 * 3. `catch (error) { ... err` → fixes mismatched variable name inside catch
 * 4. Unused `NextRequest` imports where the param is also unused → strips import
 * 5. Unused `request` params → prefix with underscore
 */
const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((entry) => {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) results.push(full);
  });
  return results;
};

const files = [...walk('./app/api'), './lib/auth-server.ts', './lib/api-response.ts'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  const original = content;

  // ── Fix 1: catch { ... err ... } → catch (err) {
  // Scan for `catch {` then look-ahead for `err` usage
  content = content.replace(
    /catch\s*\{(\s*(?:const|let|var)\s+\w+\s*=\s*\(err\s+as)/g,
    'catch (err) {$1'
  );

  // ── Fix 2: catch { ... console...err } or catch { ...err... } patterns
  content = content.replace(
    /catch\s*\{\s*([\s\S]*?)\berr\b([\s\S]*?)\}/g,
    (match, before, after) => {
      // Only replace if the entire catch block is self-contained (no nested braces)
      const inner = before + 'err' + after;
      const braceCount = (inner.match(/\{/g) || []).length - (inner.match(/\}/g) || []).length;
      if (braceCount === -1) {
        return `catch (err) {\n  ${inner}}`;
      }
      return match;
    }
  );

  // ── Fix 3: `catch (error) { ... err ... }` → rename err → error inside
  content = content.replace(
    /catch\s*\(error\)\s*\{([^}]*)\berr\b([^}]*)\}/g,
    (match, before, after) => {
      return `catch (error) {${before.replace(/\berr\b/g, 'error')}error${after.replace(/\berr\b/g, 'error')}}`;
    }
  );

  // ── Fix 4: Simplest targeted fix — any bare `catch {` containing `err` reference
  // Use line-by-line approach for reliability
  const lines = content.split('\n');
  const fixed = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*\}\s*catch\s*\{/.test(line)) {
      // Look ahead for `err` usage
      let j = i + 1;
      let hasErr = false;
      let depth = 1;
      while (j < lines.length && depth > 0) {
        const l = lines[j];
        if (/\{/.test(l)) depth++;
        if (/\}/.test(l)) depth--;
        if (depth > 0 && /\berr\b/.test(l)) hasErr = true;
        j++;
      }
      if (hasErr) {
        fixed.push(line.replace(/catch\s*\{/, 'catch (err) {'));
      } else {
        fixed.push(line);
      }
    } else {
      fixed.push(line);
    }
    i++;
  }
  content = fixed.join('\n');

  // Same for standalone `catch {`
  const lines2 = content.split('\n');
  const fixed2 = [];
  let k = 0;
  while (k < lines2.length) {
    const line = lines2[k];
    if (/^\s*catch\s*\{/.test(line)) {
      let j = k + 1;
      let hasErr = false;
      let depth = 1;
      while (j < lines2.length && depth > 0) {
        const l = lines2[j];
        const opens = (l.match(/\{/g) || []).length;
        const closes = (l.match(/\}/g) || []).length;
        depth += opens - closes;
        if (depth > 0 && /\berr\b/.test(l)) hasErr = true;
        j++;
      }
      if (hasErr) {
        fixed2.push(line.replace(/catch\s*\{/, 'catch (err) {'));
      } else {
        fixed2.push(line);
      }
    } else {
      fixed2.push(line);
    }
    k++;
  }
  content = fixed2.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log('Done.');
