/**
 * Airport Broadcast System
 * 机场广播管理系统
 */

// ========== State ==========
let broadcasts = [];
let currentBroadcast = null;
let currentLang = 'zh';
let currentCategory = 'oversized';
let searchQuery = '';
let langFilter = 'all';
let isPlaying = false;

// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const broadcastGrid = document.getElementById('broadcastGrid');
const emptyState = document.getElementById('emptyState');
const uploadModal = document.getElementById('uploadModal');
const uploadForm = document.getElementById('uploadForm');
const categoryList = document.getElementById('categoryList');
const searchInput = document.getElementById('searchInput');
const waveform = document.getElementById('waveform');
const progressFill = document.getElementById('progressFill');
const progressBar = document.getElementById('progressBar');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');
const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Category mappings
const categoryNames = {
    all: { zh: '全部广播', en: 'All Broadcasts' },
    boarding: { zh: '登机广播', en: 'Boarding' },
    oversized: { zh: '三超行李', en: 'Oversized Baggage' },
    delay: { zh: '延误通知', en: 'Delay Notice' },
    security: { zh: '安检提醒', en: 'Security Check' },
    general: { zh: '通用广播', en: 'General' }
};

const langLabels = {
    zh: '🇨🇳 中文',
    en: '🇬🇧 English',
    mn: '🏠 闽南语'
};

// ========== Initialize ==========
function init() {
    loadFromStorage();
    renderBroadcasts();
    updateCounts();
    bindEvents();
    initTheme();

    // Set initial volume
    audioPlayer.volume = volumeSlider.value / 100;

    // Add demo data if empty
    if (broadcasts.length === 0) {
        addDemoData();
    }
}

function addDemoData() {
    // Add two demo broadcasts
    broadcasts = [
        {
            id: Date.now() + 1,
            name: '三超行李提醒',
            category: 'oversized',
            createdAt: new Date().toISOString(),
            audio: {
                zh: null,
                en: null,
                mn: null
            }
        },
        {
            id: Date.now() + 2,
            name: '登机广播',
            category: 'boarding',
            createdAt: new Date().toISOString(),
            audio: {
                mn: null
            }
        }
    ];
    saveToStorage();
    renderBroadcasts();
    updateCounts();
}

// ========== Storage ==========
function saveToStorage() {
    // Note: Audio files are stored as base64 data URLs
    // In production, use a proper backend storage
    localStorage.setItem('broadcasts', JSON.stringify(broadcasts));
}

function loadFromStorage() {
    const saved = localStorage.getItem('broadcasts');
    if (saved) {
        broadcasts = JSON.parse(saved);
    }
}

// ========== Event Bindings ==========
function bindEvents() {
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Upload modal
    document.getElementById('uploadBtn').addEventListener('click', () => {
        uploadModal.classList.add('active');
    });
    
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelUpload').addEventListener('click', closeModal);
    
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeModal();
    });
    
    // Form submission
    uploadForm.addEventListener('submit', handleUpload);
    
    // File inputs
    ['Zh', 'En', 'Mn'].forEach(lang => {
        const input = document.getElementById(`audio${lang}`);
        const fileName = document.getElementById(`fileName${lang}`);
        input.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                fileName.textContent = e.target.files[0].name;
            }
        });
    });
    
    // Category navigation
    categoryList.addEventListener('click', (e) => {
        const item = e.target.closest('.category-item');
        if (item) {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            closeSidebar(); // Close sidebar on mobile after selection
            updateListTitle();
            renderBroadcasts();
        }
    });
    
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderBroadcasts();
    });
    
    // Language filter
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            langFilter = btn.dataset.lang;
            renderBroadcasts();
        });
    });
    
    // Player controls
    playBtn.addEventListener('click', togglePlay);
    document.getElementById('prevBtn').addEventListener('click', playPrevious);
    document.getElementById('nextBtn').addEventListener('click', playNext);
    
    // Volume
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
        updateVolumeIcon();
    });
    
    document.getElementById('volumeBtn').addEventListener('click', toggleMute);
    
    // Progress bar
    progressBar.addEventListener('click', (e) => {
        if (audioPlayer.duration) {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = percent * audioPlayer.duration;
        }
    });
    
    // Audio events
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        timeTotal.textContent = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButton();
        waveform.classList.remove('playing');
        // Auto play next language version or next broadcast
        playNextLanguage();
    });
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.view === 'list') {
                broadcastGrid.classList.add('list-view');
            } else {
                broadcastGrid.classList.remove('list-view');
            }
        });
    });
}

// ========== Sidebar Mobile ==========
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}

// ========== Modal ==========
function closeModal() {
    uploadModal.classList.remove('active');
    uploadForm.reset();
    ['Zh', 'En', 'Mn'].forEach(lang => {
        document.getElementById(`fileName${lang}`).textContent = '未选择';
    });
}

// ========== Upload Handler ==========
async function handleUpload(e) {
    e.preventDefault();
    
    const name = document.getElementById('broadcastName').value.trim();
    const category = document.getElementById('broadcastCategory').value;
    
    const audioFiles = {
        zh: document.getElementById('audioZh').files[0],
        en: document.getElementById('audioEn').files[0],
        mn: document.getElementById('audioMn').files[0]
    };
    
    // Convert files to base64 for storage
    const audio = {};
    for (const [lang, file] of Object.entries(audioFiles)) {
        if (file) {
            audio[lang] = await fileToBase64(file);
        } else {
            audio[lang] = null;
        }
    }
    
    const broadcast = {
        id: Date.now(),
        name,
        category,
        createdAt: new Date().toISOString(),
        audio
    };
    
    broadcasts.unshift(broadcast);
    saveToStorage();
    renderBroadcasts();
    updateCounts();
    closeModal();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========== Render ==========
function renderBroadcasts() {
    let filtered = [...broadcasts];
    
    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(b => b.category === currentCategory);
    }
    
    // Filter by search
    if (searchQuery) {
        filtered = filtered.filter(b => 
            b.name.toLowerCase().includes(searchQuery)
        );
    }
    
    // Filter by language (has audio for that language)
    if (langFilter !== 'all') {
        filtered = filtered.filter(b => b.audio && b.audio[langFilter]);
    }
    
    if (filtered.length === 0) {
        broadcastGrid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        broadcastGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        broadcastGrid.innerHTML = filtered.map(b => createBroadcastCard(b)).join('');
        
        // Bind card events
        document.querySelectorAll('.broadcast-card').forEach(card => {
            const id = parseInt(card.dataset.id);
            
            // Play on click
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-action-btn') && !e.target.closest('.lang-tag')) {
                    playBroadcast(id);
                }
            });
            
            // Language tag clicks
            card.querySelectorAll('.lang-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playBroadcast(id, tag.dataset.lang);
                });
            });
            
            // Delete button
            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteBroadcast(id);
                });
            }
        });
    }
}

function createBroadcastCard(broadcast) {
    const categoryName = categoryNames[broadcast.category]?.zh || broadcast.category;
    const isActive = currentBroadcast && currentBroadcast.id === broadcast.id;
    
    // Get available languages
    const availableLangs = [];
    if (broadcast.audio) {
        if (broadcast.audio.zh) availableLangs.push('zh');
        if (broadcast.audio.en) availableLangs.push('en');
        if (broadcast.audio.mn) availableLangs.push('mn');
    }
    
    const langTags = availableLangs.length > 0 
        ? availableLangs.map(lang => {
            const isCurrentLang = isActive && currentLang === lang;
            return `<span class="lang-tag ${isCurrentLang ? 'active' : ''}" data-lang="${lang}">${langLabels[lang]}</span>`;
        }).join('')
        : '<span class="lang-tag">无音频 No Audio</span>';
    
    const createdDate = new Date(broadcast.createdAt).toLocaleDateString('zh-CN');
    
    return `
        <div class="broadcast-card ${isActive ? 'active' : ''}" data-id="${broadcast.id}">
            <div class="card-header">
                <span class="card-category">${categoryName}</span>
                <div class="card-actions">
                    <button class="card-action-btn delete-btn" title="删除">🗑️</button>
                </div>
            </div>
            <h4 class="card-title">${escapeHtml(broadcast.name)}</h4>
            <p class="card-info">创建于 ${createdDate}</p>
            <div class="card-languages">
                ${langTags}
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== Player ==========
function playBroadcast(id, lang = null) {
    const broadcast = broadcasts.find(b => b.id === id);
    if (!broadcast) return;
    
    currentBroadcast = broadcast;
    
    // Determine which language to play
    if (lang && broadcast.audio && broadcast.audio[lang]) {
        currentLang = lang;
    } else if (broadcast.audio) {
        // Find first available language
        if (broadcast.audio.zh) currentLang = 'zh';
        else if (broadcast.audio.en) currentLang = 'en';
        else if (broadcast.audio.mn) currentLang = 'mn';
        else {
            // No audio available
            updateNowPlaying(broadcast, null);
            return;
        }
    }
    
    // Update UI
    updateNowPlaying(broadcast, currentLang);
    renderBroadcasts(); // Update active states
    
    // Play audio
    if (broadcast.audio && broadcast.audio[currentLang]) {
        audioPlayer.src = broadcast.audio[currentLang];
        audioPlayer.play();
        isPlaying = true;
        updatePlayButton();
        waveform.classList.add('playing');
    }
}

function updateNowPlaying(broadcast, lang) {
    document.getElementById('currentTitle').textContent = broadcast.name;
    
    const langText = lang ? langLabels[lang] : '';
    const categoryText = categoryNames[broadcast.category]?.zh || broadcast.category;
    document.getElementById('currentMeta').textContent = `${categoryText} ${langText ? '• ' + langText : ''}`;
}

function togglePlay() {
    if (!currentBroadcast) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        waveform.classList.remove('playing');
    } else {
        audioPlayer.play();
        isPlaying = true;
        waveform.classList.add('playing');
    }
    updatePlayButton();
}

function updatePlayButton() {
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
}

function playPrevious() {
    if (!currentBroadcast) return;
    const filtered = getFilteredBroadcasts();
    const index = filtered.findIndex(b => b.id === currentBroadcast.id);
    if (index > 0) {
        playBroadcast(filtered[index - 1].id);
    }
}

function playNext() {
    if (!currentBroadcast) return;
    const filtered = getFilteredBroadcasts();
    const index = filtered.findIndex(b => b.id === currentBroadcast.id);
    if (index < filtered.length - 1) {
        playBroadcast(filtered[index + 1].id);
    }
}

function playNextLanguage() {
    if (!currentBroadcast || !currentBroadcast.audio) return;
    
    const langs = ['zh', 'en', 'mn'];
    const currentIndex = langs.indexOf(currentLang);
    
    // Find next available language
    for (let i = currentIndex + 1; i < langs.length; i++) {
        if (currentBroadcast.audio[langs[i]]) {
            playBroadcast(currentBroadcast.id, langs[i]);
            return;
        }
    }
    
    // No more languages, play next broadcast
    playNext();
}

function getFilteredBroadcasts() {
    let filtered = [...broadcasts];
    if (currentCategory !== 'all') {
        filtered = filtered.filter(b => b.category === currentCategory);
    }
    return filtered;
}

function updateProgress() {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = `${percent}%`;
        timeCurrent.textContent = formatTime(audioPlayer.currentTime);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toggleMute() {
    audioPlayer.muted = !audioPlayer.muted;
    updateVolumeIcon();
}

function updateVolumeIcon() {
    const btn = document.getElementById('volumeBtn');
    if (audioPlayer.muted || audioPlayer.volume === 0) {
        btn.textContent = '🔇';
    } else if (audioPlayer.volume < 0.5) {
        btn.textContent = '🔉';
    } else {
        btn.textContent = '🔊';
    }
}

// ========== Delete ==========
function deleteBroadcast(id) {
    if (confirm('确定要删除此广播吗？\nAre you sure to delete this broadcast?')) {
        broadcasts = broadcasts.filter(b => b.id !== id);
        if (currentBroadcast && currentBroadcast.id === id) {
            currentBroadcast = null;
            audioPlayer.pause();
            audioPlayer.src = '';
            document.getElementById('currentTitle').textContent = '请选择广播';
            document.getElementById('currentMeta').textContent = 'Select a broadcast to play';
            isPlaying = false;
            updatePlayButton();
            waveform.classList.remove('playing');
        }
        saveToStorage();
        renderBroadcasts();
        updateCounts();
    }
}

// ========== Counts ==========
function updateCounts() {
    const counts = {
        all: broadcasts.length,
        boarding: 0,
        oversized: 0,
        delay: 0,
        security: 0,
        general: 0
    };
    
    broadcasts.forEach(b => {
        if (counts[b.category] !== undefined) {
            counts[b.category]++;
        }
    });
    
    for (const [cat, count] of Object.entries(counts)) {
        const el = document.getElementById(`count-${cat}`);
        if (el) el.textContent = count;
    }
}

function updateListTitle() {
    const title = categoryNames[currentCategory];
    document.getElementById('listTitle').textContent = `${title.zh} ${title.en}`;
}

// ========== Theme Toggle ==========
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = savedTheme || (systemDark ? 'dark' : 'light');
    setTheme(theme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// ========== Start ==========
document.addEventListener('DOMContentLoaded', init);
