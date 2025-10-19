import React, { useEffect, useState } from "react";
import api from "../../api";
import html2pdf from "html2pdf.js";
import "./BalanceSheet.css";
import logoImg from "./logo.jpg";

export default function BalanceSheet({ lang }) {
  const [subbands, setSubbands] = useState([]);

  const t = {
    ar: { title: "الميزانية العمومية", subband: "الفئة الفرعية", total: "الإجمالي", export: "تصدير PDF" },
    en: { title: "Balance Sheet", subband: "Subband", total: "Total", export: "Export PDF" },
  }[lang || "ar"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/reports/balance-sheet");
      setSubbands(res.data.subbands || []);
    } catch (err) {
      console.error(err);
    }
  };

  const calcTotal = (arr) =>
    Array.isArray(arr) ? arr.reduce((a, b) => a + (b.amount || 0), 0) : 0;

const printPDF = () => {
  const element = document.createElement("div");

  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      
      <!-- الهيدر: لوجو على اليسار واسم التقرير على اليمين -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <img src="${logoImg}" style="height:50px;" />
        </div>
        <div style="font-size:24px; font-weight:bold; text-align: right;">
          ${t.title}
        </div>
      </div>

      <!-- الجدول -->
      <div style="${lang === 'ar' ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'}">
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border:1px solid #C8E2E1; padding:5px;">${t.subband}</th>
              <th style="border:1px solid #C8E2E1; padding:5px; text-align:end;">${t.total}</th>
            </tr>
          </thead>
          <tbody>
            ${subbands.map(s => `
              <tr>
                <td style="border:1px solid #C8E2E1; padding:5px;">${s.name}</td>
                <td style="border:1px solid #C8E2E1; padding:5px; text-align:end;">${s.amount.toLocaleString()}</td>
              </tr>
            `).join("")}
            <tr style="background:#f0f6f6;">
              <td><strong>${t.total}</strong></td>
              <td style="text-align:end;"><strong>${calcTotal(subbands).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `${t.title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save();
};


  return (
    <div className="voucher-container" dir={lang === "ar" ? "rtl" : "ltr"}>
      <h2>{t.title}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>{t.subband}</th>
            <th>{t.total}</th>
          </tr>
        </thead>
        <tbody>
          {subbands.map((s, i) => (
            <tr key={i}>
              <td>{s.name}</td>
              <td style={{ textAlign: "end" }}>{s.amount.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: "bold", background: "#f0f6f6" }}>
            <td>{t.total}</td>
            <td style={{ textAlign: "end" }}>{calcTotal(subbands).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button className="btn save" onClick={printPDF}>{t.export}</button>
      </div>
    </div>
  );
}
