import { useState } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  addDoc
} from 'firebase/firestore';
import { app } from '../firebase/config';

const auth = getAuth(app);
const db = getFirestore(app);

export const useRegister = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const register = async ({ isSeller, agencia, logoAgencia }) => {
    try {
      // Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullname,
      });

      let companyId = null;

      if (isSeller) {
        // Crear documento nuevo en companies, con ID auto generado
        const companyRef = await addDoc(collection(db, "companies"), {
          name: agencia,
          logo: logoAgencia
        });

        companyId = companyRef.id;
      }

      // Crear documento en users, con companyId si es seller
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        fullname,
        role: isSeller ? "seller" : "user",
        companyId: companyId ? companyId : null
      });

      setSuccess("Usuario registrado exitosamente.");
      setError(null);
      setFullname('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError("No se pudo registrar. Verificá el email, contraseña o intentá más tarde.");
      setSuccess(null);
      console.error(err);
    }
  };

  return {
    fullname,
    setFullname,
    email,
    setEmail,
    password,
    setPassword,
    error,
    success,
    register,
  };
};
