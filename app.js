pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const COLLEGES=[
  {id:'간호대학',   ic:'ti-heart-rate-monitor', co:'#D4537E', bg:'#FDF0F4'},
  {id:'경영대학',   ic:'ti-chart-line',          co:'#3A86D4', bg:'#EEF5FC'},
  {id:'경제금융대학',ic:'ti-coin',               co:'#C07A00', bg:'#FBF3E3'},
  {id:'공과대학',   ic:'ti-tools',               co:'#4A6278', bg:'#EEF1F5'},
  {id:'국제대학',   ic:'ti-world',               co:'#1D9E75', bg:'#E6F7F3'},
  {id:'기술혁신대학',ic:'ti-circuit-board',      co:'#6B4FB5', bg:'#F0ECF9'},
  {id:'사범대학',   ic:'ti-pencil',              co:'#C04D20', bg:'#FAF0EB'},
  {id:'사회과학대학',ic:'ti-users',              co:'#1B4F8A', bg:'#EAF0F8'},
  {id:'생활과학대학',ic:'ti-home-2',             co:'#3B7A1A', bg:'#EBF5E3'},
  {id:'예술·체육대학',ic:'ti-palette',           co:'#993556', bg:'#F7EBF0'},
  {id:'음악대학',   ic:'ti-music',               co:'#6B5ECC', bg:'#EFECF9'},
  {id:'의과대학',   ic:'ti-stethoscope',         co:'#A32D2D', bg:'#F7ECEC'},
  {id:'인문과학대학',ic:'ti-book',               co:'#7A4A0A', bg:'#F5EFE5'},
  {id:'자연과학대학',ic:'ti-flask',              co:'#0A6E5A', bg:'#E5F3EF'},
  {id:'정책과학대학',ic:'ti-building-bank',      co:'#1B4F8A', bg:'#EAF0F8'},
  {id:'한양YK인터칼리지',ic:'ti-school',         co:'#3C3489', bg:'#EEEDF8'}
];

const store={};
COLLEGES.forEach(c=>{store[c.id]={pdfDataUrl:null,thumbSrc:null,project:'',period:'',cost:'',budgets:[]};});
// 완성본 저장 파일에서 열 때 preload 데이터 복원
if(window.__preloadStore__){
  Object.keys(window.__preloadStore__).forEach(k=>{
    if(store[k])Object.assign(store[k],window.__preloadStore__[k]);
  });
}
let currentCollege=null,currentPDF=null,currentScale=1.0,pendingFile=null;

/* ── 그리드 렌더 ── */
function renderGrid(){
  const g=document.getElementById('college-grid');g.innerHTML='';
  COLLEGES.forEach(c=>{
    const d=store[c.id];const has=!!d.pdfDataUrl;
    const card=document.createElement('div');
    card.className='card'+(has?' done':' card-upload-hint');
    card.onclick=()=>has?openView(c.id):openUpload(c.id);

    // 썸네일: 예산 표 or 아이콘
    let thumbContent='';
    if(has && d.budgets && d.budgets.length){
      const totalAmt=d.budgets.reduce((s,b)=>s+(parseInt((b.amt||'').replace(/[^0-9]/g,''))||0),0);
      const rows=d.budgets.map(b=>{
        const a=parseInt((b.amt||'').replace(/[^0-9]/g,''))||0;
        return `<div class="cb-row">
          <span class="cb-name">${b.name||'-'}</span>
          <span class="cb-amt">${a.toLocaleString()}</span>
          <span class="cb-note">${b.note||''}</span>
        </div>`;
      }).join('');
      thumbContent=`<div class="card-budget-table">
        <div class="cb-header">
          <span>항목</span><span>금액(천원)</span><span>비고</span>
        </div>
        ${rows}
        <div class="cb-row total">
          <span class="cb-name">합 계</span>
          <span class="cb-amt">${totalAmt.toLocaleString()}천원</span>
          <span class="cb-note"></span>
        </div>
      </div>`;
    } else {
      thumbContent=`<div class="card-icon-wrap" style="background:${c.bg}">
        <i class="ti ${c.ic}" style="color:${c.co}"></i>
        <span style="color:${c.co}">${has?'표 정보 미입력':'업로드'}</span>
      </div>`;
    }

    card.innerHTML=`
      <div class="card-thumb" style="${(has&&d.budgets&&d.budgets.length)?'':'background:'+c.bg}">
        ${thumbContent}
        <div class="card-overlay">
          <div class="card-overlay-label">
            <i class="ti ${has?'ti-eye':'ti-upload'}"></i>
            ${has?'신청서 열기':'PDF 업로드'}
          </div>
        </div>
        <span class="card-badge ${has?'done':'none'}">${has?'접수':'대기'}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${c.id}</div>
        ${d.project
          ?`<div class="card-meta"><i class="ti ti-file-text" style="font-size:11px"></i><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${d.project.length>16?d.project.slice(0,16)+'…':d.project}</span></div>`
          :`<div class="card-meta" style="color:var(--gray3)">${has?'정보 미입력':'신청서 없음'}</div>`
        }
        ${totalChunwon(d)?`<div class="card-cost">${totalChunwon(d).toLocaleString()}천원</div>`:''}
      </div>`;
    g.appendChild(card);
  });
  updateStats();
}

function totalChunwon(d){
  // budgets 금액을 천원 단위로 직접 합산
  return (d.budgets||[]).reduce((s,b)=>s+(parseInt((b.amt||'').replace(/[^0-9]/g,''))||0),0);
}
function updateStats(){
  const done=COLLEGES.filter(c=>store[c.id].pdfDataUrl).length;
  const pct=Math.round(done/16*100);
  document.getElementById('s-done').textContent=done;
  document.getElementById('s-remain').textContent=16-done;
  document.getElementById('bar-done').style.width=pct+'%';
  const tot=COLLEGES.reduce((s,c)=>s+totalChunwon(store[c.id]),0);
  document.getElementById('s-cost').textContent=tot?tot.toLocaleString():'—';
  document.getElementById('progress-fill').style.width=pct+'%';
  document.getElementById('progress-label').textContent=done+' / 16';

  const pills=document.getElementById('pills');pills.innerHTML='';
  COLLEGES.forEach(c=>{
    const has=!!store[c.id].pdfDataUrl;
    const pill=document.createElement('span');
    pill.className='pill '+(has?'done':'none');
    pill.innerHTML=has?`<i class="ti ti-check" style="font-size:10px;margin-right:2px"></i>${c.id}`:c.id;
    pills.appendChild(pill);
  });
}

function addBudgetRow(name,amt,note){
  const wrap=document.getElementById('m-budget-rows');
  const row=document.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:1fr 120px 90px 28px;gap:6px;margin-bottom:6px;align-items:center';
  const si='font-size:12px;padding:7px 9px;border:1.5px solid var(--gray2);border-radius:7px;width:100%;outline:none;font-family:inherit;color:var(--text);transition:border-color .15s';
  row.innerHTML=`<input placeholder="예: 천정형 냉난방기 설치" value="${name||''}" style="${si}" onfocus="this.style.borderColor='var(--sky)'" onblur="this.style.borderColor='var(--gray2)'">
    <input placeholder="21784" value="${amt||''}" style="${si}" onfocus="this.style.borderColor='var(--sky)'" onblur="this.style.borderColor='var(--gray2)'">
    <input placeholder="비고" value="${note||''}" style="${si}" onfocus="this.style.borderColor='var(--sky)'" onblur="this.style.borderColor='var(--gray2)'">
    <button type="button" onclick="this.parentElement.remove()" style="background:transparent;border:none;cursor:pointer;color:var(--gray3);font-size:18px;padding:0;display:flex;align-items:center;justify-content:center;transition:color .15s" onmouseover="this.style.color='#C0392B'" onmouseout="this.style.color='var(--gray3)'"><i class="ti ti-x"></i></button>`;
  wrap.appendChild(row);
}

function getBudgets(){
  const rows=document.querySelectorAll('#m-budget-rows > div');
  return Array.from(rows).map(r=>{
    const ins=r.querySelectorAll('input');
    return{name:ins[0].value.trim(),amt:ins[1].value.trim(),note:ins[2].value.trim()};
  }).filter(b=>b.name||b.amt);
}
function openUpload(id){
  currentCollege=id;pendingFile=null;
  document.getElementById('um-title').textContent=id+' — PDF 업로드';
  document.getElementById('dz-title').textContent='PDF를 여기에 끌어다 놓거나 클릭해서 선택';
  document.getElementById('dropzone').style.borderColor='';
  document.getElementById('dropzone').classList.remove('drag');
  document.getElementById('file-input').value='';
  const d=store[id];
  document.getElementById('m-project').value=d.project||'';
  document.getElementById('m-period').value=d.period||'';
  document.getElementById('m-budget-rows').innerHTML='';
  if(d.budgets&&d.budgets.length){d.budgets.forEach(b=>addBudgetRow(b.name,b.amt,b.note));}
  else{addBudgetRow();}
  document.getElementById('upload-btn').disabled=true;
  document.getElementById('upload-modal').classList.add('open');
}
function closeUpload(){document.getElementById('upload-modal').classList.remove('open');}
function replaceUpload(){closeView();openUpload(currentCollege);}

function handleDrop(e){
  e.preventDefault();document.getElementById('dropzone').classList.remove('drag');
  const f=e.dataTransfer.files[0];
  if(f&&f.type==='application/pdf')setFile(f);
  else alert('PDF 파일만 업로드할 수 있습니다.');
}
function handleFile(e){const f=e.target.files[0];if(f)setFile(f);}
function setFile(f){
  pendingFile=f;
  document.getElementById('dz-title').textContent='✓  '+f.name;
  document.getElementById('dropzone').style.borderColor='var(--mint)';
  document.getElementById('upload-btn').disabled=false;
}

async function confirmUpload(){
  if(!pendingFile||!currentCollege)return;
  const btn=document.getElementById('upload-btn');
  btn.disabled=true;btn.innerHTML='<i class="ti ti-loader" style="animation:spin .8s linear infinite;display:inline-block"></i> 처리 중...';
  const reader=new FileReader();
  reader.onload=async e=>{
    const dataUrl=e.target.result;
    const d=store[currentCollege];
    d.pdfDataUrl=dataUrl;
    d.project=document.getElementById('m-project').value.trim();
    d.period=document.getElementById('m-period').value.trim();
    d.budgets=getBudgets();
    closeUpload();renderGrid();
    setTimeout(()=>openView(currentCollege),120);
  };
  reader.readAsDataURL(pendingFile);
}

/* ── PDF 뷰어 ── */
async function openView(id){
  currentCollege=id;const d=store[id];
  document.getElementById('vm-title').textContent=id;
  document.getElementById('vm-sub').textContent=d.project||'2026학년도 총학생회 교육환경개선사업 신청서';
  document.getElementById('view-modal').classList.add('open');
  currentScale=1.0;
  await loadPDF(d.pdfDataUrl);
}
function closeView(){
  document.getElementById('view-modal').classList.remove('open');
  document.getElementById('pdf-pages').innerHTML='';
  currentPDF=null;
}

async function loadPDF(dataUrl){
  const pages=document.getElementById('pdf-pages');
  pages.innerHTML='<div style="color:#aaa;padding:3rem;text-align:center;font-size:13px"><i class="ti ti-loader" style="font-size:24px;display:block;margin-bottom:8px"></i>PDF 불러오는 중...</div>';
  try{
    currentPDF=await pdfjsLib.getDocument(dataUrl).promise;
    document.getElementById('page-info').textContent='전체 '+currentPDF.numPages+'페이지';
    await renderPages();
  }catch(err){
    pages.innerHTML=`<div style="color:#f99;padding:2rem;text-align:center;font-size:13px">PDF 로드 실패: ${err.message}</div>`;
  }
}

async function renderPages(){
  if(!currentPDF)return;
  const pages=document.getElementById('pdf-pages');
  pages.innerHTML='';
  // 컨테이너 가용 너비 계산 (패딩 32px 제외)
  const containerW=pages.clientWidth-32||700;
  for(let i=1;i<=currentPDF.numPages;i++){
    const page=await currentPDF.getPage(i);
    // 기본 뷰포트로 원본 너비 파악
    const baseVp=page.getViewport({scale:1});
    // 컨테이너에 맞는 스케일 × currentScale 배율 적용
    const fitScale=(containerW/baseVp.width)*currentScale;
    const vp=page.getViewport({scale:fitScale});
    const wrap=document.createElement('div');
    wrap.className='pdf-page-wrap';
    const canvas=document.createElement('canvas');
    canvas.width=Math.floor(vp.width);
    canvas.height=Math.floor(vp.height);
    canvas.style.width=Math.floor(vp.width)+'px';
    canvas.style.height=Math.floor(vp.height)+'px';
    wrap.appendChild(canvas);
    pages.appendChild(wrap);
    await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
  }
  document.getElementById('page-info').textContent='전체 '+currentPDF.numPages+'페이지  |  '+Math.round(currentScale*100)+'%';
}
async function zoomIn(){if(currentScale<3){currentScale=Math.round((currentScale+0.2)*10)/10;await renderPages();}}
async function zoomOut(){if(currentScale>0.4){currentScale=Math.round((currentScale-0.2)*10)/10;await renderPages();}}

function downloadPDF(){
  const d=store[currentCollege];if(!d.pdfDataUrl)return;
  const a=document.createElement('a');a.href=d.pdfDataUrl;
  a.download=currentCollege+'_신청서.pdf';a.click();
}
function removePDF(){
  if(!confirm(currentCollege+' 신청서를 삭제하시겠습니까?'))return;
  store[currentCollege]={pdfDataUrl:null,thumbSrc:null,project:'',period:'',cost:''};
  closeView();renderGrid();
}

/* ── CSV ── */
function exportCSV(){
  const rows=COLLEGES.map(c=>{const d=store[c.id];const t=totalChunwon(d);return[c.id,d.pdfDataUrl?'접수완료':'미접수',d.project||'',d.period||'',t?t.toLocaleString()+'천원':''];});
  const h=['단과대학','접수여부','신청사업명','소요기간','총금액'];
  const csv=[h,...rows].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  a.download='교육환경개선사업_접수현황_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
}

/* ── GitHub API 설정 ── */
const GH_OWNER='hyu-planning';
const GH_REPO='budget-facility-improvement-dashboard';
const GH_FILE='index.html';
const GH_BRANCH='main';

function getGHToken(){return localStorage.getItem('gh_pat');}

function openTokenSettings(){
  const has=!!getGHToken();
  const inp=document.getElementById('token-input');
  inp.value='';
  inp.placeholder=has?'저장된 토큰이 있습니다 (변경하려면 입력)':'ghp_xxxxxxxxxxxx';
  document.getElementById('token-modal').classList.add('open');
}
function closeTokenSettings(){document.getElementById('token-modal').classList.remove('open');}

function saveToken(){
  const val=document.getElementById('token-input').value.trim();
  if(val){localStorage.setItem('gh_pat',val);showToast('GitHub 토큰이 저장되었습니다.','success');}
  updateTokenStatus();
  closeTokenSettings();
}
function clearToken(){
  if(!confirm('저장된 GitHub 토큰을 삭제합니다.'))return;
  localStorage.removeItem('gh_pat');
  updateTokenStatus();
  closeTokenSettings();
  showToast('토큰이 삭제되었습니다.','info');
}
function updateTokenStatus(){
  const btn=document.getElementById('token-setup-btn');
  const txt=document.getElementById('token-status-text');
  const has=!!getGHToken();
  txt.textContent=has?'연결됨':'GitHub 설정';
  btn.style.borderColor=has?'var(--mint)':'';
  btn.style.color=has?'var(--mint)':'';
}
function showToast(msg,type='success'){
  const t=document.getElementById('gh-toast');
  t.textContent=msg;
  t.className='gh-toast gh-toast-'+type+' show';
  setTimeout(()=>t.classList.remove('show'),4000);
}
function htmlToBase64(str){
  const bytes=new TextEncoder().encode(str);
  let bin='';
  for(let i=0;i<bytes.length;i+=8192){bin+=String.fromCharCode(...bytes.subarray(i,i+8192));}
  return btoa(bin);
}
async function pushToGitHub(content){
  const token=getGHToken();
  if(!token){openTokenSettings();return false;}
  const api=`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`;
  const headers={'Authorization':'Bearer '+token,'Content-Type':'application/json','Accept':'application/vnd.github+json'};
  const getRes=await fetch(api+'?ref='+GH_BRANCH,{headers});
  if(!getRes.ok){const e=await getRes.json();throw new Error(e.message||'파일 정보 조회 실패');}
  const {sha}=await getRes.json();
  const putRes=await fetch(api,{method:'PUT',headers,body:JSON.stringify({
    message:`대시보드 업데이트 (${new Date().toISOString().slice(0,10)})`,
    content:htmlToBase64(content),
    sha,branch:GH_BRANCH
  })});
  if(!putRes.ok){const e=await putRes.json();throw new Error(e.message||'GitHub 업로드 실패');}
  return true;
}

/* ── GitHub 배포 ── */
async function exportHTML(){
  const done=COLLEGES.filter(c=>store[c.id].pdfDataUrl).length;
  if(done===0){alert('업로드된 신청서가 없습니다.\nPDF를 먼저 등록해주세요.');return;}
  if(!getGHToken()){openTokenSettings();return;}
  if(!confirm(`현재 등록된 ${done}개 대학 신청서를\nGitHub Pages에 배포합니다.\n계속하시겠습니까?`))return;
  const storeData=JSON.stringify(store);
  const script=`\n<script id="__preload__">\n(function(){\nvar _d=${storeData};\nObject.keys(_d).forEach(function(k){if(window.__store__)window.__store__[k]=_d[k];else window.__preloadStore__=_d;});\n})();\n<\/script>`;
  const html=document.documentElement.outerHTML;
  const cleaned=html.replace(/<script id="__preload__">[\s\S]*?<\/script>/,'');
  const injected=cleaned.replace('</head>',script+'</head>');
  const btn=document.querySelector('button[onclick="exportHTML()"]');
  const orig=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML='<i class="ti ti-loader" style="animation:spin .8s linear infinite;display:inline-block"></i> 배포 중...';
  try{
    await pushToGitHub(injected);
    showToast('✓ GitHub Pages 배포 완료! (반영까지 약 1~2분)','success');
  }catch(err){
    showToast('오류: '+err.message,'error');
  }finally{
    btn.disabled=false;btn.innerHTML=orig;
  }
}

updateTokenStatus();
renderGrid();