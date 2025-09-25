import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AccountsForm.css";

function AccountsForm({ lang }) {
  const [accNo, setAccNo] = useState("");
  const [accName, setAccName] = useState("");
  const [mainNo, setMainNo] = useState("");
  const [message, setMessage] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [mainAccounts, setMainAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  // جلب الحسابات الفرعية
  const fetchAccounts = async (query = "") => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/accounts/all?search=${query}`
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
    fetchAccounts(search);
  }, [search]);

  useEffect(() => {
    fetchMainAccounts();
  }, []);

  // إظهار الرسالة مع مؤقت
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // حفظ أو تعديل
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`http://localhost:5000/api/accounts/${editing}`, {
          accName,
          mainNo,
        });
        showMessage(lang === "ar" ? "تم التعديل بنجاح " : "Account updated ");
      } else {
        await axios.post("http://localhost:5000/api/accounts", {
          accNo,
          accName,
          mainNo,
        });
        showMessage(lang === "ar" ? "تم الحفظ بنجاح " : "Account saved ");
      }
      setAccNo("");
      setAccName("");
      setMainNo("");
      setEditing(null);
      fetchAccounts();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error saving account ");
    }
  };

  const handleEdit = (acc) => {
    setAccNo(acc.SUBMAIN_NO);
    setAccName(acc.SUBMAIN_NAME);
    setMainNo(acc.SUBMAIN_MAIN_NO);
    setEditing(acc.SUBMAIN_NO);
  };

  const handleDelete = async (accNo) => {
    if (
      !window.confirm(
        lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure to delete?"
      )
    )
      return;
    try {
      await axios.delete(`http://localhost:5000/api/accounts/${accNo}`);
      showMessage(lang === "ar" ? "تم الحذف " : "Account deleted ");
      fetchAccounts();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error deleting account ");
    }
  };

  return (
    <div className="account-container">
      <h2>{lang === "ar" ? "الحسابات" : "Accounts"}</h2>

      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-group">
          <label>{lang === "ar" ? "الحساب الرئيسي" : "Main Account"}</label>
          <select
            value={mainNo}
            onChange={(e) => setMainNo(e.target.value)}
            required
          >
            <option value="">
              {lang === "ar" ? "اختر الحساب" : "Select account"}
            </option>
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
            readOnly={editing ? true : false}
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
            {lang === "ar" ? (editing ? "تعديل" : "حفظ") : editing ? "Update" : "Save"}
          </button>

          {editing && (
            <button
              type="button"
              className="btn cancel"
              onClick={() => {
                setAccNo("");
                setAccName("");
                setMainNo("");
                setEditing(null);
              }}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          )}
        </div>
      </form>

      {message && <div className="toast success">{message}</div>}

      {/* Live Search */}
      <div className="form-header" style={{ marginBottom: "15px" }}>
        <div className="form-group">
          <label>{lang === "ar" ? "بحث..." : "Search..."}</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          {accounts.map((acc) => (
            <tr key={acc.SUBMAIN_NO}>
              <td>{acc.SUBMAIN_NO}</td>
              <td>{acc.SUBMAIN_NAME}</td>
              <td>{acc.MAIN_NAME || acc.SUBMAIN_MAIN_NO}</td>
              <td>
                <button className="btn save" onClick={() => handleEdit(acc)}>
                  {lang === "ar" ? "تعديل" : "Edit"}
                </button>
                <button
                  className="btn delete"
                  onClick={() => handleDelete(acc.SUBMAIN_NO)}
                >
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
