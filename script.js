// DOM Elements
  const container = document.getElementById('notes-container');
  const addNoteBtn = document.getElementById('add-note');
  const searchInput = document.getElementById('search-notes');
  const colorOptions = document.querySelectorAll('.color-palette .color-option');
  const themeToggle = document.getElementById('theme-toggle');
  const emptyState = document.getElementById('empty-state');
  
  // Note colors
  const noteColors = [
    '#fff8e1', // Light Yellow
    '#e8f5e9', // Light Green
    '#e3f2fd', // Light Blue
    '#fce4ec', // Light Pink
    '#f3e5f5', // Light Purple
    '#e0f7fa', // Light Cyan
    '#fff3e0', // Light Orange
    '#f1f8e9'  // Light Lime
  ];
  
  // Default selected color
  let selectedColor = noteColors[0];
  
  // Notes array
  let notes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
  
  // Initialize UI
  function init() {
    // Check for saved theme
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Highlight default color
    colorOptions[0].style.border = '2px solid rgba(0, 0, 0, 0.3)';
    
    // Display notes or empty state
    if (notes.length === 0) {
      emptyState.style.display = 'block';
    } else {
      notes.forEach(note => createNoteElement(note));
    }
  }
  
  // Save notes to localStorage
  function saveNotes() {
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
    
    // Show/hide empty state
    if (notes.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }
  }
  
  // Format date
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Generate random rotation
  function randomRotation() {
    return Math.random() * 6 - 3 + 'deg';
  }
  
  // Create confetti effect
  function createConfetti() {
    const colors = ['#f44336', '#2196f3', '#ffeb3b', '#4caf50', '#9c27b0'];
    
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.width = Math.random() * 10 + 5 + 'px';
      confetti.style.height = Math.random() * 10 + 5 + 'px';
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
      document.body.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  }
  
  // Create note DOM element
  function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'note animate-in';
    div.style.setProperty('--rotation', note.rotation || randomRotation());
    div.id = `note-${note.id}`;
    div.style.left = note.left + 'px';
    div.style.top = note.top + 'px';
    div.style.backgroundColor = note.color;
    
    const timestamp = note.timestamp || Date.now();
    
    div.innerHTML = `
      <div class="note-header">
        <div class="note-drag-handle">
          <i class="fas fa-grip-lines"></i>
        </div>
        <div class="note-actions">
          <button class="note-btn color-btn">
            <i class="fas fa-palette"></i>
            <div class="color-dropdown">
              ${noteColors.map(color => `
                <div class="color-dot" style="background-color:${color}" data-color="${color}"></div>
              `).join('')}
            </div>
          </button>
          <button class="note-btn delete-btn">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <textarea placeholder="Write something...">${note.content}</textarea>
      <div class="note-date">${formatDate(timestamp)}</div>
    `;
    
    const textarea = div.querySelector('textarea');
    const deleteBtn = div.querySelector('.delete-btn');
    const colorBtn = div.querySelector('.color-btn');
    const colorDropdown = div.querySelector('.color-dropdown');
    const colorDots = div.querySelectorAll('.color-dot');
    
    // Text input event
    textarea.oninput = () => {
      const index = notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        notes[index].content = textarea.value;
        saveNotes();
      }
    };
    
    // Delete button event
    deleteBtn.onclick = () => {
      notes = notes.filter(n => n.id !== note.id);
      saveNotes();
      div.classList.remove('animate-in');
      div.style.opacity = '0';
      div.style.transform = 'scale(0.8)';
      setTimeout(() => div.remove(), 300);
    };
    
    // Color button event
    colorBtn.onclick = (e) => {
      e.stopPropagation();
      colorDropdown.classList.toggle('show-dropdown');
    };
    
    // Hide dropdown when clicking elsewhere
    document.addEventListener('click', () => {
      colorDropdown.classList.remove('show-dropdown');
    });
    
    // Color dot events
    colorDots.forEach(dot => {
      dot.onclick = (e) => {
        e.stopPropagation();
        const newColor = dot.getAttribute('data-color');
        div.style.backgroundColor = newColor;
        
        const index = notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
          notes[index].color = newColor;
          saveNotes();
        }
        
        colorDropdown.classList.remove('show-dropdown');
      };
    });
    
    // Dragging functionality
    let isDragging = false;
    let offsetX, offsetY;
    
    div.addEventListener('mousedown', (e) => {
      // Prevent dragging when interacting with controls
      if (e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'BUTTON' || 
          e.target.tagName === 'I' ||
          e.target.className.includes('color-dot')) {
        return;
      }
      
      isDragging = true;
      div.style.zIndex = 999;
      
      const rect = div.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      div.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const left = e.clientX - offsetX;
      const top = e.clientY - offsetY;
      
      // Keep note within viewport
      const maxLeft = window.innerWidth - div.offsetWidth;
      const maxTop = window.innerHeight - div.offsetHeight;
      
      div.style.left = Math.max(0, Math.min(left, maxLeft)) + 'px';
      div.style.top = Math.max(0, Math.min(top, maxTop)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      
      isDragging = false;
      div.style.transition = 'transform 0.2s, box-shadow 0.3s';
      
      // Update note position in array
      const index = notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        notes[index].left = parseInt(div.style.left);
        notes[index].top = parseInt(div.style.top);
        saveNotes();
      }
    });
    
    container.appendChild(div);
  }
  
  // Add a new note
  function addNote() {
    const newNote = {
      id: Date.now(),
      content: '',
      left: Math.max(50, Math.min(window.innerWidth/2 - 120 + (Math.random() * 100 - 50), window.innerWidth - 260)),
      top: Math.max(150, Math.min(window.innerHeight/2 - 100 + (Math.random() * 100 - 50), window.innerHeight - 200)),
      color: selectedColor,
      rotation: randomRotation(),
      timestamp: Date.now()
    };
    
    notes.push(newNote);
    saveNotes();
    createNoteElement(newNote);
    createConfetti();
  }
  
  // Filter notes by search text
  function filterNotes(searchText) {
    const noteElements = document.querySelectorAll('.note');
    
    noteElements.forEach(noteEl => {
      const textarea = noteEl.querySelector('textarea');
      const content = textarea.value.toLowerCase();
      
      if (content.includes(searchText.toLowerCase())) {
        noteEl.style.display = 'block';
      } else {
        noteEl.style.display = 'none';
      }
    });
  }
  
  // Event Listeners
  addNoteBtn.addEventListener('click', addNote);
  
  // Color palette selection
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectedColor = option.getAttribute('data-color');
      
      // Update visual selection
      colorOptions.forEach(opt => {
        opt.style.border = '2px solid rgba(255, 255, 255, 0.5)';
      });
      option.style.border = '2px solid rgba(0, 0, 0, 0.3)';
    });
  });
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    filterNotes(e.target.value);
  });
  
  // Theme toggle
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      localStorage.setItem('darkMode', 'true');
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      localStorage.setItem('darkMode', 'false');
    }
  });
  
  // Window resize listener
  window.addEventListener('resize', () => {
    // Keep notes in viewport when window is resized
    const noteElements = document.querySelectorAll('.note');
    
    noteElements.forEach(noteEl => {
      const left = parseInt(noteEl.style.left);
      const top = parseInt(noteEl.style.top);
      const maxLeft = window.innerWidth - noteEl.offsetWidth;
      const maxTop = window.innerHeight - noteEl.offsetHeight;
      
      if (left > maxLeft) {
        noteEl.style.left = maxLeft + 'px';
        
        // Update in notes array
        const id = parseInt(noteEl.id.replace('note-', ''));
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
          notes[index].left = maxLeft;
        }
      }
      
      if (top > maxTop) {
        noteEl.style.top = maxTop + 'px';
        
        // Update in notes array
        const id = parseInt(noteEl.id.replace('note-', ''));
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
          notes[index].top = maxTop;
        }
      }
    });
    
    saveNotes();
  });
  
  // Initialize the app
  init();