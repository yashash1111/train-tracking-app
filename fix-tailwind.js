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

function roundToNearestHundred(numStr) {
    const num = parseInt(numStr, 10);
    // Tailwind has 50, 100, 200... 900, 950.
    if (num <= 50) return '50';
    if (num >= 950) return '950';
    const rounded = Math.round(num / 100) * 100;
    return rounded.toString();
}

const themeMappings = {
  'bg-slate-950': 'bg-white dark:bg-slate-950',
  'bg-slate-900': 'bg-slate-50 dark:bg-slate-900',
  'bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
  'text-slate-400': 'text-slate-500 dark:text-slate-400',
  'text-slate-500': 'text-slate-500 dark:text-slate-500',
  'text-slate-600': 'text-slate-600 dark:text-slate-600',
  'text-slate-300': 'text-slate-600 dark:text-slate-300',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
  'text-slate-100': 'text-slate-900 dark:text-slate-100',
  'text-yellow-400': 'text-yellow-600 dark:text-yellow-400',
  'text-yellow-500': 'text-yellow-600 dark:text-yellow-500',
  'text-emerald-400': 'text-emerald-600 dark:text-emerald-400',
  'text-rose-400': 'text-rose-600 dark:text-rose-400',
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Fix invalid numbers (e.g., text-slate-505 -> text-slate-500)
  content = content.replace(/\b(text|bg|border)-([a-z]+)-([0-9]{3})\b/g, (match, type, color, num) => {
      const valid = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      if (!valid.includes(num)) {
          const newNum = roundToNearestHundred(num);
          return `${type}-${color}-${newNum}`;
      }
      return match;
  });

  // 2. Apply dark mappings for the newly fixed classes, if they aren't already mapped
  for (const [oldClass, newClass] of Object.entries(themeMappings)) {
    const regex = new RegExp(`\\b${oldClass}\\b(?! dark:)`, 'g');
    if (content.includes(newClass)) {
        // replace any remaining stragglers that don't have dark: prepended
        content = content.replace(regex, newClass);
    } else {
        content = content.replace(regex, newClass);
    }
  }

  // 3. Fix any duplicate classes we might have caused (e.g. bg-white dark:bg-white dark:bg-slate-950)
  // This is a rough cleanup just in case
  content = content.replace(/bg-white dark:bg-white dark:bg-slate-950/g, 'bg-white dark:bg-slate-950');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
