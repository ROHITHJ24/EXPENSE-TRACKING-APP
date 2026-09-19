import { useState, useEffect } from 'react';
import { Transaction, Category, PaginationMeta } from '../../types/index.js';
import { TransactionFilters } from './TransactionFilters.js';
import { TransactionList } from './TransactionList.js';
import { TransactionModal } from './TransactionModal.js';
import { api } from '../../services/api.js';
import { Plus } from 'lucide-react';

interface TransactionsViewProps {
  categories: Category[];
  onTransactionsChanged: () => void;
  selectedTransactionForEdit?: Transaction | null;
  onClearEditTransaction?: () => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  onOpenAddModal?: () => void;
}

export function TransactionsView({
  categories,
  onTransactionsChanged,
  selectedTransactionForEdit,
  onClearEditTransaction,
  isAddModalOpen: externalIsAddModalOpen,
  onCloseAddModal: externalOnCloseAddModal,
  onOpenAddModal: externalOnOpenAddModal,
}: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    type: 'all' as 'all' | 'income' | 'expense',
    categoryId: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    sortBy: 'date' as 'date' | 'amount',
    sortOrder: 'desc' as 'desc' | 'asc',
  });

  // Modal State
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const isModalOpen = externalIsAddModalOpen !== undefined ? externalIsAddModalOpen : internalModalOpen;

  const handleOpenModal = () => {
    if (externalOnOpenAddModal) {
      externalOnOpenAddModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    if (externalOnCloseAddModal) {
      externalOnCloseAddModal();
    }
    setInternalModalOpen(false);
    setEditingTransaction(null);
    if (onClearEditTransaction) onClearEditTransaction();
  };

  useEffect(() => {
    if (selectedTransactionForEdit) {
      setEditingTransaction(selectedTransactionForEdit);
      if (externalOnOpenAddModal) {
        externalOnOpenAddModal();
      } else {
        setInternalModalOpen(true);
      }
    }
  }, [selectedTransactionForEdit]);

  const fetchTransactions = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        page,
        limit: pagination.limit,
        search: filters.search,
        type: filters.type !== 'all' ? filters.type : undefined,
        categoryId: filters.categoryId || undefined,
        paymentMethod: filters.paymentMethod || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      setTransactions(res.transactions || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters or pagination page change
  useEffect(() => {
    fetchTransactions(1);
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchTransactions(newPage);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      categoryId: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const handleSubmitTransaction = async (data: any) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction._id, data);
    } else {
      await api.createTransaction(data);
    }
    await fetchTransactions(pagination.page);
    onTransactionsChanged();
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    await fetchTransactions(pagination.page);
    onTransactionsChanged();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Transactions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Search, filter, and review all recorded transactions.
          </p>
        </div>

        <button
          id="add-transaction-page-btn"
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filters Bar */}
      <TransactionFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* List */}
      <TransactionList
        transactions={transactions}
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        onEdit={(tx) => {
          setEditingTransaction(tx);
          handleOpenModal();
        }}
        onDelete={handleDeleteTransaction}
        onAddNew={handleOpenModal}
      />

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTransaction}
        onDelete={handleDeleteTransaction}
        transaction={editingTransaction}
        categories={categories}
      />
    </div>
  );
}
