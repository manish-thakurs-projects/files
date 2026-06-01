let allDocuments = [];   
let activeCategory = 'all';  
let searchTerm = '';

const grid = document.getElementById('documentGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const docCountEl = document.getElementById('docCount');
const categoryFilters = document.getElementById('categoryFilters');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const btnResetFilters = document.getElementById('btnResetFilters');


async function loadDocuments() {
    try {
        const response = await fetch('documents.json');
        if (!response.ok) throw new Error('Failed to fetch documents.json');
        allDocuments = await response.json();

        allDocuments.sort((a, b) => {
            if (a.date && b.date) return new Date(b.date) - new Date(a.date);
            return 0;
        });

        populateCategories();
        renderDocuments();
    } catch (error) {
        console.error(error);
        grid.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><h2>Could not load documents</h2><p>Check that documents.json exists and is valid JSON.</p></div>`;
        docCountEl.textContent = '';
        loadingState.style.display = 'none';
    }
}


function populateCategories() {
    const categories = new Set();
    allDocuments.forEach(doc => {
        if (doc.category) categories.add(doc.category.trim());
    });

    categoryFilters.innerHTML = '';

    const allPill = document.createElement('button');
    allPill.className = `category-pill ${activeCategory === 'all' ? 'active' : ''}`;
    allPill.textContent = 'All';
    allPill.dataset.category = 'all';
    allPill.addEventListener('click', () => setCategory('all'));
    categoryFilters.appendChild(allPill);

    const sortedCategories = Array.from(categories).sort();
    sortedCategories.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = `category-pill ${activeCategory === cat ? 'active' : ''}`;
        pill.textContent = cat;
        pill.dataset.category = cat;
        pill.addEventListener('click', () => setCategory(cat));
        categoryFilters.appendChild(pill);
    });

    if (activeCategory !== 'all' && !categories.has(activeCategory)) {
        activeCategory = 'all';
        updateCategoryPills();
    }
}

function setCategory(category) {
    activeCategory = category;
    updateCategoryPills();
    renderDocuments();
}

function updateCategoryPills() {
    document.querySelectorAll('.category-pill').forEach(pill => {
        const cat = pill.dataset.category;
        if (cat === activeCategory) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}


function getFilteredDocuments() {
    let filtered = [...allDocuments];


    if (activeCategory !== 'all') {
        filtered = filtered.filter(doc => {
            return doc.category && doc.category.trim().toLowerCase() === activeCategory.toLowerCase();
        });
    }

    if (searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(doc => {
            const title = (doc.title || '').toLowerCase();
            const desc = (doc.description || '').toLowerCase();
            return title.includes(term) || desc.includes(term);
        });
    }

    return filtered;
}

function renderDocuments() {
    const filtered = getFilteredDocuments();

    if (loadingState) loadingState.style.display = 'none';

    grid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';

        filtered.forEach(doc => {
            const card = createDocumentCard(doc);
            grid.appendChild(card);
        });
    }

    const total = allDocuments.length;
    const visible = filtered.length;
    if (total === 0) {
        docCountEl.textContent = 'No documents available.';
    } else {
        docCountEl.textContent = `Showing ${visible} of ${total} document${total !== 1 ? 's' : ''}`;
    }
}

function createDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'doc-card';

    const fileType = (doc.fileType || 'file').toLowerCase();
    const badgeClass = getBadgeClass(fileType);

    card.innerHTML = `
        <div class="card-header">
            <h3 class="doc-title">${escapeHTML(doc.title || 'Untitled')}</h3>
            <span class="file-badge ${badgeClass}">${escapeHTML(fileType)}</span>
        </div>
        <p class="doc-description">${escapeHTML(doc.description || 'No description provided.')}</p>
        <div class="card-actions">
            <a href="${encodeURI(doc.filePath)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                📖 View
            </a>
            <a href="${encodeURI(doc.filePath)}" download class="btn btn-outline">
                ⬇ Download
            </a>
        </div>
    `;

    return card;
}

function getBadgeClass(fileType) {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return 'pdf';
    if (type === 'docx' || type === 'doc') return 'docx';
    if (type === 'ppt' || type === 'pptx') return 'ppt';
    if (type === 'txt' || type === 'md') return 'txt';
    if (type === 'xlsx' || type === 'csv') return 'xlsx';
    if (type === 'zip') return 'zip';
    return '';
}
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
function onSearchInput() {
    searchTerm = searchInput.value;

    if (searchTerm.trim() !== '') {
        clearSearchBtn.classList.add('visible');
    } else {
        clearSearchBtn.classList.remove('visible');
    }
    renderDocuments();
}

function clearSearch() {
    searchInput.value = '';
    searchTerm = '';
    clearSearchBtn.classList.remove('visible');
    renderDocuments();
    searchInput.focus();
}
function resetAllFilters() {
    searchInput.value = '';
    searchTerm = '';
    clearSearchBtn.classList.remove('visible');
    activeCategory = 'all';
    updateCategoryPills();
    renderDocuments();
}

searchInput.addEventListener('input', onSearchInput);
clearSearchBtn.addEventListener('click', clearSearch);
btnResetFilters.addEventListener('click', resetAllFilters);

window.addEventListener('load', () => {
    if (searchInput.value.trim() !== '') {
        clearSearchBtn.classList.add('visible');
    }
});

loadDocuments();
