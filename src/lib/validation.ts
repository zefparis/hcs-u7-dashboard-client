import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  hcsCode: z.string()
    .min(50, "HCS-U7 code is too short")
    .regex(/^HCS-U7\|/, "Invalid HCS-U7 code format. Must start with 'HCS-U7|'"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeHcsCodeSchema = z.object({
  currentHcsCode: z.string()
    .min(50, "HCS-U7 code is too short")
    .regex(/^HCS-U7\|/, "Invalid HCS-U7 code format"),
  newHcsCode: z.string()
    .min(50, "HCS-U7 code is too short")
    .regex(/^HCS-U7\|/, "Invalid HCS-U7 code format"),
  confirmHcsCode: z.string(),
}).refine((data) => data.newHcsCode === data.confirmHcsCode, {
  message: "HCS codes don't match",
  path: ["confirmHcsCode"],
}).refine((data) => data.currentHcsCode !== data.newHcsCode, {
  message: "New HCS code must be different from current code",
  path: ["newHcsCode"],
});
