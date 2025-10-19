import React, { useState, useEffect } from "react";
import { FaGlobe } from "react-icons/fa";
import api from "../api";

export default function RegisterUser({ navigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" }); // type: 'success' | 'error'
  const [lang, setLang] = useState("ar"); // 'ar' للغة العربية، 'en' للإنجليزية

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/companies");
        setCompanies(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompanies();
  }, []);

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    try {
      if (!companyId) {
        setToast({ message: lang === "ar" ? "اختر الشركة أولاً" : "Please select a company", type: "error" });
        return;
      }

      await api.post("/register-user", {
        username,
        password,
        role,
        company_id: companyId,
      });

      setToast({ message: lang === "ar" ? "تم تسجيل المستخدم بنجاح 🎉" : "User registered successfully 🎉", type: "success" });
      setTimeout(() => navigate("/login"), 1500); // توجه بعد 1.5 ثانية
    } catch (err) {
      setToast({ message: err.response?.data?.error || (lang === "ar" ? "فشل تسجيل المستخدم" : "User registration failed"), type: "error" });
    }
  };

  const text = {
    title: lang === "ar" ? "تسجيل مستخدم" : "Register User",
    username: lang === "ar" ? "اسم المستخدم" : "Username",
    password: lang === "ar" ? "كلمة المرور" : "Password",
    role: lang === "ar" ? "الدور" : "Role",
    selectCompany: lang === "ar" ? "اختر الشركة" : "Select Company",
    roleUser: lang === "ar" ? "مستخدم" : "User",
    roleAdmin: lang === "ar" ? "مشرف" : "Admin",
    submitBtn: lang === "ar" ? "تسجيل المستخدم" : "Register User",
    loginText: lang === "ar" ? "لديك حساب؟" : "Already have an account?",
    loginLink: lang === "ar" ? "سجل الدخول" : "Login",
    selectCompanyPlaceholder: lang === "ar" ? "-- اختر شركة --" : "-- Select Company --",
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

      <div className="form-group">
        <label>{text.username}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="form-group">
        <label>{text.password}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>{text.role}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">{text.roleUser}</option>
          <option value="admin">{text.roleAdmin}</option>
        </select>
      </div>

      <div className="form-group">
        <label>{text.selectCompany}</label>
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">{text.selectCompanyPlaceholder}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button className="btn save" onClick={handleRegisterUser}>
          {text.submitBtn}
        </button>
      </div>

      <p className="text-center mt-4">
        {text.loginText}{" "}
        <span
          className="text-blue-500 cursor-pointer"
          onClick={() => navigate("/login")}
        >
          {text.loginLink}
        </span>
      </p>
    </div>
  );
}
