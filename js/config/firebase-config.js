import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js';

// Reemplaza estas credenciales con las de tu proyecto Firebase.
// Import the functions you need from the SDKs you need

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAype1QNZjlLF1KbzyktE8ekeTtBdixd70",
  authDomain: "sicag-oficial.firebaseapp.com",
  projectId: "sicag-oficial",
  storageBucket: "sicag-oficial.firebasestorage.app",
  messagingSenderId: "335229572111",
  appId: "1:335229572111:web:13275dc759ed749754ff7a"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

// Inicializar App Check (Seguridad)
// NOTA: Reemplaza 'TU_RECAPTCHA_SITE_KEY' por la llave pública (Site Key) de reCAPTCHA v3
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LffLC4tAAAAABDk9hvaE8FnFHpiH4qX5etp7HYT'),
  isTokenAutoRefreshEnabled: true
});

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export const eliminarImagenFirebase = async (url) => {
  if (!url || !url.includes('firebasestorage')) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    console.log('Imagen eliminada de Firebase Storage:', url);
  } catch (error) {
    console.error('Error al eliminar imagen de Firebase Storage:', error);
  }
};

export { app, auth, db, storage, functions };