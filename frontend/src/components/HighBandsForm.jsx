import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HighBandsForm.css";

function HighBandsForm({ lang }) {
  const [subbNo, setSubbNo] = useState("");
  const [subbName, setSubbName] = useState("");
  const [bandNo, setBandNo] = useState("");
  const [bands, setBands] = useState([]);
  const [subbands, setSubbands] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // جلب الـ Bands
  const fetchBands = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bands");
      setBands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // جلب الـ Subbands وربطها بالـ Band names
  const fetchSubbands = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/high-accounts");
      const dataWithBandNames = res.data.map(sub => ({
        ...sub,
        band_name: bands.find(b => b.BAND_NO === sub.subb_band_no)?.BAND_NAME || ""
      }));
      setSubbands(dataWithBandNames);
    } catch (err) {
      console.error(err);
    }
  };

  // تحميل البيانات مرة واحدة
useEffect(() => {
  fetchBands();
}, []);

useEffect(() => {
  if (bands.length > 0) {
    fetchSubbands();
  }
}, [bands, search]);


  // الرسائل المؤقتة
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const resetForm = () => {
    setSubbNo("");
    setSubbName("");
    setBandNo("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subbNo || !subbName || !bandNo) return;

    try {
      if (editingId) {
        // تحقق من التكرار للـ subbNo
        const duplicate = subbands.find(
          (acc) => acc.subbno === subbNo && acc.ID !== editingId
        );
        if (duplicate) {
          showMessage(lang === "ar" ? "رقم الحساب موجود مسبقاً" : "Subband No already exists");
          return;
        }

        await axios.put(`http://localhost:5000/api/high-accounts/${editingId}`, {
          subbno: subbNo,
          subbname: subbName,
          subb_band_no: bandNo
        });

        setSubbands(prev =>
          prev.map(acc =>
            acc.ID === editingId
              ? {
                  ...acc,
                  subbno: subbNo,
                  subbname: subbName,
                  subb_band_no: bandNo,
                  band_name: bands.find(b => b.BAND_NO === bandNo)?.BAND_NAME || ""
                }
              : acc
          )
        );

        showMessage(lang === "ar" ? "تم التعديل بنجاح" : "Updated");
      } else {
        const res = await axios.post("http://localhost:5000/api/high-accounts", {
          subbno: subbNo,
          subbname: subbName,
          subb_band_no: bandNo
        });

        const bandName = bands.find(b => b.BAND_NO === bandNo)?.BAND_NAME || "";
        setSubbands(prev => [
          ...prev,
          { ID: res.data.id, subbno: subbNo, subbname: subbName, subb_band_no: bandNo, band_name: bandName }
        ]);

        showMessage(lang === "ar" ? "تم الحفظ بنجاح" : "Saved");
      }

      resetForm();
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

  const handleEdit = (acc) => {
    setSubbNo(acc.subbno);
    setSubbName(acc.subbname);
    setBandNo(acc.subb_band_no);
    setEditingId(acc.ID);
  };

  const handleDelete = async (subbNo) => {
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/high-accounts/${subbNo}`);
      setSubbands(prev => prev.filter(acc => acc.subbno !== subbNo));
      showMessage(lang === "ar" ? "تم الحذف" : "Deleted");
    } catch (err) {
      showMessage(err.response?.data?.error || "Error");
    }
  };

// فلترة البيانات للبحث
const filteredSubbands = subbands.filter(acc =>
  String(acc.subbno).includes(search) ||
  acc.subbname.toLowerCase().includes(search.toLowerCase()) ||
  acc.band_name.toLowerCase().includes(search.toLowerCase())
);


  return (
    <div className="account-container">
      <h2>{lang === "ar" ? "الحسابات العليا" : "High Bands"}</h2>

      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-group">
          <label>{lang === "ar" ? "الحساب الرئيسي" : "Main Account"}</label>
          <select value={bandNo} onChange={(e) => setBandNo(e.target.value)} required>
            <option value="">{lang === "ar" ? "اختر الحساب" : "Select High Bands"}</option>
            {bands.map(b => (
              <option key={b.BAND_NO} value={b.BAND_NO}>{b.BAND_NAME}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{lang === "ar" ? "رقم الحساب الفرعي" : "Sub Account No"}</label>
          <input type="text" value={subbNo} onChange={(e) => setSubbNo(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>{lang === "ar" ? "اسم الحساب الفرعي" : "Sub Account Name"}</label>
          <input type="text" value={subbName} onChange={(e) => setSubbName(e.target.value)} required />
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
          {filteredSubbands.map((acc, index) => (
            <tr key={`${acc.ID}-${acc.subbno}-${index}`}>
              <td>{acc.subbno}</td>
              <td>{acc.subbname}</td>
              <td>{acc.band_name || ""}</td>
              <td>
                <button className="btn save" onClick={() => handleEdit(acc)}>
                  {lang === "ar" ? "تعديل" : "Edit"}
                </button>
                <button className="btn delete" onClick={() => handleDelete(acc.subbno)}>
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

export default HighBandsForm;
