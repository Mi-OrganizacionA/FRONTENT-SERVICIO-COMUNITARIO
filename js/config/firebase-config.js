import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';
import { getStorage, ref, deleteObject } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-functions.js';

// Reemplaza estas credenciales con las de tu proyecto Firebase.
const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_AUTH_DOMAIN',
  projectId: 'TU_PROJECT_ID',
  storageBucket: 'TU_STORAGE_BUCKET',
  messagingSenderId: 'TU_MESSAGING_SENDER_ID',
  appId: 'TU_APP_ID',
  measurementId: 'TU_MEASUREMENT_ID'
};

const app = initializeApp(firebaseConfig);
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