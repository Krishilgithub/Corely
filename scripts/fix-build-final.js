/**
 * COMPREHENSIVE BUILD FIXER
 * Fixes all remaining TypeScript errors and ESLint warnings in one pass:
 * 1. Functions with unused `_request: NextRequest` as the ONLY param → remove the param entirely (valid in Next.js 15)
 * 2. Functions with unused `_request: NextRequest` as the FIRST of two params → keep it (required for dynamic routes)
 *    but re-add the NextRequest import if missing
 * 3. Removes dangling `NextRequest` imports that are truly unused
 * 4. Fixes any remaining `catch {}` blocks that reference `err` or `error` without binding the variable
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

const files = walk('./app/api');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  const original = content;

  // ── Step 1: Remove `_request: NextRequest` from single-param route handlers ──
  // Pattern: export async function VERB(_request: NextRequest) {
  // These don't use `request` so we can just use no param: VERB() {
  content = content.replace(
    /export async function (GET|POST|PUT|PATCH|DELETE)\(_request: NextRequest\)\s*\{/g,
    'export async function $1() {'
  );

  // ── Step 2: Fix `request: NextRequest` (with leading underscore removed by earlier script) ──
  // Keep it but rename to remove if unused
  content = content.replace(
    /export async function (GET|POST|PUT|PATCH|DELETE)\(request: NextRequest\)\s*\{/g,
    (match, verb) => {
      // Check if `request` is actually used in the file body after this point
      // Simple heuristic: count usages of `request.` in the file
      const usages = (content.match(/\brequest\./g) || []).length;
      if (usages === 0) {
        return `export async function ${verb}() {`;
      }
      return match;
    }
  );

  // ── Step 3: Remove import { NextRequest } if NextRequest is no longer referenced ──
  const hasNextRequestUsage = /\bNextRequest\b/.test(content.replace(/import[^;]+;/g, ''));
  if (!hasNextRequestUsage) {
    // Remove standalone import of NextRequest
    content = content.replace(/^import \{ NextRequest \} from ['"]next\/server['"];\r?\n/gm, '');
    // Remove from combined import e.g. { NextRequest, NextResponse }
    content = content.replace(/NextRequest,\s*/g, '');
    content = content.replace(/,\s*NextRequest/g, '');
  }

  // ── Step 4: Re-add NextRequest import if it's still referenced but not imported ──
  const stillRefs = /\bNextRequest\b/.test(content.replace(/^import[^;]+;/gm, ''));
  const alreadyImported = /\bNextRequest\b/.test(content.match(/^import[^;]+;/gm)?.join(' ') || '');
  if (stillRefs && !alreadyImported) {
    // Add import after first line or before first import
    const hasNextServerImport = /from ['"]next\/server['"]/.test(content);
    if (hasNextServerImport) {
      // Add NextRequest to existing next/server import
      content = content.replace(
        /import \{([^}]+)\} from ['"]next\/server['"]/,
        (match, imports) => `import {${imports}, NextRequest} from 'next/server'`
      );
    } else {
      content = `import { NextRequest } from 'next/server';\n` + content;
    }
  }

  // ── Step 5: Fix catch blocks that reference `err` but have no catch param ──
  // Line-by-line approach for reliability
  const lines = content.split('\n');
  const fixed = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Match `} catch {` or `catch {`
    if (/\}\s*catch\s*\{/.test(line) || /^\s*catch\s*\{/.test(line)) {
      // Scan ahead to find the closing brace and check for `err` or variable usage
      let depth = 1;
      let j = i + 1;
      let catchBody = '';
      let catchEnd = i + 1;
      while (j < lines.length && depth > 0) {
        const l = lines[j];
        const opens = (l.match(/\{/g) || []).length;
        const closes = (l.match(/\}/g) || []).length;
        depth += opens - closes;
        if (depth > 0) catchBody += l + '\n';
        else catchEnd = j;
        j++;
      }
      // Check if catch body uses `err` (not a new declaration)
      if (/\berr\b/.test(catchBody) && !/\bcatch\s*\(err\)/.test(line)) {
        fixed.push(line.replace(/catch\s*\{/, 'catch (err) {'));
      } else if (/\berror\b/.test(catchBody) && !/\bcatch\s*\(error\)/.test(line) && !/\bnew\s+Error\b/.test(catchBody)) {
        fixed.push(line.replace(/catch\s*\{/, 'catch (error) {'));
      } else {
        fixed.push(line);
      }
    } else {
      fixed.push(line);
    }
    i++;
  }
  content = fixed.join('\n');

  // ── Step 6: Fix `catch (error) { ... err ... }` mismatch ──
  content = content.replace(
    /catch\s*\(error\)\s*\{([^}]*?)\berr\b([^}]*?)\}/gs,
    (match, before, after) => {
      const fixed = match.replace(/\bcatch\s*\(error\)\s*\{/, 'catch (error) {')
        .replace(/(catch\s*\(error\)\s*\{[\s\S]*?)(\berr\b)([\s\S]*?\})/g,
          (m, pre, _err, post) => pre + 'error' + post);
      return fixed;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${path.relative('.', file)}`);
  } else {
    console.log(`⏭  No changes: ${path.relative('.', file)}`);
  }
});

console.log('\n✅ All files processed.');
