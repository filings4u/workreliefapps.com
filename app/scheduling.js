import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
const sb=createClient('https://cqzwoskpgefacghdnuyz.supabase.co','sb_publishable_CoIoX7Pinqd2o4kJwqCTqA_RKmePPZt');
const $=id=>document.getElementById(id),qp=new URLSearchParams(location.search);
let workspaceId='',user=null,resources=[],bookings=[],month=new Date();month.setDate(1);
const shortDate=d=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(d));
const localInput=date=>{const d=new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error)}
function modal(id,show){$(id).hidden=!show}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>modal(b.closest('.modal').id,false)));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)modal(m.id,false)}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal').forEach(m=>m.hidden=true)});
$('newBooking').onclick=()=>{const start=new Date();start.setMinutes(0,0,0);start.setHours(start.getHours()+1);const end=new Date(start.getTime()+3600000);$('booking-form').reset();$('booking-form').elements.start.value=localInput(start);$('booking-form').elements.end.value=localInput(end);modal('booking-modal',true)};
$('newResource').onclick=()=>{if(!['owner','admin'].includes(window.wrSchedRole)){status('Only workspace administrators can create resources.',true);return}$('resource-form').reset();modal('resource-modal',true)};
$('today').onclick=()=>{month=new Date();month.setDate(1);load()};
$('prev').onclick=()=>{month.setMonth(month.getMonth()-1);load()};
$('next').onclick=()=>{month.setMonth(month.getMonth()+1);load()};
$('resource-filter').onchange=render;
function render(){
 $('month-title').textContent=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(month);
 const first=new Date(month.getFullYear(),month.getMonth(),1),last=new Date(month.getFullYear(),month.getMonth()+1,0),grid=$('calendar-grid');grid.replaceChildren();
 for(const day of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']){const h=document.createElement('div');h.className='weekday';h.textContent=day;grid.append(h)}
 for(let index=0;index<Math.ceil((first.getDay()+last.getDate())/7)*7;index++){
  const date=new Date(first.getFullYear(),first.getMonth(),index-first.getDay()+1);const start=date.getTime(),end=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1).getTime();
  const cell=document.createElement('div');cell.className='day';if(date.getMonth()!==month.getMonth())cell.classList.add('outside');if(new Date().toDateString()===date.toDateString())cell.classList.add('today');
  const n=document.createElement('span');n.className='date';n.textContent=date.getDate();cell.append(n);
  const visible=bookings.filter(b=>b.status!=='cancelled'&&new Date(b.starts_at).getTime()<end&&new Date(b.ends_at).getTime()>start&&(!$('resource-filter').value||b.resource_id===$('resource-filter').value));
  for(const b of visible.slice(0,4)){const el=document.createElement('span');el.className='event';el.title=b.title+' — '+shortDate(b.starts_at);el.textContent=b.title;cell.append(el)}
  if(visible.length>4){const more=document.createElement('small');more.textContent='+'+(visible.length-4)+' more';cell.append(more)}grid.append(cell);
 }
 const active=bookings.filter(b=>b.status!=='cancelled');$('metric-total').textContent=bookings.length;$('metric-confirmed').textContent=bookings.filter(b=>b.status==='confirmed').length;$('metric-resources').textContent=resources.length;
 const list=$('upcoming-list');list.replaceChildren();
 const next=active.filter(b=>new Date(b.ends_at)>new Date()).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)).slice(0,8);
 for(const b of next){const row=document.createElement('div');row.className='list-row';const title=document.createElement('strong');title.textContent=b.title;const time=document.createElement('small');time.className='muted';time.textContent=shortDate(b.starts_at)+' · '+b.status;row.append(title,time);list.append(row)}
 if(!next.length){const p=document.createElement('p');p.className='muted';p.textContent='No upcoming bookings this month.';list.append(p)}
 const resourceList=$('resource-list');resourceList.replaceChildren();for(const r of resources){const item=document.createElement('div');item.className='list-row';item.textContent=r.name+' · '+r.resource_type;resourceList.append(item)}
 if(!resources.length)resourceList.textContent='No resources yet.';
}
async function load(){
 if(!workspaceId)return;const start=new Date(month.getFullYear(),month.getMonth(),-6),end=new Date(month.getFullYear(),month.getMonth()+2,8);
 status('Loading scheduling data…');
 try{const [a,b]=await Promise.all([sb.from('sched_resources').select('id,name,resource_type,capacity,active').eq('workspace_id',workspaceId).eq('active',true).order('name'),sb.from('sched_bookings').select('id,resource_id,title,booking_type,status,starts_at,ends_at').eq('workspace_id',workspaceId).lt('starts_at',end.toISOString()).gt('ends_at',start.toISOString()).order('starts_at').limit(500)]);
 if(a.error)throw a.error;if(b.error)throw b.error;resources=a.data||[];bookings=b.data||[];
 for(const select of [$('resource-filter'),$('booking-resource')]){const chosen=select.value;select.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent=select.id==='resource-filter'?'All resources':'No assigned resource';select.append(blank);for(const r of resources){const option=document.createElement('option');option.value=r.id;option.textContent=r.name;select.append(option)}select.value=chosen}
 render();status('Workspace scheduling is ready.');
 }catch(e){status('Unable to load scheduling data: '+(e.message||'Unknown error'),true)}
}
$('booking-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),start=new Date(f.start),end=new Date(f.end);if(!(end>start)){status('End time must be later than start time.',true);return}const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const {error}=await sb.from('sched_bookings').insert({workspace_id:workspaceId,resource_id:f.resource_id||null,title:f.title.trim(),description:f.description||'',booking_type:f.booking_type,status:'confirmed',starts_at:start.toISOString(),ends_at:end.toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',created_by:user.id});if(error)throw error;modal('booking-modal',false);await load()}catch(err){status(err.code==='23P01'?'That resource already has a confirmed booking at this time.':err.message,true)}finally{button.disabled=false}};
$('resource-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),button=e.target.querySelector('[type=submit]');button.disabled=true;try{const {error}=await sb.from('sched_resources').insert({workspace_id:workspaceId,name:f.name.trim(),resource_type:f.resource_type});if(error)throw error;modal('resource-modal',false);await load()}catch(err){status(err.message,true)}finally{button.disabled=false}};
try{const {data:{user:current},error:authError}=await sb.auth.getUser();if(authError)throw authError;if(!current){location.replace('login.html?next='+encodeURIComponent('app/scheduling.html'+location.search));}else{user=current;const {data:members,error:memberError}=await sb.from('workspace_members').select('workspace_id,role').eq('user_id',user.id);if(memberError)throw memberError;const member=(members||[]).find(m=>m.workspace_id===qp.get('workspace'))||(members||[])[0];if(!member)throw Error('No workspace membership');workspaceId=member.workspace_id;window.wrSchedRole=member.role;
 const {data:grant,error:grantError}=await sb.from('wr_application_entitlements').select('billing_state').eq('workspace_id',workspaceId).eq('application_code','scheduling').maybeSingle();if(grantError)throw grantError;if(!['active','trialing'].includes(grant?.billing_state)){status('Scheduling is not subscribed in this workspace. Purchase the application to continue.',true);$('newBooking').disabled=true;$('newResource').disabled=true;}else{
 const {data:workspaces,error:wError}=await sb.from('workspaces').select('id,name').in('id',(members||[]).map(m=>m.workspace_id));if(wError)throw wError;
 for(const m of members){const opt=document.createElement('option');opt.value=m.workspace_id;opt.textContent=(workspaces||[]).find(w=>w.id===m.workspace_id)?.name||'Workspace';$('workspace').append(opt)}$('workspace').value=workspaceId;$('workspace').onchange=()=>location.href='scheduling.html?workspace='+encodeURIComponent($('workspace').value);
 for(const [id,file]of [['backapps','index.html'],['market','purchase-apps.html'],['subscriptions','subscriptions.html']])$(id).href=file+'?workspace='+encodeURIComponent(workspaceId);
 await load();
 }}}catch(e){status(e.message||'Unable to initialize Scheduling.',true)}
