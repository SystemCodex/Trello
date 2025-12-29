import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Tu configuración específica
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
export const auth = getAuth(app);
export const db = getFirestore(app);
