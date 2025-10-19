import React, { useEffect, useState } from "react";
import api from "../../api";
import html2pdf from "html2pdf.js";
import "./BalanceSheet.css";
import cairoBold from "./Cairo-Bold-normal.js"; // الخط العربي
import { jsPDF } from "jspdf";

export default function BalanceSheet({ lang }) {
  const [assets, setAssets] = useState({ current: [], nonCurrent: [] });
  const [liabilities, setLiabilities] = useState({ current: [], nonCurrent: [], equity: [] });

  const t = {
    ar: {
      title: "الميزانية العمومية",
      assets: "الأصول",
      currentAssets: "الأصول المتداولة",
      nonCurrentAssets: "الأصول غير المتداولة",
      liabilities: "الخصوم",
      currentLiabilities: "الخصوم المتداولة",
      nonCurrentLiabilities: "الخصوم غير المتداولة",
      equity: "حقوق الملكية",
      total: "الإجمالي",
      export: "تصدير PDF"
    },
    en: {
      title: "Balance Sheet",
      assets: "Assets",
      currentAssets: "Current Assets",
      nonCurrentAssets: "Non-current Assets",
      liabilities: "Liabilities",
      currentLiabilities: "Current Liabilities",
      nonCurrentLiabilities: "Non-current Liabilities",
      equity: "Equity",
      total: "Total",
      export: "Export PDF"
    }
  }[lang || "ar"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/reports/balance-sheet");
      const data = res.data;
      setAssets(data.assets || { current: [], nonCurrent: [] });
      setLiabilities(data.liabilities || { current: [], nonCurrent: [], equity: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, i) => sum + (i.amount || 0), 0);
  };

  const printPDF = () => {
    // إضافة الخط العربي بطريقة VoucherForm
    jsPDF.API.events.push(["addFonts", function () {
      this.addFileToVFS("Cairo-Bold.ttf", cairoBold);
      this.addFont("Cairo-Bold.ttf", "Cairo", "normal");
    }]);

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="font-family: 'Cairo', Arial, sans-serif; padding:20px; ${lang==="ar"?"direction:rtl;text-align:right;":""}">
        <h2 style="text-align:center;">${t.title}</h2>

        <h3>${t.assets}</h3>
        <h4>${t.currentAssets}</h4>
        <table style="width:100%; border-collapse: collapse;">
          <tbody>
            ${assets.current.map(a => `
              <tr>
                <td style="border:1px solid #000; padding:5px;">${a.name}</td>
                <td style="border:1px solid #000; padding:5px;">${a.amount.toLocaleString()}</td>
              </tr>
            `).join("")}
            <tr>
              <td><strong>${t.total}</strong></td>
              <td><strong>${calculateTotal(assets.current).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <h4>${t.nonCurrentAssets}</h4>
        <table style="width:100%; border-collapse: collapse;">
          <tbody>
            ${assets.nonCurrent.map(a => `
              <tr>
                <td style="border:1px solid #000; padding:5px;">${a.name}</td>
                <td style="border:1px solid #000; padding:5px;">${a.amount.toLocaleString()}</td>
              </tr>
            `).join("")}
            <tr>
              <td><strong>${t.total}</strong></td>
              <td><strong>${calculateTotal(assets.nonCurrent).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <h3>${t.liabilities}</h3>
        <h4>${t.currentLiabilities}</h4>
        <table style="width:100%; border-collapse: collapse;">
          <tbody>
            ${liabilities.current.map(l => `
              <tr>
                <td style="border:1px solid #000; padding:5px;">${l.name}</td>
                <td style="border:1px solid #000; padding:5px;">${l.amount.toLocaleString()}</td>
              </tr>
            `).join("")}
            <tr>
              <td><strong>${t.total}</strong></td>
              <td><strong>${calculateTotal(liabilities.current).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <h4>${t.nonCurrentLiabilities}</h4>
        <table style="width:100%; border-collapse: collapse;">
          <tbody>
            ${liabilities.nonCurrent.map(l => `
              <tr>
                <td style="border:1px solid #000; padding:5px;">${l.name}</td>
                <td style="border:1px solid #000; padding:5px;">${l.amount.toLocaleString()}</td>
              </tr>
            `).join("")}
            <tr>
              <td><strong>${t.total}</strong></td>
              <td><strong>${calculateTotal(liabilities.nonCurrent).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        <h4>${t.equity}</h4>
        <table style="width:100%; border-collapse: collapse;">
          <tbody>
            ${liabilities.equity.map(e => `
              <tr>
                <td style="border:1px solid #000; padding:5px;">${e.name}</td>
                <td style="border:1px solid #000; padding:5px;">${e.amount.toLocaleString()}</td>
              </tr>
            `).join("")}
            <tr>
              <td><strong>${t.total}</strong></td>
              <td><strong>${calculateTotal(liabilities.equity).toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

      </div>
    `;

    const opt = {
      margin: [10,10,25,10],
      filename: `${t.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf){
      const totalPages = pdf.internal.getNumberOfPages();
      const pageLabel = lang==="ar"?"صفحة":"Page";
      const ofLabel = lang==="ar"?"من":"of";

      for(let i=1;i<=totalPages;i++){
        pdf.setPage(i);
        pdf.setFont("Cairo","normal");
        pdf.setFontSize(10);
        const pageText = `${pageLabel} ${i} ${ofLabel} ${totalPages}`;
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.text(pageText, pageWidth/2, pdf.internal.pageSize.getHeight()-10, {align:"center"});
      }

      pdf.save(`${t.title}.pdf`);
    });
  };

  return (
    <div className="voucher-container" dir={lang==="ar"?"rtl":"ltr"}>
      <h2>{t.title}</h2>
      <div style={{ display:"flex", justifyContent:"center", margin:"20px 0" }}>
        <button className="btn save" onClick={printPDF}>{t.export}</button>
      </div>
    </div>
  );
}
