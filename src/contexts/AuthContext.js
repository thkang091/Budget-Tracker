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

  async function signup(userData) {
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
      isIncomeVerified: userData.hasIncome
    });
    
    const newUser = {
      ...userCredential.user,
      hasIncome: userData.hasIncome,
      isIncomeVerified: userData.hasIncome
    };
    setCurrentUser(newUser);
    return newUser;
  }

  function sendEmailVerification(user) {
    return user.sendEmailVerification();
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const newUser = {
        ...userCredential.user,
        hasIncome: userData.hasIncome,
        isIncomeVerified: userData.isIncomeVerified
      };
      setCurrentUser(newUser);
      return newUser;
    } else {
      setCurrentUser(userCredential.user);
      return userCredential.user;
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
      incomeFrequency: data.hasIncome ? data.incomeFrequency : null,
      isIncomeVerified: data.hasIncome
    };

    await updateDoc(userDocRef, updateData);

    const updatedUser = {
      ...currentUser,
      ...updateData,
      displayName: data.name || currentUser.displayName,
      photoURL: data.photoURL || currentUser.photoURL
    };

    setCurrentUser(updatedUser);
    return updatedUser;
  }

  async function loginWithGoogle() {
    if (isOffline) {
      throw new Error("Cannot log in with Google while offline");
    }

    const result = await signInWithPopup(auth, googleProvider);
    const userDocRef = doc(db, 'users', result.user.uid);
    let userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        name: result.user.displayName,
        email: result.user.email,
        hasIncome: false,
        isIncomeVerified: false,
        photoURL: result.user.photoURL
      });
      userDocSnap = await getDoc(userDocRef);
    }

    const userData = userDocSnap.data();
    const newUser = {
      ...result.user,
      hasIncome: userData.hasIncome,
      isIncomeVerified: userData.isIncomeVerified
    };
    
    setCurrentUser(newUser);
    return newUser;
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
    updateIncomeInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
