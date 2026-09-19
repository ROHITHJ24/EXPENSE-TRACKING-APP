import { Transaction } from '../models/Transaction.js';
import { memoryStore } from './store.js';
import { getDBStatus } from '../config/db.js';
import { getBudgets } from './budget.service.js';
import { getUpcomingCommitments } from './recurring.service.js';

export async function getDashboardSummary(userId: string) {
  const dbStatus = getDBStatus();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    // All-time totals
    const totals = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    totals.forEach((item: any) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    const totalBalance = totalIncome - totalExpense;

    // Monthly totals (current month)
    const monthTotals = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    monthTotals.forEach((item: any) => {
      if (item._id === 'income') monthlyIncome = item.total;
      if (item._id === 'expense') monthlyExpense = item.total;
    });

    // Category breakdown for expenses
    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]);

    const categoryBreakdown = categoryAgg.map((item: any) => ({
      categoryId: item._id?.toString(),
      name: item.category?.name || 'Uncategorized',
      icon: item.category?.icon || 'Tag',
      color: item.category?.color || 'blue',
      amount: item.total,
      percentage: monthlyExpense > 0 ? Math.round((item.total / monthlyExpense) * 100) : 0,
    }));

    // Recent 5 transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate('categoryId', 'name type icon color')
      .lean();

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      categoryBreakdown,
      recentTransactions: recentTransactions.map((t: any) => ({
        ...t,
        category: t.categoryId,
        categoryId: t.categoryId?._id || t.categoryId,
      })),
    };
  } else {
    // Memory store
    const userTransactions = memoryStore.transactions.filter((t) => t.userId === userId);

    let totalIncome = 0;
    let totalExpense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const startMs = startOfMonth.getTime();
    const endMs = endOfMonth.getTime();

    const expenseByCategory: { [catId: string]: number } = {};

    userTransactions.forEach((t) => {
      const txTime = new Date(t.date).getTime();
      const inCurrentMonth = txTime >= startMs && txTime <= endMs;

      if (t.type === 'income') {
        totalIncome += t.amount;
        if (inCurrentMonth) monthlyIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (inCurrentMonth) {
          monthlyExpense += t.amount;
          expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
        }
      }
    });

    const categoryBreakdown = Object.entries(expenseByCategory)
      .map(([catId, amount]) => {
        const cat = memoryStore.categories.find((c) => c._id === catId);
        return {
          categoryId: catId,
          name: cat?.name || 'Uncategorized',
          icon: cat?.icon || 'Tag',
          color: cat?.color || 'blue',
          amount,
          percentage: monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const sortedRecent = [...userTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t) => {
        const cat = memoryStore.categories.find((c) => c._id === t.categoryId);
        return {
          ...t,
          category: cat
            ? { _id: cat._id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }
            : null,
        };
      });

    return {
      totalBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
      categoryBreakdown,
      recentTransactions: sortedRecent,
    };
  }
}

export async function getDashboardAnalytics(userId: string) {
  const dbStatus = getDBStatus();
  const summary = await getDashboardSummary(userId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // 1. Fetch user's budgets for the current month
  const userBudgets = await getBudgets(userId, currentMonth + 1, currentYear);
  const totalBudget = (userBudgets || []).reduce((acc: number, b: any) => acc + (b.amount || 0), 0);

  // 2. Fetch upcoming recurring commitments for the remainder of this month
  const commitmentsData = await getUpcomingCommitments(userId, now);
  const upcomingCommitments = commitmentsData.totalUpcoming || 0;

  // 3. Calculate Safe-to-Spend
  const { totalBalance, monthlyIncome, monthlyExpense } = summary;
  const hasTransactions = summary.recentTransactions && summary.recentTransactions.length > 0;
  const hasSufficientData = hasTransactions || monthlyIncome > 0 || totalBalance > 0 || totalBudget > 0;

  let safeToSpendAmount = 0;
  let notice: string | null = null;

  if (!hasSufficientData) {
    notice = 'Add your income and upcoming expenses to calculate your Safe-to-Spend amount.';
  } else if (totalBalance <= 0) {
    safeToSpendAmount = 0;
    notice = 'Available balance is zero or negative. Focus on essential upcoming commitments.';
  } else {
    // If user has configured monthly budgets:
    if (totalBudget > 0) {
      const budgetRemaining = Math.max(0, totalBudget - monthlyExpense);
      const balanceAfterCommitments = Math.max(0, totalBalance - upcomingCommitments);
      const budgetAfterCommitments = Math.max(0, budgetRemaining - upcomingCommitments);
      safeToSpendAmount = Math.min(balanceAfterCommitments, budgetAfterCommitments);
    } else {
      // If no budget is configured, use available balance minus commitments
      safeToSpendAmount = Math.max(0, totalBalance - upcomingCommitments);
    }
  }

  const dailyGuideline = safeToSpendAmount > 0 ? Math.floor(safeToSpendAmount / daysRemaining) : 0;

  const safeToSpend = {
    amount: Math.round(safeToSpendAmount),
    daysRemaining,
    dailyGuideline,
    upcomingCommitments,
    totalBudget,
    totalBudgetRemaining: totalBudget > 0 ? Math.max(0, totalBudget - monthlyExpense) : 0,
    hasSufficientData,
    notice,
    disclaimer: 'Budgeting estimate based on your recorded transactions and commitments, not professional financial advice.',
  };

  // 4. Calculate last 6 months trend
  const months: { label: string; year: number; month: number; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    months.push({
      label,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      income: 0,
      expense: 0,
    });
  }

  // 5. Month-to-Month comparison (Current Month vs Last Month)
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
  const thisMonthStart = new Date(currentYear, currentMonth, 1);
  const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  let currentCategoryExpenses: { [catName: string]: number } = {};
  let lastCategoryExpenses: { [catName: string]: number } = {};
  let highestExpense: any = null;
  let averageExpense = 0;
  let totalTransactionsCount = 0;

  // Real data analysis for Insights
  let insights: string[] = [];

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
    const trendAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    trendAgg.forEach((item: any) => {
      const match = months.find((m) => m.year === item._id.year && m.month === item._id.month);
      if (match) {
        if (item._id.type === 'income') match.income = item.total;
        if (item._id.type === 'expense') match.expense = item.total;
      }
    });

    const highestExpenseDoc = await Transaction.findOne({ userId, type: 'expense' })
      .sort({ amount: -1 })
      .populate('categoryId', 'name')
      .lean();

    if (highestExpenseDoc) {
      highestExpense = {
        amount: highestExpenseDoc.amount,
        description: highestExpenseDoc.description || 'Expense',
        date: highestExpenseDoc.date,
        categoryName: (highestExpenseDoc.categoryId as any)?.name || 'Expense',
      };
    }

    const expenseCountAgg = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        },
      },
    ]);

    expenseCountAgg.forEach((item: any) => {
      totalTransactionsCount += item.count;
      if (item._id === 'expense') {
        averageExpense = Math.round(item.avg || 0);
      }
    });

    // Month-to-Month Category Aggregations
    const monthCompAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: lastMonthStart, $lte: thisMonthEnd },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          amount: 1,
          date: 1,
          categoryName: { $ifNull: ['$category.name', 'General'] },
        },
      },
    ]);

    monthCompAgg.forEach((tx: any) => {
      const txTime = new Date(tx.date).getTime();
      const catName = tx.categoryName;
      if (txTime >= thisMonthStart.getTime() && txTime <= thisMonthEnd.getTime()) {
        currentCategoryExpenses[catName] = (currentCategoryExpenses[catName] || 0) + tx.amount;
      } else if (txTime >= lastMonthStart.getTime() && txTime <= lastMonthEnd.getTime()) {
        lastCategoryExpenses[catName] = (lastCategoryExpenses[catName] || 0) + tx.amount;
      }
    });
  } else {
    // Memory store
    const userTx = memoryStore.transactions.filter((t) => t.userId === userId);
    totalTransactionsCount = userTx.length;

    userTx.forEach((t) => {
      const txDate = new Date(t.date);
      const match = months.find(
        (m) => m.year === txDate.getFullYear() && m.month === txDate.getMonth() + 1
      );
      if (match) {
        if (t.type === 'income') match.income += t.amount;
        if (t.type === 'expense') match.expense += t.amount;
      }

      // Categorize for comparison
      if (t.type === 'expense') {
        const cat = memoryStore.categories.find((c) => c._id === t.categoryId);
        const catName = cat?.name || 'General';
        const txTime = txDate.getTime();
        if (txTime >= thisMonthStart.getTime() && txTime <= thisMonthEnd.getTime()) {
          currentCategoryExpenses[catName] = (currentCategoryExpenses[catName] || 0) + t.amount;
        } else if (txTime >= lastMonthStart.getTime() && txTime <= lastMonthEnd.getTime()) {
          lastCategoryExpenses[catName] = (lastCategoryExpenses[catName] || 0) + t.amount;
        }
      }
    });

    const expenses = userTx.filter((t) => t.type === 'expense');
    if (expenses.length > 0) {
      const highest = expenses.reduce((max, t) => (t.amount > max.amount ? t : max), expenses[0]);
      const highestCat = memoryStore.categories.find((c) => c._id === highest.categoryId);
      highestExpense = {
        amount: highest.amount,
        description: highest.description || 'Expense',
        date: highest.date,
        categoryName: highestCat?.name || 'Expense',
      };
      averageExpense = Math.round(expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length);
    }
  }

  // Build Month-to-Month comparison items
  const allCompCategories = Array.from(
    new Set([...Object.keys(currentCategoryExpenses), ...Object.keys(lastCategoryExpenses)])
  );

  const comparisonCategories = allCompCategories
    .map((name) => {
      const current = currentCategoryExpenses[name] || 0;
      const previous = lastCategoryExpenses[name] || 0;
      const diff = current - previous;
      const percentChange =
        previous > 0
          ? Math.round((diff / previous) * 100)
          : current > 0
          ? 100
          : 0;

      return {
        name,
        current,
        previous,
        diff,
        absDiff: Math.abs(diff),
        percentChange,
        direction: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('same' as const),
      };
    })
    .sort((a, b) => b.absDiff - a.absDiff);

  // Generate concise explanation for Month-to-Month
  let comparisonSummary = 'Spending is currently consistent with last month.';
  if (comparisonCategories.length > 0) {
    const increased = comparisonCategories.filter((c) => c.direction === 'up' && c.diff >= 100);
    const decreased = comparisonCategories.filter((c) => c.direction === 'down' && Math.abs(c.diff) >= 100);

    if (increased.length > 0 && decreased.length > 0) {
      comparisonSummary = `Your spending increased mainly because of ${increased[0].name} (+₹${increased[0].diff.toLocaleString('en-IN')}), while ${decreased[0].name} decreased by ₹${Math.abs(decreased[0].diff).toLocaleString('en-IN')}.`;
    } else if (increased.length > 0) {
      const topNames = increased.slice(0, 2).map((c) => `${c.name} (+₹${c.diff.toLocaleString('en-IN')})`).join(' and ');
      comparisonSummary = `Your spending increased mainly because of ${topNames}.`;
    } else if (decreased.length > 0) {
      const topNames = decreased.slice(0, 2).map((c) => `${c.name} (-₹${Math.abs(c.diff).toLocaleString('en-IN')})`).join(' and ');
      comparisonSummary = `Your spending decreased across ${topNames} compared to last month.`;
    }
  }

  // 6. Generate grounded Insights
  if (hasTransactions) {
    // Insight 1: Budget utilization vs calendar pacing
    if (totalBudget > 0) {
      const percentBudgetUsed = Math.round((monthlyExpense / totalBudget) * 100);
      const percentMonthPassed = Math.round((currentDay / totalDaysInMonth) * 100);
      if (percentBudgetUsed <= percentMonthPassed && percentBudgetUsed < 85) {
        insights.push(`Your spending is on track with your budget (${percentBudgetUsed}% utilized with ${daysRemaining} days left).`);
      } else if (percentBudgetUsed > 90) {
        insights.push(`You have reached ${percentBudgetUsed}% of your monthly budget.`);
      }
    }

    // Insight 2: Category surge
    const highestIncrease = comparisonCategories.find((c) => c.direction === 'up' && c.diff >= 500);
    if (highestIncrease) {
      insights.push(`${highestIncrease.name} is ₹${highestIncrease.diff.toLocaleString('en-IN')} higher than your usual monthly spending.`);
    }

    // Insight 3: Daily pace vs previous average
    if (averageExpense > 0 && monthlyExpense > 0) {
      const dailyExpenseRunRate = monthlyExpense / Math.max(1, currentDay);
      if (dailyExpenseRunRate < averageExpense) {
        insights.push("You're currently spending below your monthly spending average.");
      }
    }

    // Insight 4: Safe-to-spend guideline note
    if (safeToSpendAmount > 0 && dailyGuideline > 0) {
      insights.push(`Based on your remaining balance and commitments, keeping daily spending under ₹${dailyGuideline.toLocaleString('en-IN')} keeps you safe through month-end.`);
    }
  }

  // Ensure we have at least 1-2 helpful insights if user has transactions
  if (insights.length === 0 && hasTransactions) {
    if (safeToSpendAmount > 0) {
      insights.push(`You have ₹${safeToSpendAmount.toLocaleString('en-IN')} available for the next ${daysRemaining} days.`);
    } else {
      insights.push('Log upcoming recurring bills to keep your safe-to-spend guideline accurate.');
    }
  }

  return {
    ...summary,
    safeToSpend,
    monthlyTrend: months,
    highestExpense,
    averageExpense,
    totalTransactionsCount,
    monthComparison: {
      categories: comparisonCategories.slice(0, 5),
      summary: comparisonSummary,
    },
    spendingInsights: insights.slice(0, 4),
    upcomingCommitmentsList: commitmentsData.commitments,
  };
}
