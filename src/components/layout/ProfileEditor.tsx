"use client";

import { Camera, CheckCircle2, Trash2, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { AuthenticatedUser } from "@/auth/authTypes";
import { roleLabels } from "@/auth/authConfig";
import { updateCurrentUserProfile } from "@/auth/authService";

export function ProfileEditor({ user, onClose }: { user: AuthenticatedUser; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile ?? "");
  const [imageUrl, setImageUrl] = useState(user.image_url ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Writes users.json through the server, so the profile is still here after F5.
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateCurrentUserProfile({ name, email, mobile, image_url: imageUrl });
      setSaved(true);
    } catch (cause) {
      setSaved(false);
      setError(cause instanceof Error ? cause.message : "Could not save the profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/") || file.size > 2_000_000) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  return <div className="modal-backdrop" role="presentation"><section className="form-modal profile-modal" role="dialog" aria-modal="true" aria-label="Edit profile"><div className="modal-header"><div><span className="panel-eyebrow">Account</span><h2>Edit profile</h2></div><button className="icon-button" onClick={onClose} aria-label="Close profile"><X size={19} /></button></div><div className="profile-photo-editor"><div className="profile-photo-preview">{imageUrl ? <Image src={imageUrl} alt="" width={66} height={66} unoptimized /> : <span>{name.charAt(0)}</span>}</div><label className="secondary-button profile-upload"><Camera size={15} /> Change photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImage(event.target.files?.[0])} /></label>{imageUrl && <button className="table-action" onClick={() => setImageUrl("")}><Trash2 size={15} /> Remove</button>}</div><div className="form-grid"><label className="form-field">Full name<input className="form-input" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="form-field">Email<input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="form-field">Mobile<input className="form-input" value={mobile} onChange={(event) => setMobile(event.target.value)} /></label><label className="form-field">Role<input className="form-input" value={roleLabels[user.role]} disabled /></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="button" className="primary-button" onClick={save} disabled={saving}>{saved ? <CheckCircle2 size={16} /> : <UserRound size={16} />} {saved ? "Saved" : saving ? "Saving" : "Save profile"}</button></div>{error && <p className="success-message" role="alert">Not saved: {error}</p>}</section></div>;
}