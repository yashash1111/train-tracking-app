const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./client/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix recursive dark:dark:
  let prev;
  do {
      prev = content;
      content = content.replace(/dark:dark:/g, 'dark:');
  } while(content !== prev);

  const cleanups = [
    ['dark:bg-white dark:bg-slate-950', 'dark:bg-slate-950'],
    ['dark:bg-slate-50 dark:bg-slate-900', 'dark:bg-slate-900'],
    ['dark:bg-slate-100 dark:bg-slate-800', 'dark:bg-slate-800'],
    ['dark:border-slate-200 dark:border-slate-800', 'dark:border-slate-800'],
    ['dark:border-slate-300 dark:border-slate-700', 'dark:border-slate-700'],
    ['dark:text-slate-500 dark:text-slate-400', 'dark:text-slate-400'],
    ['dark:text-slate-600 dark:text-slate-300', 'dark:text-slate-300'],
    ['dark:text-slate-800 dark:text-slate-200', 'dark:text-slate-200'],
    ['dark:text-slate-900 dark:text-slate-100', 'dark:text-slate-100'],
    ['dark:text-yellow-600 dark:text-yellow-400', 'dark:text-yellow-400'],
    ['dark:text-yellow-600 dark:text-yellow-500', 'dark:text-yellow-500'],
    ['dark:text-emerald-600 dark:text-emerald-400', 'dark:text-emerald-400'],
    ['dark:text-rose-600 dark:text-rose-400', 'dark:text-rose-400'],
    ['dark:text-slate-500 dark:text-slate-500', 'dark:text-slate-500'],
    ['dark:text-slate-600 dark:text-slate-600', 'dark:text-slate-600'],
  ];

  for (const [bad, good] of cleanups) {
      // Create a global regex for each bad string
      content = content.split(bad).join(good);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned ${file}`);
  }
});
