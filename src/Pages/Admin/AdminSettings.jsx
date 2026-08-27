// src/Pages/Admin/AdminSettings.jsx
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Initial default state (ready to hook to backend API endpoints)
const INITIAL_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Civil Engineering",
  "Library",
  "IT & Network Services",
  "Finance & Accounts",
];

const INITIAL_HELP_TOPICS = [
  "Network & Internet Access",
  "Computer Hardware",
  "Software Installation / Issue",
  "Account & Login Problem",
  "Email & Communication",
  "Printing & Scanning",
];

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-2.5 text-white " +
  "text-[13px] placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors";

const AdminSettings = () => {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [helpTopics, setHelpTopics] = useState(INITIAL_HELP_TOPICS);

  // Form Inputs
  const [newDept, setNewDept] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Edit states
  const [editingDept, setEditingDept] = useState({ index: null, value: "" });
  const [editingTopic, setEditingTopic] = useState({ index: null, value: "" });

  // ── Handlers: Departments ────────────────────────────────────────────────
  const handleAddDept = (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    // TODO: Call API endpoint -> POST /api/departments
    setDepartments([...departments, newDept.trim()]);
    setNewDept("");
  };

  const handleSaveDeptEdit = (index) => {
    if (!editingDept.value.trim()) return;
    // TODO: Call API endpoint -> PUT /api/departments/:id
    const updated = [...departments];
    updated[index] = editingDept.value.trim();
    setDepartments(updated);
    setEditingDept({ index: null, value: "" });
  };

  const handleDeleteDept = (index) => {
    // TODO: Call API endpoint -> DELETE /api/departments/:id
    setDepartments(departments.filter((_, i) => i !== index));
  };

  // ── Handlers: Help Topics ────────────────────────────────────────────────
  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    // TODO: Call API endpoint -> POST /api/help-topics
    setHelpTopics([...helpTopics, newTopic.trim()]);
    setNewTopic("");
  };

  const handleSaveTopicEdit = (index) => {
    if (!editingTopic.value.trim()) return;
    // TODO: Call API endpoint -> PUT /api/help-topics/:id
    const updated = [...helpTopics];
    updated[index] = editingTopic.value.trim();
    setHelpTopics(updated);
    setEditingTopic({ index: null, value: "" });
  };

  const handleDeleteTopic = (index) => {
    // TODO: Call API endpoint -> DELETE /api/help-topics/:id
    setHelpTopics(helpTopics.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[16px] font-bold text-white/90">System Configurations</h2>
        <p className="text-[12px] text-white/35 mt-0.5">
          Manage system-wide options dynamically fed into ticket creation forms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── 1. Departments Manager ────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[13.5px] font-semibold text-white/85 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              Departments ({departments.length})
            </h3>
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Add Input */}
            <form onSubmit={handleAddDept} className="flex gap-2">
              <input
                className={inputCls}
                placeholder="Add new department..."
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors shrink-0"
              >
                Add
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {departments.map((dept, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group"
                >
                  {editingDept.index === index ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        className={inputCls}
                        value={editingDept.value}
                        onChange={(e) =>
                          setEditingDept({ ...editingDept, value: e.target.value })
                        }
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveDeptEdit(index)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[12.5px] text-white/75 font-medium truncate">
                        {dept}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingDept({ index, value: dept })}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06]"
                          title="Edit"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDept(index)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. Help Topics Manager ────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[13.5px] font-semibold text-white/85 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Help Topics ({helpTopics.length})
            </h3>
          </div>

          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Add Input */}
            <form onSubmit={handleAddTopic} className="flex gap-2">
              <input
                className={inputCls}
                placeholder="Add new help topic..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors shrink-0"
              >
                Add
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {helpTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] group"
                >
                  {editingTopic.index === index ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        className={inputCls}
                        value={editingTopic.value}
                        onChange={(e) =>
                          setEditingTopic({ ...editingTopic, value: e.target.value })
                        }
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTopicEdit(index)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[12.5px] text-white/75 font-medium truncate">
                        {topic}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTopic({ index, value: topic })}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06]"
                          title="Edit"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(index)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;