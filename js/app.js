import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- TUS CREDENCIALES ---
const firebaseConfig = {
    apiKey: "AIzaSyAQnrIODc_2Qv_Snow02X-Sq8_PHwMoRVk",
    authDomain: "trello-d2532.firebaseapp.com",
    projectId: "trello-d2532",
    storageBucket: "trello-d2532.firebasestorage.app",
    messagingSenderId: "630892154656",
    appId: "1:630892154656:web:1d0dfce355216a1d879145",
    measurementId: "G-4L4P7E6TZC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const MEMBERS = [
    { id: 'u1', name: 'Juan', initial: 'JP', color: '#e91e63' },
    { id: 'u2', name: 'Maria', initial: 'ML', color: '#9c27b0' },
    { id: 'u3', name: 'Carlos', initial: 'CR', color: '#2196f3' },
    { id: 'u4', name: 'Ana', initial: 'AV', color: '#4caf50' }
];

let boardData = { todo: [], 'in-progress': [], done: [], history: [], settings: { theme: 'light' } };
let currentEditingId = null;

// --- FUNCIONES GLOBALES (ACCESIBLES DESDE HTML) ---
window.handleAddNewCard = function(btn) {
    const input = btn.parentElement.querySelector('.card-input');
    const colId = btn.closest('.list').dataset.id;
    if (!input.value.trim()) return;
    const newCard = { id: 'c'+Date.now(), title: input.value, desc: '', tags: [], members: [], date: '', checklist: [] };
    boardData[colId].push(newCard);
    addLog(`Nueva tarea: ${newCard.title}`);
    input.value = ''; save();
};

window.addTag = () => {
    const input = document.getElementById('tag-input');
    const card = findCard(currentEditingId);
    if(input.value && !card.tags.includes(input.value)) {
        card.tags.push(input.value); renderTags(card); renderBoard(); save();
    }
    input.value = '';
};

window.toggleMember = (mId) => {
    const card = findCard(currentEditingId);
    if(!card.members) card.members = [];
    const idx = card.members.indexOf(mId);
    idx === -1 ? card.members.push(mId) : card.members.splice(idx, 1);
    renderMembers(card); renderBoard(); save();
};

window.addChecklistItem = () => {
    const input = document.getElementById('new-check-input');
    if(!input.value) return;
    findCard(currentEditingId).checklist.push({ text: input.value, done: false });
    input.value = ''; renderChecklist(findCard(currentEditingId)); renderBoard(); save();
};

window.toggleCheck = (i) => {
    const card = findCard(currentEditingId);
    card.checklist[i].done = !card.checklist[i].done;
    renderChecklist(card); renderBoard(); save();
};

window.closeModal = () => document.getElementById('card-modal').style.display = 'none';

window.archiveCardFromModal = () => {
    if(confirm("¿Eliminar tarea definitivamente?")) {
        ['todo','in-progress','done'].forEach(col => boardData[col] = boardData[col].filter(c => c.id !== currentEditingId));
        window.closeModal(); save();
    }
};

window.searchCards = () => {
    const q = document.getElementById('board-search').value.toLowerCase();
    document.querySelectorAll('.card').forEach(el => {
        const c = findCard(el.id);
        const match = c.title.toLowerCase().includes(q) || MEMBERS.some(m => c.members.includes(m.id) && m.name.toLowerCase().includes(q));
        el.style.display = match ? 'block' : 'none';
    });
};

window.exportToCSV = () => {
    let csv = "Columna,Tarea,Fecha,Tags\n";
    ['todo','in-progress','done'].forEach(col => boardData[col].forEach(c => csv += `${col},${c.title},${c.date},${c.tags.join('|')}\n`));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = 'reporte.csv'; a.click();
};

// --- LÓGICA CORE ---
async function save() { await setDoc(doc(db, "boards", "master"), boardData); }

function startSync() {
    onSnapshot(doc(db, "boards", "master"), (snap) => {
        if (snap.exists()) {
            boardData = snap.data();
            renderBoard(); renderHistory();
            document.body.className = boardData.settings.theme + '-theme';
        } else { save(); }
    });
}

function renderBoard() {
    ['todo', 'in-progress', 'done'].forEach(col => {
        const container = document.getElementById(col);
        container.innerHTML = '';
        (boardData[col] || []).forEach(card => {
            const el = document.createElement('div');
            el.className = 'card'; el.draggable = true;
            el.onclick = () => openModal(card.id);
            el.ondragstart = (e) => e.dataTransfer.setData("text", card.id);
            
            const avatars = (card.members || []).map(mId => {
                const m = MEMBERS.find(u => u.id === mId);
                return `<div class="avatar" style="background:${m.color}">${m.initial}</div>`;
            }).join('');

            el.innerHTML = `
                <div class="card-tags">${(card.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
                <strong>${card.title}</strong>
                <div class="card-footer" style="display:flex; justify-content:space-between; margin-top:10px;">
                    <small>${card.date ? '📅 '+card.date : ''}</small>
                    <div class="avatar-stack">${avatars}</div>
                </div>`;
            container.appendChild(el);
        });
    });
    updateStats();
}

function openModal(id) {
    currentEditingId = id;
    const card = findCard(id);
    document.getElementById('modal-title').value = card.title;
    document.getElementById('modal-desc').value = card.desc;
    document.getElementById('modal-date').value = card.date;
    renderMembers(card); renderTags(card); renderChecklist(card);
    document.getElementById('card-modal').style.display = 'block';
}

function findCard(id) { return [...boardData.todo, ...boardData['in-progress'], ...boardData.done].find(c => c.id === id); }

function renderMembers(card) {
    document.getElementById('modal-members').innerHTML = MEMBERS.map(m => `
        <div class="avatar avatar-selectable ${card.members?.includes(m.id) ? 'selected' : ''}" 
             style="background:${m.color}" onclick="window.toggleMember('${m.id}')">${m.initial}</div>`).join('');
}

function renderTags(card) { document.getElementById('modal-tags').innerHTML = (card.tags || []).map(t => `<span class="tag">${t}</span>`).join(''); }

function renderChecklist(card) {
    const cont = document.getElementById('modal-checklist');
    cont.innerHTML = (card.checklist || []).map((item, i) => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="window.toggleCheck(${i})">
            <span>${item.text}</span>
        </div>`).join('');
    const done = card.checklist.filter(x => x.done).length;
    const pc = card.checklist.length ? Math.round((done/card.checklist.length)*100) : 0;
    document.getElementById('progress-fill').style.width = pc+'%';
    document.getElementById('check-percent').innerText = pc+'%';
}

function addLog(action) {
    boardData.history.unshift({ time: new Date().toLocaleTimeString(), action });
    if(boardData.history.length > 20) boardData.history.pop();
}

function renderHistory() {
    document.getElementById('history-log').innerHTML = boardData.history.map(h => `<div><b>${h.time}</b>: ${h.action}</div>`).join('');
}

function updateStats() {
    const total = boardData.todo.length + boardData['in-progress'].length + boardData.done.length;
    document.getElementById('board-stats').innerHTML = `<span>Tareas: ${total}</span> | <span>Finalizadas: ${boardData.done.length}</span>`;
}

// --- AUTH ---
document.getElementById('btn-login').onclick = () => {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    signInWithEmailAndPassword(auth, e, p).catch(err => alert("Error: " + err.message));
};

document.getElementById('btn-signup').onclick = () => {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    createUserWithEmailAndPassword(auth, e, p).catch(err => alert("Error: " + err.message));
};

document.getElementById('btn-logout').onclick = () => signOut(auth);

document.getElementById('btn-reset').onclick = () => {
    const email = document.getElementById('login-email').value;
    if(!email) return alert("Escribe tu correo");
    sendPasswordResetEmail(auth, email).then(() => alert("Correo enviado"));
};

onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = user.email;
        startSync();
    } else {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
});

// --- DRAG & DROP ---
document.querySelectorAll('.list').forEach(list => {
    list.ondragover = e => e.preventDefault();
    list.ondrop = e => {
        const id = e.dataTransfer.getData("text");
        const targetCol = list.dataset.id;
        let cardObj;
        ['todo','in-progress','done'].forEach(c => {
            const idx = boardData[c].findIndex(x => x.id === id);
            if(idx !== -1) cardObj = boardData[c].splice(idx,1)[0];
        });
        if(cardObj) { boardData[targetCol].push(cardObj); addLog(`Movido a ${targetCol}`); save(); }
    };
});

// Eventos Finales
document.getElementById('modal-title').onblur = e => { findCard(currentEditingId).title = e.target.value; save(); };
document.getElementById('modal-desc').onblur = e => { findCard(currentEditingId).desc = e.target.value; save(); };
document.getElementById('modal-date').onchange = e => { findCard(currentEditingId).date = e.target.value; save(); };
document.getElementById('btn-theme').onclick = () => { boardData.settings.theme = boardData.settings.theme === 'light' ? 'dark' : 'light'; save(); };
document.getElementById('btn-toggle-log').onclick = () => document.getElementById('history-panel').classList.toggle('active');
document.getElementById('close-history').onclick = () => document.getElementById('history-panel').classList.remove('active');
