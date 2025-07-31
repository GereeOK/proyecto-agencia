import { useState } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullname,
      });

      const role = isSeller ? "seller" : "user";

      const userData = {
        email: user.email,
        fullname,
        role,
      };

      if (isSeller) {
        userData.agencia = agencia;
        userData.logoAgencia = logoAgencia;
      }

      // Crear el documento en la colección "users"
      await setDoc(doc(db, "users", user.uid), userData);

      // Si es seller, también crear en "companies"
      if (isSeller) {
        await setDoc(doc(db, "companies", user.uid), {
          name: agencia,
          logo: logoAgencia
        });
      }

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
