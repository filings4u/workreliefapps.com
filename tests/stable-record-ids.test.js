// UUID identity assertions for the active database-backed CRM actions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/crm.html'),'utf8');
assert(source.includes('const entries=state.items.map(c=>({id:c.id,'));
assert(source.includes('const rows=state.items.map(d=>({id:d.id,'));
assert(source.includes('x.id===String(id)'));
assert(source.includes('wrFetchRecord(\'crm_companies\',id)'));
assert(!source.includes('stableId('));
assert(!source.includes('const id=i+1;'));
console.log('Active lists and detail actions preserve database UUIDs');
