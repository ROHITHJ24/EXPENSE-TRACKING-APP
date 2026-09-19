import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as groupService from '../services/group.service.js';

export async function createGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const group = await groupService.createGroup(req.user!._id, {
      name: req.body.name,
      description: req.body.description,
      participants: req.body.participants || [],
    });
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
}

export async function getUserGroups(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const groups = await groupService.getUserGroups(req.user!._id);
    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
}

export async function getGroupDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const details = await groupService.getGroupDetails(req.user!._id, req.params.groupId);
    res.json({ success: true, data: details });
  } catch (err) {
    next(err);
  }
}

export async function addParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const participant = await groupService.addParticipant(
      req.user!._id,
      req.params.groupId,
      req.body
    );
    res.status(201).json({ success: true, data: participant });
  } catch (err) {
    next(err);
  }
}

export async function removeParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await groupService.removeParticipant(
      req.user!._id,
      req.params.groupId,
      req.params.participantId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function addGroupExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const expense = await groupService.addGroupExpense(
      req.user!._id,
      req.params.groupId,
      req.body
    );
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

export async function deleteGroupExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await groupService.deleteGroupExpense(
      req.user!._id,
      req.params.groupId,
      req.params.expenseId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getGroupBalances(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const balances = await groupService.calculateGroupBalances(
      req.user!._id,
      req.params.groupId
    );
    res.json({ success: true, data: balances });
  } catch (err) {
    next(err);
  }
}

export async function recordSettlement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const settlement = await groupService.recordSettlement(
      req.user!._id,
      req.params.groupId,
      req.body
    );
    res.status(201).json({ success: true, data: settlement });
  } catch (err) {
    next(err);
  }
}

export async function updateSettlementStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const updated = await groupService.updateSettlementStatus(
      req.user!._id,
      req.params.groupId,
      req.params.settlementId,
      req.body.status
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
