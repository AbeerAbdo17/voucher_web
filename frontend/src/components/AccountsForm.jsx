import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AccountsForm.css";

function AccountsForm({ lang }) {
  const [accNo, setAccNo] = useState("");
  const [accName, setAccName] = useState("");
  const [mainNo, setMainNo] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [mainAccounts, setMainAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  // جلب الحسابات الفرعية
  const fetchAccounts = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/accounts/all?search=${search}`
      );
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // جلب الحسابات الرئيسية
  const fetchMainAccounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/main-accounts");
      setMainAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchMainAccounts();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const resetForm = () => {
    setAccNo("");
    setAccName("");
    setMainNo("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accNo || !accName || !mainNo) return;

    // التحقق من التكرار
    const duplicate = accounts.find(
      (acc) => acc.SUBMAIN_NO === accNo && acc.SUBMAIN_NO !== editingId
    );
    if (duplicate) {
      showMessage(lang === "ar" ? "رقم الحساب موجود مسبقاً" : "Account No already exists");
      return;
    }

    try {
      if (editingId) {
        // تعديل الحساب
        await axios.put(`http://localhost:5000/api/accounts/${editingId}`, {
          accNo,
          accName,
          mainNo,
        });

        setAccounts(prev =>
          prev.map(acc =>
            acc.SUBMAIN_NO === editingId
              ? { ...acc, SUBMAIN_NO: accNo, SUBMAIN_NAME: accName, SUBMAIN_MAIN_NO: mainNo, MAIN_NAME: mainAccounts.find(m => m.MAIN_NO === mainNo)?.MAIN_NAME || "" }
              : acc
          )
        );

        showMessage(lang === "ar" ? "تم التعديل بنجاح" : "Updated");
      } else {
        // إضافة حساب جديد
        const res = await axios.post("http://localhost:5000/api/accounts", {
          accNo,
          accName,
          mainNo,
        });

        const mainName = mainAccounts.find(m => m.MAIN_NO === mainNo)?.MAIN_NAME || "";
        setAccounts(prev => [
          ...prev,
          { SUBMAIN_NO: accNo, SUBMAIN_NAME: accName, SUBMAIN_MAIN_NO: mainNo, MAIN_NAME: mainName }
        ]);

        showMessage(lang === "ar" ? "تم الحفظ بنجاح" : "Saved");
      }

      resetForm();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  const handleEdit = (acc) => {
    setAccNo(acc.SUBMAIN_NO);
    setAccName(acc.SUBMAIN_NAME);
    setMainNo(acc.SUBMAIN_MAIN_NO);
    setEditingId(acc.SUBMAIN_NO);
  };

  const handleDelete = async (accNo) => {
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/accounts/${accNo}`);
      setAccounts(prev => prev.filter(acc => acc.SUBMAIN_NO !== accNo));
      showMessage(lang === "ar" ? "تم الحذف" : "Deleted");
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  return (
    <div className="account-container">
      <h2>{lang === "ar" ? "الحسابات" : "Accounts"}</h2>

      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-group">
          <label>{lang === "ar" ? "الحساب الرئيسي" : "Main Account"}</label>
          <select value={mainNo} onChange={(e) => setMainNo(e.target.value)} required>
            <option value="">{lang === "ar" ? " اختر الحساب " : "Select  High Sub Accounts"}</option>
            {mainAccounts.map((acc) => (
              <option key={acc.MAIN_NO} value={acc.MAIN_NO}>
                {acc.MAIN_NO} - {acc.MAIN_NAME}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{lang === "ar" ? "رقم الحساب الفرعي" : "Sub Account No"}</label>
          <input
            type="text"
            value={accNo}
            onChange={(e) => setAccNo(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>{lang === "ar" ? "اسم الحساب الفرعي" : "Sub Account Name"}</label>
          <input
            type="text"
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
            required
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn save">
            {editingId ? (lang === "ar" ? "تعديل" : "Update") : (lang === "ar" ? "حفظ" : "Save")}
          </button>
          {editingId && (
            <button type="button" className="btn cancel" onClick={resetForm}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          )}
        </div>
      </form>

      {message && <div className="toast success">{message}</div>}

      <div className="form-header">
        <div className="form-group">
          <label>{lang === "ar" ? "بحث..." : "Search..."}</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <table className="accounts-table">
        <thead>
          <tr>
            <th>{lang === "ar" ? "رقم الحساب" : "Account No"}</th>
            <th>{lang === "ar" ? "اسم الحساب" : "Account Name"}</th>
            <th>{lang === "ar" ? "الحساب الرئيسي" : "Main Account"}</th>
            <th>{lang === "ar" ? "إجراء" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc, index) => (
            <tr key={`${acc.SUBMAIN_NO}-${index}`}>
              <td>{acc.SUBMAIN_NO}</td>
              <td>{acc.SUBMAIN_NAME}</td>
              <td>{acc.MAIN_NAME || acc.SUBMAIN_MAIN_NO}</td>
              <td>
                <button className="btn save" onClick={() => handleEdit(acc)}>
                  {lang === "ar" ? "تعديل" : "Edit"}
                </button>
                <button className="btn delete" onClick={() => handleDelete(acc.SUBMAIN_NO)}>
                  {lang === "ar" ? "حذف" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsForm;
