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

  const allScreens = ["Journal", "AccountsBase", "AccountsHigh", "AccountsBands", "Users", "Reports"];


  const t = {
    ar: {
      manageUsers: "إدارة المستخدمين",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      role: "الدور",
      action: "الإجراء",
      editPerms: "تعديل",
      addUser: "إضافة",
      permissionsOf: "صلاحيات",
      save: "حفظ",
      cancel: "إلغاء",
      saved: "تم الحفظ",
      accounts: "الحسابات",
      HighAccountsForm: "الحسابات الفرعية",
      HighBandsForm: "الحسابات العليا",
      journal: "القيود اليومية",
      users: "المستخدمين",
      view: "عرض",
      edit: "تعديل",
      delete: "حذف",
      reports: "التقارير",
    },
    en: {
      manageUsers: "Manage Users",
      username: "Username",
      password: "Password",
      role: "Role",
      action: "Action",
      editPerms: "Edit",
      addUser: "Add",
      permissionsOf: "Permissions of",
      save: "Save",
      cancel: "Cancel",
      HighAccountsForm: "High Sub Accounts",
      HighBandsForm: "High Accounts",
      saved: "Saved",
      accounts: "Accounts",
      journal: "Journal",
      users: "Users",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      reports: "Reports",
    },
  }[lang || "en"];

  // خريطة أسماء الشاشات بالعربي والإنجليزي
  const screenNames = {
    Journal: t.journal,
    AccountsBase: t.accounts,
    AccountsHigh: t.HighAccountsForm,
    AccountsBands: t.HighBandsForm,
    Users: t.users,
    Reports: t.reports,
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      showToast("Error fetching users", "error");
    }
  };

  const fetchPermissions = async (user) => {
    try {
      const res = await api.get(`/users/${user.id}/permissions`);
      setSelectedUser(user);
      setEditUserData({ username: user.username, password: "", role: user.role });
      setScreens(res.data.screens || []);
      setPermissions(res.data.permissions || {});
    } catch (err) {
      showToast("Error fetching permissions", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleScreen = (screen) => {
    setScreens((prev) =>
      prev.includes(screen) ? prev.filter((s) => s !== screen) : [...prev, screen]
    );
  };

  const togglePerm = (screen, perm) => {
    setPermissions((prev) => ({
      ...prev,
      [screen]: {
        ...prev[screen],
        [perm]: !prev[screen]?.[perm],
      },
    }));
  };

  const handleDeleteUser = async (userId) => {
  if (!window.confirm("هل أنت متأكد من حذف المستخدم؟")) return;
  try {
    await api.delete(`/users/${userId}`); // تأكد إن الباك إند عنده DELETE /users/:id
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast("User deleted successfully", "success");
  } catch (err) {
    showToast("Error deleting user", "error");
  }
};


  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.id}`, editUserData);
      await api.put(`/users/${selectedUser.id}/permissions`, { screens, permissions });
      showToast(t.saved, "success");
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      showToast("Error saving user", "error");
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setScreens([]);
    setPermissions({});
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showToast("Please enter username and password", "error");
      return;
    }
    try {
      const res = await api.post("/users", newUser);
      setUsers((prev) => [...prev, res.data]);
      setNewUser({ username: "", password: "", role: "user" });
      showToast("User added successfully", "success");
    } catch (err) {
      showToast("Error adding user", "error");
    }
  };

  return (
    <div
      className="voucher-container admin-users"
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ textAlign: lang === "ar" ? "right" : "left" }}
    >
      <h2>{t.manageUsers}</h2>

      {/* Toast */}
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      {/* فورم إضافة مستخدم جديد */}
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
          <button
            className="btn save"
            style={{ padding: "6px 12px", fontSize: "15px" }}
            onClick={handleAddUser}
          >
            {t.addUser}
          </button>
        </div>
      </div>

      {/* جدول المستخدمين */}
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

      {/* تعديل بيانات وصلاحيات المستخدم */}
      {selectedUser && (
        <div className="permissions-box">
          <h3>{t.permissionsOf} {selectedUser.username}</h3>

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
                {screens.includes(screen) && (
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
            <button className="btn save" onClick={handleSave}>{t.save}</button>
            <button className="btn delete" onClick={handleCancel}>{t.cancel}</button>
          </div>
        </div>
      )}
    </div>
  );
}
