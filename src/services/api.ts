const TOKEN_STORAGE_KEY = 'et_auth_token';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Check if token exists in localStorage (used as fallback if third-party cookies are blocked)
    try {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string; pagination?: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'include', // sends HTTP-only cookie automatically
      });
    } catch {
      throw new Error(
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message: 'The server response could not be processed. Please try again in a moment.',
      };
    }

    if (!response.ok) {
      let errorMsg = data?.message;
      if (!errorMsg || errorMsg.toLowerCase().includes('status ') || errorMsg.toLowerCase().includes('failed to fetch')) {
        if (response.status === 401) {
          errorMsg = 'Your login session has expired. Please sign in again.';
        } else if (response.status === 403) {
          errorMsg = 'You do not have permission to view or edit this resource.';
        } else if (response.status === 404) {
          errorMsg = 'The requested item was not found.';
        } else if (response.status === 409) {
          errorMsg = 'A record with these details already exists. Please review your entries.';
        } else if (response.status === 429) {
          errorMsg = 'You are making requests too quickly. Please pause for a moment before continuing.';
        } else if (response.status >= 500) {
          errorMsg = 'We encountered a momentary issue processing your request. Please try again shortly.';
        } else {
          errorMsg = 'Something unexpected happened while processing your request. Please try again.';
        }
      }
      throw new Error(errorMsg);
    }

    return data;
  }

  // System & Status
  async getSystemStatus() {
    return this.request('/api/system/status');
  }

  // Auth
  async register(name: string, email: string, password: string) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async login(email: string, password: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    const res = await this.request('/api/auth/me');
    return res.data;
  }

  // Dashboard
  async getDashboardSummary() {
    const res = await this.request('/api/dashboard/summary');
    return res.data;
  }

  async getDashboardAnalytics() {
    const res = await this.request('/api/dashboard/analytics');
    return res.data;
  }

  // Transactions
  async getTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const endpoint = `/api/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    return {
      transactions: res.data,
      pagination: res.pagination,
    };
  }

  async createTransaction(payload: any) {
    const res = await this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async updateTransaction(id: string, payload: any) {
    const res = await this.request(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteTransaction(id: string) {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories() {
    const res = await this.request('/api/categories');
    return res.data;
  }

  async createCategory(payload: { name: string; type: 'income' | 'expense'; icon?: string; color?: string }) {
    const res = await this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteCategory(id: string) {
    return this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Budgets
  async getBudgets(month?: number, year?: number) {
    const query = new URLSearchParams();
    if (month) query.append('month', String(month));
    if (year) query.append('year', String(year));
    const endpoint = `/api/budgets${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await this.request(endpoint);
    return res.data;
  }

  async createOrUpdateBudget(payload: { categoryId: string; amount: number; month: number; year: number }) {
    const res = await this.request('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteBudget(id: string) {
    return this.request(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Recurring Expenses & Commitments
  async getRecurringExpenses() {
    const res = await this.request('/api/recurring');
    return res.data;
  }

  async getUpcomingCommitments() {
    const res = await this.request('/api/recurring/commitments');
    return res.data;
  }

  async createRecurringExpense(payload: {
    title: string;
    amount: number;
    categoryId: string;
    frequency?: 'monthly' | 'weekly' | 'yearly';
    dueDay: number;
    notes?: string;
  }) {
    const res = await this.request('/api/recurring', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async updateRecurringExpense(id: string, payload: any) {
    const res = await this.request(`/api/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteRecurringExpense(id: string) {
    return this.request(`/api/recurring/${id}`, {
      method: 'DELETE',
    });
  }

  // Split / Group Expenses
  async getUserGroups() {
    const res = await this.request('/api/groups');
    return res.data;
  }

  async createGroup(payload: { name: string; description?: string; participants: string[] }) {
    const res = await this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async getGroupDetails(groupId: string) {
    const res = await this.request(`/api/groups/${groupId}`);
    return res.data;
  }

  async addParticipant(groupId: string, payload: { name: string; email?: string }) {
    const res = await this.request(`/api/groups/${groupId}/participants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async removeParticipant(groupId: string, participantId: string) {
    return this.request(`/api/groups/${groupId}/participants/${participantId}`, {
      method: 'DELETE',
    });
  }

  async addGroupExpense(groupId: string, payload: any) {
    const res = await this.request(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteGroupExpense(groupId: string, expenseId: string) {
    return this.request(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  async getGroupBalances(groupId: string) {
    const res = await this.request(`/api/groups/${groupId}/balances`);
    return res.data;
  }

  async recordSettlement(groupId: string, payload: any) {
    const res = await this.request(`/api/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async updateSettlementStatus(groupId: string, settlementId: string, status: 'pending' | 'settled') {
    const res = await this.request(`/api/groups/${groupId}/settlements/${settlementId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  }
}

export const api = new ApiService();
