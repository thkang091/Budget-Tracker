import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from "../firebase";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const setupFirestore = async () => {
      try {
        await enableIndexedDbPersistence(db);
        console.log("Firestore offline persistence enabled");
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
          console.warn("The current browser does not support all of the features required to enable persistence");
        }
      }
    };

    setupFirestore();
  }, []);

  async function signup(userData) {
    try {
      console.log('Starting signup in AuthContext...');
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      console.log('User created with Firebase Auth');
      
      await updateProfile(userCredential.user, { displayName: userData.name });
      console.log('User profile updated');
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        name: userData.name,
        email: userData.email,
        hasIncome: userData.hasIncome,
        incomeAmount: userData.hasIncome ? userData.incomeAmount : null,
        incomeFrequency: userData.hasIncome ? userData.incomeFrequency : null,
        twoFactorEnabled: userData.enableTwoFactor,
        twoFactorMethod: userData.enableTwoFactor ? userData.twoFactorMethod : null,
        securityQuestions: userData.securityQuestions,
        notificationPreferences: userData.notificationPreferences
      }, { merge: true });
      console.log('User document created in Firestore');
      
      const newUser = {
        ...userCredential.user,
        hasIncome: userData.hasIncome
      };
      setCurrentUser(newUser);
      
      return newUser;
    } catch (error) {
      console.error("Error in signup:", error);
      throw error;
    }
  }
  
  function sendEmailVerification(user) {
    return user.sendEmailVerification();
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const newUser = {
          ...userCredential.user,
          hasIncome: userData.hasIncome
        };
        setCurrentUser(newUser);
        return newUser;
      } else {
        setCurrentUser(userCredential.user);
        return userCredential.user;
      }
    } catch (error) {
      console.error("Error in login:", error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth).then(() => {
      setCurrentUser(null);
    });
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateUserProfile(data) {
    try {
      if (!currentUser) {
        throw new Error("No user is currently logged in");
      }

      const userDocRef = doc(db, 'users', currentUser.uid);

      if (data.name || data.photoURL) {
        await updateProfile(currentUser, {
          displayName: data.name || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL
        });
      }

      const updateData = {
        username: data.username,
        name: data.name,
        photoURL: data.photoURL,
        hasIncome: data.hasIncome,
        incomeAmount: data.hasIncome ? data.incomeAmount : null,
        incomeFrequency: data.hasIncome ? data.incomeFrequency : null
      };

      await updateDoc(userDocRef, updateData);

      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      const updatedUser = {
        ...currentUser,
        ...userData,
        displayName: data.name || currentUser.displayName,
        photoURL: data.photoURL || currentUser.photoURL
      };

      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      if (isOffline) {
        throw new Error("Cannot log in with Google while offline");
      }

      const result = await signInWithPopup(auth, googleProvider);
      const userDocRef = doc(db, 'users', result.user.uid);
      let userDocSnap;
      
      try {
        userDocSnap = await getDoc(userDocRef);
      } catch (error) {
        console.error("Error fetching user document:", error);
        userDocSnap = { exists: () => false };
      }

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          name: result.user.displayName,
          email: result.user.email,
          hasIncome: false,
          photoURL: result.user.photoURL
        });
      }

      const userData = userDocSnap.exists() ? userDocSnap.data() : { hasIncome: false };
      const newUser = {
        ...result.user,
        hasIncome: userData.hasIncome
      };
      setCurrentUser(newUser);
      return newUser;
    } catch (error) {
      console.error("Error in loginWithGoogle:", error);
      throw error;
    }
  }

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUser({
              ...user,
              hasIncome: userData.hasIncome
            });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    loginWithGoogle,
    sendEmailVerification,
    isOffline
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}