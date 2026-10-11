import assert from 'node:assert/strict';
import {crmQuery,crmPage,crmAllRows} from '../app/crm-data.js';
function fake(total=8){
 const state={calls:[]};
 const sb={from(table){let q={table,conditions:[],range:null};const obj={
 select(){return obj},eq(k,v){q.conditions.push(['eq',k,v]);return obj},is(k,v){q.conditions.push(['is',k,v]);return obj},neq(k,v){q.conditions.push(['neq',k,v]);return obj},ilike(k,v){q.conditions.push(['ilike',k,v]);return obj},order(){return obj},range(a,b){q.range=[a,b];state.calls.push(q);const size=Math.max(0,Math.min(b,total-1)-a+1);return Promise.resolve({data:Array.from({length:size},(_,i)=>({id:a+i})),error:null,count:total});}
 };return obj;}};return {sb,state};
}
const workspaceId='2c67bdf6-f979-4dbd-87a8-c3f2c69d3bed';
const {sb,state}=fake(8);
let p=await crmPage({sb,workspaceId,table:'crm_contacts',page:1,pageSize:3,filters:{status:'lead'},search:'Alpha'});
assert.equal(p.records.length,3);assert.equal(p.total,8);
assert.deepEqual(state.calls[0].range,[3,5]);
assert(state.calls[0].conditions.some(x=>x[1]==='workspace_id'&&x[2]===workspaceId));
assert(state.calls[0].conditions.some(x=>x[1]==='status'&&x[2]==='lead'));
assert(state.calls[0].conditions.some(x=>x[0]==='ilike'&&x[1]==='name'));
await crmPage({sb,workspaceId,table:'crm_contacts',exclude:{status:'lead'}});
assert(state.calls.at(-1).conditions.some(x=>x[0]==='neq'&&x[1]==='status'&&x[2]==='lead'));
assert.deepEqual((await crmAllRows({sb,workspaceId,table:'crm_contacts',pageSize:3})).map(x=>x.id),[0,1,2,3,4,5,6,7]);
for(const args of [{table:'auth.users'},{table:'crm_contacts',filters:{workspace_id:'other'}},{table:'crm_contacts',filters:{password:'test'}},{table:'crm_contacts',pageSize:201},{table:'crm_contacts',page:-1}]){
 assert.throws(()=>crmQuery({sb,workspaceId,...args}));
}
console.log('PASS: workspace-scoped, filtered, paged queries; validation; full-fetch compatibility');
