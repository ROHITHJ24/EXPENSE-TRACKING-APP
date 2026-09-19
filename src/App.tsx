import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar, NavTab } from './components/common/Navbar.js';
import { AuthView } from './components/auth/AuthView.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { TransactionsView } from './components/transactions/TransactionsView.js';
import { BudgetsView } from './components/budgets/BudgetsView.js';
import { GroupsView } from './components/groups/GroupsView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { TransactionModal } from './components/transactions/TransactionModal.js';
import { Category, DashboardAnalytics, Transaction } from './types/index.js';
import { api } from './services/api.js';

function MainApp() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Global Quick Add Modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialType, setQuickAddInitialType] = useState<'income' | 'expense'>('expense');

  // Transaction selected from Dashboard to Edit
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);

  const fetchSharedData = async () => {
    if (!isAuthenticated) return;
    try {
      const [catsRes, analyticsRes] = await Promise.all([
        api.getCategories(),
        api.getDashboardAnalytics(),
      ]);
      setCategories(catsRes || []);
      setAnalytics(analyticsRes || null);
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSharedData();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center animate-pulse">
            ₹
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            Loading Expense Tracker...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleOpenQuickAdd = (type: 'income' | 'expense' = 'expense') => {
    setQuickAddInitialType(type);
    setSelectedTxForEdit(null);
    setIsQuickAddOpen(true);
  };

  const handleSelectTransactionFromDashboard = (tx: Transaction) => {
    setSelectedTxForEdit(tx);
    setCurrentTab('transactions');
  };

  const handleQuickAddSubmit = async (data: any) => {
    await api.createTransaction(data);
    await fetchSharedData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddTransaction={() => handleOpenQuickAdd('expense')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            analytics={analytics}
            loading={loadingData}
            categories={categories}
            onOpenAddTransaction={handleOpenQuickAdd}
            onNavigateToTransactions={() => setCurrentTab('transactions')}
            onSelectTransaction={handleSelectTransactionFromDashboard}
            onNavigateToGroups={() => setCurrentTab('groups')}
            onRefreshData={fetchSharedData}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            categories={categories}
            onTransactionsChanged={fetchSharedData}
            selectedTransactionForEdit={selectedTxForEdit}
            onClearEditTransaction={() => setSelectedTxForEdit(null)}
          />
        )}

        {currentTab === 'budgets' && <BudgetsView categories={categories} />}

        {currentTab === 'groups' && (
          <GroupsView
            categories={categories}
            currentUserId={user?._id}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView categories={categories} onRefreshCategories={fetchSharedData} />
        )}
      </main>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleQuickAddSubmit}
        categories={categories}
        initialType={quickAddInitialType}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
