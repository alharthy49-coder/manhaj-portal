(function(){
  const qs = new URLSearchParams(location.search);
  const topicId = qs.get('topic') || 'money';
  const bank = window.QUESTION_BANK && window.QUESTION_BANK.topics;
  const topic = bank && bank[topicId];
  if(!topic){ document.body.innerHTML='<main class="page"><h1>المحتوى غير موجود</h1></main>'; return; }

  const titleEl=document.getElementById('lessonTitle');
  const descEl=document.getElementById('lessonDesc');
  const tabsEl=document.getElementById('activityTabs');
  const introEl=document.getElementById('activityIntro');
  const qEl=document.getElementById('questionArea');
  const progressEl=document.getElementById('progressBar');
  titleEl.textContent=topic.title;
  descEl.textContent=topic.description;
  document.title=`${topic.title} | فقه المعاملات (1) | منهج الطالبين`;

  let activityIndex=0, questionIndex=0;

  const typeName={classification:'تصنيف موجّه',single:'اختيار من متعدد',multi:'اختيار متعدد',tf:'صواب أو خطأ',essay:'سؤال مقالي',matching:'مزاوجة'};
  const letters=['أ','ب','ج','د','هـ','و'];

  function activityLabel(a,i){
    const cleaned=a.title.replace(/^النشاط\s*\d+\s*:\s*/, '');
    return `نشاط ${i+1}: ${cleaned}`;
  }
  function renderTabs(){
    tabsEl.innerHTML='';
    topic.activities.forEach((a,i)=>{
      const b=document.createElement('button'); b.className='activity-tab'+(i===activityIndex?' active':'');
      b.textContent=activityLabel(a,i); b.onclick=()=>{activityIndex=i;questionIndex=0;renderAll()};
      tabsEl.appendChild(b);
    });
  }
  function renderAll(){ renderTabs(); renderQuestion(); }
  function renderQuestion(){
    const a=topic.activities[activityIndex]; const q=a.questions[questionIndex];
    introEl.textContent=a.intro||''; introEl.style.display=a.intro?'block':'none';
    progressEl.style.width=((questionIndex+1)/a.questions.length*100)+'%';
    qEl.innerHTML='';
    const meta=document.createElement('div'); meta.className='q-meta';
    meta.innerHTML=`<span class="q-kind">${typeName[q.type]||q.labelType}</span><span class="q-count">السؤال ${questionIndex+1} من ${a.questions.length}</span>`;
    qEl.appendChild(meta);
    const prompt=document.createElement('div'); prompt.className='question'; prompt.textContent=q.prompt; qEl.appendChild(prompt);
    if(q.type==='classification') renderClassification(q,qEl);
    else if(q.type==='single'||q.type==='tf') renderSingle(q,qEl);
    else if(q.type==='multi') renderMulti(q,qEl);
    else if(q.type==='essay') renderEssay(q,qEl);
    else if(q.type==='matching') renderMatching(q,qEl);
    const nav=document.createElement('div'); nav.className='nav-row';
    const prev=document.createElement('button'); prev.className='nav-btn'; prev.textContent='السابق'; prev.disabled=questionIndex===0; prev.onclick=()=>{questionIndex--;renderQuestion()};
    const next=document.createElement('button'); next.className='nav-btn'; next.textContent=questionIndex===a.questions.length-1?'انتهى النشاط':'التالي'; next.disabled=questionIndex===a.questions.length-1; next.onclick=()=>{questionIndex++;renderQuestion()};
    nav.append(prev,next);qEl.appendChild(nav);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function feedbackBox(text,ok){const d=document.createElement('div');d.className='feedback show '+(ok?'ok':'bad');d.textContent=text;return d;}
  function renderSingle(q,root){
    const wrap=document.createElement('div');wrap.className='options'; const buttons=[];
    q.options.forEach((opt,i)=>{const b=document.createElement('button');b.className='option-btn';b.textContent=`${letters[i]||''}. ${opt}`;b.onclick=()=>{
      buttons.forEach(x=>x.disabled=true); const ok=i===q.correct;
      if(ok)b.classList.add('correct'); else {b.classList.add('wrong');buttons[q.correct]?.classList.add('correct')}
      wrap.after(feedbackBox((ok?'إجابة صحيحة. ':'إجابة غير صحيحة. ')+(q.feedback||''),ok));
    };buttons.push(b);wrap.appendChild(b)});root.appendChild(wrap);
  }
  function renderMulti(q,root){
    const wrap=document.createElement('div');wrap.className='options';const rows=[];
    q.options.forEach((opt,i)=>{const l=document.createElement('label');l.className='multi-option';l.innerHTML=`<input type="checkbox" value="${i}"><span>${letters[i]||''}. ${opt}</span>`;rows.push(l);wrap.appendChild(l)});root.appendChild(wrap);
    const acts=document.createElement('div');acts.className='multi-actions';const btn=document.createElement('button');btn.className='primary';btn.textContent='تحقق';acts.appendChild(btn);root.appendChild(acts);
    btn.onclick=()=>{const chosen=rows.map((r,i)=>r.querySelector('input').checked?i:null).filter(i=>i!==null);const correct=[...(q.correct||[])];const ok=chosen.length===correct.length&&chosen.every(i=>correct.includes(i));rows.forEach((r,i)=>{r.querySelector('input').disabled=true;if(correct.includes(i))r.classList.add('correct');else if(chosen.includes(i))r.classList.add('wrong')});btn.disabled=true;acts.after(feedbackBox((ok?'إجابة صحيحة. ':'راجع الاختيارات المظللة. ')+(q.feedback||''),ok));};
  }
  function renderClassification(q,root){
    const grid=document.createElement('div');grid.className='class-grid';q.classifications.forEach(f=>{const box=document.createElement('div');box.className='facet';box.innerHTML=`<div class="facet-title">${f.facet}</div>`;const opts=document.createElement('div');opts.className='facet-options';const note=document.createElement('div');note.className='facet-note';const bs=[];f.choices.forEach(ch=>{const b=document.createElement('button');b.className='facet-btn';b.textContent=ch;b.onclick=()=>{bs.forEach(x=>x.disabled=true);if(ch===f.correct){b.classList.add('correct')}else{b.classList.add('wrong');bs.find(x=>x.textContent===f.correct)?.classList.add('correct');note.textContent=f.feedback;note.classList.add('show')}};bs.push(b);opts.appendChild(b)});box.append(opts,note);grid.appendChild(box)});root.appendChild(grid);
  }
  function renderEssay(q,root){
    const ta=document.createElement('textarea');ta.className='essay-box';ta.placeholder='اكتب إجابتك هنا...';root.appendChild(ta);
    const actions=document.createElement('div');actions.className='essay-actions';const submit=document.createElement('button');submit.className='primary';submit.textContent='اعتمد إجابتي';actions.appendChild(submit);root.appendChild(actions);
    const saved=document.createElement('div');saved.className='student-answer';const model=document.createElement('div');model.className='answer-model';model.innerHTML=`<strong>الجواب النموذجي:</strong><br>${escapeHtml(q.modelAnswer||'')}`;root.append(saved,model);
    submit.onclick=()=>{if(!ta.value.trim()){ta.focus();return;} saved.textContent='إجابتك: '+ta.value.trim();saved.classList.add('show');ta.disabled=true;submit.disabled=true;const show=document.createElement('button');show.className='secondary';show.textContent='عرض الجواب النموذجي';show.onclick=()=>model.classList.toggle('show');actions.appendChild(show)};
  }
  function renderMatching(q,root){
    const list=document.createElement('div');list.className='match-list';const rows=[];
    q.matching.items.forEach(item=>{const row=document.createElement('div');row.className='match-row';const label=document.createElement('div');label.textContent=item;const sel=document.createElement('select');sel.innerHTML='<option value="">اختر القسم...</option>'+q.matching.choices.map(c=>`<option>${escapeHtml(c)}</option>`).join('');const res=document.createElement('div');res.className='match-result';row.append(label,sel,res);list.appendChild(row);rows.push({item,sel,res})});root.appendChild(list);
    const acts=document.createElement('div');acts.className='match-actions';const btn=document.createElement('button');btn.className='primary';btn.textContent='تحقق';acts.appendChild(btn);root.appendChild(acts);
    btn.onclick=()=>{let all=true;rows.forEach(r=>{const ans=q.matching.answers[r.item];const ok=r.sel.value===ans;if(!ok)all=false;r.sel.disabled=true;r.res.textContent=ok?'صحيح':'الصحيح: '+ans;r.res.className='match-result show '+(ok?'ok':'bad')});btn.disabled=true;acts.after(feedbackBox(all?'أحسنت، جميع المزاوجات صحيحة.':'ظهرت الإجابة الصحيحة أسفل كل سطر أخطأت فيه.',all));};
  }
  function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  renderAll();
})();