import {
  MembershipType,
  SwishPaymentStatus,
  SwishRefundStatus
} from "@prisma/client";
import { z } from "zod";

export const participantSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  consent: z.literal(true),
  note: z.string().optional(),
  busId: z.string(),
  member: z.boolean(),
  youth: z.boolean()
});

const SwishPaymentStatuses: [SwishPaymentStatus, ...SwishPaymentStatus[]] = [
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  Object.values(SwishPaymentStatus)[0]!,
  ...Object.values(SwishPaymentStatus).slice(1)
];

const SwishRefundStatuses: [SwishRefundStatus, ...SwishRefundStatus[]] = [
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  Object.values(SwishRefundStatus)[0]!,
  ...Object.values(SwishRefundStatus).slice(1)
];

export const swishCallbackPaymentSchema = z.object({
  id: z.string(),
  payeePaymentReference: z.string(),
  paymentReference: z.string(),
  callbackUrl: z.string(),
  payerAlias: z.string(),
  payeeAlias: z.string(),
  currency: z.string(),
  message: z.string(),
  errorMessage: z.string().nullable(),
  status: z.enum(SwishPaymentStatuses),
  amount: z.number(),
  dateCreated: z.string(),
  datePaid: z.string().nullable(),
  errorCode: z.string().nullable()
});

export const swishCallbackRefundSchema = z.object({
  amount: z.preprocess((val) => Number(val), z.number()),
  originalPaymentReference: z.string(),
  dateCreated: z.string(),
  datePaid: z.string().optional(),
  payerPaymentReference: z.string().nullable(),
  payerAlias: z.string(),
  callbackUrl: z.string(),
  currency: z.string(),
  id: z.string(),
  payeeAlias: z.string().nullable(),
  message: z.string(),
  status: z.enum(SwishRefundStatuses)
});

export const signupSchema = z
  .object({
    email: z.string().email({ message: "Felaktig email" }),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z
      .string()
      .min(8, { message: "Lösenordet måste vara minst 8 tecken" })
      .max(64, { message: "Lösenordet får inte vara mer än 64 tecken" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Lösenordet måste vara minst 8 tecken" })
      .max(64, { message: "Lösenordet får inte vara mer än 64 tecken" })
  })
  .refine((x) => x.confirmPassword === x.password, {
    message: "Lösenorden matchar inte"
  });

export const loginSchema = z.object({
  email: z.string().email({ message: "Felaktig email" }),
  password: z
    .string()
    .min(8, { message: "Lösenordet måste vara minst 8 tecken" })
    .max(64, { message: "Lösenordet får inte vara mer än 64 tecken" })
});

export const memberSignupSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email({ message: "Felaktig email" }),
    acceptedTerms: z.literal<boolean>(true),
    membershipType: z.nativeEnum(MembershipType),
    membershipId: z.string().min(1),
    phone: z.string().min(1),
    additionalMembers: z
      .array(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email({ message: "Felaktig email" }),
          membershipType: z.nativeEnum(MembershipType)
        })
      )
      .optional()
  })
  .refine((x) => {
    // Require additional members if membership type is family
    if (x.membershipType === MembershipType.FAMILY) {
      return x.additionalMembers && x.additionalMembers.length > 0;
    }
    return true;
  });
