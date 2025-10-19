import { useState, useEffect } from "react";
import {
  FaBars,
  FaSignOutAlt,
  FaBook,
  FaWallet,
  FaLayerGroup,
  FaBoxes,
  FaGlobe,
  FaUsersCog,
} from "react-icons/fa";
import "./style/Sidebar.css";

function Sidebar({ lang, setLang, navigate }) {
  const [open, setOpen] = useState(true);
  const [screens, setScreens] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showReports, setShowReports] = useState(false);

  // 🔹 تحميل البيانات من localStorage
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const allowedScreens = JSON.parse(localStorage.getItem("screens") || "[]");
    console.log("✅ Loaded screens from localStorage:", allowedScreens);
    setIsAdmin(role === "admin");
    setScreens(allowedScreens);
  }, []);

  // 🔹 التقارير المتاحة
  const availableReports = [
    { key: "balanceSheet", name: lang === "ar" ? "الميزانية العمومية" : "Balance Sheet" },
    // { key: "journalReport", name: lang === "ar" ? "تقرير اليومية" : "Journal Report" },
    // { key: "profitLoss", name: lang === "ar" ? "قائمة الأرباح والخسائر" : "Profit & Loss" },
    
  ];

  // 🔹 تبديل اللغة
  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // 🔹 تسجيل الخروج
  const handleLogout = () => {
    alert(lang === "ar" ? "تم تسجيل الخروج" : "Logged out");
    localStorage.clear();
    navigate("/login");
  };

  // 🔹 الانتقال إلى صفحة (فقط المسموح بها)
  const handleNavigate = (path, screenKey) => {
    if (!isAdmin && !screens.includes(screenKey)) {
      alert(lang === "ar" ? "ليس لديك صلاحية لهذه الصفحة" : "Access denied");
      return;
    }
    navigate(path);
    setOpen(false);
  };

  // 🔹 الترجمات
  const t = {
    ar: {
      journal: "قيد اليومية",
      accounts: "الحسابات",
      highAccounts: "الحسابات الفرعية",
      highBands: "الحسابات العليا",
      users: "إدارة المستخدمين",
      reports: "التقارير",
      logout: "تسجيل خروج",
      langSwitch: "English",
    },
    en: {
      journal: "Journal Entry",
      accounts: "Accounts",
      highAccounts: "High Sub Accounts",
      highBands: "High Accounts",
      users: "Manage Users",
      reports: "Reports",
      logout: "Logout",
      langSwitch: "عربي",
    },
  }[lang];

  return (
    <div
      className={`sidebar ${open ? "open" : "collapsed"}`}
      style={{ [lang === "ar" ? "right" : "left"]: 0 }}
    >
      <div className="toggle-btn" onClick={() => setOpen(!open)}>
        <FaBars size={20} />
      </div>

      <ul className="menu">
        {/* 🔹 اللغة */}
        <li onClick={toggleLanguage}>
          <FaGlobe /> <span>{t.langSwitch}</span>
        </li>

        {/* 🔹 صفحة إدارة المستخدمين */}
        {(isAdmin || screens.includes("Users")) && (
          <li onClick={() => handleNavigate("/admin-users", "Users")}>
            <FaUsersCog /> <span>{t.users}</span>
          </li>
        )}

        {/* 🔹 قيد اليومية */}
        {screens.includes("Journal") && (
          <li onClick={() => handleNavigate("/voucher", "Journal")}>
            <FaBook /> <span>{t.journal}</span>
          </li>
        )}

        {/* 🔹 الحسابات */}
        {screens.includes("AccountsBase") && (
          <li onClick={() => handleNavigate("/accounts", "AccountsBase")}>
            <FaWallet /> <span>{t.accounts}</span>
          </li>
        )}

        {/* 🔹 الحسابات الفرعية */}
        {screens.includes("AccountsHigh") && (
          <li onClick={() => handleNavigate("/HighAccounts", "AccountsHigh")}>
            <FaLayerGroup /> <span>{t.highAccounts}</span>
          </li>
        )}

        {/* 🔹 الحسابات العليا */}
        {screens.includes("AccountsBands") && (
          <li onClick={() => handleNavigate("/HighBands", "AccountsBands")}>
            <FaBoxes /> <span>{t.highBands}</span>
          </li>
        )}

        {/* 🔹 التقارير */}
        {screens.includes("Reports") && (
          <li className="submenu">
            <span onClick={() => setShowReports(!showReports)}>
              <FaBook /> <span>{t.reports}</span>
            </span>
            {showReports && (
              <ul className="submenu-items">
                {availableReports.map((r) => (
                  <li
                    key={r.key}
                    onClick={() => handleNavigate(`/report/${r.key}`, "Reports")}
                  >
                    {r.name}
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}

        {/* 🔹 تسجيل الخروج */}
        <li onClick={handleLogout}>
          <FaSignOutAlt /> <span>{t.logout}</span>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
