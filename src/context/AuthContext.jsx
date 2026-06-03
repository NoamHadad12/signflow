import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Create the context object — components consume this via useAuth()
const AuthContext = createContext(null);

// Custom hook for easy access to the auth context from any component
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // currentUser: the Firebase user object (with uid), or null if not signed in
  // userProfile: firstName + lastName fetched from the users Firestore collection
  // loading: true while Firebase resolves the initial auth state on page load
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', status: 'pending', role: 'user' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires immediately with the current user, then again
    // every time the user signs in or out. Returns an unsubscribe function.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Show loader while fetching user data to prevent "Account Pending" flash
        setLoading(true);
      }
      setCurrentUser(user);
      
      let userUnsubscribe = null;

      if (user) {
        try {
          userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile({ 
                firstName: data.firstName || '', 
                lastName: data.lastName || '', 
                status: data.status || 'pending', 
                role: data.role || 'user',
                uploadCount: data.uploadCount || 0,
                isBlocked: data.isBlocked || false,
                subscriptionEnd: data.subscriptionEnd || null
              });
            } else {
              setUserProfile({ firstName: '', lastName: '', status: 'pending', role: 'user', uploadCount: 0, isBlocked: false, subscriptionEnd: null });
            }
          });
        } catch {
          setUserProfile({ firstName: '', lastName: '', status: 'pending', role: 'user', uploadCount: 0, isBlocked: false, subscriptionEnd: null });
        }
      } else {
        setUserProfile({ firstName: '', lastName: '', status: 'pending', role: 'user', uploadCount: 0, isBlocked: false, subscriptionEnd: null });
      }
      setLoading(false);

      // Clean up the user profile listener when auth state changes or unmounts
      return () => {
        if (userUnsubscribe) userUnsubscribe();
      };
    });

    // Clean up the auth listener when the component unmounts
    return unsubscribe;
  }, []);

  // Sign in with email and password
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Register a new account with email and password
  const signup = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  // Sign the current user out of Firebase
  const logout = () => signOut(auth);

  const value = { currentUser, userProfile, login, signup, logout, loading };

  // Render a loading spinner until Firebase resolves the initial auth state.
  // This prevents a flash of the login page when the user refreshes while logged in.
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f6f3',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <style>{`
            .auth-spinner {
              width: 36px; height: 36px;
              border: 3px solid #e5e5e0;
              border-top-color: #9e7d52;
              border-radius: 50%;
              animation: auth-spin 0.8s linear infinite;
            }
            @keyframes auth-spin { to { transform: rotate(360deg); } }
          `}</style>
          <div className="auth-spinner" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
