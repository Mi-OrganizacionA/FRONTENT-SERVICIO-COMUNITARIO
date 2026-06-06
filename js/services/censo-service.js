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

const censosCollection = collection(db, 'censos');

class CensoService {
  async getCensos() {
    const snapshot = await getDocs(censosCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getCensoById(id) {
    const ref = doc(db, 'censos', id);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  async searchCensosByComuna(codigoComuna) {
    const q = query(censosCollection, where('codigo_comuna', '==', codigoComuna));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createCenso(censo) {
    const ref = await addDoc(censosCollection, {
      ...censo,
      createdAt: serverTimestamp()
    });
    return { id: ref.id, ...censo };
  }

  async updateCenso(id, updates) {
    const ref = doc(db, 'censos', id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return this.getCensoById(id);
  }

  async deleteCenso(id) {
    const ref = doc(db, 'censos', id);
    await updateDoc(ref, { eliminado: true, deletedAt: serverTimestamp() });
    return { id };
  }
}

export const censoService = new CensoService();