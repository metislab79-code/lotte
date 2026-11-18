function refreshCompanyHints(){
 const x=COMPANIES[state.company];
 ['service','customer','purpose'].forEach((key,i)=>{$(key).placeholder=(state.mode==='work'||state.company==='직접 입력')?['서비스 또는 프로젝트를 입력하세요','대상 고객을 입력하세요','기획 목적을 입력하세요'][i]:'예: '+x[i]});
}
const syncBeforeCompanyHints=syncProject;
syncProject=function(){syncBeforeCompanyHints();refreshCompanyHints()};
function changeCompany(company){
 if(!COMPANIES[company])return;
 if(state.mode==='work'){
  state.company=company;state.service='';state.customer='';state.purpose='';syncProject();updatePrompt();return;
 }
 const active=state.active;
 save();
 let saved=null;
 try{saved=JSON.parse(localStorage.getItem(KEY+'-learn-company-'+encodeURIComponent(company))||'null')}catch{}
 state=cleanState(saved,'learn');state.company=company;state.active=active;
 if(company!=='직접 입력'){
  const x=COMPANIES[company];if(!state.service)state.service=x[0];if(!state.customer)state.customer=x[1];if(!state.purpose)state.purpose=x[2];
  if(!saved)state.business=company==='롯데피플네트웍스'?'B2B 거래처 서비스':'B2C 고객 서비스';
  for(const t of TASKS)if(!state.tasks[t.id]?.values?.some(v=>v.trim())&&!state.tasks[t.id]?.answer?.trim())state.tasks[t.id]={values:samples(t,x),extra:'예시의 수치와 역량은 학습용 가정이며, 확인이 필요한 내용은 구분해 주세요.',context:'',carriedContext:'',answer:'',confirmed:false};
 }
 backup=null;render();
 toast(company==='직접 입력'?'교육실습 내용을 직접 작성하세요.':company+(saved?'의 저장한 교육실습을 불러왔습니다.':' 프로젝트와 32개 실습 예시로 변경했습니다.'));
}
$('company').addEventListener('change',()=>changeCompany($('company').value));
refreshCompanyHints();
