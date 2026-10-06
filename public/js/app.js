/**
 * Starlight Notes - Client-side LocalStorage Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Storage Keys
  const STORAGE_KEY = 'starlight_notes_data_v1';
  const DRAFT_KEY = 'starlight_note_draft_v1';
  const THEME_KEY = 'starlight_theme_v1';

  // Sample default notes for initial load if storage is empty
  const DEFAULT_NOTES = [
    {
      id: 'note-welcome-1',
      title: '✨ Welcome to Starlight Notes!',
      content: 'Your notes are automatically saved to your browser\'s LocalStorage.\n\nEven when you refresh the page or restart your browser, your data remains completely intact!',
      category: 'personal',
      color: 'purple',
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'note-welcome-2',
      title: '🚀 Node.js + Express + EJS Stack',
      content: 'This app is powered by an Express server using EJS template rendering for structure, combined with vanilla modern CSS and client-side LocalStorage for zero-latency persistence.',
      category: 'code',
      color: 'blue',
      isPinned: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'note-welcome-3',
      title: '💡 Quick Tip: Pinning & Categories',
      content: 'You can pin important notes to keep them at the top of your dashboard, filter by category tabs, or export your notes as a JSON backup!',
      category: 'ideas',
      color: 'emerald',
      isPinned: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // State Management
  let notes = [];
  let currentCategory = 'all';
  let searchQuery = '';
  let sortBy = 'newest';
  let selectedColor = 'purple';
  let editingNoteId = null;

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  
  const categoryTabs = document.getElementById('categoryTabs');
  const sortSelect = document.getElementById('sortSelect');
  const openNewNoteBtn = document.getElementById('openNewNoteBtn');
  const emptyCreateBtn = document.getElementById('emptyCreateBtn');
  const moreActionsBtn = document.getElementById('moreActionsBtn');
  const moreActionsMenu = document.getElementById('moreActionsMenu');
  const exportNotesBtn = document.getElementById('exportNotesBtn');
  const importFileInput = document.getElementById('importFileInput');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  const noteFormContainer = document.getElementById('noteFormContainer');
  const noteForm = document.getElementById('noteForm');
  const formTitle = document.getElementById('formTitle');
  const closeFormBtn = document.getElementById('closeFormBtn');
  const cancelNoteBtn = document.getElementById('cancelNoteBtn');
  const noteIdInput = document.getElementById('noteId');
  const noteTitleInput = document.getElementById('noteTitleInput');
  const noteContentInput = document.getElementById('noteContentInput');
  const noteCategorySelect = document.getElementById('noteCategorySelect');
  const notePinnedInput = document.getElementById('notePinnedInput');
  const colorOptions = document.getElementById('colorOptions');
  const charCountEl = document.getElementById('charCount');
  const wordCountEl = document.getElementById('wordCount');
  const draftIndicator = document.getElementById('draftIndicator');
  const saveBtnText = document.getElementById('saveBtnText');
  
  const pinnedSection = document.getElementById('pinnedSection');
  const pinnedGrid = document.getElementById('pinnedGrid');
  const allNotesSection = document.getElementById('allNotesSection');
  const notesGrid = document.getElementById('notesGrid');
  const gridSectionHeading = document.getElementById('gridSectionHeading');
  const emptyState = document.getElementById('emptyState');
  const emptyStateMsg = document.getElementById('emptyStateMsg');
  const storageCountText = document.getElementById('storageCountText');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  // Counts Pinned
  const countAll = document.getElementById('countAll');
  const countPersonal = document.getElementById('countPersonal');
  const countWork = document.getElementById('countWork');
  const countIdeas = document.getElementById('countIdeas');
  const countCode = document.getElementById('countCode');

  // Initialize App
  function init() {
    loadTheme();
    loadNotesFromStorage();
    loadDraft();
    setupEventListeners();
    render();
  }

  // LocalStorage Load & Save Functions
  function loadNotesFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        notes = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse notes from localStorage:', e);
        notes = DEFAULT_NOTES;
        saveNotesToStorage();
      }
    } else {
      // First visit setup
      notes = DEFAULT_NOTES;
      saveNotesToStorage();
    }
  }

  function saveNotesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    updateStorageStatusText();
  }

  function updateStorageStatusText() {
    if (storageCountText) {
      const count = notes.length;
      storageCountText.textContent = `${count} ${count === 1 ? 'note' : 'notes'} saved in LocalStorage`;
    }
  }

  // Theme Management
  function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    } else {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    }
  }

  // Draft Management
  function saveDraft() {
    const title = noteTitleInput.value;
    const content = noteContentInput.value;
    if (title || content) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title,
        content,
        category: noteCategorySelect.value,
        color: selectedColor,
        isPinned: notePinnedInput.checked
      }));
      draftIndicator.classList.remove('hidden');
    } else {
      clearDraft();
    }
  }

  function loadDraft() {
    if (editingNoteId) return; // Don't overwrite when editing existing note
    const draftData = localStorage.getItem(DRAFT_KEY);
    if (draftData) {
      try {
        const draft = JSON.parse(draftData);
        if (draft.title || draft.content) {
          noteTitleInput.value = draft.title || '';
          noteContentInput.value = draft.content || '';
          if (draft.category) noteCategorySelect.value = draft.category;
          if (draft.color) setSelectedColor(draft.color);
          if (draft.isPinned !== undefined) notePinnedInput.checked = draft.isPinned;
          updateCounters();
          draftIndicator.classList.remove('hidden');
        }
      } catch (e) {
        clearDraft();
      }
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    draftIndicator.classList.add('hidden');
  }

  // Counters
  function updateCounters() {
    const content = noteContentInput.value;
    const charLen = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    charCountEl.textContent = `${charLen} char${charLen === 1 ? '' : 's'}`;
    wordCountEl.textContent = `${words} word${words === 1 ? '' : 's'}`;
  }

  // Toast Notification
  function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Color Selector Setup
  function setSelectedColor(color) {
    selectedColor = color;
    const buttons = colorOptions.querySelectorAll('.color-btn');
    buttons.forEach(btn => {
      if (btn.dataset.color === color) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (searchQuery) {
        clearSearchBtn.style.display = 'flex';
      } else {
        clearSearchBtn.style.display = 'none';
      }
      render();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      render();
    });

    // Category Filter Tabs
    categoryTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      
      categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      render();
    });

    // Sort Select
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    // Toggle Form
    openNewNoteBtn.addEventListener('click', () => {
      openForm();
    });

    if (emptyCreateBtn) {
      emptyCreateBtn.addEventListener('click', () => {
        openForm();
      });
    }

    closeFormBtn.addEventListener('click', closeForm);
    cancelNoteBtn.addEventListener('click', closeForm);

    // Color buttons
    colorOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.color-btn');
      if (btn) {
        setSelectedColor(btn.dataset.color);
        saveDraft();
      }
    });

    // Live typing draft & count
    noteTitleInput.addEventListener('input', () => {
      if (!editingNoteId) saveDraft();
    });

    noteContentInput.addEventListener('input', () => {
      updateCounters();
      if (!editingNoteId) saveDraft();
    });

    noteCategorySelect.addEventListener('change', () => {
      if (!editingNoteId) saveDraft();
    });

    notePinnedInput.addEventListener('change', () => {
      if (!editingNoteId) saveDraft();
    });

    // Submit Note Form
    noteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveNote();
    });

    // More Actions Menu Dropdown
    moreActionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreActionsMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      moreActionsMenu.classList.add('hidden');
    });

    // Export Notes
    exportNotesBtn.addEventListener('click', () => {
      exportNotesJSON();
    });

    // Import Notes
    importFileInput.addEventListener('change', (e) => {
      importNotesJSON(e);
    });

    // Clear All Notes
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) {
        notes = [];
        saveNotesToStorage();
        render();
        showToast('All notes cleared');
      }
    });
  }

  // Open & Close Form
  function openForm(note = null) {
    noteFormContainer.classList.remove('hidden');
    if (note) {
      editingNoteId = note.id;
      formTitle.textContent = 'Edit Note';
      saveBtnText.textContent = 'Update Note';
      noteIdInput.value = note.id;
      noteTitleInput.value = note.title;
      noteContentInput.value = note.content;
      noteCategorySelect.value = note.category;
      notePinnedInput.checked = note.isPinned;
      setSelectedColor(note.color || 'purple');
      draftIndicator.classList.add('hidden');
    } else {
      editingNoteId = null;
      formTitle.textContent = 'Create New Note';
      saveBtnText.textContent = 'Save Note';
      noteIdInput.value = '';
      loadDraft();
    }
    updateCounters();
    noteTitleInput.focus();
    window.scrollTo({ top: noteFormContainer.offsetTop - 80, behavior: 'smooth' });
  }

  function closeForm() {
    noteFormContainer.classList.add('hidden');
    editingNoteId = null;
    noteForm.reset();
    setSelectedColor('purple');
    updateCounters();
  }

  // Save Note Object
  function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const category = noteCategorySelect.value;
    const isPinned = notePinnedInput.checked;
    const color = selectedColor;

    if (!title || !content) {
      alert('Please fill out both title and content for your note.');
      return;
    }

    if (editingNoteId) {
      // Update existing note
      const index = notes.findIndex(n => n.id === editingNoteId);
      if (index !== -1) {
        notes[index] = {
          ...notes[index],
          title,
          content,
          category,
          color,
          isPinned,
          updatedAt: new Date().toISOString()
        };
        showToast('Note updated successfully');
      }
    } else {
      // Add new note
      const newNote = {
        id: 'note-' + Date.now(),
        title,
        content,
        category,
        color,
        isPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      notes.unshift(newNote);
      clearDraft();
      showToast('New note saved');
    }

    saveNotesToStorage();
    closeForm();
    render();
  }

  // Delete Note
  function deleteNote(id) {
    if (confirm('Delete this note?')) {
      notes = notes.filter(n => n.id !== id);
      saveNotesToStorage();
      render();
      showToast('Note deleted');
    }
  }

  // Toggle Pin Note
  function togglePinNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      note.updatedAt = new Date().toISOString();
      saveNotesToStorage();
      render();
      showToast(note.isPinned ? 'Note pinned' : 'Note unpinned');
    }
  }

  // Copy Note Content
  function copyNoteContent(content) {
    navigator.clipboard.writeText(content).then(() => {
      showToast('Content copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  // Export JSON
  function exportNotesJSON() {
    if (notes.length === 0) {
      alert('No notes to export.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `starlight_notes_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Notes exported as JSON');
  }

  // Import JSON
  function importNotesJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          // Merge imported notes ensuring unique IDs
          let importedCount = 0;
          imported.forEach(item => {
            if (item.title && item.content) {
              const exists = notes.some(n => n.id === item.id);
              if (!exists) {
                notes.push({
                  id: item.id || 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                  title: item.title,
                  content: item.content,
                  category: item.category || 'personal',
                  color: item.color || 'purple',
                  isPinned: !!item.isPinned,
                  createdAt: item.createdAt || new Date().toISOString(),
                  updatedAt: item.updatedAt || new Date().toISOString()
                });
                importedCount++;
              }
            }
          });
          saveNotesToStorage();
          render();
          showToast(`Successfully imported ${importedCount} notes`);
        } else {
          alert('Invalid JSON file format. Expected an array of notes.');
        }
      } catch (err) {
        alert('Error reading JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }

  // Filter & Sort Logic
  function getFilteredAndSortedNotes() {
    let filtered = notes.filter(n => {
      // Category filter
      if (currentCategory !== 'all' && n.category !== currentCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery) {
        const titleMatch = n.title.toLowerCase().includes(searchQuery);
        const contentMatch = n.content.toLowerCase().includes(searchQuery);
        return titleMatch || contentMatch;
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }

  // Update Category Counts
  function updateCategoryCounts() {
    const counts = { all: notes.length, personal: 0, work: 0, ideas: 0, code: 0 };
    notes.forEach(n => {
      if (counts[n.category] !== undefined) {
        counts[n.category]++;
      }
    });

    countAll.textContent = counts.all;
    countPersonal.textContent = counts.personal;
    countWork.textContent = counts.work;
    countIdeas.textContent = counts.ideas;
    countCode.textContent = counts.code;
  }

  // Format Date
  function formatDate(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Render HTML Note Card Element
  function createNoteCardHTML(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.color = note.color || 'purple';
    card.dataset.id = note.id;

    card.innerHTML = `
      <div class="note-card-header">
        <h3 class="note-card-title">${escapeHTML(note.title)}</h3>
        <div class="note-card-actions">
          <button class="icon-btn-action pin-btn ${note.isPinned ? 'pinned' : ''}" title="${note.isPinned ? 'Unpin Note' : 'Pin Note'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${note.isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button class="icon-btn-action copy-btn" title="Copy Content">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="icon-btn-action edit-btn" title="Edit Note">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn-action delete-btn text-danger" title="Delete Note">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <div class="note-card-body">${escapeHTML(note.content)}</div>
      <div class="note-card-footer">
        <span class="category-tag">${escapeHTML(note.category)}</span>
        <span class="date-tag">${formatDate(note.updatedAt)}</span>
      </div>
    `;

    // Attach card event listeners
    card.querySelector('.pin-btn').addEventListener('click', () => togglePinNote(note.id));
    card.querySelector('.copy-btn').addEventListener('click', () => copyNoteContent(note.content));
    card.querySelector('.edit-btn').addEventListener('click', () => openForm(note));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteNote(note.id));

    return card;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Render UI
  function render() {
    updateCategoryCounts();
    updateStorageStatusText();

    const filtered = getFilteredAndSortedNotes();
    const pinnedNotes = filtered.filter(n => n.isPinned);
    const regularNotes = filtered.filter(n => !n.isPinned);

    pinnedGrid.innerHTML = '';
    notesGrid.innerHTML = '';

    // Render Pinned Section
    if (pinnedNotes.length > 0) {
      pinnedSection.classList.remove('hidden');
      pinnedNotes.forEach(n => {
        pinnedGrid.appendChild(createNoteCardHTML(n));
      });
    } else {
      pinnedSection.classList.add('hidden');
    }

    // Render All Notes Section
    if (regularNotes.length > 0) {
      allNotesSection.classList.remove('hidden');
      if (pinnedNotes.length > 0) {
        gridSectionHeading.textContent = 'Other Notes';
      } else {
        gridSectionHeading.textContent = currentCategory === 'all' ? 'All Notes' : `${currentCategory.toUpperCase()} Notes`;
      }

      regularNotes.forEach(n => {
        notesGrid.appendChild(createNoteCardHTML(n));
      });
    } else {
      if (pinnedNotes.length > 0) {
        allNotesSection.classList.add('hidden');
      }
    }

    // Empty state handling
    if (filtered.length === 0) {
      allNotesSection.classList.add('hidden');
      pinnedSection.classList.add('hidden');
      emptyState.classList.remove('hidden');

      if (searchQuery) {
        emptyStateMsg.textContent = `No notes matching "${searchQuery}". Try clearing search.`;
      } else if (currentCategory !== 'all') {
        emptyStateMsg.textContent = `No notes in category "${currentCategory}".`;
      } else {
        emptyStateMsg.textContent = 'Start by creating your first note! Your notes are stored locally in your browser.';
      }
    } else {
      emptyState.classList.add('hidden');
    }
  }

  // Run initialization
  init();
});
