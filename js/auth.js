import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

export const initAuth = (onLoginSuccess) => {
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogout = document.getElementById('btn-logout');
    const btnReset = document.getElementById('btn-reset');
    const errorDiv = document.getElementById('auth-error');

    btnLogin.onclick = () => {
        const e = document.getElementById('login-email').value;
        const p = document.getElementById('login-pass').value;
        signInWithEmailAndPassword(auth, e, p).catch(err => errorDiv.innerText = "Error: Credenciales inválidas");
    };

    btnSignup.onclick = () => {
        const e = document.getElementById('login-email').value;
        const p = document.getElementById('login-pass').value;
        if(p.length < 6) { errorDiv.innerText = "La contraseña debe tener al menos 6 caracteres"; return; }
        createUserWithEmailAndPassword(auth, e, p).catch(err => errorDiv.innerText = "Error: " + err.message);
    };

    btnLogout.onclick = () => signOut(auth);

    btnReset.onclick = () => {
        const email = document.getElementById('login-email').value;
        if(!email) { alert("Ingresa tu correo para recuperar"); return; }
        sendPasswordResetEmail(auth, email).then(() => alert("Correo de recuperación enviado"));
    };

    onAuthStateChanged(auth, user => {
        if (user) {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            document.getElementById('user-display').innerText = user.email;
            onLoginSuccess();
        } else {
            document.getElementById('auth-container').style.display = 'flex';
            document.getElementById('app-container').style.display = 'none';
        }
    });
};
