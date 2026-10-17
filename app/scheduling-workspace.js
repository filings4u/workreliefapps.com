/* WorkRelief Scheduling workspace: distinct modules using existing scheduling controls. */
(()=>{
 const $=id=>document.getElementById(id);
 const main=document.querySelector('.content'),head=main?.querySelector('.head'),stats=main?.querySelector('.stats'),layout=main?.querySelector('.layout');
 if(!main||!head||!stats||!layout)return;
 const calendar=$('calendar'),upcoming=$('upcoming'),resources=$('resources'),services=$('services');
 const create=(id,heading,description)=>{const section=document.createElement('section');section.className='sched-panel';section.id='sched-page-'+id;section.hidden=true;const h=document.createElement('h2');h.className='sched-page-heading';h.textContent=heading;const p=document.createElement('p');p.className='sched-page-sub';p.textContent=description;section.append(h,p);main.append(section);return section};
 const dashboard=create('dashboard','Workspace overview','A central view of bookings, resource capacity and your next actions.');
 const calendarPage=create('calendar','Team calendar','View and manage appointments across your team and resources.');
 const appointments=create('appointments','Appointments','Review upcoming, past and cancelled bookings. Select an appointment to edit or reschedule.');
 const availability=create('availability','Availability & working hours','Set resource working hours and blackout periods before publishing services.');
 const resourcesPage=create('resources','Resources','Manage staff, rooms, equipment and other schedulable resources.');
 const servicesPage=create('services','Customer booking pages','Create services, manage publication and open customer-facing booking pages.');
 dashboard.append(stats);
 const guide=document.createElement('div');guide.className='sched-dashboard-guide';guide.innerHTML='<h3>Complete your scheduling setup</h3><p>Configure resources and availability, then publish a customer booking page when you are ready.</p>';
 const actions=[['Manage availability','availability'],['Booking pages','services']];
 for(const [label,id] of actions){const btn=document.createElement('button');btn.className='btn';btn.textContent=label;btn.onclick=()=>navigate(id);guide.append(btn)}
 dashboard.append(guide,upcoming);
 calendarPage.append(calendar);
 const appointCard=document.createElement('div');appointCard.className='card sched-section-card';const list=document.createElement('div');list.className='sched-view-list';list.id='sched-appointment-list';appointCard.append(list);appointments.append(appointCard);
 availability.append(resources.cloneNode(false));const availCard=availability.lastElementChild;availCard.id='sched-availability-card';availCard.className='card sched-section-card';const availIntro=document.createElement('p');availIntro.className='muted';availIntro.textContent='Working hours and blackout rules are configured for each resource. Hours are enforced when creating confirmed resource bookings.';availCard.append(availIntro);
 const availTools=document.createElement('div');availTools.className='controls';for(const [title,target] of [['Manage working hours','edit-hours'],['Blackout dates','edit-blackouts']]){const button=document.createElement('button');button.className='btn';button.textContent=title;button.onclick=()=>$(target)?.click();availTools.append(button)}availCard.append(availTools);
 resourcesPage.append(resources);servicesPage.append(services);
 layout.remove();
 const nav=[...document.querySelectorAll('[data-sched-view]')];const titles={dashboard:['Scheduling overview','Your bookings, availability and team at a glance.'],calendar:['Team calendar','Appointments, meetings, shifts and resource schedules.'],appointments:['Appointments','Manage scheduled appointments across your workspace.'],availability:['Availability','Working hours, holidays and resource blackouts.'],resources:['Resources','Staff, rooms, equipment and schedulable resources.'],services:['Booking pages','Customer-facing services and online scheduling.']};
 function navigate(view){if(!titles[view])view='dashboard';for(const node of main.querySelectorAll('.sched-panel'))node.hidden=node.id!=='sched-page-'+view;nav.forEach(a=>{a.classList.toggle('active',a.dataset.schedView===view);a.setAttribute('aria-current',a.dataset.schedView===view?'page':'false')});const heading=head.querySelector('h1'),sub=head.querySelector('.muted');if(heading)heading.textContent=titles[view][0];if(sub)sub.textContent=titles[view][1];for(const id of ['view-mode','today','prev','next']){const node=$(id);if(node)node.hidden=view!=='calendar'}history.replaceState(null,'',location.pathname+location.search+'#'+view);if(view==='appointments')renderAppointments()}
 let renderAppointments=function(){list.replaceChildren();const events=[...document.querySelectorAll('#calendar-grid .event')];const rows=[...document.querySelectorAll('#upcoming-list .list-row')];if(!rows.length){const empty=document.createElement('div');empty.className='sched-empty';empty.textContent='No upcoming appointments in the selected period. Create a booking from the top-right action.';list.append(empty);return}for(const item of rows){const row=document.createElement('div');row.className='sched-appointment-row';const label=document.createElement('div');label.innerHTML='<strong></strong><small></small>';label.querySelector('strong').textContent=item.querySelector('strong')?.textContent||'Appointment';label.querySelector('small').textContent=item.querySelector('small')?.textContent||'';const details=document.createElement('div');details.className='muted';details.textContent='Workspace booking';const state=document.createElement('span');state.className='sched-state-pill';state.textContent='Scheduled';const edit=document.createElement('button');edit.className='btn';edit.textContent='View / Edit';edit.onclick=()=>item.click();row.append(label,details,state,edit);list.append(row)}};

 const teamBox=document.createElement('div');teamBox.className='sched-dashboard-guide';teamBox.innerHTML='<h3>Team scheduling</h3><p id="sched-team-state">Checking purchased team seats…</p>';dashboard.append(teamBox);
 async function teamAccess(){
  const api=window.wrSchedulingApi;if(!api?.getWorkspace())return;
  const {data,error}=await api.client.rpc('wr_team_summary',{p_workspace_id:api.getWorkspace()});
  const count=error?0:Math.max(0,Number(data?.paid_seats||0));
  const active=!error&&['active','trialing'].includes(data?.billing_state)&&count>0;
  $('sched-team-state').textContent=active?count+' paid additional team seat(s) available. Team scheduling can be configured.':'Solo Scheduling is included. Purchase team seats to unlock scheduling for additional members.';
  if(!teamBox.querySelector('a')){const a=document.createElement('a');a.className='btn';a.href='crm-team.html?workspace='+encodeURIComponent(api.getWorkspace());a.textContent=active?'Manage team access':'Purchase team seats';teamBox.append(a)}
  for(const a of nav.filter(x=>x.dataset.schedView==='team'))a.hidden=!active;
 }
 window.addEventListener('wr-scheduling-loaded',teamAccess);teamAccess();
 nav.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.dataset.schedView)}));
 // Appointment controls persist between data refreshes; filtering never mutates bookings.
 const appointmentTools=document.createElement('div');
 appointmentTools.className='controls sched-appointment-tools';
 appointmentTools.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px';
 const appointmentSearch=document.createElement('input');
 appointmentSearch.type='search';
 appointmentSearch.placeholder='Search title, type or status…';
 appointmentSearch.setAttribute('aria-label','Search appointments');
 appointmentSearch.style.cssText='flex:2 1 220px;min-width:0;border:1px solid #cbdfe6;border-radius:10px;padding:11px';
 const appointmentStatus=document.createElement('select');
 appointmentStatus.setAttribute('aria-label','Filter appointments by status');
 appointmentStatus.className='btn';
 for(const [value,label] of [['all','All statuses'],['confirmed','Confirmed'],['tentative','Tentative'],['cancelled','Cancelled']]){
  const option=document.createElement('option');option.value=value;option.textContent=label;appointmentStatus.append(option);
 }
 const appointmentType=document.createElement('select');
 appointmentType.setAttribute('aria-label','Filter appointments by type');
 appointmentType.className='btn';
 for(const [value,label] of [['all','All types'],['appointment','Appointments'],['meeting','Meetings'],['shift','Shifts'],['event','Events']]){
  const option=document.createElement('option');option.value=value;option.textContent=label;appointmentType.append(option);
 }
 appointmentTools.append(appointmentSearch,appointmentStatus,appointmentType);
 appointCard.insertBefore(appointmentTools,list);
 const appointmentCount=document.createElement('p');
 appointmentCount.className='muted';
 appointmentCount.setAttribute('role','status');
 appointCard.insertBefore(appointmentCount,list);
 function renderRealAppointments(){
  const api=window.wrSchedulingApi;
  if(!api?.getWorkspace())return originalRender();
  list.replaceChildren();
  const term=appointmentSearch.value.trim().toLocaleLowerCase();
  const status=appointmentStatus.value,type=appointmentType.value;
  const bookings=api.getBookings().filter(b=>
   (status==='all'||String(b.status||'confirmed').toLowerCase()===status)&&
   (type==='all'||String(b.booking_type||'appointment').toLowerCase()===type)&&
   (!term||[b.title,b.booking_type,b.status,b.description].some(v=>String(v||'').toLocaleLowerCase().includes(term)))
  ).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
  appointmentCount.textContent=bookings.length+' appointment'+(bookings.length===1?'':'s')+' matching filters';
  if(!bookings.length){
   const empty=document.createElement('div');empty.className='sched-empty';
   empty.textContent='No appointments match these filters. Try a different search or status.';
   list.append(empty);return;
  }
  for(const b of bookings){
   const row=document.createElement('div');row.className='sched-appointment-row';
   const left=document.createElement('div');
   const title=document.createElement('strong');title.textContent=b.title||'Untitled booking';
   const dates=document.createElement('small');
   const start=new Date(b.starts_at),end=new Date(b.ends_at);
   dates.textContent=Number.isNaN(start.getTime())?'Date unavailable':
    new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(start)+
    (Number.isNaN(end.getTime())?'':' – '+new Intl.DateTimeFormat(undefined,{timeStyle:'short'}).format(end));
   left.append(title,dates);
   const bookingType=document.createElement('div');
   bookingType.textContent=b.booking_type||'Appointment';
   const state=document.createElement('span');state.className='sched-state-pill';
   state.textContent=b.status||'Confirmed';
   state.classList.toggle('cancelled',b.status==='cancelled');
   const edit=document.createElement('button');edit.type='button';edit.className='btn';
   edit.textContent='View / Edit';edit.onclick=()=>api.editBooking(b);
   row.append(left,bookingType,state,edit);list.append(row);
  }
 }
 const originalRender=renderAppointments;
 renderAppointments=renderRealAppointments;
 for(const control of [appointmentSearch,appointmentStatus,appointmentType])control.addEventListener('input',renderRealAppointments);
 window.addEventListener('wr-scheduling-loaded',()=>{if(!appointments.hidden)renderAppointments()});
 const observer=new MutationObserver(()=>{if(!appointments.hidden)renderAppointments()});observer.observe($('upcoming-list'),{childList:true});
 window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));navigate(location.hash.slice(1)||'dashboard');
})();
