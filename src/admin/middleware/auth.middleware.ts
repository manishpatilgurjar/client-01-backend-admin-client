import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminUserModel } from '../models/user.schema';
import { AdminMessages } from '../enums/messages';
const jwt = require('jsonwebtoken');

/**
 * Middleware to validate JWT access tokens for admin APIs.
 * - Checks for Bearer token in Authorization header
 * - Verifies JWT signature and expiry
 * - Validates that the user exists and is active
 * - Attaches user info to req.user
 * - Throws UnauthorizedException or ForbiddenException as appropriate
 */
@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Check for Authorization header
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(AdminMessages.LOGIN_MISSING_AUTH_HEADER);
      }
      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException(AdminMessages.LOGIN_MISSING_TOKEN);
      }
      // 2. Verify JWT
      let payload: any;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      } catch (err) {
        throw new UnauthorizedException(AdminMessages.LOGIN_INVALID_TOKEN);
      }
      // 3. Validate user existence and role
      const user = await AdminUserModel.findById(payload.id);
      if (!user || user.role !== 'admin') {
        throw new ForbiddenException(AdminMessages.LOGIN_USER_NOT_FOUND);
      }
      // 4. Attach user info to request for downstream use
      (req as any).user = {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      };
      next();
    } catch (err) {
      // Respond with error in standard NestJS way
      next(err);
    }
  }
} 