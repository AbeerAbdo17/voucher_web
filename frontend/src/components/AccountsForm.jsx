import React, { useState, useEffect } from "react";
import api from "../api";
import "./style/AccountsForm.css";

function AccountsForm({ lang, permissions }) {
  const screen = "AccountsBase";
  const canView = permissions[screen]?.view;
  const canEdit = permissions[screen]?.edit;
  const canDelete = permissions[screen]?.delete;

  const [accNo, setAccNo] = useState("");
  const [accName, setAccName] = useState("");
  const [mainNo, setMainNo] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [mainAccounts, setMainAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/accounts/all?search=${search}`);
      setAccounts(res.data);
    } catch (err) {
      console.error("Fetch accounts error:", err);
    }
  };

  const fetchMainAccounts = async () => {
    try {
      const res = await api.get("/main-accounts");
      setMainAccounts(res.data);
    } catch (err) {
      console.error("Fetch main accounts error:", err);
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
    if (!canEdit) return; // منع الحفظ لو ما عنده صلاحية
    if (!accNo || !accName || !mainNo) return;

    try {
      if (editingId) {
        await api.put(`/accounts/${editingId}`, { accNo, accName, mainNo });
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.SUBMAIN_NO === editingId
              ? {
                  ...acc,
                  SUBMAIN_NO: accNo,
                  SUBMAIN_NAME: accName,
                  SUBMAIN_MAIN_NO: mainNo,
                  MAIN_NAME:
                    mainAccounts.find((m) => m.MAIN_NO === mainNo)?.MAIN_NAME || "",
                }
              : acc
          )
        );
        showMessage(lang === "ar" ? "تم التعديل بنجاح" : "Updated");
      } else {
        await api.post("/accounts", { accNo, accName, mainNo });
        const mainName =
          mainAccounts.find((m) => m.MAIN_NO === mainNo)?.MAIN_NAME || "";
        setAccounts((prev) => [
          ...prev,
          {
            SUBMAIN_NO: accNo,
            SUBMAIN_NAME: accName,
            SUBMAIN_MAIN_NO: mainNo,
            MAIN_NAME: mainName,
          },
        ]);
        showMessage(lang === "ar" ? "تم الحفظ بنجاح" : "Saved");
      }

      resetForm();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  const handleEdit = (acc) => {
    if (!canEdit) return; // منع التعديل لو ما عنده صلاحية
    setAccNo(acc.SUBMAIN_NO);
    setAccName(acc.SUBMAIN_NAME);
    setMainNo(acc.SUBMAIN_MAIN_NO);
    setEditingId(acc.SUBMAIN_NO);
  };

  const handleDelete = async (accNo) => {
    if (!canDelete) return; // منع الحذف لو ما عنده صلاحية
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?"))
      return;
    try {
      await api.delete(`/accounts/${accNo}`);
      setAccounts((prev) => prev.filter((acc) => acc.SUBMAIN_NO !== accNo));
      showMessage(lang === "ar" ? "تم الحذف" : "Deleted");
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  // منع العرض لو ما عنده صلاحية view
  if (!canView) {
    return <div>{lang === "ar" ? "لا توجد صلاحية للعرض" : "No permission to view"}</div>;
  }

  return (
    <div className="account-container"
     dir={lang === "ar" ? "rtl" : "ltr"}
     style={{ textAlign: lang === "ar" ? "right" : "left" }}
    >
      <h2>{lang === "ar" ? "الحسابات التشغلية" : "OPerating Accounts"}</h2>

      {canEdit && (
        <form onSubmit={handleSubmit} className="account-form">
          <div className="form-group">
            <label>{lang === "ar" ? "الحساب الرئيسي" : "Main Account"}</label>
            <select
              value={mainNo}
              onChange={(e) => setMainNo(e.target.value)}
              required
              disabled={!canEdit}
            >
              <option value="">
                {lang === "ar" ? " اختر الحساب " : "Select High Account"}
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
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label>{lang === "ar" ? "اسم الحساب الفرعي" : "Sub Account Name"}</label>
            <input
              type="text"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              required
              disabled={!canEdit}
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn save">
              {editingId
                ? lang === "ar"
                  ? "تعديل"
                  : "Update"
                : lang === "ar"
                ? "حفظ"
                : "Save"}
            </button>
            {editingId && (
              <button type="button" className="btn cancel" onClick={resetForm}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            )}
          </div>
        </form>
      )}

      {message && <div className="toast success">{message}</div>}

      <div className="form-header">
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
          {accounts.map((acc, index) => (
            <tr key={`${acc.SUBMAIN_NO}-${index}`}>
              <td>{acc.SUBMAIN_NO}</td>
              <td>{acc.SUBMAIN_NAME}</td>
              <td>{acc.MAIN_NAME || acc.SUBMAIN_MAIN_NO}</td>
              <td>
                {canEdit && (
                  <button className="btn save" onClick={() => handleEdit(acc)}>
                    {lang === "ar" ? "تعديل" : "Edit"}
                  </button>
                )}

                {canDelete && (
                  <button
                    className="btn delete"
                    onClick={() => handleDelete(acc.SUBMAIN_NO)}
                  >
                    {lang === "ar" ? "حذف" : "Delete"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsForm;
