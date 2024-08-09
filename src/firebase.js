import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, enableNetwork, disableNetwork } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCyqLACeiApjF7sl-_ZKbbhbed2lRWE3yM",
    authDomain: "budgettracking-73e00.firebaseapp.com",
    projectId: "budgettracking-73e00",
    storageBucket: "budgettracking-73e00.appspot.com",
    messagingSenderId: "786614014929",
    appId: "1:786614014929:web:d895260699f5ec75d886f0",
    measurementId: "G-GZX9WMZZPN"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const githubProvider = new GithubAuthProvider();

// Initialize analytics only if in browser environment and analytics is available
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    analytics = getAnalytics(app);
}

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.log('Persistence is not available in this browser');
    }
});

// Handle connection state
function handleConnectionChange() {
    if (navigator.onLine) {
        enableNetwork(db).then(() => {
            console.log("Network connection restored");
        });
    } else {
        disableNetwork(db).then(() => {
            console.log("Network connection lost");
        });
    }
}

// Add event listeners for online/offline events
if (typeof window !== 'undefined') {
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    handleConnectionChange(); // Set the initial state
}

export { 
    app, 
    auth, 
    db, 
    storage, 
    analytics, 
    googleProvider, 
    facebookProvider, 
    githubProvider 
};
