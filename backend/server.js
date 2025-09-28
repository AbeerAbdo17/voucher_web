const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "0000",
  database: "k_shipping_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// توليد رقم القيد الجديد للسنة الحالية
async function getNextVoucherNo(conn) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    "SELECT MAX(TOPNO) AS max_no FROM yeartopno WHERE SYSYEAR = ? FOR UPDATE",
    [year]
  );
  return (rows[0].max_no || 0) + 1;
}

// async function getNextVoucherNo(conn) {
//   const year = new Date().getFullYear();
//   // const [rows] = await conn.query(
//   //   "SELECT MAX(TOPNO) AS max_no FROM yeartopno WHERE SYSYEAR = ?",
//   //   [year]
//   // );

//   const [rows] = await conn.query(
//   "SELECT MAX(TOPNO) AS max_no FROM yeartopno WHERE SYSYEAR = ? FOR UPDATE",
//   [year]
// );

//   return (rows[0].max_no || 0) + 1;
// }


// جلب رقم القيد الجديد
app.get("/api/voucher/new", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nextNo = await getNextVoucherNo(conn);
    res.json({ newVoucherNo: nextNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// جلب القيد حسب الرقم
app.get("/api/voucher/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT j.*, s.SUBMAIN_NAME 
       FROM journal j 
       LEFT JOIN submain s ON j.JOURNAL_SUBMAIN_NO = s.SUBMAIN_NO
       WHERE j.JOURNAL_NO = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// جلب الحسابات للاقتراحات
app.get("/api/accounts", async (req, res) => {
  const { query, type } = req.query;
  if (!query) return res.json([]);

  try {
    const sql =
      type === "accNo"
        ? `SELECT SUBMAIN_NO, SUBMAIN_NAME 
           FROM submain 
           WHERE SUBMAIN_NO LIKE ? OR SUBMAIN_NAME LIKE ? 
           LIMIT 20`
        : `SELECT SUBMAIN_NO, SUBMAIN_NAME 
           FROM submain 
           WHERE SUBMAIN_NAME LIKE ? OR SUBMAIN_NO LIKE ? 
           LIMIT 20`;

    const [rows] = await pool.query(sql, [`${query}%`, `${query}%`]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// حفظ القيد (جديد أو تعديل)
// app.post("/api/voucher", async (req, res) => {
//   const { voucherNo: incomingNo, date, entries = [], isNew } = req.body;
//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

//     // let voucherNo = incomingNo;
//     // if (isNew) {
//     //   voucherNo = incomingNo || (await getNextVoucherNo(conn));
//     // } else {
//     //   await conn.query("DELETE FROM journal WHERE JOURNAL_NO = ?", [voucherNo]);
//     // }

//     let voucherNo = incomingNo;

// if (isNew) {
//   // ✅ توليد الرقم فقط في السيرفر وبقفل بالـ Transaction
//   voucherNo = await getNextVoucherNo(conn);

//   // تحديث جدول yeartopno هنا مباشرة عشان يتثبت الرقم
//   await conn.query(
//     `INSERT INTO yeartopno (SYSYEAR, TOPNO) VALUES (?, ?) 
//      ON DUPLICATE KEY UPDATE TOPNO = VALUES(TOPNO)`,
//     [new Date().getFullYear(), voucherNo]
//   );
// } else {
//   await conn.query("DELETE FROM journal WHERE JOURNAL_NO = ?", [voucherNo]);
// }


//     const cleanEntries = entries.filter(
//       (e) =>
//         (e.accNo && String(e.accNo).trim() !== "") ||
//         (e.desc && String(e.desc).trim() !== "") ||
//         Number(e.dr) !== 0 ||
//         Number(e.cr) !== 0
//     );

//     if (cleanEntries.length === 0) {
//       await conn.rollback();
//       return res.status(400).json({ error: "No lines to save" });
//     }

//     let totalDr = 0,
//       totalCr = 0;

//     for (const e of cleanEntries) {
//       const dr = parseFloat(e.dr) || 0;
//       const cr = parseFloat(e.cr) || 0;
//       totalDr += dr;
//       totalCr += cr;

//       await conn.query(
//         `INSERT INTO journal 
//          (JOURNAL_NO, JOURNAL_SUBMAIN_NO, JOURNAL_DR, JOURNAL_CR, JOURNAL_DESC, JOURNAL_DATE, JOURNAL_DOCNO, JOURNAL_USER)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           voucherNo,
//           e.accNo || null,
//           dr,
//           cr,
//           e.desc || "",
//           date || new Date().toISOString().slice(0, 10),
//           e.reference || "",
//           "system",
//         ]
//       );
//     }

//     if (Math.abs(totalDr - totalCr) > 0.001) {
//       await conn.rollback();
//       return res.status(400).json({ error: "Debit and Credit totals must match" });
//     }

//     if (isNew) {
//       await conn.query(
//         `INSERT INTO yeartopno (SYSYEAR, TOPNO) VALUES (?, ?) 
//          ON DUPLICATE KEY UPDATE TOPNO = VALUES(TOPNO)`,
//         [new Date().getFullYear(), voucherNo]
//       );
//     }

//     await conn.commit();
//     res.json({ message: "Voucher saved", voucherNo });
//   } catch (err) {
//     await conn.rollback();
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     conn.release();
//   }
// });

// حفظ القيد (جديد أو تعديل)
app.post("/api/voucher", async (req, res) => {
  const { voucherNo: incomingNo, date, entries = [], isNew } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let voucherNo = incomingNo;

    if (isNew) {
      // ✅ ولّد الرقم فقط
      voucherNo = await getNextVoucherNo(conn);
    } else {
      await conn.query("DELETE FROM journal WHERE JOURNAL_NO = ?", [voucherNo]);
    }

    const cleanEntries = entries.filter(
      (e) =>
        (e.accNo && String(e.accNo).trim() !== "") ||
        (e.desc && String(e.desc).trim() !== "") ||
        Number(e.dr) !== 0 ||
        Number(e.cr) !== 0
    );

    if (cleanEntries.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: "No lines to save" });
    }

    let totalDr = 0,
        totalCr = 0;

    for (const e of cleanEntries) {
      const dr = parseFloat(e.dr) || 0;
      const cr = parseFloat(e.cr) || 0;
      totalDr += dr;
      totalCr += cr;

      await conn.query(
        `INSERT INTO journal 
         (JOURNAL_NO, JOURNAL_SUBMAIN_NO, JOURNAL_DR, JOURNAL_CR, JOURNAL_DESC, JOURNAL_DATE, JOURNAL_DOCNO, JOURNAL_USER)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          voucherNo,
          e.accNo || null,
          dr,
          cr,
          e.desc || "",
          date || new Date().toISOString().slice(0, 10),
          e.reference || "",
          "system",
        ]
      );
    }

    if (Math.abs(totalDr - totalCr) > 0.001) {
      await conn.rollback();
      return res.status(400).json({ error: "Debit and Credit totals must match" });
    }

    // ✅ تحديث yeartopno مرة واحدة فقط هنا
    if (isNew) {
      await conn.query(
        `INSERT INTO yeartopno (SYSYEAR, TOPNO) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE TOPNO = VALUES(TOPNO)`,
        [new Date().getFullYear(), voucherNo]
      );
    }

    await conn.commit();
    res.json({ message: "Voucher saved", voucherNo });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});


// حذف القيد بالكامل
app.delete("/api/voucher/:id", async (req, res) => {
  const voucherNo = parseInt(req.params.id);
  if (!voucherNo) return res.status(400).json({ error: "Invalid voucher number" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query("DELETE FROM journal WHERE JOURNAL_NO = ?", [voucherNo]);
    if (result.affectedRows > 0) {
      await conn.query("DELETE FROM yeartopno WHERE TOPNO = ?", [voucherNo]);
      await conn.commit();
      res.json({ message: "Voucher deleted" });
    } else {
      await conn.rollback();
      res.status(404).json({ error: "Voucher not found" });
    }
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});
// ----------------- الحسابات -----------------

// إضافة حساب فرعي جديد
app.post("/api/accounts", async (req, res) => {
  const { accNo, accName, mainNo } = req.body;

  if (!accNo || !accName || !mainNo) {
    return res
      .status(400)
      .json({ error: "Main, Sub Account number and name are required" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT * FROM submain WHERE SUBMAIN_NO = ?",
      [accNo]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Sub Account already exists" });
    }

    const [result] = await pool.query(
      "INSERT INTO submain (SUBMAIN_NO, SUBMAIN_NAME, SUBMAIN_MAIN_NO) VALUES (?, ?, ?)",
      [accNo, accName, mainNo]
    );
    res.json({ message: "Sub Account created", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع الحسابات أو البحث الحي (مع الحساب الرئيسي)
app.get("/api/accounts/all", async (req, res) => {
  const { search } = req.query;
  try {
    const sql = search
      ? `SELECT s.SUBMAIN_NO, s.SUBMAIN_NAME, s.SUBMAIN_MAIN_NO, m.MAIN_NAME
         FROM submain s
         LEFT JOIN main m ON s.SUBMAIN_MAIN_NO = m.MAIN_NO
         WHERE s.SUBMAIN_NO LIKE ? OR s.SUBMAIN_NAME LIKE ?
         LIMIT 50`
      : `SELECT s.SUBMAIN_NO, s.SUBMAIN_NAME, s.SUBMAIN_MAIN_NO, m.MAIN_NAME
         FROM submain s
         LEFT JOIN main m ON s.SUBMAIN_MAIN_NO = m.MAIN_NO
         ORDER BY s.SUBMAIN_NO ASC
         LIMIT 50`;

    const [rows] = await pool.query(
      sql,
      search ? [`%${search}%`, `%${search}%`] : []
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// تعديل حساب موجود
app.put("/api/accounts/:id", async (req, res) => {
  const { id } = req.params;
  const { accName } = req.body;

  if (!accName) return res.status(400).json({ error: "Account name required" });

  try {
    const [result] = await pool.query(
      "UPDATE submain SET SUBMAIN_NAME = ? WHERE SUBMAIN_NO = ?",
      [accName, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Account not found" });

    res.json({ message: "Account updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// حذف حساب
app.delete("/api/accounts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM submain WHERE SUBMAIN_NO = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Account not found" });

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// جلب الحسابات الرئيسية
app.get("/api/main-accounts", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT MAIN_NO, MAIN_NAME FROM main ORDER BY MAIN_NO ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==================== الحسابات العليا (subband) ====================
// ---------------- الحسابات العليا ----------------
app.get("/api/high-accounts", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT ID, subbno, subbname, subb_band_no FROM subband ORDER BY subbno ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- الحسابات الفرعية ----------------

// جلب الحسابات الفرعية مع البحث
app.get("/api/sub-accounts", async (req, res) => {
  const { search } = req.query;
  try {
    const sql = search
      ? `SELECT m.ID, m.MAIN_NO, m.MAIN_NAME, m.MAIN_BAND_NO, h.subbname AS high_account_name
         FROM main m
         LEFT JOIN subband h ON m.MAIN_BAND_NO = h.subb_band_no
         WHERE m.MAIN_NO LIKE ? OR m.MAIN_NAME LIKE ? OR h.subbname LIKE ?
         ORDER BY m.MAIN_NO ASC LIMIT 50`
      : `SELECT m.ID, m.MAIN_NO, m.MAIN_NAME, m.MAIN_BAND_NO, h.subbname AS high_account_name
         FROM main m
         LEFT JOIN subband h ON m.MAIN_BAND_NO = h.subb_band_no
         ORDER BY m.MAIN_NO ASC LIMIT 50`;

    const [rows] = await pool.query(
      sql,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة حساب فرعي
app.post("/api/sub-accounts", async (req, res) => {
  const { MAIN_NO, MAIN_NAME, MAIN_BAND_NO } = req.body;
  if (!MAIN_NO || !MAIN_NAME || !MAIN_BAND_NO)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const [exist] = await pool.query("SELECT * FROM main WHERE MAIN_NO = ?", [MAIN_NO]);
    if (exist.length > 0) return res.status(400).json({ error: "Sub Account already exists" });

    const [result] = await pool.query(
      "INSERT INTO main (MAIN_NO, MAIN_NAME, MAIN_BAND_NO) VALUES (?, ?, ?)",
      [MAIN_NO, MAIN_NAME, MAIN_BAND_NO]
    );
    res.json({ message: "Sub Account created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل حساب فرعي: تحديث مباشر بدون حذف
app.put("/api/sub-accounts/:id", async (req, res) => {
  const { id } = req.params;
  const { MAIN_NO, MAIN_NAME, MAIN_BAND_NO } = req.body;

  if (!MAIN_NO || !MAIN_NAME || !MAIN_BAND_NO)
    return res.status(400).json({ error: "All fields required" });

  try {
    // نجيب الحساب الحالي
    const [current] = await pool.query("SELECT * FROM main WHERE ID = ?", [id]);
    if (current.length === 0)
      return res.status(404).json({ error: "Sub Account not found" });

    // لو غيرنا رقم الحساب، نتأكد ما متكرر
    if (current[0].MAIN_NO !== MAIN_NO) {
      const [exist] = await pool.query("SELECT * FROM main WHERE MAIN_NO = ?", [MAIN_NO]);
      if (exist.length > 0)
        return res.status(400).json({ error: "Sub Account No already exists" });
    }

    // نعمل UPDATE للصف بدل الحذف/الإضافة
    const [result] = await pool.query(
      "UPDATE main SET MAIN_NO = ?, MAIN_NAME = ?, MAIN_BAND_NO = ? WHERE ID = ?",
      [MAIN_NO, MAIN_NAME, MAIN_BAND_NO, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Update failed" });

    res.json({ message: "Sub Account updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// حذف حساب فرعي
app.delete("/api/sub-accounts/:mainNo", async (req, res) => {
  const mainNo = req.params.mainNo;
  try {
    const [result] = await pool.query("DELETE FROM main WHERE MAIN_NO = ?", [mainNo]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Account not found" });
    res.json({ message: "Sub Account deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- الحسابات الاساسية ----------------

// جلب جميع الباندات
app.get("/api/bands", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT BAND_NO, BAND_NAME FROM band ORDER BY BAND_NO ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب الـ Subband (High Accounts) مع بحث
app.get("/api/high-accounts", async (req, res) => {
  const { search } = req.query;
  try {
    const sql = search
      ? `SELECT s.ID, s.subbno, s.subbname, s.subb_band_no, b.BAND_NAME as band_name
         FROM subband s
         LEFT JOIN band b ON s.subb_band_no = b.BAND_NO
         WHERE s.subbno LIKE ? OR s.subbname LIKE ? OR b.BAND_NAME LIKE ?
         ORDER BY s.subbno ASC LIMIT 50`
      : `SELECT s.ID, s.subbno, s.subbname, s.subb_band_no, b.BAND_NAME as band_name
         FROM subband s
         LEFT JOIN band b ON s.subb_band_no = b.BAND_NO
         ORDER BY s.subbno ASC LIMIT 50`;

    const [rows] = await pool.query(
      sql,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة Subband
app.post("/api/high-accounts", async (req, res) => {
  const { subbno, subbname, subb_band_no } = req.body;
  if (!subbno || !subbname || !subb_band_no)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const [exist] = await pool.query("SELECT * FROM subband WHERE subbno = ?", [subbno]);
    if (exist.length > 0) return res.status(400).json({ error: "Subband already exists" });

    const [result] = await pool.query(
      "INSERT INTO subband (subbno, subbname, subb_band_no) VALUES (?, ?, ?)",
      [subbno, subbname, subb_band_no]
    );

    res.json({ message: "Subband created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل Subband
app.put("/api/high-accounts/:id", async (req, res) => {
  const { id } = req.params;
  const { subbno, subbname, subb_band_no } = req.body;

  if (!subbno || !subbname || !subb_band_no)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const [current] = await pool.query("SELECT * FROM subband WHERE ID = ?", [id]);
    if (current.length === 0) return res.status(404).json({ error: "Subband not found" });

    if (current[0].subbno !== subbno) {
      const [exist] = await pool.query("SELECT * FROM subband WHERE subbno = ?", [subbno]);
      if (exist.length > 0) return res.status(400).json({ error: "Subband No already exists" });
    }

    const [result] = await pool.query(
      "UPDATE subband SET subbno = ?, subbname = ?, subb_band_no = ? WHERE ID = ?",
      [subbno, subbname, subb_band_no, id]
    );

    res.json({ message: "Subband updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف Subband
app.delete("/api/high-accounts/:subbno", async (req, res) => {
  const subbno = req.params.subbno;
  try {
    const [result] = await pool.query("DELETE FROM subband WHERE subbno = ?", [subbno]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Subband not found" });
    res.json({ message: "Subband deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(5000, "0.0.0.0", () => console.log("Server running on port 5000"));

