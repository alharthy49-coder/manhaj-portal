(function(){
  const qs = new URLSearchParams(location.search);
  const topicId = qs.get('topic') || 'money';
  const bank = window.QUESTION_BANK && window.QUESTION_BANK.topics;
  const topic = bank && bank[topicId];
  if(!topic){
    document.body.innerHTML='<main class="page"><h1>المحتوى غير موجود</h1></main>';
    return;
  }

  const titleEl=document.getElementById('lessonTitle');
  const descEl=document.getElementById('lessonDesc');
  const tabsEl=document.getElementById('activityTabs');
  const introEl=document.getElementById('activityIntro');
  const qEl=document.getElementById('questionArea');
  const progressEl=document.getElementById('progressBar');

  titleEl.textContent=topic.title;
  descEl.textContent=topic.description;
  document.title=`${topic.title} | فقه المعاملات (1) | منهج الطالبين`;

  let activityIndex=0;
  const answeredByActivity=topic.activities.map(()=>new Set());

  const typeName={
    classification:'تصنيف موجّه',
    single:'اختيار من متعدد',
    multi:'اختيار متعدد',
    tf:'صواب أو خطأ',
    essay:'سؤال مقالي',
    matching:'مزاوجة'
  };
  const letters=['أ','ب','ج','د','هـ','و'];

  function activityLabel(a,i){
    const cleaned=a.title.replace(/^النشاط\s*\d+\s*:\s*/, '');
    return `نشاط ${i+1}: ${cleaned}`;
  }

  function renderTabs(){
    tabsEl.innerHTML='';
    topic.activities.forEach((a,i)=>{
      const b=document.createElement('button');
      b.className='activity-tab'+(i===activityIndex?' active':'');
      b.textContent=activityLabel(a,i);
      b.onclick=()=>{
        activityIndex=i;
        renderAll();
        document.querySelector('.lesson-head')?.scrollIntoView({behavior:'smooth',block:'start'});
      };
      tabsEl.appendChild(b);
    });
  }

  function updateProgress(){
    const total=topic.activities[activityIndex].questions.length;
    const done=answeredByActivity[activityIndex].size;
    progressEl.style.width=(total ? (done/total*100) : 0)+'%';
    progressEl.setAttribute('aria-label',`أجيب عن ${done} من ${total}`);
  }

  function markAnswered(qIndex){
    answeredByActivity[activityIndex].add(qIndex);
    updateProgress();
    const badge=document.querySelector(`[data-question-index="${qIndex}"] .q-state`);
    if(badge){
      badge.textContent='تمت الإجابة';
      badge.classList.add('done');
    }
  }

  function renderAll(){
    renderTabs();
    renderActivity();
  }

  function renderActivity(){
    const a=topic.activities[activityIndex];
    introEl.textContent=a.intro||'أجب عن الأسئلة في الصفحة نفسها؛ لا حاجة للتنقل بين صفحات منفصلة.';
    introEl.style.display='block';
    qEl.innerHTML='';
    qEl.className='question-wrap question-list';

    a.questions.forEach((q,qIndex)=>{
      const card=document.createElement('article');
      card.className='question-card';
      card.dataset.questionIndex=String(qIndex);

      const head=document.createElement('div');
      head.className='question-card-head';
      head.innerHTML=`
        <div class="q-meta">
          <span class="q-number">السؤال ${qIndex+1}</span>
          <span class="q-kind">${typeName[q.type]||q.labelType}</span>
        </div>
        <span class="q-state${answeredByActivity[activityIndex].has(qIndex)?' done':''}">${answeredByActivity[activityIndex].has(qIndex)?'تمت الإجابة':'غير مجاب'}</span>
      `;
      card.appendChild(head);

      const prompt=document.createElement('div');
      prompt.className='question';
      prompt.textContent=q.prompt;
      card.appendChild(prompt);

      const body=document.createElement('div');
      body.className='question-body';
      card.appendChild(body);

      const onDone=()=>markAnswered(qIndex);
      if(q.type==='classification') renderClassification(q,body,onDone);
      else if(q.type==='single'||q.type==='tf') renderSingle(q,body,onDone);
      else if(q.type==='multi') renderMulti(q,body,onDone);
      else if(q.type==='essay') renderEssay(q,body,onDone);
      else if(q.type==='matching') renderMatching(q,body,onDone);

      qEl.appendChild(card);
    });

    updateProgress();
  }

  function feedbackBox(text,ok){
    const d=document.createElement('div');
    d.className='feedback show '+(ok?'ok':'bad');
    d.textContent=text;
    return d;
  }

  function renderSingle(q,root,onDone){
    const wrap=document.createElement('div');
    wrap.className='options';
    const buttons=[];
    q.options.forEach((opt,i)=>{
      const b=document.createElement('button');
      b.className='option-btn';
      b.textContent=`${letters[i]||''}. ${opt}`;
      b.onclick=()=>{
        buttons.forEach(x=>x.disabled=true);
        const ok=i===q.correct;
        if(ok){
          b.classList.add('correct');
        }else{
          b.classList.add('wrong');
          buttons[q.correct]?.classList.add('correct');
        }
        wrap.after(feedbackBox((ok?'إجابة صحيحة. ':'إجابة غير صحيحة. ')+(q.feedback||''),ok));
        onDone();
      };
      buttons.push(b);
      wrap.appendChild(b);
    });
    root.appendChild(wrap);
  }

  function renderMulti(q,root,onDone){
    const wrap=document.createElement('div');
    wrap.className='options';
    const rows=[];
    q.options.forEach((opt,i)=>{
      const l=document.createElement('label');
      l.className='multi-option';
      l.innerHTML=`<input type="checkbox" value="${i}"><span>${letters[i]||''}. ${opt}</span>`;
      rows.push(l);
      wrap.appendChild(l);
    });
    root.appendChild(wrap);

    const acts=document.createElement('div');
    acts.className='multi-actions';
    const btn=document.createElement('button');
    btn.className='primary';
    btn.textContent='تحقق';
    acts.appendChild(btn);
    root.appendChild(acts);

    btn.onclick=()=>{
      const chosen=rows.map((r,i)=>r.querySelector('input').checked?i:null).filter(i=>i!==null);
      const correct=[...(q.correct||[])];
      const ok=chosen.length===correct.length&&chosen.every(i=>correct.includes(i));
      rows.forEach((r,i)=>{
        r.querySelector('input').disabled=true;
        if(correct.includes(i)) r.classList.add('correct');
        else if(chosen.includes(i)) r.classList.add('wrong');
      });
      btn.disabled=true;
      acts.after(feedbackBox((ok?'إجابة صحيحة. ':'راجع الاختيارات المظللة. ')+(q.feedback||''),ok));
      onDone();
    };
  }

  function renderClassification(q,root,onDone){
    const grid=document.createElement('div');
    grid.className='class-grid';
    let completed=0;

    q.classifications.forEach(f=>{
      const box=document.createElement('div');
      box.className='facet';
      box.innerHTML=`<div class="facet-title">${f.facet}</div>`;

      const opts=document.createElement('div');
      opts.className='facet-options';
      const note=document.createElement('div');
      note.className='facet-note';
      const bs=[];
      let facetDone=false;

      f.choices.forEach(ch=>{
        const b=document.createElement('button');
        b.className='facet-btn';
        b.textContent=ch;
        b.onclick=()=>{
          if(facetDone) return;
          facetDone=true;
          completed++;
          bs.forEach(x=>x.disabled=true);
          if(ch===f.correct){
            b.classList.add('correct');
          }else{
            b.classList.add('wrong');
            bs.find(x=>x.textContent===f.correct)?.classList.add('correct');
            note.textContent=f.feedback;
            note.classList.add('show');
          }
          if(completed===q.classifications.length) onDone();
        };
        bs.push(b);
        opts.appendChild(b);
      });

      box.append(opts,note);
      grid.appendChild(box);
    });
    root.appendChild(grid);
  }

  function renderEssay(q,root,onDone){
    const ta=document.createElement('textarea');
    ta.className='essay-box';
    ta.placeholder='اكتب إجابتك هنا...';
    root.appendChild(ta);

    const actions=document.createElement('div');
    actions.className='essay-actions';
    const submit=document.createElement('button');
    submit.className='primary';
    submit.textContent='اعتمد إجابتي';
    actions.appendChild(submit);
    root.appendChild(actions);

    const saved=document.createElement('div');
    saved.className='student-answer';
    const model=document.createElement('div');
    model.className='answer-model';
    model.innerHTML=`<strong>الجواب النموذجي:</strong><br>${escapeHtml(q.modelAnswer||'')}`;
    root.append(saved,model);

    submit.onclick=()=>{
      if(!ta.value.trim()){
        ta.focus();
        return;
      }
      saved.textContent='إجابتك: '+ta.value.trim();
      saved.classList.add('show');
      ta.disabled=true;
      submit.disabled=true;
      const show=document.createElement('button');
      show.className='secondary';
      show.textContent='عرض الجواب النموذجي';
      show.onclick=()=>model.classList.toggle('show');
      actions.appendChild(show);
      onDone();
    };
  }

  function renderMatching(q,root,onDone){
    const list=document.createElement('div');
    list.className='match-list';
    const rows=[];

    q.matching.items.forEach(item=>{
      const row=document.createElement('div');
      row.className='match-row';
      const label=document.createElement('div');
      label.textContent=item;
      const sel=document.createElement('select');
      sel.innerHTML='<option value="">اختر القسم...</option>'+q.matching.choices.map(c=>`<option>${escapeHtml(c)}</option>`).join('');
      const res=document.createElement('div');
      res.className='match-result';
      row.append(label,sel,res);
      list.appendChild(row);
      rows.push({item,sel,res});
    });
    root.appendChild(list);

    const acts=document.createElement('div');
    acts.className='match-actions';
    const btn=document.createElement('button');
    btn.className='primary';
    btn.textContent='تحقق';
    acts.appendChild(btn);
    root.appendChild(acts);

    btn.onclick=()=>{
      let all=true;
      rows.forEach(r=>{
        const ans=q.matching.answers[r.item];
        const ok=r.sel.value===ans;
        if(!ok) all=false;
        r.sel.disabled=true;
        r.res.textContent=ok?'صحيح':'الصحيح: '+ans;
        r.res.className='match-result show '+(ok?'ok':'bad');
      });
      btn.disabled=true;
      acts.after(feedbackBox(all?'أحسنت، جميع المزاوجات صحيحة.':'ظهرت الإجابة الصحيحة أسفل كل سطر أخطأت فيه.',all));
      onDone();
    };
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  renderAll();
})();