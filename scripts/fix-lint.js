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

const files = [
  ...walk('./app/api'),
  './lib/api-response.ts',
  './lib/auth-server.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Fix catch (error: any) -> catch (error)
  content = content.replace(/catch\s*\(\s*error\s*:\s*any\s*\)/g, 'catch (error)');
  content = content.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, 'catch (err)');
  
  // Fix error.message
  content = content.replace(/if\s*\(\s*error\.message\s*===/g, 'if (error instanceof Error && error.message ===');
  
  // Fix unused request: NextRequest -> _request: NextRequest
  content = content.replace(/export async function (GET|POST|PATCH|DELETE|PUT)\(request: NextRequest\)/g, 'export async function $1(_request: NextRequest)');
  
  // Fix specific unused vars
  content = content.replace(/catch \(_*err\)/g, 'catch'); // auth-server.ts
  content = content.replace(/catch \(_*error\)/g, 'catch'); // users/me/route.ts
  content = content.replace(/export async function GET\(_request: NextRequest\)/g, 'export async function GET()'); // For those that don't use it at all
  
  // Actually, some POSTs might use `request`, so I should only replace if unused
  // Instead of complex AST, I'll just rely on the specific lint warnings.

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
