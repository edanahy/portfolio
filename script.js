
// RENDER ENGINE
function renderAll() {
  
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Collect all unique tags
  const allTags = [...new Set(projects.flatMap(p => p.tags))].sort();
  let activeTags = new Set();
  
  const filterTagsEl = document.getElementById('filter-tags');
  const clearBtn = document.getElementById('clear-filters');
  const grid = document.getElementById('projects-grid');
  const noResults = document.getElementById('no-results');
  const resultsNote = document.getElementById('results-note');
  
  // Render filter tags
  allTags.forEach(tag => {
	const btn = document.createElement('button');
	btn.className = 'tag-btn';
	btn.textContent = tag;
	btn.dataset.tag = tag;
	btn.addEventListener('click', () => toggleTag(tag, btn));
	filterTagsEl.appendChild(btn);
  });
  
  function toggleTag(tag, btn) {
	if (activeTags.has(tag)) {
	  activeTags.delete(tag);
	  btn.classList.remove('active');
	} else {
	  activeTags.add(tag);
	  btn.classList.add('active');
	}
	clearBtn.style.display = activeTags.size > 0 ? '' : 'none';
	renderGrid();
  }
  
  clearBtn.addEventListener('click', () => {
	activeTags.clear();
	document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
	clearBtn.style.display = 'none';
	renderGrid();
  });
  
  function renderGrid() {
	const cards = document.querySelectorAll('.project-card');
	let visible = 0;
	cards.forEach(card => {
	  const projectTags = JSON.parse(card.dataset.tags);
	  const show = activeTags.size === 0 || [...activeTags].every(t => projectTags.includes(t));
	  card.classList.toggle('hidden', !show);
	  if (show) visible++;
	});
	noResults.style.display = visible === 0 ? '' : 'none';
	if (activeTags.size === 0) {
	  resultsNote.textContent = `Showing all ${projects.length} projects — click any card to read more, or filter by tag above.`;
	} else {
	  resultsNote.textContent = `Showing ${visible} of ${projects.length} projects matching: ${[...activeTags].join(', ')}.`;
	}
  }
  
  // Render project cards
  projects.forEach((p, i) => {
	const card = document.createElement('div');
	card.className = 'project-card';
	card.dataset.id = p.id;
	card.dataset.tags = JSON.stringify(p.tags);
	card.style.animationDelay = `${i * 0.05}s`;
  
	const heroHTML = p.hero
	  ? `<img class="card-hero" src="media/${p.hero}" alt="${p.title}" loading="lazy">`
	  : '';
  
	card.innerHTML = `
	  ${heroHTML}
	  <div class="card-year">${p.year}</div>
	  <div class="card-title">${p.title}</div>
	  <div class="card-excerpt">${p.excerpt}</div>
	  <div class="card-tags">${p.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}</div>
	  <div class="card-cta">View project &nbsp;→</div>
	`;
  
	card.addEventListener('click', () => openModal(p));
	grid.insertBefore(card, noResults);
  });
  
  // ── LIGHTBOX ─────────────────────────────────────────────────────
  const lightboxOverlay = document.getElementById('lightbox-overlay');
  const lightboxImg     = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose   = document.getElementById('lightbox-close');
  
  function openLightbox(src, caption) {
	lightboxImg.src = src;
	lightboxImg.alt = caption || '';
	lightboxCaption.textContent = caption || '';
	lightboxOverlay.classList.add('open');
	// Don't touch body overflow — the project modal is already managing it
  }
  
  function closeLightbox() {
	lightboxOverlay.classList.remove('open');
	lightboxImg.src = '';
  }
  
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', e => { if (e.target === lightboxOverlay) closeLightbox(); });
  
  // Delegate lightbox clicks from any .modal-media-thumb rendered into modalBody
  document.getElementById('modal-body').addEventListener('click', e => {
	const thumb = e.target.closest('.modal-media-thumb');
	if (thumb) openLightbox(thumb.dataset.lightboxSrc, thumb.dataset.lightboxCaption);
  });
  
  // ── MEDIA BLOCK RENDERER ─────────────────────────────────────────
  function renderMediaBlock(m) {
	let content = '';
  
	if (m.youtube) {
	  const ytMatch = m.youtube.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
	  const ytId = ytMatch ? ytMatch[1] : m.youtube;
	  content += `<div class="modal-video-wrap">
		<iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen loading="lazy"></iframe>
	  </div>`;
	}
  
	if (m.images && m.images.length === 1) {
	  const img = m.images[0];
	  content += `<div class="modal-media-single-wrap">
		<img class="modal-media-thumb" src="media/${img.src}" alt="${img.caption || ''}"
			data-lightbox-src="media/${img.src}" data-lightbox-caption="${img.caption || ''}" loading="lazy">
		${img.caption ? `<div class="modal-media-caption">${img.caption}</div>` : ''}
	  </div>`;
	} else if (m.images && m.images.length > 1) {
	  content += `<div class="modal-media-grid">`;
	  m.images.forEach(img => {
		content += `<div>
		  <img class="modal-media-thumb" src="media/${img.src}" alt="${img.caption || ''}"
			  data-lightbox-src="media/${img.src}" data-lightbox-caption="${img.caption || ''}" loading="lazy">
		  ${img.caption ? `<div class="modal-media-caption">${img.caption}</div>` : ''}
		</div>`;
	  });
	  content += `</div>`;
	}
  
	return content;
  }
  
  // ── SECTION DEFINITIONS ──────────────────────────────────────────
  const SECTION_DEFS = {
	overview:      { title: 'Project Overview',                type: 'text' },
	role:          { title: 'My Role & Engagement',            type: 'text' },
	technical:     { title: 'Technical Focus',                 type: 'list' },
	decisions:     { title: 'Key Design Decisions & Tradeoffs', type: 'text' },
	collaboration: { title: 'Collaboration & Context',         type: 'text' },
	outcomes:      { title: 'Outcomes & Learning',             type: 'list' },
	media:         { title: 'Media',                           type: 'media' },
  };
  
  function renderSection(id, value) {
	const def   = SECTION_DEFS[id];
	const title = (def && def.title) || id;
	const type  = (def && def.type)  || 'text';
  
	let inner = '';
	if (type === 'text') {
	  if (!value) return '';
	  inner = `<p class="modal-text">${value}</p>`;
	} else if (type === 'list') {
	  if (!value || !value.length) return '';
	  inner = `<ul class="modal-list">${value.map(item => `<li>${item}</li>`).join('')}</ul>`;
	} else if (type === 'media') {
	  inner = renderMediaBlock(value);
	  if (!inner) return '';
	}
  
	const displayTitle = (type === 'media' && value.label) ? value.label : title;
	return `<div class="modal-section${type === 'media' ? ' modal-media-section' : ''}">
	  <div class="modal-section-title">${displayTitle}</div>
	  ${inner}
	</div>`;
  }
  
  // ── MODAL ─────────────────────────────────────────────────────────
  const overlay    = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalTags  = document.getElementById('modal-tags');
  const modalBody  = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  
  function openModal(p) {
	modalEyebrow.textContent = p.year;
	modalTitle.textContent   = p.title;
	modalTags.innerHTML = p.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');
  
	const heroHTML = p.hero
	  ? `<div class="modal-hero-wrap"><img class="modal-hero" src="media/${p.hero}" alt="${p.title}"></div>`
	  : '';
  
	const s = p.sections;
	let sectionsHTML = '';
	if (Array.isArray(s)) {
	  sectionsHTML = s.map(entry => renderSection(entry.id, entry.value)).join('');
	} else if (s && typeof s === 'object') {
	  sectionsHTML = Object.keys(SECTION_DEFS)
		.filter(id => id in s)
		.map(id => renderSection(id, s[id]))
		.join('');
	}
  
	modalBody.innerHTML = heroHTML + sectionsHTML;
  
	overlay.classList.add('open');
	document.body.style.overflow = 'hidden';
	overlay.scrollTop = 0;
  }
  
  function closeModal() {
	overlay.classList.remove('open');
	document.body.style.overflow = '';
  }
  
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLightbox(); closeModal(); } });

}