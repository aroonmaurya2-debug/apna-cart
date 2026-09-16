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

// Owner login only needs the Firebase Auth configuration. Optional services
// such as Firestore must not be allowed to break Auth initialization.
export const firebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean)

let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseConfigured) {
  try {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(firebaseApp)
  } catch {
    firebaseApp = null
    auth = null
  }

  if (firebaseApp) {
    try {
      db = getFirestore(firebaseApp)
    } catch {
      db = null
    }
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
