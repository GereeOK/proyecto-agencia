import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase/config";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "",
            role: "user", // default
            companyId: null,
            logo: null,
          };

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();

            userData = {
              ...userData,
              displayName: firestoreData.fullname || currentUser.displayName || "",
              role: firestoreData.role || "user",
              companyId: firestoreData.companyId || null,
              logo: firestoreData.logo || null,
            };
          }

          setUser(userData);
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "",
            role: "user",
            companyId: null,
            logo: null,
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
