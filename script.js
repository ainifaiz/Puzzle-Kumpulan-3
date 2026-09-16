const ROWS = 3;
const COLS = 4;
const TOTAL = ROWS * COLS;
const WORDS = ["SEMANGAT","BEKERJASAMA","DAPAT","MENGEKALKAN","KEHARMONIAN","BERSAMA"];
const BACKS = ["SEMANGAT","★","BEKERJASAMA","★","DAPAT","★","MENGEKALKAN","★","KEHARMONIAN","★","BERSAMA","★"];

const tray = document.getElementById('tray');
const board = document.getElementById('board');
const moveCountEl = document.getElementById('moveCount');
const correctCountEl = document.getElementById('correctCount');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const revealSection = document.getElementById('revealSection');
const flipBtn = document.getElementById('flipBtn');
const flipGrid = document.getElementById('flipGrid');
const messageSection = document.getElementById('messageSection');
const wordBank = document.getElementById('wordBank');
const messageSlots = document.getElementById('messageSlots');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const feedback = document.getElementById('feedback');
const previewBtn = document.getElementById('previewBtn');
const previewDialog = document.getElementById('previewDialog');
const closePreview = document.getElementById('closePreview');

let moves = 0;
let startedAt = null;
let timerId = null;
let selectedPiece = null;
let solved = false;

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function posStyle(i){
  const row=Math.floor(i/COLS), col=i%COLS;
  const x=(col/(COLS-1))*100, y=(row/(ROWS-1))*100;
  return `${x}% ${y}%`;
}

function makePiece(i){
  const p=document.createElement('div');
  p.className='piece';
  p.draggable=true;
  p.dataset.index=i;
  p.style.backgroundImage="url('assets/kampung-harmoni.png')";
  p.style.backgroundPosition=posStyle(i);
  p.setAttribute('aria-label',`Kepingan puzzle ${i+1}`);
  p.addEventListener('dragstart',e=>{startTimer();e.dataTransfer.setData('text/plain',i);p.classList.add('selected');});
  p.addEventListener('dragend',()=>p.classList.remove('selected'));
  p.addEventListener('click',()=>{
    startTimer();
    document.querySelectorAll('.piece').forEach(x=>x.classList.remove('selected'));
    selectedPiece=p;
    p.classList.add('selected');
  });
  return p;
}

function initBoard(){
  board.innerHTML='';
  for(let i=0;i<TOTAL;i++){
    const s=document.createElement('div');
    s.className='slot';
    s.dataset.slot=i;
    s.addEventListener('dragover',e=>{e.preventDefault();s.classList.add('highlight');});
    s.addEventListener('dragleave',()=>s.classList.remove('highlight'));
    s.addEventListener('drop',e=>{
      e.preventDefault();s.classList.remove('highlight');
      const idx=e.dataTransfer.getData('text/plain');
      const p=document.querySelector(`.piece[data-index="${idx}"]`);
      placePiece(p,s);
    });
    s.addEventListener('click',()=>{if(selectedPiece) placePiece(selectedPiece,s);});
    board.appendChild(s);
  }
}

function initTray(){
  tray.innerHTML='';
  shuffle([...Array(TOTAL).keys()]).forEach(i=>tray.appendChild(makePiece(i)));
}

function placePiece(piece, slot){
  if(!piece || solved) return;
  startTimer();
  const existing=slot.querySelector('.piece');
  const oldParent=piece.parentElement;
  if(existing && existing!==piece){
    if(oldParent.classList.contains('slot')) oldParent.appendChild(existing);
    else tray.appendChild(existing);
  }
  slot.appendChild(piece);
  moves++;
  moveCountEl.textContent=moves;
  selectedPiece=null;
  document.querySelectorAll('.piece').forEach(x=>x.classList.remove('selected'));
  evaluate();
}

function evaluate(){
  let correct=0;
  [...board.children].forEach((s,i)=>{
    const p=s.querySelector('.piece');
    const ok=p && Number(p.dataset.index)===i;
    s.classList.toggle('correct',!!ok);
    if(ok) correct++;
  });
  correctCountEl.textContent=`${correct}/12`;
  if(correct===TOTAL) completePuzzle();
}

function startTimer(){
  if(startedAt) return;
  startedAt=Date.now();
  timerId=setInterval(()=>{
    const sec=Math.floor((Date.now()-startedAt)/1000);
    const m=String(Math.floor(sec/60)).padStart(2,'0');
    const s=String(sec%60).padStart(2,'0');
    timerEl.textContent=`${m}:${s}`;
  },500);
}

function completePuzzle(){
  solved=true;
  clearInterval(timerId);
  revealSection.classList.remove('locked');
  flipBtn.disabled=false;
  buildFlipGrid();
  celebrate();
  setTimeout(()=>revealSection.scrollIntoView({behavior:'smooth',block:'center'}),400);
}

function buildFlipGrid(){
  flipGrid.innerHTML='';
  for(let i=0;i<TOTAL;i++){
    const card=document.createElement('div');
    card.className='flip-card';
    card.innerHTML=`<div class="flip-inner">
      <div class="flip-face flip-front" style="background-image:url('assets/kampung-harmoni.png');background-position:${posStyle(i)}"></div>
      <div class="flip-face flip-back ${BACKS[i]==='★'?'clue':''}">${BACKS[i]}</div>
    </div>`;
    card.addEventListener('click',()=>card.classList.toggle('flipped'));
    flipGrid.appendChild(card);
  }
}

flipBtn.addEventListener('click',()=>{
  document.querySelectorAll('.flip-card').forEach((c,i)=>setTimeout(()=>c.classList.add('flipped'),i*70));
  setTimeout(()=>{
    messageSection.classList.remove('hidden');
    buildWords();
    messageSection.scrollIntoView({behavior:'smooth',block:'start'});
  },1050);
});

function buildWords(){
  wordBank.innerHTML='';messageSlots.innerHTML='';feedback.textContent='';
  shuffle(WORDS).forEach((w,i)=>{
    const chip=document.createElement('div');
    chip.className='word-chip';chip.draggable=true;chip.textContent=w;chip.dataset.word=w;chip.id=`word-${i}-${w}`;
    chip.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',chip.id));
    chip.addEventListener('click',()=>{
      const target=[...messageSlots.children].find(s=>!s.querySelector('.word-chip'));
      if(target) dropWord(chip,target);
    });
    wordBank.appendChild(chip);
  });
  WORDS.forEach((_,i)=>{
    const slot=document.createElement('div');
    slot.className='message-slot';slot.textContent=`${i+1}`;
    slot.addEventListener('dragover',e=>e.preventDefault());
    slot.addEventListener('drop',e=>{
      e.preventDefault();
      const chip=document.getElementById(e.dataTransfer.getData('text/plain'));
      if(chip) dropWord(chip,slot);
    });
    slot.addEventListener('click',()=>{
      const chip=slot.querySelector('.word-chip');
      if(chip) wordBank.appendChild(chip);
      refreshSlots();
    });
    messageSlots.appendChild(slot);
  });
}

function dropWord(chip,slot){
  const existing=slot.querySelector('.word-chip');
  if(existing) wordBank.appendChild(existing);
  slot.textContent='';slot.appendChild(chip);refreshSlots();
}
function refreshSlots(){
  [...messageSlots.children].forEach((s,i)=>{
    const filled=!!s.querySelector('.word-chip');s.classList.toggle('filled',filled);
    if(!filled) s.textContent=String(i+1);
  });
}

checkBtn.addEventListener('click',()=>{
  const answer=[...messageSlots.children].map(s=>s.querySelector('.word-chip')?.dataset.word||'');
  if(answer.join('|')===WORDS.join('|')){
    feedback.className='feedback good';
    feedback.textContent='🎉 Tahniah! Mesej rahsia berjaya disusun: “SEMANGAT BEKERJASAMA DAPAT MENGEKALKAN KEHARMONIAN BERSAMA.”';
    celebrate();
  }else{
    feedback.className='feedback bad';
    feedback.textContent='Cuba lagi. Perhatikan maksud ayat dan susun perkataan supaya menjadi mesej yang lengkap.';
  }
});
clearBtn.addEventListener('click',()=>{[...messageSlots.querySelectorAll('.word-chip')].forEach(c=>wordBank.appendChild(c));refreshSlots();feedback.textContent='';});

resetBtn.addEventListener('click',()=>{
  clearInterval(timerId);moves=0;startedAt=null;solved=false;selectedPiece=null;
  moveCountEl.textContent='0';correctCountEl.textContent='0/12';timerEl.textContent='00:00';
  revealSection.classList.add('locked');flipBtn.disabled=true;flipGrid.innerHTML='';messageSection.classList.add('hidden');
  initBoard();initTray();
});

previewBtn.addEventListener('click',()=>previewDialog.showModal());
closePreview.addEventListener('click',()=>previewDialog.close());
previewDialog.addEventListener('click',e=>{if(e.target===previewDialog)previewDialog.close();});

function celebrate(){
  const icons=['🎉','✨','🇲🇾','⭐','🎊'];
  for(let i=0;i<18;i++){
    const c=document.createElement('span');c.className='confetti';c.textContent=icons[Math.floor(Math.random()*icons.length)];
    c.style.left=`${5+Math.random()*90}vw`;c.style.top=`${65+Math.random()*25}vh`;c.style.animationDelay=`${Math.random()*.35}s`;document.body.appendChild(c);
    setTimeout(()=>c.remove(),1800);
  }
}

initBoard();initTray();
