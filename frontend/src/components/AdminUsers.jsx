import React, { useEffect, useState } from "react";
import api from "../api";

export default function AdminUsers({ lang }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [screens, setScreens] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });
  const [editUserData, setEditUserData] = useState({ username: "", password: "", role: "" });
  const [toast, setToast] = useState({ message: "", type: "" });

  // ✳️ التقارير (المفاتيح بالإنجليزي، الأسماء حسب اللغة)
  const reportPages = [
    { key: "balanceSheet", ar: "الميزانية العمومية", en: "Balance Sheet" },
    { key: "trialBalance", ar: "ميزان المراجعة", en: "Trial Balance" },
    { key: "accountStatement", ar: "كشف حساب", en: "Account Statement" },
  ];

  // ✳️ أسماء الشاشات
  const allScreens = [
    "Journal",
    "AccountsBase",
    "AccountsHigh",
    "AccountsBands",
    "Users",
    "Reports",
  ];

  // ✳️ الترجمة
  const t = {
    ar: {
      manageUsers: "إدارة المستخدمين",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      role: "الدور",
      action: "الإجراء",
      editPerms: "تعديل ",
      addUser: "إضافة ",
      permissionsOf: "صلاحيات المستخدم",
      save: "حفظ",
      cancel: "إلغاء",
      saved: "تم الحفظ بنجاح",
      accounts: "الحسابات التشغيلية",
      HighAccountsForm: "الحسابات الفرعية",
      HighBandsForm: "الحسابات العليا",
      journal: "القيود اليومية",
      users: "إدارة المستخدمين",
      view: "عرض",
      edit: "تعديل",
      delete: "حذف",
      reports: "التقارير",
      confirmDelete: "هل أنت متأكد من حذف المستخدم؟",
      errorFetch: "حدث خطأ أثناء جلب البيانات",
      errorSave: "حدث خطأ أثناء الحفظ",
      errorAdd: "حدث خطأ أثناء الإضافة",
      errorDelete: "حدث خطأ أثناء الحذف",
      added: "تمت الإضافة بنجاح",
      deleted: "تم الحذف بنجاح",
    },
    en: {
      manageUsers: "Manage Users",
      username: "Username",
      password: "Password",
      role: "Role",
      action: "Action",
      editPerms: "Edit ",
      addUser: "Add ",
      permissionsOf: "Permissions of",
      save: "Save",
      cancel: "Cancel",
      saved: "Saved successfully",
      accounts: "Operating Accounts",
      HighAccountsForm: "High Sub Accounts",
      HighBandsForm: "High Accounts",
      journal: "Journal Entry",
      users: "Manage Users",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      reports: "Reports",
      confirmDelete: "Are you sure you want to delete this user?",
      errorFetch: "Error fetching users",
      errorSave: "Error saving user",
      errorAdd: "Error adding user",
      errorDelete: "Error deleting user",
      added: "User added successfully",
      deleted: "User deleted successfully",
    },
  }[lang || "en"];

  const screenNames = {
    Journal: t.journal,
    AccountsBase: t.accounts,
    AccountsHigh: t.HighAccountsForm,
    AccountsBands: t.HighBandsForm,
    Users: t.users,
    Reports: t.reports,
  };

  // ✅ Toast function
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // ✅ Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch {
      showToast(t.errorFetch, "error");
    }
  };

  // ✅ Fetch user permissions
  const fetchPermissions = async (user) => {
    try {
      const res = await api.get(`/users/${user.id}/permissions`);
      const perms = res.data.permissions || {};
      if (!perms.Reports) perms.Reports = {};
      setSelectedUser(user);
      setEditUserData({ username: user.username, password: "", role: user.role });
      setScreens(res.data.screens || []);
      setPermissions(perms);
    } catch {
      showToast(t.errorFetch, "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Toggle screen
  const toggleScreen = (screen) => {
    setScreens((prev) =>
      prev.includes(screen)
        ? prev.filter((s) => s !== screen)
        : [...prev, screen]
    );
  };

  // ✅ Toggle permission (عرض / تعديل / حذف)
  const togglePerm = (screen, perm) => {
    setPermissions((prev) => ({
      ...prev,
      [screen]: {
        ...prev[screen],
        [perm]: !prev[screen]?.[perm],
      },
    }));
  };

  // ✅ Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(t.deleted, "success");
    } catch {
      showToast(t.errorDelete, "error");
    }
  };

  // ✅ Save permissions
  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.id}`, editUserData);
      const fixedPermissions = { ...permissions, Reports: permissions.Reports || {} };
      await api.put(`/users/${selectedUser.id}/permissions`, {
        screens,
        permissions: fixedPermissions,
      });
      showToast(t.saved, "success");
      setSelectedUser(null);
      fetchUsers();
    } catch {
      showToast(t.errorSave, "error");
    }
  };

  // ✅ Cancel editing
  const handleCancel = () => {
    setSelectedUser(null);
    setScreens([]);
    setPermissions({});
  };

  // ✅ Add new user
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showToast("Please enter username and password", "error");
      return;
    }
    try {
      const res = await api.post("/users", newUser);
      setUsers((prev) => [...prev, res.data]);
      setNewUser({ username: "", password: "", role: "user" });
      showToast(t.added, "success");
    } catch {
      showToast(t.errorAdd, "error");
    }
  };

  return (
    <div
      className="voucher-container admin-users"
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ textAlign: lang === "ar" ? "right" : "left" }}
    >
      <h2>{t.manageUsers}</h2>

      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      {/* ✅ إضافة مستخدم جديد */}
      <div className="form-header">
        <div className="form-group">
          <label>{t.username}</label>
          <input
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            placeholder={t.username}
          />
        </div>
        <div className="form-group">
          <label>{t.password}</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder={t.password}
          />
        </div>
        <div className="form-group" style={{ flex: "0 0 120px" }}>
          <button className="btn save" onClick={handleAddUser}>
            {t.addUser}
          </button>
        </div>
      </div>

      {/* ✅ جدول المستخدمين */}
      <table className="voucher-table">
        <thead>
          <tr>
            <th>{t.username}</th>
            <th>{t.action}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>
                <button className="btn save" onClick={() => fetchPermissions(u)}>
                  {t.editPerms}
                </button>
                <button
                  className="btn delete"
                  style={{ marginLeft: "6px" }}
                  onClick={() => handleDeleteUser(u.id)}
                >
                  {t.delete}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ تعديل الصلاحيات */}
      {selectedUser && (
        <div className="permissions-box">
          <h3>
            {t.permissionsOf} {selectedUser.username}
          </h3>

          <div className="form-header">
            <div className="form-group">
              <label>{t.username}</label>
              <input
                value={editUserData.username}
                onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input
                type="password"
                placeholder="••••••"
                value={editUserData.password}
                onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            {allScreens.map((screen) => (
              <div key={screen} className="screen-perm">
                <label>
                  <input
                    type="checkbox"
                    checked={screens.includes(screen)}
                    onChange={() => toggleScreen(screen)}
                  />
                  {screenNames[screen]}
                </label>

                {/* ✅ في حالة Reports */}
                {screens.includes(screen) && screen === "Reports" && (
                  <div className="sub-permissions">
                    {reportPages.map((report) => (
                      <label key={report.key}>
                        <input
                          type="checkbox"
                          checked={permissions.Reports?.[report.key] || false}
                          onChange={() =>
                            setPermissions((prev) => ({
                              ...prev,
                              Reports: {
                                ...prev.Reports,
                                [report.key]: !prev.Reports?.[report.key],
                              },
                            }))
                          }
                        />
                        {lang === "ar" ? report.ar : report.en}
                      </label>
                    ))}
                  </div>
                )}

                {/* ✅ باقي الصفحات */}
                {screens.includes(screen) && screen !== "Reports" && (
                  <div className="sub-permissions">
                    {["view", "edit", "delete"].map((perm) => (
                      <label key={perm}>
                        <input
                          type="checkbox"
                          checked={permissions[screen]?.[perm] || false}
                          onChange={() => togglePerm(screen, perm)}
                        />
                        {t[perm]}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn save" onClick={handleSave}>
              {t.save}
            </button>
            <button className="btn delete" onClick={handleCancel}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
