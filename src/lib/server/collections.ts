import { z } from "zod";
import {
  COLLECTION_NAMES,
  LIST_COLLECTIONS,
  isCollectionName,
  type CollectionName,
} from "@/data/collections";

// SERVER-SIDE COLLECTION REGISTRY.
//
// Describes every JSON file the prototype persists: where it lives, whether it
// holds a list or a single document, and the runtime schema used to reject a
// malformed write before it can reach disk.
//
// This module must never be imported by a client component: it is the schema
// half of the server-side file boundary.

export type { CollectionName };
export { COLLECTION_NAMES, LIST_COLLECTIONS, isCollectionName };

const isoDate = z.string().min(1);
const optionalTimestamp = z.string().min(1).optional();

export const memberRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string(),
  room: z.string(),
  joiningDate: isoDate,
  status: z.enum(["active", "inactive"]),
  role: z.enum(["admin", "manager", "president", "member"]),
  entryFee: z.number().min(0),
  entryFeeStatus: z.enum(["paid", "pending"]),
  entryFeePaidDate: z.string().nullable(),
});

export const mealRecordSchema = z.object({
  id: z.string().min(1),
  memberId: z.string().min(1),
  date: isoDate,
  mealType: z.enum(["lunch", "dinner"]),
  status: z.enum(["taken", "cancelled"]),
  createdAt: optionalTimestamp,
  updatedAt: optionalTimestamp,
});

export const guestMealRecordSchema = z.object({
  id: z.string().min(1),
  memberId: z.string().min(1),
  guestName: z.string().min(1),
  date: isoDate,
  thaliType: z.enum(["fish-thali", "chicken-thali", "veg-thali", "egg-thali"]),
  price: z.number().min(0),
  status: z.enum(["confirmed", "cancelled"]),
  createdAt: optionalTimestamp,
  updatedAt: optionalTimestamp,
});

export const expenseRecordSchema = z.object({
  id: z.string().min(1),
  date: isoDate,
  category: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["fixed", "market"]),
  note: z.string(),
  description: z.string().optional(),
  createdAt: optionalTimestamp,
  updatedAt: optionalTimestamp,
});

export const messRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string(),
  month: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
});

export const settingsRecordSchema = z.object({
  guestThaliPrices: z.object({
    "fish-thali": z.number().min(0),
    "chicken-thali": z.number().min(0),
    "veg-thali": z.number().min(0),
    "egg-thali": z.number().min(0),
  }),
  fixedExpenseCategories: z.array(z.string()),
  marketExpenseCategories: z.array(z.string()),
  theme: z.enum(["bhuri-green", "emerald", "midnight", "warm"]).optional(),
});

export const userRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["admin", "manager", "president", "member"]),
  memberId: z.string().optional(),
  mobile: z.string().optional(),
  avatarUrl: z.string().optional(),
});

type RegistryEntry = {
  file: string;
  isList: boolean;
  /**
   * The id a singleton document is addressed by in the API. mess.json and
   * settings.json each hold exactly one document, so their route id is the
   * collection name rather than anything stored in the file.
   */
  singletonId: string;
  recordSchema: z.ZodType;
  /** Update validation for a POST to /{collection}/{id}: only editable fields, never `id`. */
  patchSchema: z.ZodType;
};

export const COLLECTIONS: Record<CollectionName, RegistryEntry> = {
  members: {
    file: "members.json",
    isList: true,
    singletonId: "",
    recordSchema: memberRecordSchema,
    patchSchema: memberRecordSchema.omit({ id: true }).partial().strict(),
  },
  meals: {
    file: "meals.json",
    isList: true,
    singletonId: "",
    recordSchema: mealRecordSchema,
    patchSchema: mealRecordSchema.omit({ id: true }).partial().strict(),
  },
  guestMeals: {
    file: "guestMeals.json",
    isList: true,
    singletonId: "",
    recordSchema: guestMealRecordSchema,
    patchSchema: guestMealRecordSchema.omit({ id: true }).partial().strict(),
  },
  expenses: {
    file: "expenses.json",
    isList: true,
    singletonId: "",
    recordSchema: expenseRecordSchema,
    patchSchema: expenseRecordSchema.omit({ id: true }).partial().strict(),
  },
  mess: {
    file: "mess.json",
    isList: false,
    singletonId: "mess",
    recordSchema: messRecordSchema,
    patchSchema: messRecordSchema.omit({ id: true }).partial().strict(),
  },
  settings: {
    file: "settings.json",
    isList: false,
    singletonId: "settings",
    recordSchema: settingsRecordSchema,
    patchSchema: settingsRecordSchema.partial().strict(),
  },
  users: {
    file: "users.json",
    isList: true,
    singletonId: "",
    recordSchema: userRecordSchema,
    // A profile update can never change the stored password.
    patchSchema: userRecordSchema.omit({ id: true, password: true }).partial().strict(),
  },
};
