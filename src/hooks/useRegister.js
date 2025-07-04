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

  const register = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullname,
      });

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        fullname,
        role: "user",
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
