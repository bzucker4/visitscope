const cfg = window.PREVISIT_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
document.documentElement.style.setProperty('--accent', cfg.accent || '#765d4f');
document.documentElement.style.setProperty('--accent-dark', cfg.accentDark || '#5e493e');

const state={service:'',situation:'',propertyType:'',bedrooms:'',years:'',fullness:'',extraAreas:[],sorted:'',needs:[],categories:[],removed:'',destination:'',moveDate:'',deadline:'',salePrep:'',decisionMakers:'',outOfState:'',notes:'',contact:{},photos:{}};
const steps=$$('.step');let current=0;

function initials(name){return (name||'Your Business').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function setBrand(){
  $('#businessName').textContent=cfg.businessName||'Your Business';
  $('#businessMark').textContent=cfg.businessInitials||initials(cfg.businessName);
  $('#brandName').textContent=cfg.brandName||'VisitScope';
  if(!cfg.demoMode) $$('.demo-only').forEach(x=>x.classList.add('hidden'));
}
setBrand();

function showStep(i){
  current=Math.max(0,Math.min(i,steps.length-1));
  steps.forEach((s,n)=>s.classList.toggle('hidden',n!==current));
  const pct=current===0?0:Math.round((current/(steps.length-1))*100);
  $('#progressBar').style.width=pct+'%';$('#progressText').textContent=pct+'%';
  $('#stepLabel').textContent=current===0?'Getting started':current===steps.length-1?'Complete':`Step ${Math.min(current,8)} of 8`;
  $('#progressShell').classList.toggle('hidden',current===steps.length-1);
  window.scrollTo({top:0,behavior:'smooth'});
}
function escapeHtml(x){return String(x||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function selectGroup(group,value,el){state[group]=value;$$(`[data-group="${group}"]`).forEach(x=>x.classList.remove('selected'));el.classList.add('selected');if(group==='service'){renderSituation();renderDetails();renderPhotos();}}
function selectPill(group,value,el){state[group]=value;$$(`[data-pill-group="${group}"] button`).forEach(x=>x.classList.remove('selected'));el.classList.add('selected')}

$$('.choice-card[data-group]').forEach(el=>el.addEventListener('click',()=>selectGroup(el.dataset.group,el.dataset.value,el)));
$$('[data-pill-group] button').forEach(el=>el.addEventListener('click',()=>selectPill(el.closest('[data-pill-group]').dataset.pillGroup,el.dataset.value,el)));

const situationSets={
  organizer:[['organizing','Getting organized','A room, storage area, or whole home needs a better system.'],['declutter','Decluttering','Too many belongings or crowded spaces are making the home hard to use.'],['move','Preparing for a move','The home needs organizing before packing or listing.'],['life','Life transition','A change in the household is prompting the project.']],
  downsizing:[['smaller','Moving to a smaller home','Belongings need to be reduced before a move.'],['assisted','Move to assisted living','A parent or relative is moving into a smaller setting.'],['sale','Preparing the home for sale','The property needs to be simplified and readied for listing.'],['future','Planning ahead','Downsizing is proactive rather than urgent.']],
  estate:[['death','Death / inherited property','Family is managing a loved one’s home or belongings.'],['sale','Preparing property for sale','Contents need evaluation before the home is listed or cleared.'],['executor','Executor / estate responsibility','You are coordinating decisions for an estate.'],['other','Other estate transition','Another situation is prompting the evaluation.']],
  senior:[['assisted','Move to assisted living','A parent or relative is moving into a smaller setting.'],['family','Moving closer to family','The move is connected to family support or care.'],['smaller','Moving to a smaller home','The move involves downsizing and sorting.'],['care','Care transition','A change in care needs is prompting the move.']]
};
function renderSituation(){
  const service=state.service||'organizer',items=situationSets[service];
  const titles={organizer:'What is prompting the organizing project?',downsizing:'What is prompting the downsizing?',estate:'What is prompting the estate evaluation?',senior:'What is prompting the move?'};
  $('#situationTitle').textContent=titles[service];
  $('#situationChoices').innerHTML=items.map(([v,t,d])=>`<button class="choice-card" data-group="situation" data-value="${v}"><span class="choice-icon">○</span><span><strong>${t}</strong><small>${d}</small></span><span class="chevron">›</span></button>`).join('');
  $$('#situationChoices .choice-card').forEach(el=>el.addEventListener('click',()=>selectGroup('situation',el.dataset.value,el)));
}
renderSituation();

const detailSets={
  organizer:{title:'What kind of help would be useful?',needs:['Decluttering','Sorting decisions','Donation coordination','Storage systems','Paperwork organization','Packing / unpacking','Whole-home organizing','One or two focused spaces']},
  downsizing:{title:'What may need to happen before the move?',needs:['Sorting','Deciding what to keep','Donation coordination','Packing','Furniture planning','Removal / cleanout','Home sale preparation','Family coordination']},
  estate:{title:'What types of contents are still present?',needs:['Furniture','Jewelry','Tools','Collectibles','Art / décor','Books / records','Vehicles','Large / specialty items'],estate:true},
  senior:{title:'What support may be needed?',needs:['Sorting','Downsizing','Packing','Floor-plan planning','Mover coordination','Donation coordination','Unpacking / setup','Removal / cleanout'],senior:true}
};
function renderDetails(){
  const d=detailSets[state.service||'organizer'];$('#detailsTitle').textContent=d.title;
  let html=`<div class="detail-checks">${d.needs.map(v=>`<label><input type="checkbox" data-detail value="${v}"><span>${v}</span></label>`).join('')}</div>`;
  if(d.estate) html+=`<div class="field"><label>Have desirable items already been removed?</label><div class="pill-grid" data-pill-group="removed"><button data-value="none">No / very little</button><button data-value="some">Some items</button><button data-value="most">Most items</button><button data-value="unsure">Not sure</button></div></div>`;
  if(d.senior) html+=`<div class="two-col"><div class="field"><label for="destination">Moving to <span>optional</span></label><input id="destination" placeholder="Apartment, assisted living, family home..."></div><div class="field"><label for="moveDate">Target move date <span>optional</span></label><input id="moveDate" type="date"></div></div>`;
  $('#detailsContent').innerHTML=html;
  $$('[data-detail]').forEach(cb=>cb.addEventListener('change',()=>{const vals=$$('[data-detail]:checked').map(x=>x.value);if(state.service==='estate')state.categories=vals;else state.needs=vals;}));
  $$('#detailsContent [data-pill-group] button').forEach(el=>el.addEventListener('click',()=>selectPill(el.closest('[data-pill-group]').dataset.pillGroup,el.dataset.value,el)));
  const dest=$('#destination'),date=$('#moveDate');if(dest)dest.addEventListener('input',()=>state.destination=dest.value);if(date)date.addEventListener('input',()=>state.moveDate=date.value);
}
renderDetails();

const basePhotos=['Front / entry','Living room','Kitchen','Primary bedroom'];
function photoList(){const x=[...basePhotos];if(state.extraAreas.includes('Basement'))x.push('Basement');if(state.extraAreas.includes('Garage'))x.push('Garage');if(state.extraAreas.includes('Attic'))x.push('Attic');if(state.extraAreas.includes('Shed / outbuilding'))x.push('Shed / outbuilding');if(state.service==='estate')x.push('Potential sale items');if(state.service==='organizer')x.push('Most challenging space');return [...new Set(x)].slice(0,9)}
function renderPhotos(){
 const list=photoList();$('#photoRecommended').textContent=list.length;
 $('#photoGrid').innerHTML=list.map((name,i)=>`<label class="photo-card" data-photo-card="p${i}"><input type="file" accept="image/*" multiple data-photo="p${i}"><div class="photo-top"><span class="photo-icon">▧</span><span class="photo-status">Add photo</span></div><div><strong>${escapeHtml(name)}</strong><small>Wide-angle view if possible</small></div></label>`).join('');
 $$('input[data-photo]').forEach(inp=>inp.addEventListener('change',()=>{state.photos[inp.dataset.photo]=[...inp.files].map(f=>f.name);const card=inp.closest('.photo-card');card.classList.toggle('done',inp.files.length>0);card.querySelector('.photo-status').textContent=inp.files.length?`✓ ${inp.files.length} added`:'Add photo';updatePhotoProgress();}));updatePhotoProgress();
}
function updatePhotoProgress(){const total=Object.values(state.photos).filter(x=>x&&x.length).length,rec=photoList().length;$('#photoCount').textContent=total;$('#photoMeter').style.width=Math.min(100,Math.round(total/Math.max(rec,1)*100))+'%'}
renderPhotos();

$$('input[type=checkbox][data-array]').forEach(cb=>cb.addEventListener('change',()=>{const key=cb.dataset.array;state[key]=$$(`input[data-array="${key}"]:checked`).map(x=>x.value);if(key==='extraAreas')renderPhotos();}));
[['#bedrooms','bedrooms'],['#years','years'],['#decisionMakers','decisionMakers'],['#outOfState','outOfState'],['#notes','notes']].forEach(([sel,key])=>$(sel).addEventListener('input',e=>state[key]=e.target.value));

function requireState(keys){return keys.every(k=>state[k]&&(!Array.isArray(state[k])||state[k].length));}
function nextFrom(index,required=[]){const err=steps[index].querySelector('.error');if(required.length&&!requireState(required)){if(err)err.textContent='Please choose an option to continue.';return}if(err)err.textContent='';showStep(index+1)}
$$('[data-next]').forEach(btn=>btn.addEventListener('click',()=>nextFrom(Number(btn.dataset.next),(btn.dataset.require||'').split(',').filter(Boolean))));
$$('[data-back]').forEach(btn=>btn.addEventListener('click',()=>showStep(Number(btn.dataset.back))));

function score(){let s=15;const f={light:3,average:10,heavy:20,extreme:28};s+=f[state.fullness]||0;s+=state.extraAreas.length*4;if(state.sorted==='no')s+=15;else if(state.sorted==='partial')s+=8;const d={week:18,month:12,quarter:6,flexible:2};s+=d[state.deadline]||0;if(state.salePrep==='yes')s+=6;if(Number(state.years)>=30)s+=7;else if(Number(state.years)>=15)s+=3;const selected=state.service==='estate'?state.categories:state.needs;s+=Math.min(12,selected.length*2);if(state.service==='estate'){if(state.removed==='none')s+=8;if(state.removed==='most')s-=10}if(Number(state.outOfState)>0)s+=4;return Math.max(0,Math.min(100,s))}
function scoreInfo(s){if(s>=75)return['High','Schedule full consultation'];if(s>=52)return['Medium-high','Consultation recommended'];if(s>=30)return['Medium','Review before scheduling'];return['Low','Remote follow-up may be enough']}
function serviceLabel(){return({organizer:'Professional organizing',downsizing:'Downsizing',estate:'Estate sale',senior:'Senior move'})[state.service]||'Project'}
function fullnessLabel(){return({light:'Light',average:'Average',heavy:'Heavy',extreme:'Very full'})[state.fullness]||'Not provided'}
function deadlineLabel(){return({week:'Within 7 days',month:'Within 30 days',quarter:'Within 90 days',flexible:'Flexible'})[state.deadline]||'Not provided'}
function photoCount(){return Object.values(state.photos).reduce((n,a)=>n+(a?.length||0),0)}
function makeResults(){
 const first=(state.contact.name||'there').split(/\s+/)[0];$('#leadFirstName').textContent=first;
 const consumer=[['Service',serviceLabel()],['Home',`${state.bedrooms?state.bedrooms+' bedrooms · ':''}${state.propertyType||'Property details added'}`],['Contents',fullnessLabel()],['Timeline',deadlineLabel()],['Photos',`${photoCount()} selected`]];
 $('#consumerSummary').innerHTML=`<div class="consumer-summary-grid">${consumer.map(([k,v])=>`<div>${k}<strong>${escapeHtml(v)}</strong></div>`).join('')}</div>`;
 const s=score(),[priority,next]=scoreInfo(s);$('#scoreValue').textContent=s;$('#priorityLabel').textContent=priority;$('#scoreNext').textContent=next;
 $('#leadName').textContent=state.contact.name;$('#leadMeta').textContent=[state.contact.zip,state.contact.email,state.contact.phone].filter(Boolean).join(' · ');
 const rows=[['Service',serviceLabel()],['Situation',state.situation||'Not provided'],['Property',`${state.bedrooms||'?'} BR · ${state.propertyType||'Not provided'}`],['Years occupied',state.years||'Not provided'],['Contents',fullnessLabel()],['Sorting',state.sorted||'Not provided'],['Deadline',deadlineLabel()],['Sale prep',state.salePrep||'Not provided'],['Decision makers',state.decisionMakers||'Not provided'],['Out of state',state.outOfState||'0'],['Photos',photoCount()]];
 $('#summaryRows').innerHTML=rows.map(([k,v])=>`<div class="brief-row"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join('');
 const tags=[...state.extraAreas,...state.needs,...state.categories,state.destination?`Destination: ${state.destination}`:'',state.moveDate?`Move date: ${state.moveDate}`:''].filter(Boolean);$('#summaryTags').innerHTML=tags.length?tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(''):'<span class="tag">No extra signals selected</span>';$('#briefNotes').textContent=state.notes||'None provided.';
}

$('#contactNext').addEventListener('click',()=>{state.contact={name:$('#name').value.trim(),email:$('#email').value.trim(),phone:$('#phone').value.trim(),zip:$('#zip').value.trim()};const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email);if(!state.contact.name||!emailOk||!/^\d{5}(-\d{4})?$/.test(state.contact.zip)||!$('#consent').checked){$('#contactError').textContent='Please enter your name, a valid email, ZIP code, and confirm contact permission.';return}$('#contactError').textContent='';makeResults();showStep(9)});
$('#editAssessment').addEventListener('click',()=>showStep(1));

function openModal(){makeResults();$('#briefModal').classList.remove('hidden');$('#briefModal').setAttribute('aria-hidden','false')}
function closeModal(){$('#briefModal').classList.add('hidden');$('#briefModal').setAttribute('aria-hidden','true')}
$('#viewBusinessBrief').addEventListener('click',openModal);$$('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

$('#emailBrief').addEventListener('click',()=>{const s=score(),[priority,next]=scoreInfo(s),selected=state.service==='estate'?state.categories:state.needs;const subject=encodeURIComponent(`VisitScope brief - ${state.contact.name}`);const body=encodeURIComponent(`NEW VISITSCOPE PROJECT BRIEF\n\nLead priority: ${priority}\nQualification: ${s}/100\nRecommended: ${next}\n\nName: ${state.contact.name}\nEmail: ${state.contact.email}\nPhone: ${state.contact.phone}\nZIP: ${state.contact.zip}\nService: ${serviceLabel()}\nSituation: ${state.situation}\nProperty: ${state.bedrooms} BR, ${state.propertyType}\nYears occupied: ${state.years}\nContents: ${fullnessLabel()}\nExtra areas: ${state.extraAreas.join(', ')}\nSorting: ${state.sorted}\nSelected needs/items: ${selected.join(', ')}\nDeadline: ${deadlineLabel()}\nProperty sale prep: ${state.salePrep}\nDecision makers: ${state.decisionMakers}\nOut of state: ${state.outOfState}\nPhotos selected: ${photoCount()}\nNotes: ${state.notes}`);location.href=`mailto:${cfg.contactEmail||'hello@example.com'}?subject=${subject}&body=${body}`});
$('#consultationBtn').addEventListener('click',()=>{if(cfg.consultationUrl)window.open(cfg.consultationUrl,'_blank');else if(cfg.contactPhone)location.href=`tel:${cfg.contactPhone}`;else location.href=`mailto:${cfg.contactEmail||'hello@example.com'}?subject=${encodeURIComponent('Consultation request')}`});
showStep(0);
