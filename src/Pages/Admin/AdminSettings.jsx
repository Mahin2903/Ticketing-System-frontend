/* eslint-disable react-hooks/set-state-in-effect */
// src/Pages/Admin/AdminSettings.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import UseAxiosSecure from "../../Hooks/UseAxiosSecure";

// ── API factories (receive axios instance from the calling component/hook) ────
const makeDepartmentsApi = (axios) => ({
  getAll: () => axios.get("/api/departments").then((r) => r.data?.data ?? r.data ?? []),
  create: (body) => axios.post("/api/departments", body).then((r) => r.data),
  update: (id, body) => axios.patch(`/api/departments/${id}`, body).then((r) => r.data),
  remove: (id) => axios.delete(`/api/departments/${id}`).then((r) => r.data),
});

const makeHelpTopicsApi = (axios) => ({
  getAll: () => axios.get("/api/help-topics").then((r) => r.data?.data ?? r.data ?? []),
  create: (body) => axios.post("/api/help-topics", body).then((r) => r.data),
  update: (id, body) => axios.patch(`/api/help-topics/${id}`, body).then((r) => r.data),
  remove: (id) => axios.delete(`/api/help-topics/${id}`).then((r) => r.data),
});

// ── Shared Styles ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-2.5 text-white " +
  "text-[12.5px] placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 transition-colors";

// ── Inline Toasts ─────────────────────────────────────────────────────────────
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const push = (message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  };

  return { toasts, push };
};

const Toasts = ({ toasts }) => (
  <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`px-4 py-2.5 rounded-xl text-[12px] font-medium shadow-xl border ${
            t.type === "error"
              ? "bg-red-950/90 border-red-500/30 text-red-300"
              : "bg-[#0d0c1d]/95 border-violet-500/25 text-white/85"
          }`}
        >
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, message, onConfirm, onCancel }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.18 }}
          className="bg-[#0d0c1d] border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          <p className="text-[13px] text-white/80 leading-relaxed mb-5">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-[12px] font-medium border border-white/[0.09] text-white/55 hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ── Generic Edit Modal ────────────────────────────────────────────────────────
const EditModal = ({ open, title, fields, onSave, onClose, loading }) => {
  const [values, setValues] = useState({});

  useEffect(() => {
    if (open && fields) {
      const init = {};
      fields.forEach((f) => (init[f.key] = f.initial ?? ""));
      setValues(init);
    }
  }, [open, fields]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md bg-[#0d0c1d] border border-white/[0.1] rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
            <h3 className="text-[13.5px] font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-white/35 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {fields?.map((f) => (
              <div key={f.key}>
                <label className="text-[10.5px] uppercase tracking-wider text-white/38 block mb-1.5">
                  {f.label}
                </label>
                <input
                  className={inputCls}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  autoFocus={f.autofocus}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-medium border border-white/[0.09] text-white/55 hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(values)}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
            >
              {loading && (
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── Status badge pill ─────────────────────────────────────────────────────────
const ActiveDot = ({ active }) => (
  <span
    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
      active ? "bg-emerald-400" : "bg-white/20"
    }`}
  />
);

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse">
    <div className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
    <div className="h-2.5 bg-white/10 rounded w-2/3" />
    <div className="h-2 bg-white/[0.06] rounded w-12 ml-auto" />
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
const Empty = ({ label }) => (
  <div className="py-8 text-center text-[12px] text-white/25">
    No {label} yet. Add one above.
  </div>
);

// ── Error State ───────────────────────────────────────────────────────────────
const FetchError = ({ message, onRetry }) => (
  <div className="py-6 text-center space-y-2">
    <p className="text-[12px] text-red-400/80">{message}</p>
    <button
      onClick={onRetry}
      className="text-[11.5px] text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2"
    >
      Try again
    </button>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ── Departments Panel ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const DepartmentsPanel = ({ toast }) => {
  const axios = UseAxiosSecure();
  const departmentsApi = makeDepartmentsApi(axios);
  const qc = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [editTarget, setEditTarget] = useState(null);   // { id, department_code, department_title }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const addCodeRef = useRef(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await departmentsApi.getAll();
      return Array.isArray(res) ? res : res?.data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: (body) => departmentsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setNewCode("");
      setNewTitle("");
      toast.push("Department added");
    },
    onError: (err) => toast.push(err.response?.data?.message ?? err.message, "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => departmentsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setEditTarget(null);
      toast.push("Department updated");
    },
    onError: (err) => toast.push(err.response?.data?.message ?? err.message, "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => departmentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setDeleteTarget(null);
      toast.push("Department deleted");
    },
    onError: (err) => toast.push(err.response?.data?.message ?? err.message, "error"),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;
    createMut.mutate({
      department_code: newCode.trim().toUpperCase(),
      department_title: newTitle.trim(),
    });
  };

  const handleEditSave = (values) => {
    if (!values.department_code?.trim() || !values.department_title?.trim()) return;
    updateMut.mutate({
      id: editTarget.id,
      body: {
        department_code: values.department_code.trim().toUpperCase(),
        department_title: values.department_title.trim(),
      },
    });
  };

  const departments = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return (
    <>
      <PanelCard
        accentColor="bg-violet-400"
        title="Departments"
        count={departments.length}
      >
        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={addCodeRef}
              className={`${inputCls} max-w-[90px] uppercase tracking-widest`}
              placeholder="Code"
              value={newCode}
              maxLength={8}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Department title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <button
              type="submit"
              disabled={createMut.isPending || !newCode.trim() || !newTitle.trim()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-medium text-[11.5px] transition-colors shrink-0 flex items-center gap-1.5"
            >
              {createMut.isPending ? (
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              )}
              Add
            </button>
          </div>
        </form>

        {/* List */}
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 mt-4 styled-scroll">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

          {isError && (
            <FetchError
              message={error?.message ?? "Failed to load departments"}
              onRetry={refetch}
            />
          )}

          {!isLoading && !isError && departments.length === 0 && (
            <Empty label="departments" />
          )}

          <AnimatePresence initial={false}>
            {departments.map((dept, i) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.03, duration: 0.18 }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:border-white/[0.1] hover:bg-white/[0.045] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ActiveDot active={dept.is_active} />
                  <span className="font-mono text-[10px] text-white/30 shrink-0 uppercase tracking-wider">
                    {dept.department_code}
                  </span>
                  <span className="text-[12.5px] text-white/78 font-medium truncate">
                    {dept.department_title}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ActionBtn
                    title="Edit department"
                    onClick={() => setEditTarget(dept)}
                    icon={<EditIcon />}
                    className="text-white/40 hover:text-white hover:bg-white/[0.07]"
                  />
                  <ActionBtn
                    title="Delete department"
                    onClick={() => setDeleteTarget(dept)}
                    icon={<TrashIcon />}
                    className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                    loading={deleteMut.isPending && deleteTarget?.id === dept.id}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </PanelCard>

      {/* Edit Modal */}
      <EditModal
        open={!!editTarget}
        title={`Edit — ${editTarget?.department_title ?? ""}`}
        loading={updateMut.isPending}
        fields={[
          {
            key: "department_code",
            label: "Department Code",
            placeholder: "e.g. CSE",
            initial: editTarget?.department_code ?? "",
            autofocus: true,
          },
          {
            key: "department_title",
            label: "Department Title",
            placeholder: "e.g. Computer Science & Engineering",
            initial: editTarget?.department_title ?? "",
          },
        ]}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete "${deleteTarget?.department_title}"? This cannot be undone.`}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── Help Topics Panel ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const HelpTopicsPanel = ({ toast }) => {
  const axios = UseAxiosSecure();
  const helpTopicsApi = makeHelpTopicsApi(axios);
  const qc = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["help-topics"],
    queryFn: async () => {
      const res = await helpTopicsApi.getAll();
      return Array.isArray(res) ? res : res?.data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: (body) => helpTopicsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help-topics"] });
      setNewCode("");
      setNewTitle("");
      toast.push("Help topic added");
    },
    onError: (err) => toast.push(err.response?.data?.message ?? err.message, "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }) => helpTopicsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help-topics"] });
      setEditTarget(null);
      toast.push("Help topic updated");
    },
    onError: (err) => toast.push(err.response?.data?.message ?? err.message, "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => helpTopicsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help-topics"] });
      setDeleteTarget(null);
      toast.push("Help topic deleted");
    },
    onError: (err) => toast.push(err.response?.data?.message ?? err.message, "error"),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;
    createMut.mutate({
      topic_code: newCode.trim().toUpperCase(),
      topic_title: newTitle.trim(),
    });
  };

  const handleEditSave = (values) => {
    if (!values.topic_code?.trim() || !values.topic_title?.trim()) return;
    updateMut.mutate({
      id: editTarget.id,
      body: {
        topic_code: values.topic_code.trim().toUpperCase(),
        topic_title: values.topic_title.trim(),
      },
    });
  };

  const topics = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return (
    <>
      <PanelCard
        accentColor="bg-emerald-400"
        title="Add Category"
        count={topics.length}
      >
        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex gap-2">
            <input
              className={`${inputCls} max-w-[90px] uppercase tracking-widest`}
              placeholder="Code"
              value={newCode}
              maxLength={8}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Category"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <button
              type="submit"
              disabled={createMut.isPending || !newCode.trim() || !newTitle.trim()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-medium text-[11.5px] transition-colors shrink-0 flex items-center gap-1.5"
            >
              {createMut.isPending ? (
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              )}
              Add
            </button>
          </div>
        </form>

        {/* List */}
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1 mt-4 styled-scroll">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

          {isError && (
            <FetchError
              message={error?.message ?? "Failed to load help topics"}
              onRetry={refetch}
            />
          )}

          {!isLoading && !isError && topics.length === 0 && (
            <Empty label="help topics" />
          )}

          <AnimatePresence initial={false}>
            {topics.map((topic, i) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.03, duration: 0.18 }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:border-white/[0.1] hover:bg-white/[0.045] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
                  <span className="font-mono text-[10px] text-white/30 shrink-0 uppercase tracking-wider">
                    {topic.topic_code}
                  </span>
                  <span className="text-[12.5px] text-white/78 font-medium truncate">
                    {topic.topic_title}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ActionBtn
                    title="Edit topic"
                    onClick={() => setEditTarget(topic)}
                    icon={<EditIcon />}
                    className="text-white/40 hover:text-white hover:bg-white/[0.07]"
                  />
                  <ActionBtn
                    title="Delete topic"
                    onClick={() => setDeleteTarget(topic)}
                    icon={<TrashIcon />}
                    className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10"
                    loading={deleteMut.isPending && deleteTarget?.id === topic.id}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </PanelCard>

      {/* Edit Modal */}
      <EditModal
        open={!!editTarget}
        title={`Edit — ${editTarget?.topic_title ?? ""}`}
        loading={updateMut.isPending}
        fields={[
          {
            key: "topic_code",
            label: "Topic Code",
            placeholder: "e.g. NET",
            initial: editTarget?.topic_code ?? "",
            autofocus: true,
          },
          {
            key: "topic_title",
            label: "Topic Title",
            placeholder: "e.g. Network & Internet Access",
            initial: editTarget?.topic_title ?? "",
          },
        ]}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete "${deleteTarget?.topic_title}"? This cannot be undone.`}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

// ── Shared Panel Card ─────────────────────────────────────────────────────────
const PanelCard = ({ accentColor, title, count, children }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden flex flex-col">
    <div className="px-5 py-4 border-b border-white/[0.055] flex items-center gap-2.5">
      <span className={`w-2 h-2 rounded-full ${accentColor}`} />
      <h3 className="text-[13px] font-semibold text-white/85 flex-1">{title}</h3>
      <span className="text-[10.5px] font-mono text-white/25 tabular-nums">{count ?? "—"}</span>
    </div>
    <div className="p-5 flex-1 flex flex-col">{children}</div>
  </div>
);

// ── Icon primitives ───────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const ActionBtn = ({ onClick, icon, title, className, loading }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={loading}
    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${className}`}
  >
    {loading ? (
      <span className="w-3 h-3 border border-current/40 border-t-current rounded-full animate-spin block" />
    ) : (
      icon
    )}
  </button>
);

// ══════════════════════════════════════════════════════════════════════════════
// ── AdminSettings root ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const AdminSettings = () => {
  const toast = useToast();

  return (
    <>
      <div className="max-w-4xl space-y-7 mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-[25.5px] font-bold text-white/90">System Configuration</h2>
          <p className="text-[12px] text-white/32 mt-0.5">
            Manage departments and help topics that populate ticket submission forms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ">
          <DepartmentsPanel toast={toast} />
          <HelpTopicsPanel toast={toast} />
        </div>
      </div>

      <Toasts toasts={toast.toasts} />

      {/* Scroll styling injected once */}
      <style>{`
        .styled-scroll::-webkit-scrollbar { width: 4px; }
        .styled-scroll::-webkit-scrollbar-track { background: transparent; }
        .styled-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        .styled-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </>
  );
};

export default AdminSettings;