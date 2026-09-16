import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean)

let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseConfigured) {
  try {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(firebaseApp)
    db = getFirestore(firebaseApp)
  } catch {
    // Keep the Owner App usable enough to show its login/error screen even
    // when a deployment contains an invalid or incomplete Firebase config.
    firebaseApp = null
    auth = null
    db = null
  }
}

export { firebaseApp, auth, db }

export const authPersistence = auth
  ? setPersistence(auth, browserLocalPersistence).catch(() => undefined)
  : Promise.resolve()

export const requireFirebase = () => {
  if (!auth || !db) throw new Error('Firebase is not configured correctly in this deployment. Check the VITE_FIREBASE_* values.')
  return { auth, db }
}
