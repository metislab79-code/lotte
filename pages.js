const STAGE_COPY=[
 ['READ THE CHANGE','환경을 이해하고,\n기획의 출발점을 찾습니다.','담당 서비스의 변화와 경쟁 환경을 살펴보세요.','환경 변화 · PEST · 5 Forces · 3C'],
 ['LISTEN TO THE MARKET','시장을 살피고,\n고객의 진짜 문제를 발견합니다.','데이터와 고객의 목소리에서 기획의 근거를 모으세요.','시장 조사 · 경쟁사 · 리뷰 · 인터뷰'],
 ['DEFINE THE OPPORTUNITY','분석을 연결해,\n우리의 기회를 정의합니다.','흩어진 인사이트를 전략과 기회 영역으로 정리하세요.','VRIO · SWOT · HMW · 시장분석 보고서'],
 ['SHAPE THE IDEA','가능성을 구체화하고,\n선택받을 서비스를 만듭니다.','고객 가치에서 콘셉트과 홍보 메시지까지 설계하세요.','시장성 · STP · 콘셉트 · 카피 · 와이어프레임'],
 ['BRING IT TO LIFE','기획을 눈앞에 구현하고,\n현업의 변화로 이어갑니다.','웹페이지 제작 프롬프트를 완성하고 실행을 준비하세요.','웹 제작 · 수정 · 검증 · KPI']
];
$('journeyCards').innerHTML=MODULES.map((m,i)=>`<a class="journey-card" href="#/stage/${i+1}/0"><span class="journey-num">0${i+1}</span><h3>${m}</h3><p>${STAGE_COPY[i][3].split(' · ').join('<br>')}</p><span class="journey-arrow">↗</span></a>`).join('');
function goPage(hash){save();if(location.hash===hash)routePage();else location.hash=hash}
select=function(id){const t=TASKS.find(x=>x.id===id);if(!t)return;state.active=id;backup=null;goPage(`#/stage/${t.module+1}/${t.index}`)};
function routePage(){const hash=location.hash||'#/home',match=hash.match(/^#\/stage\/([1-5])\/(\d+)$/),isProject=hash==='#/project';const t=match?TASKS.find(x=>x.module===+match[1]-1&&x.index===+match[2]):null;
 $('homePage').hidden=!!t||isProject;$('projectPage').hidden=!isProject;$('stagePage').hidden=!t;document.body.classList.toggle('home-view',!t&&!isProject);document.body.classList.toggle('project-view',isProject);document.body.classList.toggle('stage-view',!!t);
 if(t){state.active=t.id;backup=null;render();const copy=STAGE_COPY[t.module];$('stageBreadcrumb').textContent=MODULES[t.module];$('stageEyebrow').textContent=copy[0];$('stageTitle').textContent=copy[1];$('stageDescription').textContent=copy[2];$('stageNumber').textContent=`0${t.module+1}`;$('stageCount').textContent=`STEP 0${t.module+1} / 05`;$('prevStage').textContent=t.module===0?'← 프로젝트 설정':'← 이전 단계';$('nextStage').textContent=t.module===4?'전체 결과 모아보기 →':'다음 단계 →';document.title=`${MODULES[t.module]} · 롯데 서비스기획 AI 워크벤치`;}else{syncProject();document.title=isProject?'내 프로젝트 · 롯데 서비스기획 AI 워크벤치':'롯데 서비스기획 AI 워크벤치';}
 window.scrollTo({top:0,behavior:'instant'});
}
$('beginBtn').onclick=()=>select('0-0');$('resumeBtn').onclick=()=>select(state.active);
$('setupExample').onclick=()=>{if(state.mode!=='learn')return;const x=COMPANIES[state.company];state.service=x[0];state.customer=x[1];state.purpose=x[2];syncProject();save();toast('교육용 예시를 채웠습니다. 내 업무에 맞게 바꿔도 좋아요.')};
$('prevStage').onclick=()=>{const m=task().module;if(m===0)goPage('#/project');else select(TASKS.find(t=>t.module===m-1).id)};
$('nextStage').onclick=()=>{const m=task().module;if(m===4)showReport();else select(TASKS.find(t=>t.module===m+1).id)};
// Each exercise has its own URL and supports browser back/forward.
window.addEventListener('hashchange',routePage);routePage();
