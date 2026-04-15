import { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  addDoc,
} from "firebase/firestore";
import { app } from "../firebase/config";

const auth = getAuth(app);
const db = getFirestore(app);

// MEJORA (RF-02 – Registro + RNF-03 – Seguridad): Se agregan validaciones
// del lado del cliente antes de llamar a Firebase, para cumplir con
// RNF-03: "Validación de formularios en cliente y servidor."
// También se mejoran los mensajes de error según el código Firebase.

export const useRegister = () => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // MEJORA: Validación en cliente antes de llamar a Firebase
  const validar = ({ isSeller, agencia }) => {
    if (!fullname.trim()) return "El nombre completo es obligatorio.";
    if (!email.trim()) return "El email es obligatorio.";
    if (!/\S+@\S+\.\S+/.test(email)) return "El email no tiene un formato válido.";
    if (password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres.";
    if (isSeller && !agencia?.trim())
      return "El nombre de la agencia es obligatorio para sellers.";
    return null;
  };

  const register = async ({ isSeller, agencia, logoAgencia }) => {
    setError(null);
    setSuccess(null);

    const errorValidacion = validar({ isSeller, agencia });
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullname });

      let companyId = null;

      if (isSeller) {
        const companyRef = await addDoc(collection(db, "companies"), {
          name: agencia,
          logo: logoAgencia || "",
        });
        companyId = companyRef.id;
      }

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        fullname,
        role: isSeller ? "seller" : "user",
        companyId: companyId || null,
        // MEJORA: Se registra el campo "activo" desde el inicio para consistencia
        // con la función desactivarUsuario() que lo usa en Usuarios.jsx.
        activo: true,
      });

      setSuccess("Usuario registrado exitosamente. Ya podés iniciar sesión.");
      setFullname("");
      setEmail("");
      setPassword("");
    } catch (err) {
      // MEJORA: Mensajes de error específicos según el código de Firebase
      // en lugar de un mensaje genérico para todos los errores.
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Ya existe una cuenta con ese email.");
          break;
        case "auth/invalid-email":
          setError("El email ingresado no es válido.");
          break;
        case "auth/weak-password":
          setError("La contraseña es demasiado débil. Usá al menos 6 caracteres.");
          break;
        default:
          setError("No se pudo registrar. Intentá más tarde.");
      }
      console.error(err);
    } finally {
      setLoading(false);
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
    loading,
    register,
  };
};
