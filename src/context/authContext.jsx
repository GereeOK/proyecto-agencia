import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
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
        // Traer datos desde Firestore para completar user si hace falta
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData = { ...currentUser };

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            // Si displayName no existe en auth, usar fullname de Firestore
            if (!currentUser.displayName && firestoreData.fullname) {
              userData = {
                ...currentUser,
                displayName: firestoreData.fullname,
              };
            }
          }

          setUser(userData);
        } catch (error) {
          console.error("Error al obtener datos de usuario Firestore:", error);
          setUser(currentUser); // fallback: solo user auth
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
