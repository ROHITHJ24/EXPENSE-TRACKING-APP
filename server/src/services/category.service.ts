import { Category } from '../models/Category.js';
import { memoryStore, generateId } from './store.js';
import { getDBStatus } from '../config/db.js';
import { AppError } from '../utils/appError.js';

export async function getCategories(userId: string) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    // User categories + default categories
    return await Category.find({
      $or: [{ userId }, { isDefault: true }, { userId: null }],
    }).sort({ isDefault: -1, name: 1 });
  } else {
    return memoryStore.categories
      .filter((c) => c.isDefault || c.userId === userId || !c.userId)
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || a.name.localeCompare(b.name));
  }
}

export async function createCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense'; icon?: string; color?: string }
) {
  const dbStatus = getDBStatus();
  const trimmedName = data.name.trim();

  // Check duplicate
  const existing = await getCategories(userId);
  const duplicate = existing.find(
    (c: any) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.type === data.type
  );
  if (duplicate) {
    throw new AppError(`A category named "${trimmedName}" already exists for ${data.type}.`, 409);
  }

  if (dbStatus.isAtlas) {
    return await Category.create({
      userId,
      name: trimmedName,
      type: data.type,
      isDefault: false,
      icon: data.icon || 'Tag',
      color: data.color || 'blue',
    });
  } else {
    const newCat = {
      _id: generateId(),
      userId,
      name: trimmedName,
      type: data.type,
      isDefault: false,
      icon: data.icon || 'Tag',
      color: data.color || 'blue',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.categories.push(newCat);
    return newCat;
  }
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: { name?: string; icon?: string; color?: string }
) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      throw new AppError('Category not found or you do not have permission to modify it.', 404);
    }
    if (data.name) category.name = data.name.trim();
    if (data.icon) category.icon = data.icon;
    if (data.color) category.color = data.color;
    await category.save();
    return category;
  } else {
    const index = memoryStore.categories.findIndex((c) => c._id === categoryId && c.userId === userId);
    if (index === -1) {
      throw new AppError('Category not found or you do not have permission to modify it.', 404);
    }
    const cat = memoryStore.categories[index];
    if (data.name) cat.name = data.name.trim();
    if (data.icon) cat.icon = data.icon;
    if (data.color) cat.color = data.color;
    cat.updatedAt = new Date();
    return cat;
  }
}

export async function deleteCategory(userId: string, categoryId: string) {
  const dbStatus = getDBStatus();

  if (dbStatus.isAtlas) {
    const result = await Category.findOneAndDelete({ _id: categoryId, userId });
    if (!result) {
      throw new AppError('Category not found or cannot be deleted.', 404);
    }
    return true;
  } else {
    const index = memoryStore.categories.findIndex((c) => c._id === categoryId && c.userId === userId);
    if (index === -1) {
      throw new AppError('Category not found or cannot be deleted.', 404);
    }
    memoryStore.categories.splice(index, 1);
    return true;
  }
}
