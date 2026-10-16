import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://cqzwoskpgefacghdnuyz.supabase.co','sb_publishable_CoIoX7Pinqd2o4kJwqCTqA_RKmePPZt');
const $=id=>document.getElementById(id),qp=new URLSearchParams(location.search);
let workspaceId='',user=null,resources=[],bookings=[],month=new Date(),view='month',editingResourceId=null;month.setDate(1);
const shortDate=d=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(d));
const localInput=date=>{const d=new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error)}
function modal(id,show){$(id).hidden=!show}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>modal(b.closest('.modal').id,false)));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)modal(m.id,false)}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal').forEach(m=>m.hidden=true)});
$('view-mode').onchange=()=>{view=$('view-mode').value;load()};
let wrConfirmResolve=null;
function wrConfirm(message,label='Confirm'){return new Promise(resolve=>{wrConfirmResolve=resolve;$('confirm-heading').textContent=label;$('confirm-message').textContent=message;$('confirm-yes').textContent=label;modal('confirm-modal',true)})}
function wrResolveConfirm(value){modal('confirm-modal',false);if(wrConfirmResolve){wrConfirmResolve(value);wrConfirmResolve=null}}
$('confirm-no').onclick=()=>wrResolveConfirm(false);$('confirm-yes').onclick=()=>wrResolveConfirm(true);
$('newBooking').onclick=()=>{const start=new Date();start.setMinutes(0,0,0);start.setHours(start.getHours()+1);const end=new Date(start.getTime()+3600000);$('booking-form').reset();$('booking-heading').textContent='New booking';$('recurrence-fields').hidden=false;$('cancel-booking').hidden=true;$('booking-form').elements.booking_id.value='';$('booking-form').elements.start.value=localInput(start);$('booking-form').elements.end.value=localInput(end);modal('booking-modal',true)};
async function openResourceForm(resource=null){
 if(!['owner','admin'].includes(window.wrSchedRole)){status('Only administrators can manage resources.',true);return}
 editingResourceId=resource?.id||null;
 const form=$('resource-form');form.reset();
 const sel=$('resource-assignee');sel.replaceChildren();
 const blank=document.createElement('option');blank.value='';blank.textContent='Unassigned / shared resource';sel.append(blank);
 const {data,error}=await sb.from('workspace_members').select('user_id,role').eq('workspace_id',workspaceId);
 if(error){status(error.message,true);return}
 const {data:summary}=await sb.rpc('wr_team_summary',{p_workspace_id:workspaceId});
 const seatsActive=['active','trialing'].includes(summary?.billing_state)&&Number(summary?.paid_seats||0)>=Number(summary?.additional_members||0)&&Number(summary?.paid_seats||0)>0;
 for(const member of data||[]){
  if(member.role!=='owner'&&!seatsActive)continue;
  const opt=document.createElement('option');opt.value=member.user_id;opt.textContent=member.user_id===user.id?'You (owner/account)':'Workspace member '+member.user_id.slice(0,8)+' ('+member.role+')';sel.append(opt)
 }
 if(resource){form.elements.name.value=resource.name;form.elements.resource_type.value=resource.resource_type;form.elements.assigned_user_id.value=resource.assigned_user_id||'';form.elements.timezone.value=resource.timezone||'UTC'}
 $('resource-heading').textContent=resource?'Edit resource':'Add resource';
 form.querySelector('[type=submit]').textContent=resource?'Save changes':'Create resource';
 modal('resource-modal',true)
}
$('newResource').onclick=()=>openResourceForm();
$('resource-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),button=e.target.querySelector('[type=submit]');button.disabled=true;try{const timezone=f.timezone.trim();try{new Intl.DateTimeFormat('en-US',{timeZone:timezone})}catch{throw Error('Enter a valid IANA timezone such as America/Chicago')}const details={name:f.name.trim(),resource_type:f.resource_type,assigned_user_id:f.assigned_user_id||null,timezone};const query=editingResourceId?sb.from('sched_resources').update(details).eq('workspace_id',workspaceId).eq('id',editingResourceId):sb.from('sched_resources').insert({...details,workspace_id:workspaceId});const {error}=await query;if(error)throw error;modal('resource-modal',false);await load()}catch(err){status(err.message,true)}finally{button.disabled=false}};

$('edit-hours').onclick=async()=>{if(!['owner','admin'].includes(window.wrSchedRole)){status('Only workspace admins can manage working hours.',true);return}const sel=$('hours-resource');sel.replaceChildren();for(const r of resources){const o=document.createElement('option');o.value=r.id;o.textContent=r.name;sel.append(o)}if(!resources.length){status('Create a resource first.',true);return}modal('hours-modal',true);await showHours()};
async function showHours(){const id=$('hours-resource').value;if(!id)return;const {data,error}=await sb.from('sched_working_hours').select('weekday,start_time,end_time').eq('workspace_id',workspaceId).eq('resource_id',id).order('weekday');const target=$('hours-list');target.replaceChildren();if(error){target.textContent=error.message;return}for(const h of data||[]){const row=document.createElement('div');row.className='list-row';row.textContent=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][h.weekday]+': '+h.start_time.slice(0,5)+' – '+h.end_time.slice(0,5);target.append(row)}if(!data?.length)target.textContent='No working hours set yet.'}
$('hours-resource').onchange=showHours;
$('hours-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(f.end_time<=f.start_time){status('End time must follow start time.',true);return}const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const {error}=await sb.from('sched_working_hours').upsert({workspace_id:workspaceId,resource_id:$('hours-resource').value,weekday:Number(f.weekday),start_time:f.start_time,end_time:f.end_time},{onConflict:'resource_id,weekday'});if(error)throw error;await showHours();status('Working hours saved.')}catch(err){status(err.message,true)}finally{button.disabled=false}};


$('edit-blackouts').onclick=async()=>{if(!['owner','admin'].includes(window.wrSchedRole)){status('Only workspace administrators may set blackouts.',true);return}const select=$('blackout-resource');select.replaceChildren();for(const r of resources){const option=document.createElement('option');option.value=r.id;option.textContent=r.name+(r.assigned_user_id?' · staff '+r.assigned_user_id.slice(0,8):'');select.append(option)}if(!resources.length){status('Create a resource before adding blackouts.',true);return}const start=new Date();start.setHours(9,0,0,0);const end=new Date(start.getTime()+3600000);$('blackout-form').reset();$('blackout-form').elements.start.value=localInput(start);$('blackout-form').elements.end.value=localInput(end);modal('blackout-modal',true);await showBlackouts()};
async function showBlackouts(){const id=$('blackout-resource').value;if(!id)return;const {data,error}=await sb.from('sched_blackouts').select('id,title,starts_at,ends_at').eq('workspace_id',workspaceId).eq('resource_id',id).order('starts_at',{ascending:false}).limit(40);const box=$('blackout-list');box.replaceChildren();if(error){box.textContent=error.message;return}for(const item of data||[]){const row=document.createElement('div');row.className='list-row';const title=document.createElement('strong');title.textContent=item.title;const detail=document.createElement('small');detail.textContent=shortDate(item.starts_at)+' – '+shortDate(item.ends_at);const remove=document.createElement('button');remove.type='button';remove.className='btn';remove.textContent='Remove';remove.onclick=async()=>{if(!await wrConfirm('Remove this blackout?','Remove blackout'))return;const {error}=await sb.from('sched_blackouts').delete().eq('id',item.id).eq('workspace_id',workspaceId);if(error){status(error.message,true);return}await showBlackouts()};row.append(title,detail,remove);box.append(row)}if(!data?.length)box.textContent='No blackouts for this resource.'}
$('blackout-resource').onchange=showBlackouts;
$('blackout-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const start=new Date(f.start),end=new Date(f.end);if(!(end>start)){status('Blackout end must follow start.',true);return}const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const {error}=await sb.from('sched_blackouts').insert({workspace_id:workspaceId,resource_id:$('blackout-resource').value,title:f.title.trim(),starts_at:start.toISOString(),ends_at:end.toISOString()});if(error)throw error;await showBlackouts();status('Blackout saved.')}catch(err){status(err.message,true)}finally{button.disabled=false}};


async function loadServices(){
 const box=$('services-list');if(!box)return;box.replaceChildren();
 const {data,error}=await sb.from('sched_public_services').select('id,slug,title,enabled,duration_minutes').eq('workspace_id',workspaceId).order('created_at',{ascending:false});
 if(error){box.textContent=error.message;return}
 for(const service of data||[]){
  const row=document.createElement('div');row.className='list-row';const title=document.createElement('strong');title.textContent=service.title+' · '+service.duration_minutes+' min';
  const label=document.createElement('p');label.className='muted';label.textContent=service.enabled?'Published':'Unpublished';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='btn';toggle.textContent=service.enabled?'Unpublish':'Publish';toggle.disabled=!['owner','admin'].includes(window.wrSchedRole);
  toggle.onclick=async()=>{if(!await wrConfirm((service.enabled?'Unpublish':'Publish')+' this booking page?',service.enabled?'Unpublish page':'Publish page'))return;const {error}=await sb.from('sched_public_services').update({enabled:!service.enabled}).eq('workspace_id',workspaceId).eq('id',service.id);if(error)status(error.message,true);else await loadServices()};
  row.append(title,label,toggle);
  if(service.enabled){const link=document.createElement('a');link.href='book.html?service='+encodeURIComponent(service.slug);link.target='_blank';link.rel='noopener';link.textContent='Open booking page ↗';link.style.marginLeft='12px';row.append(link)}
  box.append(row);
 }
 if(!data?.length)box.textContent='No customer booking services created.';
}
$('new-service').onclick=()=>{if(!['owner','admin'].includes(window.wrSchedRole)){status('Only administrators can publish booking pages.',true);return}const select=$('service-resource');select.replaceChildren();for(const resource of resources){const option=document.createElement('option');option.value=resource.id;option.textContent=resource.name;select.append(option)}if(!resources.length){status('Add a resource first.',true);return}$('service-form').reset();modal('service-modal',true)};
$('service-form').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target)),submit=e.target.querySelector('[type=submit]');submit.disabled=true;try{
 const slug='booking-'+crypto.randomUUID();const {error}=await sb.from('sched_public_services').insert({workspace_id:workspaceId,resource_id:$('service-resource').value,title:data.title.trim(),description:data.description||'',duration_minutes:Number(data.duration_minutes),slug,enabled:false});
 if(error)throw error;modal('service-modal',false);await loadServices();status('Booking service created but not published.');
 }catch(error){status(error.message,true)}finally{submit.disabled=false}};

try{const {data:{user:current},error:authError}=await sb.auth.getUser();if(authError)throw authError;if(!current){location.replace('login.html?next='+encodeURIComponent('app/scheduling.html'+location.search));}else{user=current;const {data:members,error:memberError}=await sb.from('workspace_members').select('workspace_id,role').eq('user_id',user.id);if(memberError)throw memberError;const member=(members||[]).find(m=>m.workspace_id===qp.get('workspace'))||(members||[])[0];if(!member)throw Error('No workspace membership');workspaceId=member.workspace_id;window.wrSchedRole=member.role;if(member.role!=='owner'){const {data:seatSummary,error:seatError}=await sb.rpc('wr_team_summary',{p_workspace_id:workspaceId});if(seatError||!seatSummary||!['active','trialing'].includes(seatSummary.billing_state)||Number(seatSummary.paid_seats||0)<Number(seatSummary.additional_members||0)){throw Error('Scheduling team access requires active paid seats for all additional workspace members. Please contact the workspace owner.')}}
 const {data:grant,error:grantError}=await sb.from('wr_application_entitlements').select('billing_state').eq('workspace_id',workspaceId).eq('application_code','scheduling').maybeSingle();if(grantError)throw grantError;if(!['active','trialing'].includes(grant?.billing_state)){status('Scheduling is not subscribed in this workspace. Purchase the application to continue.',true);$('newBooking').disabled=true;$('newResource').disabled=true;}else{
 const {data:workspaces,error:wError}=await sb.from('workspaces').select('id,name').in('id',(members||[]).map(m=>m.workspace_id));if(wError)throw wError;
 for(const m of members){const opt=document.createElement('option');opt.value=m.workspace_id;opt.textContent=(workspaces||[]).find(w=>w.id===m.workspace_id)?.name||'Workspace';$('workspace').append(opt)}$('workspace').value=workspaceId;$('workspace').onchange=()=>location.href='scheduling.html?workspace='+encodeURIComponent($('workspace').value);
 for(const [id,file]of [['backapps','index.html'],['market','purchase-apps.html'],['subscriptions','subscriptions.html']])$(id).href=file+'?workspace='+encodeURIComponent(workspaceId);
 await load();await loadServices();
 }}}catch(e){status(e.message||'Unable to initialize Scheduling.',true)}
