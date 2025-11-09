import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD4cTtadmBPvjBg1rNHJXp38u86BfRWdRQ",
    authDomain: "easycreate-ai.firebaseapp.com",
    projectId: "easycreate-ai",
    storageBucket: "easycreate-ai.firebasestorage.app",
    messagingSenderId: "1017358923832",
    appId: "1:1017358923832:web:13b8cbc3b749898d00cecd",
    measurementId: "G-5Z2VT9RMKG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
};
