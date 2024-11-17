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

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineError, setOfflineError] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setOfflineError(null);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setOfflineError("You are currently offline. Some features may be unavailable.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function signup(userData) {
    if (isOffline) {
      throw new Error("Cannot sign up while offline. Please check your internet connection.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      await updateProfile(userCredential.user, { displayName: userData.name });
      
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
        notificationPreferences: userData.notificationPreferences,
        isIncomeVerified: userData.hasIncome,
        lastUpdated: new Date().toISOString(),
        offlineAccess: false // New field for offline access control
      });
      
      const newUser = {
        ...userCredential.user,
        hasIncome: userData.hasIncome,
        isIncomeVerified: userData.hasIncome
      };
      setCurrentUser(newUser);
      return newUser;
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error("Cannot complete signup while offline. Please check your internet connection.");
      }
      throw error;
    }
  }

  async function login(email, password) {
    if (isOffline) {
      throw new Error("Cannot log in while offline. Please check your internet connection.");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const newUser = {
          ...userCredential.user,
          hasIncome: userData.hasIncome,
          isIncomeVerified: userData.isIncomeVerified,
          offlineAccess: userData.offlineAccess || false
        };
        setCurrentUser(newUser);
        return newUser;
      } else {
        setCurrentUser(userCredential.user);
        return userCredential.user;
      }
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error("Cannot complete login while offline. Please check your internet connection.");
      }
      throw error;
    }
  }

  async function loginWithGoogle() {
    if (isOffline) {
      throw new Error("Cannot log in with Google while offline. Please check your internet connection and try again.");
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDocRef = doc(db, 'users', result.user.uid);
      
      try {
        let userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            name: result.user.displayName,
            email: result.user.email,
            hasIncome: false,
            isIncomeVerified: false,
            photoURL: result.user.photoURL,
            offlineAccess: false,
            lastUpdated: new Date().toISOString()
          });
          userDocSnap = await getDoc(userDocRef);
        }

        const userData = userDocSnap.data();
        const newUser = {
          ...result.user,
          hasIncome: userData.hasIncome,
          isIncomeVerified: userData.isIncomeVerified,
          offlineAccess: userData.offlineAccess || false
        };
        
        setCurrentUser(newUser);
        return newUser;
      } catch (firestoreError) {
        console.error("Firestore error during Google login:", firestoreError);
        // Still allow login but with limited data if Firestore fails
        setCurrentUser(result.user);
        return result.user;
      }
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error("Cannot complete Google login while offline. Please check your internet connection.");
      }
      throw error;
    }
  }


  async function updateIncomeInfo(hasIncome, incomeAmount, incomeFrequency) {
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const updateData = {
      hasIncome,
      incomeAmount: hasIncome ? incomeAmount : null,
      incomeFrequency: hasIncome ? incomeFrequency : null,
      isIncomeVerified: hasIncome
    };

    await updateDoc(userDocRef, updateData);

    const updatedUser = {
      ...currentUser,
      ...updateData
    };

    setCurrentUser(updatedUser);
    return updatedUser;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            ...user,
            hasIncome: userData.hasIncome,
            isIncomeVerified: userData.isIncomeVerified
          });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return unsubscribe;
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
    isOffline,
    offlineError,
    updateIncomeInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
