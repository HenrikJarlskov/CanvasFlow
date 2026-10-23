/**
 * @file AuthContext.tsx
 * @description Context and hook managing Google Authentication state via Firebase Auth.
 * Uses popup login to comply with iframe security and provides reactive user presence.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile document under /users/{userId}
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Collaborator',
              photoURL: currentUser.photoURL || '',
              createdAt: serverTimestamp(),
            });
          } else {
            await updateDoc(userDocRef, {
              displayName: currentUser.displayName || docSnap.data().displayName || 'Collaborator',
              photoURL: currentUser.photoURL || docSnap.data().photoURL || '',
            });
          }
        } catch (e) {
          console.warn('Profile sync skipped or non-blocking:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // Suppress popup-closed-by-user error toast to avoid spamming
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(err?.message || 'Failed to sign in with Google');
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signOut,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || {
    user: null,
    loading: false,
    signInWithGoogle: async () => {},
    signOut: async () => {},
  };
}
