const $=id=>document.getElementById(id),KEY='lotte-planning-lab-v1';
const blankState=mode=>({version:1,company:'롯데월드',service:'',customer:'',purpose:'',business:'B2C 고객 서비스',mode,active:'0-0',tasks:{}});
function cleanState(value,mode){
 const out=blankState(mode);const strip=v=>v.replace(/\[교육용 가상 예시\]\s*/g,'');
 if(!value||value.version!==1||!value.tasks||typeof value.tasks!=='object'||Array.isArray(value.tasks))return out;
 for(const k of ['company','service','customer','purpose','business'])if(typeof value[k]==='string')out[k]=value[k];
 if(!COMPANIES[out.company])out.company='직접 입력';
 if(TASKS.some(t=>t.id===value.active))out.active=value.active;
 for(const t of TASKS){const r=value.tasks[t.id];if(!r||!Array.isArray(r.values))continue;
 out.tasks[t.id]={values:r.values.slice(0,t.fields.length).map(v=>typeof v==='string'?strip(v):''),extra:typeof r.extra==='string'?strip(r.extra):'',context:typeof r.context==='string'?strip(r.context):'',answer:typeof r.answer==='string'?strip(r.answer):'',carriedContext:typeof r.carriedContext==='string'?strip(r.carriedContext):'',confirmed:!!r.confirmed&&typeof r.answer==='string'&&!!r.answer.trim()};
 if(typeof r.custom==='string')out.tasks[t.id].custom=strip(r.custom);
 }
 return out;
}
let state=blankState('learn'),backup=null,toastTimer;
try{
 const legacy=JSON.parse(localStorage.getItem(KEY)||'null');
 if(legacy&&!localStorage.getItem(KEY+'-split-migrated')){
  const mode=legacy.mode==='work'?'work':'learn';
  localStorage.setItem(KEY+'-'+mode,JSON.stringify(cleanState(legacy,mode)));
  localStorage.setItem(KEY+'-mode',mode);localStorage.setItem(KEY+'-split-migrated','1');
 }
 const mode=localStorage.getItem(KEY+'-mode')==='work'?'work':'learn';
 state=cleanState(JSON.parse(localStorage.getItem(KEY+'-'+mode)||'null'),mode);
}catch{}
function switchMode(mode){
 if(mode===state.mode)return;
 save();try{state=cleanState(JSON.parse(localStorage.getItem(KEY+'-'+mode)||'null'),mode)}catch{state=blankState(mode)}
 backup=null;render();toast(mode==='work'?'현업활용: 실제 업무 내용을 직접 입력하세요.':'교육실습: 저장한 실습 내용과 예시를 이용하세요.');
}
const task=()=>TASKS.find(t=>t.id===state.active),record=()=>state.tasks[state.active]||(state.tasks[state.active]={values:[],extra:'',context:'',answer:'',confirmed:false});
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600)}
function save(){try{localStorage.setItem(KEY+'-'+state.mode,JSON.stringify(state));localStorage.setItem(KEY+'-mode',state.mode);if(state.mode==='learn')localStorage.setItem(KEY+'-learn-company-'+encodeURIComponent(state.company),JSON.stringify(state));$('saveStatus').textContent='✓ 이 브라우저에 저장됨'}catch{$('saveStatus').textContent='저장 공간 부족 · 파일로 저장하세요'}}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function syncProject(){['company','service','customer','purpose','business'].forEach(k=>$(k).value=state[k]);document.body.classList.toggle('work',state.mode==='work');$('projectHint').textContent=state.mode==='work'?'실제 담당 업무를 직접 입력하세요. 계열사를 선택하면 아래 세 입력란이 비워집니다.':'계열사 선택 시 프로젝트와 실습 예시가 함께 변경됩니다.';$('projectDescription').textContent=state.mode==='work'?'서비스, 고객, 목적을 직접 작성하세요. 현업활용 내용은 교육실습과 별도로 저장됩니다.':'계열사를 선택하고 예시를 참고해 시작하세요. 교육실습 내용은 현업활용과 별도로 저장됩니다.';$('modeBadge').textContent=state.mode==='learn'?'교육실습 · 계열사 예시 사용':'현업활용 · 직접 작성';$('modeDescription').textContent=state.mode==='learn'?'계열사를 선택하면 프로젝트와 32개 실습 예시가 함께 바뀝니다. 계열사별 작성 내용은 따로 보관됩니다.':'실제 담당 서비스·고객·목적을 직접 작성하세요. 계열사를 선택하면 담당 서비스·대상 고객·기획 목적을 새로 작성합니다.';$('learnMode').setAttribute('aria-pressed',String(state.mode==='learn'));$('workMode').setAttribute('aria-pressed',String(state.mode==='work'));$('learnMode').classList.toggle('active',state.mode==='learn');$('workMode').classList.toggle('active',state.mode==='work')}
function commonConstraints(){return `- 사실·해석·가설을 구분하고, 없는 수치·후기·성과·출처를 만들지 마세요.
- 외부 사실에는 자료명·기관·기준일·원문 링크를 표시하고 미확인 내용은 [확인 필요]로 남기세요.
- 부족한 정보와 가정은 명시하고, 협업 자원을 확보된 역량으로 단정하지 마세요.
- 실제 고객 개인정보나 미공개 전략은 요구하지 마세요.
- 간결하고 명확한 업무용 문체를 사용하세요.
- 이후 단계에서도 위 역할·맥락·제약과 앞서 확정한 결과를 유지하세요. 변경 요청이 없으면 이미 정리한 분석을 반복하지 마세요.
- 각 작업 마지막에는 다음 작업에 사용할 핵심 결과와 검토 사항만 짧게 정리하세요.`}
function makePrompt(includeIntro=task().id==='0-0'){
 const t=task(),r=record();
 const clean=v=>String(v||'').replace(/\[교육용 가상 예시\]\s*/g,'').trim();
 const inputs=t.fields.map((f,i)=>clean(r.values[i])?`${f}:\n${clean(r.values[i])}`:'').filter(Boolean);
 const context=[clean(r.context),clean(r.carriedContext)].filter(Boolean).join('\n\n');
 const extra=clean(r.extra);
 if(includeIntro){
  return [`① 역할 (Role)\n당신은 ${state.company==='직접 입력'?'해당 업종':state.company}의 고객과 운영 환경을 이해하는 서비스 기획 전문가입니다.`,
  `② 맥락 (Context)\n- 회사: ${state.company==='직접 입력'?'담당 서비스의 회사·조직':state.company}\n- 서비스·프로젝트: ${state.service||'[프로젝트 입력 필요]'}\n- 대상 고객: ${state.customer||'[대상 고객 입력 필요]'}\n- 기획 목적: ${state.purpose||'[기획 목적 입력 필요]'}\n- 업무 유형: ${state.business}\n- 현재 작업: ${MODULES[t.module]} / ${t.title}${inputs.length?'\n\n[입력 자료]\n'+inputs.join('\n\n'):''}${context?'\n\n[참고 자료]\n'+context:''}`,
  '③ 과업 (Task)\n'+t.task,
  '④ 형식 (Format)\n'+t.output,
  '⑤ 제약 (Constraint)\n'+commonConstraints()+(extra?'\n\n[추가 조건]\n'+extra:'')].join('\n\n');
 }
 return [`[현재 작업] ${MODULES[t.module]} / ${t.title}`,
 inputs.length?'[추가 입력 · 변경 사항]\n'+inputs.join('\n\n'):'',
 context?'[추가 참고 자료]\n'+context:'',
 '[과업]\n'+t.task,'[형식]\n'+t.output,
 extra?'[추가 조건]\n'+extra:''].filter(Boolean).join('\n\n');
}
function updatePrompt(){delete record().custom;$('prompt').value=makePrompt();save()}
function renderNav(){const t=task();$('stages').innerHTML=MODULES.map((m,i)=>`<button class="${i===t.module?'active':''}" data-module="${i}" aria-current="${i===t.module?'step':'false'}"><span>0${i+1}</span>${m}</button>`).join('');$('moduleName').textContent=MODULES[t.module];const list=TASKS.filter(x=>x.module===t.module);$('progress').textContent=`${list.filter(x=>state.tasks[x.id]?.confirmed).length} / ${list.length}`;$('taskList').innerHTML=list.map(x=>`<button data-task="${x.id}" class="${x.id===t.id?'active ':''}${state.tasks[x.id]?.confirmed?'done':''}"><span class="dot"></span>${escapeHtml(x.title)}</button>`).join('')}
function render(){const t=task(),r=record();syncProject();renderNav();$('stepLabel').textContent=`STEP 0${t.module+1} · ${state.mode==='learn'?'함께 배우는 서비스 기획':'내 업무에 바로 적용'}`;$('taskTitle').textContent=t.title;$('taskDesc').textContent=t.desc;$('pageRef').textContent=`교재 p.${t.pages}`;$('lessonText').textContent=t.lesson;$('fields').innerHTML=t.fields.map((f,i)=>`<label>${escapeHtml(f)}<span>${i===0?'핵심 내용부터 짧게 적어도 괜찮아요.':'알고 있는 내용과 근거를 함께 입력하세요.'}</span><textarea data-field="${i}" rows="3" placeholder="${escapeHtml(f)}: 직접 입력하세요">${escapeHtml(r.values[i]||'')}</textarea></label>`).join('');$('extra').value=r.extra;$('context').value=r.context;$('carriedContext').value=r.carriedContext||'';$('answer').value=r.answer;$('confirmed').checked=r.confirmed;$('prompt').value=r.custom??makePrompt();$('refinementTip').hidden=t.id!=='0-0';$('conversationHint').textContent=t.id==='0-0'?'첫 요청은 역할·맥락·과업·형식·제약의 5요소로 구성됩니다. 이후에는 같은 AI 대화창에 이어서 붙여넣으세요.':'같은 AI 대화창에 이어서 붙여넣으세요. 빈 입력란은 이전 대화 내용을 활용합니다.';$('nextBtn').textContent=TASKS.at(-1).id===t.id?'전체 결과 모아보기 →':'저장하고 다음 실습 →';$('restoreBtn').disabled=!backup;save()}
function select(id){state.active=id;backup=null;render()}
$('company').innerHTML=Object.keys(COMPANIES).map(c=>`<option>${c}</option>`).join('');
['service','customer','purpose','business'].forEach(k=>$(k).addEventListener('input',()=>{state[k]=$(k).value;updatePrompt()}));
$('stages').addEventListener('click',e=>{const b=e.target.closest('[data-module]');if(b)select(TASKS.find(t=>t.module===+b.dataset.module).id)});
$('taskList').addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(b)select(b.dataset.task)});
$('fields').addEventListener('input',e=>{if(e.target.dataset.field!==undefined){record().values[+e.target.dataset.field]=e.target.value;record().confirmed=false;$('confirmed').checked=false;updatePrompt();renderNav()}});
['extra','context'].forEach(k=>$(k).addEventListener('input',()=>{record()[k]=$(k).value;updatePrompt()}));
$('prompt').addEventListener('input',()=>{record().custom=$('prompt').value;save()});$('answer').addEventListener('input',()=>{record().answer=$('answer').value;record().confirmed=false;$('confirmed').checked=false;renderNav();save()});
$('confirmed').addEventListener('change',()=>{if($('confirmed').checked&&!record().answer.trim()){$('confirmed').checked=false;toast('결과를 먼저 입력한 뒤 확정해 주세요.');return}record().confirmed=$('confirmed').checked;save();renderNav()});
$('generateBtn').onclick=()=>{updatePrompt();toast('프롬프트가 완성되었습니다. 복사해서 AI에 붙여넣으세요.');if(innerWidth<600)$('prompt').scrollIntoView({behavior:'smooth',block:'center'})};
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText($('prompt').value);toast('프롬프트를 복사했습니다.')}catch{$('prompt').focus();$('prompt').select();toast('복사가 제한되었습니다. Ctrl+C로 복사해 주세요.')}};
$('nextBtn').onclick=()=>{save();const i=TASKS.findIndex(t=>t.id===state.active);if(i===TASKS.length-1)showReport();else{select(TASKS[i+1].id);$('stages').scrollIntoView({behavior:'smooth',block:'start'})}};
$('carryBtn').onclick=()=>{const i=TASKS.findIndex(t=>t.id===state.active);const prior=TASKS.slice(0,i).filter(t=>state.tasks[t.id]?.confirmed&&state.tasks[t.id]?.answer.trim());if(!prior.length){toast('이전 실습에서 결과를 입력하고 검토·확정해 주세요.');return}const text=prior.map(t=>`[${t.title}]\n${state.tasks[t.id].answer}`).join('\n\n');if(record().carriedContext===text){toast('이미 같은 결과가 연결되어 있습니다.');return}record().carriedContext=text;$('carriedContext').value=text;updatePrompt();toast(`${prior.length}개 확정 결과를 갱신했습니다. 같은 대화창에서는 별도로 가져오지 않아도 됩니다.`)};
function samples(t,x){const [s,c,p,pain,strength,solution]=x;const base=[`[교육용 가상 사례]\n${s}: ${pain}`,`대상: ${c}\n목표: ${p}`,`활용 가능성 검토: ${strength}\n방향: ${solution}`];const sets={
'0-0':[`대상 고객: ${c}\n현재 경험: ${pain}`,pain,'고객 접점 하나를 대상으로 4주간 파일럿 검토. 실제 예산·시스템 연동은 추가 확인.'],
'0-1':['서비스 기획팀, 현장 운영팀, 마케팅팀, UX팀, IT·보안팀','고객 조사 → 콘셉트 확정 → 시안 제작 → 파일럿 검증','현장 운영과 디지털 채널 간 정보 전달이 늦음'],
'0-2':[`고객 불편: ${pain}\n이와 관련된 고객 행동·기술 변화`,'국내 / 최근 2년 / 자료 기준일 명시','관련 변화는 가설 단계. 공공통계와 업계 자료로 검증 필요.'],
'0-3':[s,'동일 고객 문제를 해결하는 직접 경쟁 서비스 2개와 대체재 1개 조사 필요',`${c}의 가격·편의 민감도와 공급자 의존도 확인 필요`],
'0-4':[pain,'기존 전화 상담, 현장 안내, 경쟁 서비스의 온라인 채널',strength+' / 시스템 연동과 운영 인력은 확인 필요'],
'0-5':['환경 변화 자료를 수집하고 핵심 시사점 도출',`${s} 시장을 분석해줘.`,'검색 가능한 AI와 공개 자료만 활용'],
'1-0':[`해결 방안: ${solution}\n고객 불편: ${pain}\n이 해결 방안이 불편을 줄일 수 있다는 가설`,'공개 통계와 고객 리뷰를 수집할 예정','1주일, 팀원 3명, 인터뷰 5명 목표'],
'1-1':[`국내 ${s} 관련 시장`,'최근 3개년, 동일한 시장 정의로 비교','확보한 수치 없음. 필요한 1차 자료원부터 제시'],
'1-2':['직접 경쟁 서비스 A, B와 기존 수작업 방식(가상 비교 대상)','가격, 이용 편의, 제공 범위, 지원 채널, 고객 불만','실제 경쟁사 자료는 아직 없음. 조사할 항목과 빈 비교표부터 작성'],
'1-3':[`[가상 리뷰 6건]\n1. ${pain}\n2. 안내가 친절해서 좋았어요.\n3. 원하는 정보를 찾는 데 오래 걸렸어요.\n4. 이용 방법이 생각보다 간단했어요.\n5. 문의 후 답변을 기다리는 시간이 길어요.\n6. 다음에는 더 쉽게 다시 이용하고 싶어요.`,'정보 탐색, 이용 편의, 대기, 응대','수업용 가상 리뷰 6건. 실제 고객 조사 결과가 아님'],
'1-4':[c,`제안한 해결 방안(${solution})으로 고객 불편을 줄일 수 있다.`,'15분, 최근 실제 경험 중심'],
'1-5':[`[가상 인터뷰]\nA: “${pain}.”\nA: “필요한 정보가 한곳에 있으면 좋겠어요.”\nB: “직접 물어보고 나서야 이용 방법을 알았어요.”`,'안내를 찾는 과정에서 망설임(가상 관찰)','정보 탐색과 안내 연결이 고객 경험의 병목이다.'],
'2-0':[strength,'경쟁사 대비 희소성은 조사 필요','현장 운영과 디지털 채널 연동은 확인 필요'],
'2-1':['고객 유입 → 안내 → 신청·구매 → 이용 → 사후 지원','현장 운영, 마케팅, IT, 고객 상담',pain],
'2-2':['편리한 이용 경험의 수요 확대 가설 / 공개 자료 검증 필요',`${strength}\n약점 가설: 정보·시스템 연결 부족`,pain],
'2-3':[`어떻게 하면 다음 고객의 불편을 줄일 수 있을까?\n대상: ${c}\n불편: ${pain}\n어떻게 하면 제안 서비스(${solution})를 더 쉽게 이용하게 할까?`,'교육용 가상 고객 인터뷰와 리뷰 기준. 실제 시장 검증 필요.','시장 매력도 30%, 니즈 강도 30%, 자사 적합성 20%, 실행 용이성 20%'],
'2-4':[`제안한 해결 방안(${solution})을 소규모로 검증한다.`,`${pain}\n${strength}\n실제 수요와 실행 가능성은 조사 필요`,'담당 팀장 / 파일럿 조사 진행 여부 판단'],
'2-5':[`${s} 개선을 위한 파일럿 제안`,`${pain}\n${strength}`,`HMW: 어떻게 하면 ${c}의 이용 과정을 더 간편하게 만들까?`],
'3-0':[s+' / 국내 초기 대상 고객','[수업용 가정] 고객 10만 명, 이용률 10%, 객단가 2만 원, 연 4회. 실제 시장 규모가 아님.','원가·마진 미확인. 초기 고객 500명 가정, 1개 거점 파일럿'],
'3-1':[`${c} 중 첫 이용 고객 / 반복 이용 고객 / 시간 절약 중시 고객`,'편의성, 신뢰성, 가격, 대기 시간','경쟁 서비스 A·B는 조사 전. 배치는 가설로 표시'],
'3-2':[solution,'가격은 수요 검증 후 결정 / 기존 고객 안내 채널 활용','운영 담당 1명과 현장 협업 가정 / 실제 인력 확보 미정'],
'3-3':[`어떻게 하면 다음 고객의 불편을 예방할 수 있을까?\n대상: ${c}\n불편: ${pain}`,`${pain}\n정보가 흩어져 있음\n반복 이용에 번거로움`,strength],
'3-4':[`${solution}\n상황별 맞춤 안내\n반복 이용을 위한 간편 재신청`,'고객 가치, 차별성, 실현 가능성 각 1~5점','가격·수익 모델은 검증 필요 / 추천, 안내, 신청 기능'],
'3-5':[c,'탐색 → 비교 → 신청 → 이용 → 재이용',pain],
'3-6':[`대상 고객: ${c}\n제안 서비스: ${solution}`,`${pain}의 개선을 목표로 함. 효과 수치와 실제 후기는 아직 없음.`,'간결하고 신뢰감 있게 / 자세히 알아보기'],
'3-7':[`${s}의 콘셉트 소개 / CTA: 서비스 알아보기`,`${solution}\n가격 미정 / FAQ: 대상 고객, 이용 방법, 운영 범위`,'화이트·차콜·레드 / 넓은 여백 / 모바일 우선'],
'4-0':[`${s} 홍보용 단일 페이지 시안`,'Google AI Studio 또는 사용 가능한 웹 제작 AI','로그인·결제 없이 시연 / 실제 고객 정보 수집 안 함'],
'4-1':[`Hero: ${solution}\n문제: ${pain}\n혜택: 정보 탐색 편의, 과정 단순화, 재이용 지원\n이용 방법: 내용 확인 → 조건 선택 → 안내 확인\nFAQ: 대상 고객, 이용 범위\nCTA: 서비스 알아보기`,'화이트 배경, 차콜 제목, 레드 버튼, 넓은 여백','CTA는 이용 방법으로 이동 / 폼은 데모이며 접수·저장하지 않음 / 모바일 반응형'],
'4-2':['모바일 화면의 핵심 혜택 영역','3개 항목이 가로로 붙어 글자가 작게 보임','600px 이하에서 한 열로 표시하고 본문을 16px 이상으로 변경'],
'4-3':[`${s} 소개, 혜택, 이용 방법, FAQ, CTA`,'모바일·PC에서 버튼과 텍스트 확인 예정','교육 참가자에게 시연 / 외부 공개 전 별도 검토'],
'4-4':[solution,'고객 문제 → 혜택 → 이용 흐름','고객 니즈 검증과 실제 운영 연결 방식'],
'4-5':[s,`${p}\n현재 기준값 미확보. 파일럿 전 측정 필요.`,'기획 담당과 현장 운영 담당 / 1주 조사, 1개월 파일럿 검토']};return sets[t.id]||base}
function applyExample(common=false){if(state.mode!=='learn')return;backup=JSON.parse(JSON.stringify({company:state.company,service:state.service,customer:state.customer,purpose:state.purpose,record:record()}));const x=common?COMMON:COMPANIES[state.company];state.service=x[0];state.customer=x[1];state.purpose=x[2];const r=record();r.values=samples(task(),x);r.extra='예시의 내용·숫자·역량은 학습용 가정입니다. 실제 사실과 구분하고 확인이 필요한 근거를 제시하세요.';r.context='';r.carriedContext='';r.answer='';r.confirmed=false;delete r.custom;render();toast('예시를 채웠습니다. 내 상황에 맞게 수정하세요.')}
$('exampleBtn').onclick=()=>applyExample();$('commonBtn').onclick=()=>applyExample(true);$('restoreBtn').onclick=()=>{if(!backup)return;Object.assign(state,{company:backup.company,service:backup.service,customer:backup.customer,purpose:backup.purpose});state.tasks[state.active]=backup.record;backup=null;render();toast('예시 적용 전 입력을 복원했습니다.')};
function download(name,text,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportBtn').onclick=()=>{save();download('서비스기획_프로젝트.json',JSON.stringify(state,null,2),'application/json');toast('프로젝트 파일을 저장했습니다.')};$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{
 if(file.size>5*1024*1024)throw Error();const obj=JSON.parse(await file.text());
 if(obj.version!==1||!obj.tasks||typeof obj.tasks!=='object'||Array.isArray(obj.tasks)||!['learn','work'].includes(obj.mode)||!TASKS.some(t=>t.id===obj.active))throw Error();
 for(const k of ['company','service','customer','purpose','business'])if(typeof obj[k]!=='string')throw Error();
 for(const r of Object.values(obj.tasks))if(!r||!Array.isArray(r.values)||r.values.some(v=>typeof v!=='string')||['extra','context','answer'].some(k=>typeof r[k]!=='string'))throw Error();
 if(!confirm((obj.mode==='work'?'현업활용':'교육실습')+' 내용을 이 파일로 바꿀까요? 현재 내용은 먼저 파일로 저장해 두세요.'))return;
 save();state=cleanState(obj,obj.mode);backup=null;save();
 goPage(`#/stage/${task().module+1}/${task().index}`);render();toast('프로젝트를 불러왔습니다.');
 }catch{toast('올바른 프로젝트 JSON 파일을 선택해 주세요.')}finally{e.target.value=''}};
function showModal(html){$('modalContent').innerHTML=html;$('modal').showModal()}
function reportText(){return `${state.service||'서비스 기획 프로젝트'}\n계열사: ${state.company}\n고객: ${state.customer}\n목적: ${state.purpose}\n\n`+TASKS.filter(t=>state.tasks[t.id]?.answer?.trim()).map(t=>`## ${t.title} [${state.tasks[t.id].confirmed?'검토·확정':'미확정 초안'}]\n${state.tasks[t.id].answer}`).join('\n\n')}
function showReport(){const entries=TASKS.filter(t=>state.tasks[t.id]?.answer?.trim());showModal(`<h3>내 기획 결과 모아보기</h3><p>${entries.length}개 실습 결과 · ${entries.filter(t=>state.tasks[t.id].confirmed).length}개 확정</p><button id="downloadReport" class="primary">결과 문서 다운로드</button> <button id="downloadPrompts">작성한 프롬프트 다운로드</button><pre>${escapeHtml(entries.length?reportText():'아직 기록한 결과가 없습니다. 각 실습에서 AI 답변과 나의 최종 결과를 저장하세요.')}</pre>`);$('downloadReport').onclick=()=>download('서비스기획_결과.txt',reportText(),'text/plain;charset=utf-8');$('downloadPrompts').onclick=()=>{const active=state.active;const text=TASKS.filter(t=>state.tasks[t.id]?.values?.some(Boolean)).map(t=>{state.active=t.id;return '## '+t.title+'\n'+(record().custom||makePrompt())}).join('\n\n──────────\n\n');state.active=active;download('서비스기획_프롬프트.txt',text||'작성한 프롬프트가 없습니다.','text/plain;charset=utf-8')}}
$('clearCarriedBtn').onclick=()=>{record().carriedContext='';$('carriedContext').value='';updatePrompt();};
$('restartPromptBtn').onclick=async()=>{try{await navigator.clipboard.writeText(makePrompt(true));toast('공통 설정을 포함한 새 대화 시작용 프롬프트를 복사했습니다.')}catch{$('prompt').value=makePrompt(true);$('prompt').focus();$('prompt').select();toast('Ctrl+C로 복사해 주세요.')}};
$('reportBtn').onclick=showReport;$('closeModal').onclick=()=>$('modal').close();$('guideBtn').onclick=()=>showModal('<h3>5분이면 시작할 수 있어요.</h3><p>① 계열사와 내 서비스, 고객, 목적을 입력하세요.</p><p>② 원하는 실습을 선택하세요. 교육실습에서는 「계열사 예시 전체 채우기」를, 현업활용에서는 직접 입력을 이용하세요.</p><p>③ 첫 프롬프트를 AI에 붙여넣은 뒤, 이후 단계도 같은 대화창에서 이어서 진행하세요.</p><p>④ AI 답변을 결과 칸에 붙여넣고 근거를 검토한 뒤 확정하세요.</p><p>⑤ 다음 실습에서는 추가하거나 변경할 정보만 입력하세요. 새 대화창으로 옮길 때는 「새 대화 시작용 복사」와 이전 결과 연결을 이용하세요.</p><hr><p>입력은 현재 브라우저에 자동 저장됩니다. 브라우저 데이터 삭제에 대비하거나 다른 PC에서 이어서 작업하려면 「프로젝트 저장」을 이용하세요. AI 답변은 자동으로 가져오지 않습니다.</p><p>교육실습은 순서대로, 현업활용은 필요한 실습부터 선택하세요. 5개 모듈과 32개 실습 도구를 이용할 수 있습니다.</p>');
$('learnMode').onclick=()=>switchMode('learn');$('workMode').onclick=()=>switchMode('work');render();
