import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const setupAdminSchema = z
  .object({
    name: z.string().min(2, "Nome é obrigatório"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const verifyEmailCodeSchema = z.object({
  code: z
    .string()
    .min(6, "Informe o código de 6 dígitos")
    .max(6, "O código tem 6 dígitos")
    .regex(/^\d{6}$/, "O código deve conter apenas números"),
});

export const leadSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa é obrigatório"),
  contact_name: z.string().min(2, "Nome do contato é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  city: z.string().min(2, "Cidade é obrigatória"),
  niche: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["novo", "contato", "proposta", "fechado", "perdido"]),
  freelancer_id: z.string().uuid().optional(),
});

export const freelancerSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const freelancerUpdateSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  active: z.boolean(),
});

export const settingsSchema = z.object({
  default_sale_value: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Valor inválido")
  ),
  default_commission: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Comissão inválida")
  ),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type SetupAdminFormData = z.infer<typeof setupAdminSchema>;
export type VerifyEmailCodeFormData = z.infer<typeof verifyEmailCodeSchema>;
export type LeadFormData = z.infer<typeof leadSchema>;
export type FreelancerFormData = z.infer<typeof freelancerSchema>;
export type FreelancerUpdateFormData = z.infer<typeof freelancerUpdateSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
