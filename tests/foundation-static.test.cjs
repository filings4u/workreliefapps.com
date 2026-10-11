// Foundation source checks. Browser and RLS checks run separately.
const fs=require('fs'),assert=require('node:assert/strict');
const path=require('path');
const crm=fs.readFileSync(path.join(__dirname,'../app/crm.html'),'utf8');
const checks={
  'authenticated Supabase session':/sb\.auth\.getUser\(/.test(crm),
  'workspace-scoped database operations':/\.eq\('workspace_id',workspaceId\)/.test(crm),
  'all four customer and sales lists paged':/const wrListState=\{leads:/.test(crm)&&/companies:\{page:0/.test(crm)&&/pipeline:\{page:0/.test(crm),
  'no bulk CRM reload':!crm.includes('await reload(')&&!crm.includes("rows('crm_contacts')"),
  'database aggregates':/wr_crm_dashboard_summary/.test(crm)&&/wr_crm_stage_summary/.test(crm),
  'database primary company contact':/wr_create_company_with_primary_contact/.test(crm),
  'lead conversion RPC':/wr_convert_lead_to_contact/.test(crm),
  'remote NAICS pagination':/wr_naics_codes_2022/.test(crm)&&/\.range\(offset,offset\+WR_NAICS_PAGE_SIZE-1\)/.test(crm),
  'workspace-scoped company details':/wrFetchRecord\('crm_companies',id\)/.test(crm),
  'remote relation dropdown search':/function wrAttachRemoteSelector\(/.test(crm),
  'no native alert/confirm/prompt':!/\b(?:alert|confirm|prompt)\(/.test(crm),
  'no document reload action':!/\b(?:window\.)?location\.reload\(/.test(crm),
};
for(const [name,pass] of Object.entries(checks))console.log(`${pass?'PASS':'FAIL'} ${name}`);
assert(Object.values(checks).every(Boolean),'Foundation static checks failed');
