import { db } from '../config/firebase-config.js';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const produccionCollection = collection(db, 'produccion_agricola');

class ProduccionService {
  async getProducciones() {
    const snapshot = await getDocs(produccionCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getProduccionesByHabitante(habitanteId) {
    const q = query(produccionCollection, where('habitante_id', '==', habitanteId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createProduccion(produccion) {
    const ref = await addDoc(produccionCollection, {
      ...produccion,
      createdAt: serverTimestamp()
    });
    return { id: ref.id, ...produccion };
  }

  async updateProduccion(id, updates) {
    const ref = doc(db, 'produccion_agricola', id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return this.getProduccionById(id);
  }

  async getProduccionById(id) {
    const ref = doc(db, 'produccion_agricola', id);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  async deleteProduccion(id) {
    const ref = doc(db, 'produccion_agricola', id);
    await updateDoc(ref, { eliminado: true, deletedAt: serverTimestamp() });
    return this.getProduccionById(id);
  }
}

export const produccionService = new ProduccionService();