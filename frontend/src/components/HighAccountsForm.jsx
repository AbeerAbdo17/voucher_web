import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HighAccountsForm.css";

function HighAccountsForm({ lang }) {
  const [mainNo, setMainNo] = useState("");
  const [mainName, setMainName] = useState("");
  const [mainBandNo, setMainBandNo] = useState("");
  const [highAccounts, setHighAccounts] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const fetchHighAccounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/high-accounts");
      setHighAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubAccounts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sub-accounts", { params: { search } });
      setSubAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHighAccounts();
    fetchSubAccounts();
  }, []);

  useEffect(() => {
    fetchSubAccounts();
  }, [search]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const resetForm = () => {
    setMainNo("");
    setMainName("");
    setMainBandNo("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainNo || !mainName || !mainBandNo) return;

    try {
if (editingId) {
  // تحقق من التكرار للـ MAIN_NO
  const duplicate = subAccounts.find(
    (acc) => acc.MAIN_NO === mainNo && acc.ID !== editingId
  );
  if (duplicate) {
    showMessage(lang === "ar" ? "رقم الحساب موجود مسبقاً" : "Account No already exists");
    return;
  }

  await axios.put(`http://localhost:5000/api/sub-accounts/${editingId}`, {
    MAIN_NO: mainNo,
    MAIN_NAME: mainName,
    MAIN_BAND_NO: mainBandNo,
  });

  // تحديث الصف مباشرة في الـ state
  setSubAccounts(prev =>
    prev.map(acc =>
      acc.ID === editingId
        ? {
            ...acc,
            MAIN_NO: mainNo,
            MAIN_NAME: mainName,
            MAIN_BAND_NO: mainBandNo,
            high_account_name: highAccounts.find(h => h.subb_band_no === mainBandNo)?.subbname || ""
          }
        : acc
    )
  );

  showMessage(lang === "ar" ? "تم التعديل بنجاح" : "Updated");
}
 else {
        const res = await axios.post("http://localhost:5000/api/sub-accounts", {
          MAIN_NO: mainNo,
          MAIN_NAME: mainName,
          MAIN_BAND_NO: mainBandNo
        });

        // إضافة الصف الجديد مباشرة
        const highName = highAccounts.find(h => h.subb_band_no === mainBandNo)?.subbname || "";
        setSubAccounts(prev => [...prev, { ID: res.data.id, MAIN_NO: mainNo, MAIN_NAME: mainName, MAIN_BAND_NO: mainBandNo, high_account_name: highName }]);

        showMessage(lang === "ar" ? "تم الحفظ بنجاح" : "Saved");
      }

      resetForm();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  const handleEdit = (acc) => {
    setMainNo(acc.MAIN_NO);
    setMainName(acc.MAIN_NAME);
    setMainBandNo(acc.MAIN_BAND_NO);
    setEditingId(acc.ID);
  };

  const handleDelete = async (mainNo) => {
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/sub-accounts/${mainNo}`);
      setSubAccounts(prev => prev.filter(acc => acc.MAIN_NO !== mainNo));
      showMessage(lang === "ar" ? "تم الحذف" : "Deleted");
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  return (
    <div className="account-container">
      <h2>{lang === "ar" ? "الحسابات العليا" : "High Accounts"}</h2>

      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-group">
          <label>{lang === "ar" ? "الحساب الرئيسي" : "Main Account"}</label>
          <select value={mainBandNo} onChange={(e) => setMainBandNo(e.target.value)} required>
            <option value="">{lang === "ar" ? "اختر الحساب" : "Select High Account"}</option>
            {highAccounts.map(acc => (
              <option key={acc.ID} value={acc.subb_band_no}>{acc.subbname}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{lang === "ar" ? "رقم الحساب الفرعي" : "Sub Account No"}</label>
          <input
            type="text"
            value={mainNo}
            onChange={(e) => setMainNo(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>{lang === "ar" ? "اسم الحساب الفرعي" : "Sub Account Name"}</label>
          <input type="text" value={mainName} onChange={(e) => setMainName(e.target.value)} required />
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
            <th>{lang === "ar" ? "الحساب الأعلى" : "High Account"}</th>
            <th>{lang === "ar" ? "إجراء" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {subAccounts.map(acc => (
            <tr key={acc.ID}>
              <td>{acc.MAIN_NO}</td>
              <td>{acc.MAIN_NAME}</td>
              <td>{acc.high_account_name || ""}</td>
              <td>
                <button className="btn save" onClick={() => handleEdit(acc)}>
                  {lang === "ar" ? "تعديل" : "Edit"}
                </button>
                <button className="btn delete" onClick={() => handleDelete(acc.MAIN_NO)}>
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

export default HighAccountsForm;
