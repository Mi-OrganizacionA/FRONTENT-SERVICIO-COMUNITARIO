import { auth } from '../config/firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';

class AuthService {
  constructor(authInstance) {
    this.auth = authInstance;
  }

  async login(email, password) {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    return credential.user;
  }

  async register(email, password, profile = {}) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (profile.displayName || profile.photoURL) {
      await updateProfile(credential.user, profile);
    }
    return credential.user;
  }

  async logout() {
    await signOut(this.auth);
  }

  onAuthChange(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  async resetPassword(email) {
    await sendPasswordResetEmail(this.auth, email);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }
}

export const authService = new AuthService(auth);