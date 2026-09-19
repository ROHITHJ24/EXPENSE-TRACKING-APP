import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

/**
 * Maps field names from database or payloads to natural human language.
 */
function humanizeFieldName(field: string): string {
  const map: Record<string, string> = {
    email: 'email address',
    password: 'password',
    name: 'name',
    title: 'title',
    amount: 'amount',
    categoryId: 'category',
    category: 'category',
    dueDay: 'due day',
    paidBy: 'payer',
    splitMethod: 'split method',
    splits: 'participants',
    paymentMethod: 'payment method',
    description: 'description',
  };
  return map[field] || field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

/**
 * Transforms technical database, framework, or operational errors
 * into clear, polite, and user-understandable sentences.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  let statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  let message: string = err.message || '';

  // 1. Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    const readableField = humanizeFieldName(err.path || 'item');
    message = `We couldn't locate the requested ${readableField}. Please double-check your selection and try again.`;
  }

  // 2. Handle MongoDB Duplicate Key (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'email') {
      message = 'An account with this email address already exists. Please log in with your password or use a different email.';
    } else if (field === 'name' || field === 'title') {
      message = `An entry with this ${humanizeFieldName(field)} already exists. Please choose a different name.`;
    } else {
      message = 'This information already exists in your account. Please review your details and try again.';
    }
  }

  // 3. Handle Mongoose Schema Validation Errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    if (err.errors && typeof err.errors === 'object') {
      const fieldKeys = Object.keys(err.errors);
      const friendlyItems: string[] = [];

      for (const key of fieldKeys) {
        const item = err.errors[key];
        const fieldLabel = humanizeFieldName(key);

        if (item.kind === 'required') {
          friendlyItems.push(`Please provide a ${fieldLabel}`);
        } else if (item.kind === 'min') {
          friendlyItems.push(`The ${fieldLabel} is below the minimum allowed value`);
        } else if (item.kind === 'max') {
          friendlyItems.push(`The ${fieldLabel} exceeds the maximum allowed limit`);
        } else if (item.kind === 'minlength') {
          friendlyItems.push(`The ${fieldLabel} is too short`);
        } else if (item.kind === 'maxlength') {
          friendlyItems.push(`The ${fieldLabel} is too long`);
        } else if (item.message && !item.message.includes('Path `')) {
          friendlyItems.push(item.message);
        } else {
          friendlyItems.push(`Please enter a valid ${fieldLabel}`);
        }
      }

      message = friendlyItems.length > 0
        ? `${friendlyItems.join('. ')}.`
        : 'Some submitted information was incomplete or invalid. Please check the form and try again.';
    } else {
      message = 'Please check the entered details and make sure all required fields are filled correctly.';
    }
  }

  // 4. Handle JSON Web Token Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Your login session is invalid or has expired. Please sign in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your login session has expired for your security. Please log in again to continue.';
  }

  // 5. Handle Rate Limiting (429)
  else if (statusCode === 429) {
    message = 'You have made several requests in a short time. Please wait a moment and try again.';
  }

  // 6. Handle JSON body parse errors (e.g. malformed body)
  else if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    statusCode = 400;
    message = 'The data sent to the server was formatted incorrectly. Please refresh and try again.';
  }

  // 7. Handle 500 or unknown internal errors (never leak developer/database stack)
  else if (statusCode >= 500) {
    console.error('[Internal Server Error]', err);
    // Only keep message if it's an explicit operational AppError with a human-authored message
    if (
      err instanceof AppError &&
      err.isOperational &&
      message &&
      !message.toLowerCase().includes('mongo') &&
      !message.toLowerCase().includes('database') &&
      !message.toLowerCase().includes('uncaught') &&
      !message.toLowerCase().includes('syntax')
    ) {
      // Use the operational message
    } else {
      message = 'We encountered a momentary issue processing your request. Please try again in a few moments.';
    }
  }

  // 8. Catch any remaining raw technical default sentences
  if (!message || message.trim().toLowerCase() === 'error' || message === 'Something went wrong. Please try again.') {
    message = 'Something unexpected occurred. Please check your information and try again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
