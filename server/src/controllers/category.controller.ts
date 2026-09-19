import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as categoryService from '../services/category.service.js';

export async function getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getCategories(req.user!._id);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }
    const category = await categoryService.createCategory(req.user!._id, {
      name,
      type,
      icon,
      color,
    });
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(req.user!._id, id, req.body);
    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(req.user!._id, id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
