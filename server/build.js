const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Clear dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function getFiles(dir) {
    const files = [];
    const list = fs.readdirSync(dir);
    for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...getFiles(fullPath));
        } else if (item.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

console.log('Finding all TypeScript files in src...');
const tsFiles = getFiles(srcDir);
console.log(`Found ${tsFiles.length} files. Starting native in-memory transpilation...`);

const start = Date.now();
for (const file of tsFiles) {
    const relativePath = path.relative(srcDir, file);
    const targetPath = path.join(distDir, relativePath).replace(/\.ts$/, '.js');
    
    // Ensure target subdirectory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    
    // Read and transpile in memory
    const tsCode = fs.readFileSync(file, 'utf8');
    const jsResult = ts.transpileModule(tsCode, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
            resolveJsonModule: true
        }
    });
    
    // Write JS output
    fs.writeFileSync(targetPath, jsResult.outputText, 'utf8');
}

console.log(`Transpiled successfully in ${Date.now() - start}ms!`);
