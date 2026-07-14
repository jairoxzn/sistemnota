import { asyncHandler } from '../utils/asyncHandler.js';
import { userService } from '../services/user.service.js';

export const userController = {
  list: asyncHandler(async (req, res) => {
    const result = await userService.list(req.validatedQuery);
    res.json({ success: true, ...result });
  }),

  create: asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, user });
  }),

  update: asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body, req.user.id);
    res.json({ success: true, user });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await userService.resetPassword(req.params.id, req.body.password);
    res.json({ success: true });
  }),
};
