import React, { useState } from "react";
import { FaGlobe } from "react-icons/fa";
import api from "../api";

export default function RegisterCompany({ navigate }) {
  const [company, setCompany] = useState({
    name: "",
    location: "",
    tel: "",
    email: "",
    taxid: "",
  });
  const [toast, setToast] = useState({ message: "", type: "" }); // type: 'success' | 'error'
  const [lang, setLang] = useState("ar"); // 'ar' للغة العربية، 'en' للإنجليزية

  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    try {
      if (!company.name.trim()) {
        setToast({ message: lang === "ar" ? "اسم الشركة مطلوب" : "Company name is required", type: "error" });
        return;
      }

      await api.post("/register-company", company);

      setToast({ message: lang === "ar" ? "تم تسجيل الشركة بنجاح 🎉" : "Company registered successfully 🎉", type: "success" });
      setTimeout(() => navigate("/login"), 1500); // توجه بعد 1.5 ثانية
    } catch (err) {
      setToast({ message: err.response?.data?.error || (lang === "ar" ? "فشل تسجيل الشركة" : "Company registration failed"), type: "error" });
    }
  };

  const text = {
    title: lang === "ar" ? "تسجيل شركة" : "Register Company",
    name: lang === "ar" ? "اسم الشركة" : "Company Name",
    location: lang === "ar" ? "الموقع" : "Location",
    tel: lang === "ar" ? "الهاتف" : "Phone",
    email: lang === "ar" ? "الإيميل" : "Email",
    taxid: lang === "ar" ? "الرقم الضريبي" : "Tax ID",
    namePlaceholder: lang === "ar" ? "أدخل اسم الشركة" : "Enter company name",
    locationPlaceholder: lang === "ar" ? "أدخل الموقع" : "Enter location",
    telPlaceholder: lang === "ar" ? "أدخل رقم الهاتف" : "Enter phone number",
    emailPlaceholder: lang === "ar" ? "أدخل البريد الإلكتروني" : "Enter email",
    taxidPlaceholder: lang === "ar" ? "أدخل الرقم الضريبي" : "Enter tax ID",
    submitBtn: lang === "ar" ? "تسجيل الشركة" : "Register Company",
    loginText: lang === "ar" ? "لديك حساب؟" : "Already have an account?",
    loginLink: lang === "ar" ? "سجل الدخول" : "Login",
  };

  return (
    <div className="voucher-container" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* أيقونة تبديل اللغة */}
      <div style={{ textAlign: lang === "ar" ? "left" : "right", marginBottom: "15px" }}>
        <button
          className="btn"
          style={{ padding: "5px 10px", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        >
          <FaGlobe />
        </button>
      </div>

      <h2 style={{ textAlign: "center" }}>{text.title}</h2>

      {/* Toast message */}
      {toast.message && <p className={`toast ${toast.type}`}>{toast.message}</p>}

      <form onSubmit={handleRegisterCompany} className="form-header">
        <div className="form-group">
          <label>{text.name}</label>
          <input
            placeholder={text.namePlaceholder}
            value={company.name}
            onChange={(e) => setCompany({ ...company, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>{text.location}</label>
          <input
            placeholder={text.locationPlaceholder}
            value={company.location}
            onChange={(e) => setCompany({ ...company, location: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>{text.tel}</label>
          <input
            placeholder={text.telPlaceholder}
            value={company.tel}
            onChange={(e) => setCompany({ ...company, tel: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>{text.email}</label>
          <input
            placeholder={text.emailPlaceholder}
            value={company.email}
            onChange={(e) => setCompany({ ...company, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>{text.taxid}</label>
          <input
            placeholder={text.taxidPlaceholder}
            value={company.taxid}
            onChange={(e) => setCompany({ ...company, taxid: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn save">{text.submitBtn}</button>
        </div>
      </form>

      <p className="text-center mt-4">
        {text.loginText}{" "}
        <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/login")}>
          {text.loginLink}
        </span>
      </p>
    </div>
  );
}
