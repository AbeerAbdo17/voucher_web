import React, { useState, useEffect } from "react";
import VoucherForm from "./components/VoucherForm";
import Sidebar from "./components/Sidebar";
import AccountsForm from "./components/AccountsForm";
import HighAccounts  from "./components/HighAccountsForm";

function App() {
  const [lang, setLang] = useState("ar");

  // تغيير اتجاه الصفحة مع اللغة
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // صفحة واحدة الآن لكن نقدر نوسع بعدين
  const [page, setPage] = useState("voucher");
  

  const navigate = (path) => {
    if (path === "/") setPage("voucher");
    if (path === "/accounts") setPage("accounts");
    if (path === "/HighAccounts") setPage("HighAccounts");
    // هنا تضيف صفحات تانية
  };

  return (
    <div className="flex">
      {/* سايدبار */}
      <Sidebar
        lang={lang}
        setLang={setLang}
        currentPage={page}
        navigate={navigate}
      />

      {/* المحتوى الأساسي */}
      <div
        className={`flex-1 p-6 ${
          lang === "ar" ? "mr-[60px] md:mr-[220px]" : "ml-[60px] md:ml-[220px]"
        }`}
      >
        {page === "voucher" && <VoucherForm lang={lang} />}
        {page === "accounts" && <AccountsForm lang={lang} />} 
        {page === "HighAccounts" && <HighAccounts lang={lang} />}
        
      </div>
    </div>
  );
}

export default App;
