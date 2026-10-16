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
 const availTools=document.createElement('div');availTools.className='controls';for(const [title,target] of [['Manage working hours','edit-hours'],['Blackout dates','edit-blackouts']]){const button=document.createElement('button');button.className='btn';button.textContent=title;button.onclick=()=$(target).click();availTools.append(button)}availCard.append(availTools);
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
 let searchAdded=false;const originalRender=renderAppointments;
 function renderRealAppointments(){
   const api=window.wrSchedulingApi;if(!api?.getWorkspace())return originalRender();
   list.replaceChildren();const search=document.createElement('input');search.placeholder='Search appointments…';search.setAttribute('aria-label','Search appointments');search.style.cssText='width:100%;border:1px solid #cbdfe6;border-radius:10px;padding:12px;margin-bottom:12px';if(!searchAdded){appointCard.insertBefore(search,list);searchAdded=true}else{const existing=appointCard.querySelector('input[aria-label="Search appointments"]');if(existing)existing.remove();appointCard.insertBefore(search,list)}
   const rows=()=>{list.replaceChildren();const term=search.value.trim().toLowerCase();const data=api.getBookings().filter(b=>!term||[b.title,b.booking_type,b.status].some(v=>String(v||'').toLowerCase().includes(term))).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
    if(!data.length){const e=document.createElement('div');e.className='sched-empty';e.textContent='No appointments match this view.';list.append(e)}
    for(const b of data){const row=document.createElement('div');row.className='sched-appointment-row';const left=document.createElement('div');const title=document.createElement('strong');title.textContent=b.title;const dates=document.createElement('small');dates.textContent=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(b.starts_at));left.append(title,dates);const type=document.createElement('div');type.textContent=b.booking_type;const state=document.createElement('span');state.className='sched-state-pill';state.textContent=b.status;state.classList.toggle('cancelled',b.status==='cancelled');const edit=document.createElement('button');edit.className='btn';edit.textContent='View / Edit';edit.onclick=()=>api.editBooking(b);row.append(left,type,state,edit);list.append(row)}
   };search.oninput=rows;rows();
 }
 renderAppointments=renderRealAppointments;
 window.addEventListener('wr-scheduling-loaded',()=>{if(!appointments.hidden)renderAppointments()});
 const observer=new MutationObserver(()=>{if(!appointments.hidden)renderAppointments()});observer.observe($('upcoming-list'),{childList:true});
 window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));navigate(location.hash.slice(1)||'dashboard');
})();
