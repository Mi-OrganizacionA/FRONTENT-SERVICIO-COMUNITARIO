import { db } from '../config/firebase-config.js';
import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const habitantesCollection = collection(db, 'habitantes');

class HabitantesService {
  async getHabitantes() {
    const snapshot = await getDocs(habitantesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getHabitanteById(id) {
    const ref = doc(db, 'habitantes', id);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  async getHabitanteByCedula(cedula) {
    const q = query(habitantesCollection, where('cedula', '==', cedula));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createHabitante(habitante) {
    const data = {
      ...habitante,
      activo: true,
      createdAt: serverTimestamp()
    };
    const ref = await addDoc(habitantesCollection, data);
    return { id: ref.id, ...data };
  }

  async updateHabitante(id, updates) {
    const ref = doc(db, 'habitantes', id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return this.getHabitanteById(id);
  }

  async softDeleteHabitante(id) {
    const ref = doc(db, 'habitantes', id);
    await updateDoc(ref, { activo: false, deletedAt: serverTimestamp() });
    return this.getHabitanteById(id);
  }
}

export const habitantesService = new HabitantesService();