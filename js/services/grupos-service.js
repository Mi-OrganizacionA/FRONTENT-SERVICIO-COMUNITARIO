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

const gruposCollection = collection(db, 'organizaciones_sociales');
const miembrosCollection = collection(db, 'persona_grupo_social');

class GruposService {
  async getGrupos() {
    const snapshot = await getDocs(gruposCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getGrupoById(id) {
    const ref = doc(db, 'organizaciones_sociales', id);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  async createGrupo(grupo) {
    const ref = await addDoc(gruposCollection, {
      ...grupo,
      createdAt: serverTimestamp()
    });
    return { id: ref.id, ...grupo };
  }

  async updateGrupo(id, updates) {
    const ref = doc(db, 'organizaciones_sociales', id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return this.getGrupoById(id);
  }

  async getMiembrosByOrganizacion(organizacionId) {
    const q = query(miembrosCollection, where('id_organizacion', '==', organizacionId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addMiembro(miembro) {
    const ref = await addDoc(miembrosCollection, {
      ...miembro,
      createdAt: serverTimestamp()
    });
    return { id: ref.id, ...miembro };
  }

  async removeMiembro(id) {
    const ref = doc(db, 'persona_grupo_social', id);
    await updateDoc(ref, { eliminado: true, deletedAt: serverTimestamp() });
    return { id };
  }
}

export const gruposService = new GruposService();