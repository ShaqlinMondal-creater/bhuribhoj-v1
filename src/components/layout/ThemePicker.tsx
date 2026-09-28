"use client";

import { Palette } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import type { Role } from "@/types/user";
import type { ThemeName } from "@/types/settings";
import { getSettings, updateSettings } from "@/services/messService";
import { getStoreVersion, subscribeToStore } from "@/data/memoryStore";

export function ThemePicker({ role }: { role: Role }) {
  // settings.json was read with the shell, so this is a cache read rather than a
  // request. Subscribing to the store keeps the swatch honest after a save or a
  // reset without the component holding its own copy of the value.
  const version = useSyncExternalStore(subscribeToStore, getStoreVersion, () => 0);
  void version;
  const [error, setError] = useState("");
  const canEdit = role !== "member";
  const theme = getSettings()?.theme ?? "bhuri-green";
  // settings.json is written by the server first; the swatch only moves once
  // the write succeeds.
  const choose = async (option: ThemeName) => {
    setError("");
    try {
      await updateSettings({ theme: option }, role);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the theme.");
    }
  };
  return <section className="theme-picker content-panel"><div className="panel-header"><div><span className="panel-eyebrow">Appearance</span><h3>Theme</h3></div><Palette size={19} /></div><div className="theme-options">{(["bhuri-green", "emerald", "midnight", "warm"] as ThemeName[]).map((option) => <button key={option} className={`theme-option theme-option-${option} ${theme === option ? "theme-option-active" : ""}`} disabled={!canEdit} onClick={() => choose(option)}><span className="theme-swatch" /><span>{option === "bhuri-green" ? "Bhuri Green" : option.charAt(0).toUpperCase() + option.slice(1)}</span></button>)}</div>{error && <p className="success-message" role="alert">Not saved: {error}</p>}</section>;
}
