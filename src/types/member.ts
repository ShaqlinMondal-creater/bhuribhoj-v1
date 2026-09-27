import type { Role } from "@/types/user";

export type EntryFeeStatus = "paid" | "pending";

export type Member = {
	id: string;
	name: string;
	email: string;
	mobile: string;
	room: string;
	joiningDate: string;
	status: "active" | "inactive";
	role: Role;
	entryFee: number;
	entryFeeStatus: EntryFeeStatus;
	entryFeePaidDate: string | null;
};