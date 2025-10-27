const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalCloseBottom = document.getElementById('modal-close-bottom');
const breadcrumb = document.getElementById('modal-breadcrumb');
const lastLessonEl = document.getElementById('last-lesson');
let historyStack = [];
let currentSubject = '';

function openModal() { 
  modal.classList.remove('hidden'); 
  modal.setAttribute('aria-hidden','false'); 
  document.body.classList.add('modal-open');
}

function closeModal() { 
  modal.classList.add('hidden'); 
  modal.setAttribute('aria-hidden','true'); 
  document.body.classList.remove('modal-open');
  historyStack = []; 
  breadcrumb.innerHTML = ''; 
  modalBody.innerHTML = ''; 
  currentSubject = '';
  updateLastLessonDisplay(); 
}

modalClose.addEventListener('click', closeModal);
modalCloseBottom.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => { 
  if(e.target === modal) closeModal(); 
});

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => { 
    const subj = card.dataset.subject; 
    historyStack = []; 
    currentSubject = subj;
    showSubjectMenu(subj); 
  });
});

function showSubjectMenu(subjKey) { 
  historyStack.push({ type: 'subject', key: subjKey }); 
  updateBreadcrumb(); 
  openModal(); 
  modalBody.innerHTML = ''; 
  
  if(subjKey === 'tg') { 
    const list = document.createElement('div'); 
    list.className = 'list'; 
    ['تاريخ','جغرافيا'].forEach(choice => { 
      const item = makeItem(choice, `اختر ${choice}`); 
      item.addEventListener('click', () => showFieldsMenu('texts', choice.toLowerCase())); 
      list.appendChild(item); 
    }); 
    modalBody.appendChild(list); 
  } else if(subjKey === 'madaniya') { 
    showFieldsMenu('texts','civic'); 
  } else if(subjKey === 'islamia') { 
    const list = document.createElement('div'); 
    list.className = 'list'; 
    [['الأستاذة قاسم','islamic/qassim'],['الأستاذة مصبايح','islamic/mesbaih']].forEach(([label, path]) => { 
      const it = makeItem(label,'انقر لعرض الدروس'); 
      it.addEventListener('click', () => showTeacherLessons(label, path)); 
      list.appendChild(it); 
    }); 
    modalBody.appendChild(list); 
  } 
  
  updateFooterButtons();
}

function showFieldsMenu(rootDir, choice) { 
  historyStack.push({ type: 'fields', subj: choice }); 
  updateBreadcrumb(); 
  modalBody.innerHTML = ''; 
  
  const list = document.createElement('div'); 
  list.className = 'list'; 
  for(let m = 1; m <= 3; m++) { 
    const fldTitle = `الميدان ${m}`; 
    const item = makeItem(fldTitle, 'اضغط لعرض 3 دروس وادماج كلي'); 
    item.addEventListener('click', () => showFieldLessons(rootDir, choice, m)); 
    list.appendChild(item); 
  } 
  modalBody.appendChild(list); 
  
  updateFooterButtons();
}

function showFieldLessons(rootDir, choice, m) { 
  historyStack.push({ type: 'field', subj: choice, m }); 
  updateBreadcrumb(); 
  modalBody.innerHTML = ''; 
  
  const list = document.createElement('div'); 
  list.className = 'list'; 
  for(let l = 1; l <= 3; l++) { 
    const it = makeItem(`الدرس ${l}`, 'عرض النص'); 
    it.addEventListener('click', () => loadLesson(`${rootDir}/${choice}/m${m}/lesson${l}.txt`, `الدرس ${l} — الميدان ${m} — ${choice}`)); 
    list.appendChild(it); 
  } 
  const idmBtn = document.createElement('button'); 
  idmBtn.className = 'btn-idm'; 
  idmBtn.textContent = 'الإدماج الكلي'; 
  idmBtn.addEventListener('click', () => loadLesson(`${rootDir}/${choice}/m${m}/idm.txt`, `الإدماج الكلي — الميدان ${m} — ${choice}`)); 
  const cont = document.createElement('div'); 
  cont.style.marginTop = '10px'; 
  cont.appendChild(idmBtn); 
  
  modalBody.appendChild(list); 
  modalBody.appendChild(cont);
  
  updateFooterButtons();
}

function showTeacherLessons(label, path) { 
  historyStack.push({ type: 'teacher', label }); 
  updateBreadcrumb(); 
  modalBody.innerHTML = ''; 
  
  const list = document.createElement('div'); 
  list.className = 'list'; 
  const lessonCount = 18; 
  for(let i = 1; i <= lessonCount; i++) { 
    const it = makeItem(`الدرس ${i}`, 'عرض النص'); 
    it.addEventListener('click', () => loadLesson(`texts/${path}/lesson${i}.txt`, `الدرس ${i} — ${label}`)); 
    list.appendChild(it); 
  } 
  modalBody.appendChild(list);
  
  updateFooterButtons();
}

function loadLesson(url, title) { 
  fetch(url).then(r => { 
    if(!r.ok) throw new Error('not found'); 
    return r.text() 
  }).then(txt => { 
    historyStack.push({ type: 'text', title }); 
    updateBreadcrumb(); 
    modalBody.innerHTML = ''; 
    
    const h = document.createElement('h3'); 
    h.textContent = title; 
    const pre = document.createElement('div'); 
    pre.className = 'lesson-text'; 
    pre.textContent = txt; 
    
    modalBody.appendChild(h); 
    modalBody.appendChild(pre);
    
    try { 
      localStorage.setItem('lastLesson', JSON.stringify({ url, title })); 
    } catch(e) {}; 
    updateLastLessonDisplay(); 
    
    updateFooterButtons();
  }).catch(() => { 
    alert('تعذر تحميل النص. تأكد من وجود الملف: ' + url); 
  }); 
}

function loadTerms() {
  let termsUrl = '';
  let termsTitle = '';

  // تحديد ملف المصطلحات بناءً على المادة الحالية
  if (currentSubject === 'tg') {
    // للتاريخ والجغرافيا - مصطلحات عامة
    termsUrl = 'texts/terms_general.txt';
    termsTitle = 'مصطلحات التاريخ والجغرافيا';
  } else if (currentSubject === 'madaniya') {
    // للمدنية - مصطلحات المدنية
    termsUrl = 'texts/civic/terms.txt';
    termsTitle = 'مصطلحات المدنية';
  }

  if (termsUrl) {
    fetch(termsUrl).then(r => {
      if (!r.ok) throw new Error('not found');
      return r.text();
    }).then(txt => {
      historyStack.push({ type: 'terms', title: termsTitle });
      updateBreadcrumb();
      modalBody.innerHTML = '';
      
      const h = document.createElement('h3');
      h.textContent = termsTitle;
      const pre = document.createElement('div');
      pre.className = 'lesson-text';
      pre.textContent = txt;
      
      modalBody.appendChild(h);
      modalBody.appendChild(pre);
      
      updateFooterButtons();
    }).catch(() => {
      alert('تعذر تحميل المصطلحات. تأكد من وجود الملف: ' + termsUrl);
    });
  }
}

function updateFooterButtons() {
  const modalFooter = document.querySelector('.modal-footer');
  modalFooter.innerHTML = '';

  // زر الإغلاق الأساسي
  const closeBtn = document.createElement('button');
  closeBtn.id = 'modal-close-bottom';
  closeBtn.className = 'btn-close-bottom';
  closeBtn.textContent = 'إغلاق';
  closeBtn.addEventListener('click', closeModal);

  modalFooter.appendChild(closeBtn);

  // إضافة زر المصطلحات فقط للمواد التي تدعمها (ليس الإسلامية)
  if (currentSubject !== 'islamia') {
    const termsBtn = document.createElement('button');
    termsBtn.className = 'btn-terms';
    termsBtn.textContent = '📚 المصطلحات';
    termsBtn.addEventListener('click', loadTerms);
    modalFooter.appendChild(termsBtn);
  }
}

function makeItem(title, sub) { 
  const node = document.createElement('div'); 
  node.className = 'item'; 
  const left = document.createElement('div'); 
  const t = document.createElement('div'); 
  t.className = 'title'; 
  t.textContent = title; 
  const s = document.createElement('div'); 
  s.className = 'sub'; 
  s.textContent = sub; 
  left.appendChild(t); 
  left.appendChild(s); 
  const arrow = document.createElement('div'); 
  arrow.innerHTML = '›'; 
  arrow.style.opacity = '0.6'; 
  node.appendChild(left); 
  node.appendChild(arrow); 
  return node; 
}

function updateBreadcrumb() { 
  breadcrumb.innerHTML = historyStack.map((h) => { 
    if(h.type === 'subject') return `<strong>${h.key === 'tg' ? 'التاريخ/الجغرافيا' : (h.key === 'madaniya' ? 'المدنية' : 'الإسلامية')}</strong>`; 
    if(h.type === 'fields') return `<span>› ${h.subj}</span>`; 
    if(h.type === 'field') return `<span>› الميدان ${h.m}</span>`; 
    if(h.type === 'teacher') return `<span>› ${h.label}</span>`; 
    if(h.type === 'text') return `<span style='color:#aee3ff'>› ${h.title}</span>`; 
    if(h.type === 'terms') return `<span style='color:#e91e63'>› ${h.title}</span>`; 
    return '' 
  }).join(' '); 
}

function updateLastLessonDisplay() { 
  try { 
    const val = JSON.parse(localStorage.getItem('lastLesson')); 
    if(val && val.title) { 
      lastLessonEl.innerHTML = `🔖 آخر درس زرته: <strong>${val.title}</strong> — <button class='btn-donate' onclick="loadLesson('${val.url}','${val.title}')">فتح</button>`; 
    } else { 
      lastLessonEl.innerHTML = ''; 
    } 
  } catch(e) { 
    lastLessonEl.innerHTML = ''; 
  } 
}

window.addEventListener('load', () => { 
  updateLastLessonDisplay(); 
});