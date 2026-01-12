-- (1) Trial Balance
-- BAND

SELECT
  B.BAND_NAME AS ACCNAME,
  B.BAND_NO AS ACCNO,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) < 0 THEN ABS(SUM(J.journal_CR - J.journal_DR)) ELSE 0 END AS DEBIT,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) > 0 THEN SUM(J.journal_CR - J.journal_DR) ELSE 0 END AS CREDIT
FROM JOURNAL J
INNER JOIN account A ON J.JOURNAL_account_no = A.account_no
INNER JOIN SUBMAIN SM ON A.account_aubbmain_no = SM.SUBMAIN_NO
INNER JOIN MAIN M ON SM.SUBMAIN_MAIN_NO = M.MAIN_NO
INNER JOIN SUBBAND SB ON M.MAIN_BAND_NO = SB.subbno
INNER JOIN BAND B ON SB.subb_band_no = B.BAND_NO
WHERE YEAR(J.journal_date) = $P{SYSYEAR}
  AND J.journal_date BETWEEN $P{FROM_DATE} AND $P{TO_DATE}
GROUP BY B.BAND_NAME, B.BAND_NO;

----------------------------------------

-- subband

SELECT
  B.BAND_NAME AS BAND_ACCNAME,
  B.BAND_NO AS BAND_ACCNO,
  SB.SUBBNAME AS ACCNAME,
  SB.SUBBNO AS ACCNO,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) < 0 THEN ABS(SUM(J.journal_CR - J.journal_DR)) ELSE 0 END AS DEBIT,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) > 0 THEN SUM(J.journal_CR - J.journal_DR) ELSE 0 END AS CREDIT
FROM JOURNAL J
INNER JOIN account A ON J.JOURNAL_account_no = A.account_no
INNER JOIN SUBMAIN SM ON A.account_aubbmain_no = SM.SUBMAIN_NO
INNER JOIN MAIN M ON SM.SUBMAIN_MAIN_NO = M.MAIN_NO
INNER JOIN SUBBAND SB ON M.MAIN_BAND_NO = SB.subbno
INNER JOIN BAND B ON SB.subb_band_no = B.BAND_NO
WHERE YEAR(J.journal_date) = $P{SYSYEAR}
  AND J.journal_date BETWEEN $P{FROM_DATE} AND $P{TO_DATE}
GROUP BY B.BAND_NAME, B.BAND_NO, SB.SUBBNAME, SB.SUBBNO;


----------------------------------------
-- main

SELECT
  SB.SUBBNAME AS SUBB_ACCNAME,
  SB.SUBBNO AS SUBB_ACCNO,
  M.MAIN_NAME AS ACCNAME,
  M.MAIN_NO AS ACCNO,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) < 0 THEN ABS(SUM(J.journal_CR - J.journal_DR)) ELSE 0 END AS DEBIT,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) > 0 THEN SUM(J.journal_CR - J.journal_DR) ELSE 0 END AS CREDIT
FROM JOURNAL J
INNER JOIN account A ON J.JOURNAL_account_no = A.account_no
INNER JOIN SUBMAIN SM ON A.account_aubbmain_no = SM.SUBMAIN_NO
INNER JOIN MAIN M ON SM.SUBMAIN_MAIN_NO = M.MAIN_NO
INNER JOIN SUBBAND SB ON M.MAIN_BAND_NO = SB.subbno
WHERE YEAR(J.journal_date) = $P{SYSYEAR}
  AND J.journal_date BETWEEN $P{FROM_DATE} AND $P{TO_DATE}
GROUP BY SB.SUBBNAME, SB.SUBBNO, M.MAIN_NAME, M.MAIN_NO;


----------------------------------------
-- submsain

SELECT
  M.MAIN_NAME AS MAIN_ACCNAME,
  M.MAIN_NO AS MAIN_ACCNO,
  SM.SUBMAIN_NAME AS ACCNAME,
  SM.SUBMAIN_NO AS ACCNO,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) < 0 THEN ABS(SUM(J.journal_CR - J.journal_DR)) ELSE 0 END AS DEBIT,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) > 0 THEN SUM(J.journal_CR - J.journal_DR) ELSE 0 END AS CREDIT
FROM JOURNAL J
INNER JOIN account A ON J.JOURNAL_account_no = A.account_no
INNER JOIN SUBMAIN SM ON A.account_aubbmain_no = SM.SUBMAIN_NO
INNER JOIN MAIN M ON SM.SUBMAIN_MAIN_NO = M.MAIN_NO
WHERE YEAR(J.journal_date) = $P{SYSYEAR}
  AND J.journal_date BETWEEN $P{FROM_DATE} AND $P{TO_DATE}
GROUP BY M.MAIN_NAME, M.MAIN_NO, SM.SUBMAIN_NAME, SM.SUBMAIN_NO
ORDER BY M.MAIN_NO, SM.SUBMAIN_NO;


----------------------------------------
-- account

SELECT
  SM.SUBMAIN_NAME AS SUBMAIN_ACCNAME,
  SM.SUBMAIN_NO AS SUBMAIN_ACCNO,
  A.account_NAME AS ACCNAME,
  A.account_NO AS ACCNO,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) < 0 THEN ABS(SUM(J.journal_CR - J.journal_DR)) ELSE 0 END AS DEBIT,
  CASE WHEN SUM(J.journal_CR - J.journal_DR) > 0 THEN SUM(J.journal_CR - J.journal_DR) ELSE 0 END AS CREDIT
FROM JOURNAL J
INNER JOIN account A ON J.JOURNAL_account_no = A.account_no
INNER JOIN SUBMAIN SM ON A.account_aubbmain_no = SM.SUBMAIN_NO
INNER JOIN MAIN M ON SM.SUBMAIN_MAIN_NO = M.MAIN_NO
WHERE YEAR(J.journal_date) = $P{SYSYEAR}
  AND J.journal_date BETWEEN $P{FROM_DATE} AND $P{TO_DATE}
GROUP BY SM.SUBMAIN_NAME, SM.SUBMAIN_NO, A.account_NAME, A.account_NO
ORDER BY SM.SUBMAIN_NO, A.account_NO;

----------------------------------------

-- (2) Balance Sheet
SELECT 
    sb.subbname AS subband_name,
    SUM(IFNULL(j.JOURNAL_DR,0) - IFNULL(j.JOURNAL_CR,0)) AS total_balance
FROM journal j
LEFT JOIN account ac ON j.JOURNAL_account_no = ac.account_no
LEFT JOIN submain sm ON ac.account_aubbmain_no = sm.SUBMAIN_NO
LEFT JOIN main m ON sm.SUBMAIN_MAIN_NO = m.MAIN_NO
LEFT JOIN subband sb ON m.MAIN_BAND_NO = sb.subbno
GROUP BY sb.subbname, sb.subbno
ORDER BY sb.subbno;

----------------------------------------

-- (3) account statement
SELECT
    j.idauto,
    j.journal_no,
    j.journal_date,
    j.journal_docno,
    j.journal_dr,
    j.journal_cr,
    j.journal_desc,
    ac.account_name,

    -- (Running Balance)
    (
        SELECT
            SUM(COALESCE(j2.journal_dr,0) - COALESCE(j2.journal_cr,0))
        FROM journal j2
        WHERE
            j2.journal_account_no = j.journal_account_no
            AND (
                j2.journal_date < j.journal_date
                OR (j2.journal_date = j.journal_date AND j2.journal_no < j.journal_no)
                OR (j2.journal_date = j.journal_date AND j2.journal_no = j.journal_no AND j2.idauto <= j.idauto)
            )
            AND YEAR(j2.journal_date) = ?
    ) AS running_balance,

    -- (Final balance)
    (
        SELECT
            SUM(COALESCE(j3.journal_dr,0) - COALESCE(j3.journal_cr,0))
        FROM journal j3
        WHERE
            j3.journal_account_no = j.journal_account_no
            AND YEAR(j3.journal_date) = ?
    ) AS final_balance,

    -- (Period balance)
    (
        SELECT
            SUM(COALESCE(j4.journal_dr,0) - COALESCE(j4.journal_cr,0))
        FROM journal j4
        WHERE
            j4.journal_account_no = j.journal_account_no
            AND j4.journal_date BETWEEN ? AND ?
    ) AS period_balance

FROM journal j
INNER JOIN account ac ON j.journal_account_no = ac.account_no

WHERE
    j.journal_account_no = ?
    AND YEAR(j.journal_date) = ?
    AND j.journal_date BETWEEN ? AND ?

ORDER BY
    j.journal_date,
    j.journal_no,
    j.idauto;
