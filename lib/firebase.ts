
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  Auth,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc,
  setDoc,
  orderBy, 
  writeBatch,
  enableNetwork,
  disableNetwork,
  enableMultiTabIndexedDbPersistence,
  Firestore,
  clearIndexedDbPersistence,
  terminate,
  waitForPendingWrites
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBgVx4Fw9PpB8xLladNPCVbv7JKZJ01fQM',
  authDomain: 'edumemo7.firebaseapp.com',
  projectId: 'edumemo7',
  storageBucket: 'edumemo7.firebasestorage.app',
  messagingSenderId: '348298535593',
  appId: '1:348298535593:web:e09681f27515d499ea7fb8'
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  
  setPersistence(auth, browserLocalPersistence).catch(e => console.error("Persistence Error", e));

  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("멀티탭 세션 충돌");
      }
    });
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { auth, db };
export { 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc,
  setDoc,
  orderBy, 
  writeBatch,
  enableNetwork,
  disableNetwork,
  clearIndexedDbPersistence,
  terminate,
  waitForPendingWrites,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
};
