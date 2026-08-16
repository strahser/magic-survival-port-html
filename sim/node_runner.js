'use strict';
/* Запуск: node sim/node_runner.js  → отчёт в stdout + balance-report.json */
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const files=['data.js','balance.js','spells.js','artifacts.js','classes.js','combos-data.js','theme.js',
 'sim/sim-model.js','sim/sim-grade.js','sim/sim-tune.js','sim/sim-report.js'];
let src=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n');
src+='\n;globalThis.__txt=runSuite();globalThis.__rep=getReport();';
const sandbox={console};vm.createContext(sandbox);
vm.runInContext(src,sandbox);
console.log(sandbox.__txt);
fs.writeFileSync(path.join(root,'balance-report.json'),JSON.stringify(sandbox.__rep,null,2));
console.log('[ok] balance-report.json записан');