import { Group } from '../models/Group.js';
import { GroupExpense } from '../models/GroupExpense.js';
import { Settlement } from '../models/Settlement.js';
import { User } from '../models/User.js';
import {
  memoryStore,
  generateId,
  InMemoryGroup,
  InMemoryGroupExpense,
  InMemorySettlement,
} from './store.js';
import { getDBStatus } from '../config/db.js';
import { AppError } from '../utils/appError.js';

// Helper to compute split amounts based on method
export function calculateSplits(
  amount: number,
  splitMethod: 'equal' | 'custom' | 'percentage' | 'shares',
  splitsInput: { participantId: string; rawValue?: number; shareAmount?: number }[]
) {
  if (!splitsInput || splitsInput.length === 0) {
    throw new AppError('Participants list for split cannot be empty', 400);
  }

  const count = splitsInput.length;
  let computedSplits: { participantId: string; shareAmount: number; rawValue?: number }[] = [];

  if (splitMethod === 'equal') {
    const baseShare = Math.floor((amount / count) * 100) / 100;
    let remainder = Math.round((amount - baseShare * count) * 100) / 100;

    computedSplits = splitsInput.map((s, idx) => {
      let share = baseShare;
      if (remainder > 0) {
        share = Math.round((share + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      return {
        participantId: s.participantId,
        shareAmount: share,
        rawValue: 1,
      };
    });
  } else if (splitMethod === 'custom') {
    const totalCustom = splitsInput.reduce((sum, s) => sum + (Number(s.shareAmount) || 0), 0);
    const diff = Math.abs(totalCustom - amount);
    if (diff > 0.05) {
      throw new AppError(
        `Custom split total (₹${totalCustom.toFixed(2)}) must equal expense amount (₹${amount.toFixed(2)})`,
        400
      );
    }
    computedSplits = splitsInput.map((s) => ({
      participantId: s.participantId,
      shareAmount: Number(s.shareAmount) || 0,
      rawValue: Number(s.shareAmount) || 0,
    }));
  } else if (splitMethod === 'percentage') {
    const totalPct = splitsInput.reduce((sum, s) => sum + (Number(s.rawValue) || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new AppError(`Percentages must total exactly 100% (currently ${totalPct}%)`, 400);
    }

    let runningTotal = 0;
    computedSplits = splitsInput.map((s, idx) => {
      const pct = Number(s.rawValue) || 0;
      let share = Math.round(amount * (pct / 100) * 100) / 100;
      if (idx === count - 1) {
        // Adjust last participant to match exact total amount
        share = Math.round((amount - runningTotal) * 100) / 100;
      } else {
        runningTotal += share;
      }
      return {
        participantId: s.participantId,
        shareAmount: Math.max(0, share),
        rawValue: pct,
      };
    });
  } else if (splitMethod === 'shares') {
    const totalShares = splitsInput.reduce((sum, s) => sum + (Number(s.rawValue) || 0), 0);
    if (totalShares <= 0) {
      throw new AppError('Total shares must be greater than zero', 400);
    }

    let runningTotal = 0;
    computedSplits = splitsInput.map((s, idx) => {
      const shares = Number(s.rawValue) || 0;
      let share = Math.round(amount * (shares / totalShares) * 100) / 100;
      if (idx === count - 1) {
        share = Math.round((amount - runningTotal) * 100) / 100;
      } else {
        runningTotal += share;
      }
      return {
        participantId: s.participantId,
        shareAmount: Math.max(0, share),
        rawValue: shares,
      };
    });
  }

  return computedSplits;
}

// Check if user is authorized for group
export async function verifyGroupAccess(userId: string, groupId: string) {
  const dbStatus = getDBStatus();
  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const group = await Group.findById(groupId).lean();
    if (!group) throw new AppError('Group not found', 404);

    const isCreator = group.createdBy.toString() === userId;
    const isParticipant = group.participants.some(
      (p) => p.linkedUserId && p.linkedUserId.toString() === userId
    );

    if (!isCreator && !isParticipant) {
      throw new AppError('You are not authorized to access this group', 403);
    }
    return group;
  } else {
    const group = memoryStore.groups.find((g) => g._id === groupId);
    if (!group) throw new AppError('Group not found', 404);

    const isCreator = group.createdBy === userId;
    const isParticipant = group.participants.some((p) => p.linkedUserId === userId);

    if (!isCreator && !isParticipant) {
      throw new AppError('You are not authorized to access this group', 403);
    }
    return group;
  }
}

// 1. Create Group
export async function createGroup(
  userId: string,
  data: { name: string; description?: string; participants: string[] }
) {
  const dbStatus = getDBStatus();
  const trimmedName = data.name.trim();
  if (!trimmedName) throw new AppError('Group name is required', 400);

  // Fetch current user name
  let userName = 'You';
  if (dbStatus.isAtlas) {
    const u = await User.findById(userId).lean();
    if (u) userName = u.name;
  } else {
    const u = memoryStore.users.find((user) => user._id === userId);
    if (u) userName = u.name;
  }

  // Participants list starts with the user
  const initialParticipants = [
    {
      _id: generateId(),
      name: userName,
      email: '',
      linkedUserId: userId,
    },
  ];

  // Add other participants
  if (Array.isArray(data.participants)) {
    data.participants.forEach((pName) => {
      const cleanName = (pName || '').trim();
      if (cleanName && cleanName.toLowerCase() !== userName.toLowerCase()) {
        initialParticipants.push({
          _id: generateId(),
          name: cleanName,
          email: '',
          linkedUserId: null as any,
        });
      }
    });
  }

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const group = await Group.create({
      name: trimmedName,
      description: (data.description || '').trim(),
      createdBy: mongoose.Types.ObjectId.createFromHexString(userId),
      participants: initialParticipants.map((p) => ({
        _id: p._id,
        name: p.name,
        email: p.email,
        ...(p.linkedUserId
          ? { linkedUserId: mongoose.Types.ObjectId.createFromHexString(p.linkedUserId) }
          : {}),
      })),
    });
    return group;
  } else {
    const newGroup: InMemoryGroup = {
      _id: generateId(),
      name: trimmedName,
      description: (data.description || '').trim(),
      createdBy: userId,
      participants: initialParticipants,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.groups.push(newGroup);
    return newGroup;
  }
}

// 2. Get User Groups with Summary Balances
export async function getUserGroups(userId: string) {
  const dbStatus = getDBStatus();
  let groups: any[] = [];

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

    groups = await Group.find({
      $or: [{ createdBy: userObjectId }, { 'participants.linkedUserId': userObjectId }],
    })
      .sort({ updatedAt: -1 })
      .lean();
  } else {
    groups = memoryStore.groups
      .filter((g) => g.createdBy === userId || g.participants.some((p) => p.linkedUserId === userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Enrich each group with balances & counts
  const enrichedGroups = await Promise.all(
    groups.map(async (g) => {
      const gId = g._id.toString();
      const balancesData = await calculateGroupBalances(userId, gId);

      // Identify user's participant profile
      const userParticipant = g.participants.find(
        (p: any) =>
          (p.linkedUserId && p.linkedUserId.toString() === userId) ||
          (g.createdBy && g.createdBy.toString() === userId && p.name.toLowerCase() === 'you') ||
          (p.linkedUserId === userId)
      ) || g.participants[0];

      const userBalanceInfo = balancesData.balances.find(
        (b) => b.participantId === userParticipant?._id?.toString()
      );

      return {
        _id: gId,
        name: g.name,
        description: g.description,
        participantsCount: g.participants.length,
        totalSpent: balancesData.totalGroupExpenses,
        expensesCount: balancesData.totalExpensesCount,
        userNetBalance: userBalanceInfo ? userBalanceInfo.netBalance : 0,
        userPaid: userBalanceInfo ? userBalanceInfo.paidAmount : 0,
        userOwed: userBalanceInfo ? userBalanceInfo.owedAmount : 0,
        pendingSettlementsCount: balancesData.pendingSettlementsCount,
        createdAt: g.createdAt,
      };
    })
  );

  return enrichedGroups;
}

// 3. Get Group Details with Expenses, Balances, and Settlements
export async function getGroupDetails(userId: string, groupId: string) {
  const group = await verifyGroupAccess(userId, groupId);
  const balancesData = await calculateGroupBalances(userId, groupId);

  const dbStatus = getDBStatus();
  let expenses: any[] = [];
  let settlements: any[] = [];

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const groupObjectId = mongoose.Types.ObjectId.createFromHexString(groupId);

    expenses = await GroupExpense.find({ groupId: groupObjectId })
      .sort({ date: -1, createdAt: -1 })
      .populate('categoryId', 'name icon color')
      .lean();

    settlements = await Settlement.find({ groupId: groupObjectId })
      .sort({ createdAt: -1 })
      .lean();
  } else {
    expenses = memoryStore.groupExpenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((e) => {
        const cat = memoryStore.categories.find((c) => c._id === e.categoryId);
        return {
          ...e,
          categoryId: cat
            ? { _id: cat._id, name: cat.name, icon: cat.icon, color: cat.color }
            : null,
        };
      });

    settlements = memoryStore.settlements
      .filter((s) => s.groupId === groupId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Resolve names for expenses
  const participantMap = new Map<string, string>();
  group.participants.forEach((p: any) => {
    participantMap.set(p._id.toString(), p.name);
  });

  const formattedExpenses = expenses.map((e: any) => ({
    ...e,
    _id: e._id.toString(),
    payerName: participantMap.get(e.paidBy?.toString()) || 'Unknown',
    splits: (e.splits || []).map((s: any) => ({
      ...s,
      participantName: participantMap.get(s.participantId?.toString()) || 'Participant',
    })),
  }));

  const formattedSettlements = settlements.map((s: any) => ({
    ...s,
    _id: s._id.toString(),
    fromName: participantMap.get(s.fromParticipantId?.toString()) || 'Unknown',
    toName: participantMap.get(s.toParticipantId?.toString()) || 'Unknown',
  }));

  return {
    group: {
      _id: group._id.toString(),
      name: group.name,
      description: group.description,
      createdBy: group.createdBy.toString(),
      participants: group.participants.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        email: p.email,
        linkedUserId: p.linkedUserId ? p.linkedUserId.toString() : null,
      })),
      createdAt: group.createdAt,
    },
    balances: balancesData.balances,
    suggestedSettlements: balancesData.suggestedSettlements,
    expenses: formattedExpenses,
    settlements: formattedSettlements,
    summary: {
      totalSpent: balancesData.totalGroupExpenses,
      expensesCount: formattedExpenses.length,
      pendingSettlementsCount: balancesData.pendingSettlementsCount,
    },
  };
}

// 4. Add Participant to Group
export async function addParticipant(
  userId: string,
  groupId: string,
  data: { name: string; email?: string }
) {
  const group = await verifyGroupAccess(userId, groupId);
  const cleanName = data.name.trim();
  if (!cleanName) throw new AppError('Participant name is required', 400);

  const existing = group.participants.find(
    (p: any) => p.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existing) {
    throw new AppError('A participant with this name already exists in this group', 400);
  }

  const newParticipant = {
    _id: generateId(),
    name: cleanName,
    email: (data.email || '').trim().toLowerCase(),
    linkedUserId: null as any,
  };

  const dbStatus = getDBStatus();
  if (dbStatus.isAtlas) {
    await Group.findByIdAndUpdate(groupId, {
      $push: { participants: newParticipant },
      $set: { updatedAt: new Date() },
    });
  } else {
    const g = memoryStore.groups.find((grp) => grp._id === groupId);
    if (g) {
      g.participants.push(newParticipant);
      g.updatedAt = new Date();
    }
  }

  return newParticipant;
}

// 5. Remove Participant from Group
export async function removeParticipant(userId: string, groupId: string, participantId: string) {
  const group = await verifyGroupAccess(userId, groupId);

  // Check if participant has expenses or splits
  const dbStatus = getDBStatus();
  let hasExpenses = false;

  if (dbStatus.isAtlas) {
    const expCount = await GroupExpense.countDocuments({
      groupId,
      $or: [{ paidBy: participantId }, { 'splits.participantId': participantId }],
    });
    hasExpenses = expCount > 0;
  } else {
    hasExpenses = memoryStore.groupExpenses.some(
      (e) =>
        e.groupId === groupId &&
        (e.paidBy === participantId || e.splits.some((s) => s.participantId === participantId))
    );
  }

  if (hasExpenses) {
    throw new AppError(
      'Cannot remove participant who has recorded expenses or owes shares. Please settle or reassign first.',
      400
    );
  }

  if (dbStatus.isAtlas) {
    await Group.findByIdAndUpdate(groupId, {
      $pull: { participants: { _id: participantId } },
      $set: { updatedAt: new Date() },
    });
  } else {
    const g = memoryStore.groups.find((grp) => grp._id === groupId);
    if (g) {
      g.participants = g.participants.filter((p) => p._id !== participantId);
      g.updatedAt = new Date();
    }
  }

  return { message: 'Participant removed' };
}

// 6. Add Group Expense
export async function addGroupExpense(
  userId: string,
  groupId: string,
  data: {
    title: string;
    amount: number;
    date?: string | Date;
    categoryId?: string;
    paidBy: string;
    splitMethod: 'equal' | 'custom' | 'percentage' | 'shares';
    splits: { participantId: string; rawValue?: number; shareAmount?: number }[];
  }
) {
  const group = await verifyGroupAccess(userId, groupId);
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new AppError('Amount must be a positive number', 400);
  }

  // Validate paidBy is a participant
  const payerExists = group.participants.some((p: any) => p._id.toString() === data.paidBy);
  if (!payerExists) {
    throw new AppError('The selected payer is not a participant in this group', 400);
  }

  // Calculate authoritative splits
  const calculatedSplits = calculateSplits(amount, data.splitMethod, data.splits);

  const dbStatus = getDBStatus();
  const expenseDate = data.date ? new Date(data.date) : new Date();

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const doc = await GroupExpense.create({
      groupId: mongoose.Types.ObjectId.createFromHexString(groupId),
      title: data.title.trim(),
      amount,
      date: expenseDate,
      ...(data.categoryId
        ? { categoryId: mongoose.Types.ObjectId.createFromHexString(data.categoryId) }
        : {}),
      paidBy: data.paidBy,
      splitMethod: data.splitMethod,
      splits: calculatedSplits,
      createdBy: mongoose.Types.ObjectId.createFromHexString(userId),
    });

    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });
    return doc;
  } else {
    const newExpense: InMemoryGroupExpense = {
      _id: generateId(),
      groupId,
      title: data.title.trim(),
      amount,
      date: expenseDate,
      categoryId: data.categoryId || null,
      paidBy: data.paidBy,
      splitMethod: data.splitMethod,
      splits: calculatedSplits,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.groupExpenses.push(newExpense);
    const g = memoryStore.groups.find((grp) => grp._id === groupId);
    if (g) g.updatedAt = new Date();
    return newExpense;
  }
}

// 7. Delete Group Expense
export async function deleteGroupExpense(userId: string, groupId: string, expenseId: string) {
  await verifyGroupAccess(userId, groupId);
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const res = await GroupExpense.findOneAndDelete({ _id: expenseId, groupId });
    if (!res) throw new AppError('Group expense not found', 404);
  } else {
    const idx = memoryStore.groupExpenses.findIndex(
      (e) => e._id === expenseId && e.groupId === groupId
    );
    if (idx === -1) throw new AppError('Group expense not found', 404);
    memoryStore.groupExpenses.splice(idx, 1);
  }

  return { message: 'Group expense deleted' };
}

// 8. Calculate Group Balances & Settlement Engine
export async function calculateGroupBalances(userId: string, groupId: string) {
  const group = await verifyGroupAccess(userId, groupId);
  const dbStatus = getDBStatus();

  let expenses: any[] = [];
  let settlements: any[] = [];

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const groupObjectId = mongoose.Types.ObjectId.createFromHexString(groupId);

    expenses = await GroupExpense.find({ groupId: groupObjectId }).lean();
    settlements = await Settlement.find({ groupId: groupObjectId }).lean();
  } else {
    expenses = memoryStore.groupExpenses.filter((e) => e.groupId === groupId);
    settlements = memoryStore.settlements.filter((s) => s.groupId === groupId);
  }

  // Build balance tally per participant
  const participantBalanceMap = new Map<
    string,
    {
      participantId: string;
      name: string;
      paidAmount: number;
      owedAmount: number;
      settlementsPaid: number;
      settlementsReceived: number;
      netBalance: number;
    }
  >();

  group.participants.forEach((p: any) => {
    const pId = p._id.toString();
    participantBalanceMap.set(pId, {
      participantId: pId,
      name: p.name,
      paidAmount: 0,
      owedAmount: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      netBalance: 0,
    });
  });

  let totalGroupExpenses = 0;

  // Process expenses
  expenses.forEach((e: any) => {
    totalGroupExpenses += Number(e.amount) || 0;
    const payer = participantBalanceMap.get(e.paidBy?.toString());
    if (payer) {
      payer.paidAmount += Number(e.amount) || 0;
    }

    (e.splits || []).forEach((s: any) => {
      const debtor = participantBalanceMap.get(s.participantId?.toString());
      if (debtor) {
        debtor.owedAmount += Number(s.shareAmount) || 0;
      }
    });
  });

  // Process completed settlements
  let pendingSettlementsCount = 0;
  settlements.forEach((s: any) => {
    if (s.status === 'settled') {
      const fromP = participantBalanceMap.get(s.fromParticipantId?.toString());
      const toP = participantBalanceMap.get(s.toParticipantId?.toString());
      if (fromP) fromP.settlementsPaid += Number(s.amount) || 0;
      if (toP) toP.settlementsReceived += Number(s.amount) || 0;
    } else {
      pendingSettlementsCount++;
    }
  });

  // Calculate Net Balances
  // Net = (paidAmount + settlementsPaid) - (owedAmount + settlementsReceived)
  // Positive (+): Should receive money
  // Negative (-): Owes money
  const balancesList = Array.from(participantBalanceMap.values()).map((p) => {
    const net = Math.round((p.paidAmount + p.settlementsPaid - (p.owedAmount + p.settlementsReceived)) * 100) / 100;
    return {
      ...p,
      netBalance: net,
    };
  });

  // Simplified Settlement Minimization Algorithm (Greedy Debt Reduction)
  // Separate into debtors (net < -0.01) and creditors (net > 0.01)
  const debtors: { participantId: string; name: string; amountOwed: number }[] = [];
  const creditors: { participantId: string; name: string; amountToReceive: number }[] = [];

  balancesList.forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({
        participantId: b.participantId,
        name: b.name,
        amountOwed: Math.abs(b.netBalance),
      });
    } else if (b.netBalance > 0.01) {
      creditors.push({
        participantId: b.participantId,
        name: b.name,
        amountToReceive: b.netBalance,
      });
    }
  });

  // Sort descending
  debtors.sort((a, b) => b.amountOwed - a.amountOwed);
  creditors.sort((a, b) => b.amountToReceive - a.amountToReceive);

  const suggestedSettlements: {
    fromParticipantId: string;
    fromName: string;
    toParticipantId: string;
    toName: string;
    amount: number;
  }[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.amountOwed, creditor.amountToReceive);
    const roundedAmount = Math.round(settleAmount * 100) / 100;

    if (roundedAmount > 0) {
      suggestedSettlements.push({
        fromParticipantId: debtor.participantId,
        fromName: debtor.name,
        toParticipantId: creditor.participantId,
        toName: creditor.name,
        amount: roundedAmount,
      });
    }

    debtor.amountOwed = Math.round((debtor.amountOwed - roundedAmount) * 100) / 100;
    creditor.amountToReceive = Math.round((creditor.amountToReceive - roundedAmount) * 100) / 100;

    if (debtor.amountOwed < 0.01) dIdx++;
    if (creditor.amountToReceive < 0.01) cIdx++;
  }

  return {
    totalGroupExpenses,
    totalExpensesCount: expenses.length,
    pendingSettlementsCount,
    balances: balancesList,
    suggestedSettlements,
  };
}

// 9. Record or Mark Settlement
export async function recordSettlement(
  userId: string,
  groupId: string,
  data: {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number;
    notes?: string;
    status?: 'pending' | 'settled';
  }
) {
  await verifyGroupAccess(userId, groupId);
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new AppError('Settlement amount must be greater than 0', 400);
  }

  const status = data.status || 'settled';
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const mongoose = (await import('mongoose')).default;
    const doc = await Settlement.create({
      groupId: mongoose.Types.ObjectId.createFromHexString(groupId),
      fromParticipantId: data.fromParticipantId,
      toParticipantId: data.toParticipantId,
      amount,
      notes: (data.notes || '').trim(),
      status,
      ...(status === 'settled' ? { settledAt: new Date() } : {}),
      createdBy: mongoose.Types.ObjectId.createFromHexString(userId),
    });
    return doc;
  } else {
    const newSettlement: InMemorySettlement = {
      _id: generateId(),
      groupId,
      fromParticipantId: data.fromParticipantId,
      toParticipantId: data.toParticipantId,
      amount,
      notes: (data.notes || '').trim(),
      status,
      settledAt: status === 'settled' ? new Date() : undefined,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.settlements.push(newSettlement);
    return newSettlement;
  }
}

// 10. Update Settlement Status (e.g. Mark as Settled)
export async function updateSettlementStatus(
  userId: string,
  groupId: string,
  settlementId: string,
  status: 'pending' | 'settled'
) {
  await verifyGroupAccess(userId, groupId);
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const doc = await Settlement.findOneAndUpdate(
      { _id: settlementId, groupId },
      {
        $set: {
          status,
          settledAt: status === 'settled' ? new Date() : null,
        },
      },
      { new: true }
    );
    if (!doc) throw new AppError('Settlement not found', 404);
    return doc;
  } else {
    const idx = memoryStore.settlements.findIndex(
      (s) => s._id === settlementId && s.groupId === groupId
    );
    if (idx === -1) throw new AppError('Settlement not found', 404);
    memoryStore.settlements[idx].status = status;
    memoryStore.settlements[idx].settledAt = status === 'settled' ? new Date() : undefined;
    memoryStore.settlements[idx].updatedAt = new Date();
    return memoryStore.settlements[idx];
  }
}
