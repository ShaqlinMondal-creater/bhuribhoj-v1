"use client";

import { CheckCircle2, Save } from "lucide-react";
import { useState } from "react";
import type { Mess } from "@/types/mess";
import type { Role } from "@/types/user";
import { updateMess } from "@/services/messService";

export function MessProfileEditor({ mess, role }: { mess: Mess; role: Role }) {
  // The form shows the stored document until it is edited, so a save made from
  // anywhere else - or a demo data reset - shows through instead of being
  // hidden behind a stale copy. A successful write drops the draft, which hands
  // the form back to the document the server just saved.
  const [draft, setDraft] = useState<Mess | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const value = draft ?? mess;
  const canEdit = role !== "member";
  // Writes mess.json through the server before the confirmation is shown.
  const save = async () => {
    setError("");
    try {
      await updateMess(value, role);
      setDraft(null);
      setSaved(true);
    } catch (cause) {
      setSaved(false);
      setError(cause instanceof Error ? cause.message : "Could not save the mess profile.");
    }
  };
  return <section className="content-panel mess-profile-editor"><div className="panel-header"><div><span className="panel-eyebrow">Mess profile</span><h3>Current workspace</h3></div><Save size={19} /></div><div className="mess-profile-grid"><label className="form-field">Mess name<input className="form-input" value={value.name} disabled={!canEdit} onChange={(event) => setDraft({ ...value, name: event.target.value })} /></label><label className="form-field">Address<input className="form-input" value={value.address} disabled={!canEdit} onChange={(event) => setDraft({ ...value, address: event.target.value })} /></label><label className="form-field">Contact email<input className="form-input" type="email" value={value.contactEmail} disabled={!canEdit} onChange={(event) => setDraft({ ...value, contactEmail: event.target.value })} /></label><label className="form-field">Contact phone<input className="form-input" value={value.contactPhone} disabled={!canEdit} onChange={(event) => setDraft({ ...value, contactPhone: event.target.value })} /></label></div>{canEdit && <button className="primary-button compact-button" onClick={save}>{saved ? <CheckCircle2 size={16} /> : <Save size={16} />} {saved ? "Saved" : "Save mess profile"}</button>}{saved && <p className="success-message" role="status">Mess profile saved successfully.</p>}{error && <p className="success-message" role="alert">Not saved: {error}</p>}</section>;
}