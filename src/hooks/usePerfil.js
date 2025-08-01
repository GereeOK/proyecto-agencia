import { useState, useEffect } from "react";
import { getCompanyByUser, updateCompany } from "../firebase/firestore";

const usePerfil = (user) => {
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [editedName, setEditedName] = useState("");
  const [editedLogo, setEditedLogo] = useState("");
  const [editedTelefono, setEditedTelefono] = useState("");
  const [editedSocial, setEditedSocial] = useState("");

  const [servicesCount, setServicesCount] = useState([]);
  const [reservationsCount, setReservationsCount] = useState([]);

  useEffect(() => {
    const loadCompany = async () => {
      if (user?.role === "seller" && user.companyId) {
        setLoadingCompany(true);
        const company = await getCompanyByUser(user.companyId);
        setCompanyData(company);
        setLoadingCompany(false);
      }
    };
    loadCompany();
  }, [user]);

  const openModal = () => {
    setEditedName(companyData?.name || "");
    setEditedLogo(companyData?.logo || "");
    setEditedTelefono(companyData?.telefono || "");
    setEditedSocial(companyData?.social || "");
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    try {
      await updateCompany(user.companyId, {
        name: editedName,
        logo: editedLogo,
        telefono: editedTelefono,
        social: editedSocial,
      });
      setCompanyData((prev) => ({
        ...prev,
        name: editedName,
        logo: editedLogo,
        telefono: editedTelefono,
        social: editedSocial,
      }));
      setShowModal(false);
    } catch (error) {
      console.error("Error al actualizar empresa:", error);
      alert("No se pudo actualizar la empresa. Intentá más tarde.");
    }
  };

  return {
    companyData,
    loadingCompany,
    showModal,
    editedName,
    editedLogo,
    editedTelefono,
    editedSocial,
    setShowModal,
    setEditedName,
    setEditedLogo,
    setEditedTelefono,
    setEditedSocial,
    openModal,
    handleSaveChanges,
    servicesCount,
    setServicesCount,
    reservationsCount,
    setReservationsCount,
  };
};

export default usePerfil;
