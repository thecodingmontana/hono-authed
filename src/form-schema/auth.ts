/** biome-ignore-all lint/performance/useTopLevelRegex: ignore all */

import { z } from "zod";

export const formSchema = z.object({
	email: z
		.email({
			message: "Please enter a valid email address",
		})
		.toLowerCase()
		.refine(
			(email) => {
				// Reject emails with consecutive dots
				return !email.includes("..");
			},
			{ message: "Email cannot contain consecutive dots" }
		)
		.refine(
			(email) => {
				// Basic domain validation (at least one dot after @)
				const domain = email.split("@")[1];
				return domain?.includes(".");
			},
			{ message: "Please enter a valid email domain" }
		),

	password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(128, {
			message: "Password is too long (max 128 characters)",
		})
		// At least one lowercase letter
		.refine((password) => /[a-z]/.test(password), {
			message: "Password must contain at least one lowercase letter",
		})
		// At least one uppercase letter
		.refine((password) => /[A-Z]/.test(password), {
			message: "Password must contain at least one uppercase letter",
		})
		// At least one digit
		.refine((password) => /\d/.test(password), {
			message: "Password must contain at least one number",
		})
		// At least one special character
		.refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
			message:
				'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
		})
		// No common weak patterns
		.refine(
			(password) => {
				const weakPatterns = [
					/^(.)\1+$/, // All same character
					/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
					/^(password|123456|qwerty|admin|letmein)/i, // Common passwords
				];
				return !weakPatterns.some((pattern) => pattern.test(password));
			},
			{ message: "Password is too weak - avoid common patterns and sequences" }
		)
		// No whitespace at start or end
		.refine((password) => password === password.trim(), {
			message: "Password cannot start or end with whitespace",
		}),
});

export const verifyCodeFormSchema = z.object({
	email: z
		.email({
			message: "Please enter a valid email address",
		})
		.toLowerCase()
		.refine(
			(email) => {
				// Reject emails with consecutive dots
				return !email.includes("..");
			},
			{ message: "Email cannot contain consecutive dots" }
		)
		.refine(
			(email) => {
				// Basic domain validation (at least one dot after @)
				const domain = email.split("@")[1];
				return domain?.includes(".");
			},
			{ message: "Please enter a valid email domain" }
		),

	password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(128, {
			message: "Password is too long (max 128 characters)",
		})
		// At least one lowercase letter
		.refine((password) => /[a-z]/.test(password), {
			message: "Password must contain at least one lowercase letter",
		})
		// At least one uppercase letter
		.refine((password) => /[A-Z]/.test(password), {
			message: "Password must contain at least one uppercase letter",
		})
		// At least one digit
		.refine((password) => /\d/.test(password), {
			message: "Password must contain at least one number",
		})
		// At least one special character
		.refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
			message:
				'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
		})
		// No common weak patterns
		.refine(
			(password) => {
				const weakPatterns = [
					/^(.)\1+$/, // All same character
					/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
					/^(password|123456|qwerty|admin|letmein)/i, // Common passwords
				];
				return !weakPatterns.some((pattern) => pattern.test(password));
			},
			{ message: "Password is too weak - avoid common patterns and sequences" }
		)
		// No whitespace at start or end
		.refine((password) => password === password.trim(), {
			message: "Password cannot start or end with whitespace",
		}),
	code: z.string().min(6, {
		message: "Verification code must be 6 characters.",
	}),
});

export const codeFormSchema = z.object({
	code: z.string().min(6, {
		message: "Verication code must be 6 characters.",
	}),
});

export const forgotPasswordFormSchema = z.object({
	email: z
		.email({
			message: "Please enter a valid email address",
		})
		.toLowerCase()
		.refine((email) => !email.includes(".."), {
			message: "Email cannot contain consecutive dots",
		})
		.refine(
			(email) => {
				const domain = email.split("@")[1];
				return domain?.includes(".");
			},
			{ message: "Please enter a valid email domain" }
		),
});

export const resetPasswordFormSchema = z.object({
	code: z.string().min(6, {
		message: "Verication code must be 6 characters.",
	}),
	new_password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(128, {
			message: "Password is too long (max 128 characters)",
		})
		// At least one lowercase letter
		.refine((password) => /[a-z]/.test(password), {
			message: "Password must contain at least one lowercase letter",
		})
		// At least one uppercase letter
		.refine((password) => /[A-Z]/.test(password), {
			message: "Password must contain at least one uppercase letter",
		})
		// At least one digit
		.refine((password) => /\d/.test(password), {
			message: "Password must contain at least one number",
		})
		// At least one special character
		.refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
			message:
				'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
		})
		// No common weak patterns
		.refine(
			(password) => {
				const weakPatterns = [
					/^(.)\1+$/, // All same character
					/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
					/^(password|123456|qwerty|admin|letmein)/i, // Common passwords
				];
				return !weakPatterns.some((pattern) => pattern.test(password));
			},
			{ message: "Password is too weak - avoid common patterns and sequences" }
		)
		// No whitespace at start or end
		.refine((password) => password === password.trim(), {
			message: "Password cannot start or end with whitespace",
		}),
});

export const resetPasswordActionSchema = z.object({
	email: z
		.email({
			message: "Please enter a valid email address",
		})
		.toLowerCase()
		.refine((email) => !email.includes(".."), {
			message: "Email cannot contain consecutive dots",
		})
		.refine(
			(email) => {
				const domain = email.split("@")[1];
				return domain?.includes(".");
			},
			{ message: "Please enter a valid email domain" }
		),
	code: z.string().min(6, {
		message: "Verication code must be 6 characters.",
	}),
	new_password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(128, {
			message: "Password is too long (max 128 characters)",
		})
		// At least one lowercase letter
		.refine((password) => /[a-z]/.test(password), {
			message: "Password must contain at least one lowercase letter",
		})
		// At least one uppercase letter
		.refine((password) => /[A-Z]/.test(password), {
			message: "Password must contain at least one uppercase letter",
		})
		// At least one digit
		.refine((password) => /\d/.test(password), {
			message: "Password must contain at least one number",
		})
		// At least one special character
		.refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
			message:
				'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
		})
		// No common weak patterns
		.refine(
			(password) => {
				const weakPatterns = [
					/^(.)\1+$/, // All same character
					/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
					/^(password|123456|qwerty|admin|letmein)/i, // Common passwords
				];
				return !weakPatterns.some((pattern) => pattern.test(password));
			},
			{ message: "Password is too weak - avoid common patterns and sequences" }
		)
		// No whitespace at start or end
		.refine((password) => password === password.trim(), {
			message: "Password cannot start or end with whitespace",
		}),
});
