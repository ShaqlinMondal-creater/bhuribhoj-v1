import { getCollection, setCollection } from "@/data/memoryStore";
import { updateRecordRequest } from "@/data/api";
import { hasFullAccess } from "@/auth/authConfig";
import type { Mess } from "@/types/mess";
import type { Settings } from "@/types/settings";
import type { Role } from "@/types/user";

// mess.json and settings.json each hold a single document, addressed in the API
// by the collection name. These are the two smallest datasets in the app and
// the shell chrome itself needs both, so they are the only ones read as soon as
// someone signs in. Reads come from the cache; writes POST to that document.
export const getMess = (): Mess => getCollection<Mess>("mess");

export const getSettings = (): Settings => getCollection<Settings>("settings");

export const updateMess = async (input: Partial<Mess>, role: Role) => {
	if (!hasFullAccess(role)) throw new Error("Only full-access roles can update mess settings.");
	const saved = await updateRecordRequest<Mess>("mess", "mess", input);
	setCollection("mess", saved);
	return saved;
};

export const updateSettings = async (input: Partial<Settings>, role: Role) => {
	if (!hasFullAccess(role)) throw new Error("Only full-access roles can update settings.");
	const saved = await updateRecordRequest<Settings>("settings", "settings", input);
	setCollection("settings", saved);
	return saved;
};
