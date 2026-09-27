"use client";

import { Palette } from "lucide-react";
import { useState } from "react";
import type { Role } from "@/types/user";
import type { ThemeName } from "@/types/settings";
import { getSettings, updateSettings } from "@/services/messService";

export function ThemePicker({ role }: { role: Role }) {
  const [theme, setTheme] = useState<ThemeName>(getSettings().theme ?? "bhuri-green");
  const canEdit = role !== "member";
  return <section className="theme-picker content-panel"><div className="panel-header"><div><span className="panel-eyebrow">Appearance</span><h3>Theme</h3></div><Palette size={19} /></div><div className="theme-options">{(["bhuri-green", "emerald", "midnight", "warm"] as ThemeName[]).map((option) => <button key={option} className={`theme-option theme-option-${option} ${theme === option ? "theme-option-active" : ""}`} disabled={!canEdit} onClick={() => { setTheme(option); updateSettings({ theme: option }, role); }}><span className="theme-swatch" /><span>{option === "bhuri-green" ? "Bhuri Green" : option.charAt(0).toUpperCase() + option.slice(1)}</span></button>)}</div></section>;
}