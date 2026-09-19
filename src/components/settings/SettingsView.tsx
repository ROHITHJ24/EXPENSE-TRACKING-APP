import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Category } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  User as UserIcon,
  Database,
  Tag,
  Sun,
  Moon,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SettingsViewProps {
  categories: Category[];
  onRefreshCategories: () => void;
}

export function SettingsView({ categories, onRefreshCategories }: SettingsViewProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [dbStatus, setDbStatus] = useState<any>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    api.getSystemStatus().then((res) => {
      if (res?.data) {
        setDbStatus(res.data);
      }
    });
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!newCatName.trim()) {
      setCatError('Category name is required.');
      return;
    }

    setIsAddingCat(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatType === 'income' ? 'emerald' : 'blue',
      });
      setNewCatName('');
      onRefreshCategories();
    } catch (err: any) {
      setCatError(err.message || 'Failed to add category');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Delete custom category "${name}"?`)) {
      try {
        await api.deleteCategory(id);
        onRefreshCategories();
      } catch (err: any) {
        alert(err.message || 'Failed to delete category');
      }
    }
  };

  const customCategories = categories.filter((c) => !c.isDefault && c.userId);
  const defaultCategories = categories.filter((c) => c.isDefault);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Settings</h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your account profile, custom categories, database connection, and theme.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">User Profile</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Authenticated Account Information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-sm">
          <div>
            <span className="text-xs text-neutral-400 block mb-1">Full Name</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{user?.name}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-400 block mb-1">Email Address</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Database & MERN Architecture Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Database & Stack</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">MongoDB Atlas + Mongoose + Express</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              dbStatus?.isAtlas
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
            }`}
          >
            {dbStatus?.isAtlas ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{dbStatus?.database || 'Initializing database...'}</span>
          </span>
        </div>

        <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 leading-relaxed">
          {dbStatus?.authIssue && !dbStatus?.isAtlas && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <div className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                MongoDB Atlas Credentials Notice
              </div>
              <p className="text-[11px] leading-normal text-amber-800 dark:text-amber-300">
                {dbStatus.authIssue}
              </p>
            </div>
          )}
          <p>
            This application is built with the strict <strong>MERN stack</strong> (MongoDB Atlas, Express.js, React, Node.js, and Mongoose).
          </p>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
            <div>Current database URI configured in environment:</div>
            <div className="text-blue-600 dark:text-blue-400 font-semibold mt-1 break-all select-all">
              mongodb+srv://johnrohithmidhun_db_user:••••••••@cluster0.qr2egi3.mongodb.net/expense_tracker
            </div>
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">Categories</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Add custom categories or browse system defaults</p>
          </div>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          {catError && (
            <div className="text-xs text-rose-600 dark:text-rose-400">{catError}</div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              placeholder="New category name (e.g. Subscriptions, Groceries)..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <button
                type="submit"
                disabled={isAddingCat}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Custom Categories List */}
        {customCategories.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
              Your Custom Categories
            </span>
            <div className="flex flex-wrap gap-2">
              {customCategories.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200"
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] text-neutral-400 uppercase">({c.type})</span>
                  <button
                    onClick={() => handleDeleteCategory(c._id, c.name)}
                    className="text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default Categories Pills */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-2">
            Default Categories
          </span>
          <div className="flex flex-wrap gap-1.5">
            {defaultCategories.map((c) => (
              <span
                key={c._id}
                className="px-2.5 py-1 rounded-md bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-400"
              >
                {c.name} <span className="text-[10px] opacity-70">({c.type})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Preferences & Logout */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            <span>Toggle Theme ({theme === 'dark' ? 'Dark' : 'Light'})</span>
          </button>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Account</span>
        </button>
      </div>
    </div>
  );
}
