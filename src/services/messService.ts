import mess from "@/data/json/mess.json";
import settings from "@/data/json/settings.json";
import type { Mess } from "@/types/mess";
import type { Settings } from "@/types/settings";
import { hasFullAccess } from "@/auth/authConfig";
import { readCollection, STORAGE_KEYS, writeCollection } from "@/lib/prototypeStorage";
import type { Role } from "@/types/user";

export const getMess = (): Mess => readCollection(STORAGE_KEYS.mess, mess as Mess);

export const getSettings = (): Settings => readCollection(STORAGE_KEYS.settings, settings as Settings);

export const updateMess = (input: Partial<Mess>, role: Role) => {
	if (!hasFullAccess(role)) throw new Error("Only full-access roles can update mess settings.");
	const updated = { ...getMess(), ...input };
	writeCollection(STORAGE_KEYS.mess, updated);
	return updated;
};

export const updateSettings = (input: Partial<Settings>, role: Role) => {
	if (!hasFullAccess(role)) throw new Error("Only full-access roles can update settings.");
	const updated = { ...getSettings(), ...input };
	writeCollection(STORAGE_KEYS.settings, updated);
	return updated;
};