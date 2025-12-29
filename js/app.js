import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

const COMPANY_MEMBERS = [
    { id: 'u1', name: 'Juan', initial: 'JP', color: '#e91e63' },
    { id: 'u2', name: 'Maria', initial: 'ML', color: '#9c27b0' },
    { id: 'u3', name: 'Carlos', initial: 'CR', color: '#2196f3' }
];

let boardData = { todo: [], 'in-progress': [], done: [], history: [], settings: { theme: 'light' } };
let currentEditingId = null;

// --- LOGIN ---
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

// --- MONITOR DE SESIÓN ---
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

// --- SINCRONIZACIÓN ---
function startSync() {
    onSnapshot(doc(db, "boards", "master"), (snap) => {
        if (snap.exists()) {
            boardData = snap.data();
            renderBoard();
        } else {
            // Inicializar base de datos si está vacía
            save();
        }
    });
}

async function save() {
    await setDoc(doc(db, "boards", "master"), boardData);
}

// --- RENDERIZADO ---
function renderBoard() {
    ['todo', 'in-progress', 'done'].forEach(col => {
        const container = document.getElementById(col);
        container.innerHTML = '';
        (boardData[col] || []).forEach(card => {
            const el = document.createElement('div');
            el.className = 'card';
            el.innerHTML = `<strong>${card.title}</strong>`;
            el.onclick = () => openModal(card.id);
            container.appendChild(el);
        });
    });
}

// --- FUNCIÓN PARA AÑADIR (CORREGIDA) ---
window.handleAddNewCard = function(btn) {
    const container = btn.parentElement;
    const input = container.querySelector('.card-input');
    const colId = btn.closest('.list').dataset.id;
    
    if (!input.value.trim()) return;

    const newCard = {
        id: 'c' + Date.now(),
        title: input.value,
        desc: '',
        tags: [],
        members: [],
        date: '',
        checklist: []
    };

    if (!boardData[colId]) boardData[colId] = [];
    boardData[colId].push(newCard);
    
    console.log("Añadiendo tarea:", newCard);
    
    input.value = '';
    save(); // Guardar en Firebase
};

// --- MODAL ---
function openModal(id) {
    currentEditingId = id;
    const card = findCard(id);
    document.getElementById('modal-title').value = card.title;
    document.getElementById('card-modal').style.display = 'block';
}

function findCard(id) {
    return [...boardData.todo, ...boardData['in-progress'], ...boardData.done].find(c => c.id === id);
}

document.querySelector('.close-modal').onclick = () => {
    document.getElementById('card-modal').style.display = 'none';
};

// Cerrar al hacer clic fuera
window.onclick = (e) => {
    if (e.target == document.getElementById('card-modal')) {
        document.getElementById('card-modal').style.display = 'none';
    }
};
