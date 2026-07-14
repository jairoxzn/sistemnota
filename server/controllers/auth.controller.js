import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.json({ success: true, ...data });
  }),

  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, user });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ success: true, user });
  }),
};
