import { useState, useEffect } from 'react';
import { FaBars, FaSignOutAlt, FaBook } from "react-icons/fa"; // أيقونات
import "./Sidebar.css";
import { FaUsers, FaLayerGroup } from "react-icons/fa";


function Sidebar({ lang, setLang, navigate }) {
  const [open, setOpen] = useState(true);

  // تبديل اللغة
  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // تسجيل الخروج
  const handleLogout = () => {
    alert(lang === "ar" ? "تم تسجيل الخروج" : "Logged out");
    setOpen(false); // يغلق السايد بار بعد تسجيل الخروج
  };

  // الانتقال إلى صفحة
  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false); // يغلق السايد بار تلقائيًا بعد اختيار صفحة
  };

  return (
    <div
      className={`sidebar ${open ? "open" : "collapsed"}`}
      style={{ [lang === "ar" ? "right" : "left"]: 0 }}
    >
      {/* زر الفتح/القفل */}
      <div className="toggle-btn" onClick={() => setOpen(!open)}>
        <FaBars size={20} />
      </div>

      {/* القائمة */}
      <ul className="menu">
        <li onClick={toggleLanguage}>
          🌐 <span>{lang === "ar" ? "English" : "عربي"}</span>
        </li>
        <li onClick={() => handleNavigate("/")}>
         <FaBook /> <span>{lang === "ar" ? "قيد اليومية" : "Journal Entry"}</span>
        </li>
        <li onClick={() => handleNavigate("/accounts")}>
         <FaUsers /> <span>{lang === "ar" ? "الحسابات" : "Accounts"}</span>
        </li> 
        <li onClick={() => handleNavigate("/HighAccounts")}>
         <FaLayerGroup /> <span>{lang === "ar" ? " الحسابات العليا" : "High Accounts"}</span>
        </li>
        <li onClick={handleLogout}>
          <FaSignOutAlt /> <span>{lang === "ar" ? "تسجيل خروج" : "Logout"}</span>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
