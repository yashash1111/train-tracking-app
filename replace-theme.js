const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-slate-950': 'bg-white dark:bg-slate-950',
  'bg-slate-900': 'bg-slate-50 dark:bg-slate-900',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
  'text-slate-400': 'text-slate-500 dark:text-slate-400',
  'text-slate-300': 'text-slate-600 dark:text-slate-300',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
  'text-slate-100': 'text-slate-900 dark:text-slate-100',
  'text-yellow-400': 'text-yellow-600 dark:text-yellow-400',
  'text-yellow-500': 'text-yellow-600 dark:text-yellow-500',
  'bg-yellow-500': 'bg-yellow-500 dark:bg-yellow-500', // Just keep it
};

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
  let changed = false;
  
  for (const [oldClass, newClass] of Object.entries(replacements)) {
    // Only replace if not already followed by dark: or preceded by dark:
    // This regex ensures we replace whole words and avoid double-replacing
    const regex = new RegExp(`\\b${oldClass}\\b(?! dark:)`, 'g');
    
    // We also don't want to replace if it's already "bg-white dark:bg-slate-950"
    if (content.includes(newClass)) continue;

    const newContent = content.replace(regex, newClass);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
