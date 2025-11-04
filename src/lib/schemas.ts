import { z } from "zod";

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Profile Schemas
export const createProfileSchema = z.object({
  type: z.enum(["hypeman", "spotlight"]),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100),
  publicBio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  visibility: z.enum(["public", "private"]).default("public"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  publicBio: z.string().max(500).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  payoutInfo: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountName: z.string().optional(),
    })
    .optional(),
});

// Event Schemas
export const createEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters").max(100),
  location: z
    .string()
    .min(3, "Location must be at least 3 characters")
    .max(200),
});

export const updateEventSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  location: z.string().min(3).max(200).optional(),
  isActive: z.boolean().optional(),
});

// Hype Message Schemas
export const createHypeMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long"),
  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(100, "Minimum amount is 100 Naira"),
  senderName: z
    .string()
    .min(2, "Sender name must be at least 2 characters")
    .max(100)
    .optional(),
});

export const updateHypeMessageSchema = z.object({
  status: z.enum(["new", "hyped"]),
});

// Withdrawal Schemas
export const withdrawalSchema = z.object({
  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(1000, "Minimum withdrawal is 1000 Naira"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().regex(/^\d{10,}$/, "Invalid account number"),
  accountName: z.string().min(2, "Account name is required"),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateHypeMessageInput = z.infer<typeof createHypeMessageSchema>;
export type UpdateHypeMessageInput = z.infer<typeof updateHypeMessageSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
