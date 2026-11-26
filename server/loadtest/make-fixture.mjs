// Writes new-game.json for the k6 script: a brand-new save for each class, made by the game's own rules.
// Run again whenever the game's rules change:   node make-fixture.mjs <game dir>
import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';import {writeFileSync} from 'node:fs';
const game=path.resolve(process.argv[2]);
const {rankedAction}=await import(pathToFileURL(path.join(game,'dist/server/rank-simulation.js')).href);
const out={};for(const job of ['warrior','mage','archer','paladin','shadow'])out[job]=rankedAction(null,{action:'register',job},Date.now()).state;
writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'new-game.json'),JSON.stringify(out));
console.log('new-game.json written');
