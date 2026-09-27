"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

type LoginScreenProps = {
  isSigningIn: boolean;
  error: string;
  onSignIn: (email: string, password: string) => Promise<boolean>;
};

export function LoginScreen({ isSigningIn, error, onSignIn }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSignIn(email, password);
  };

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="BhuriBhoj shared meal illustration">
        <Image src="/no-bg.png" alt="A shared meal table at BhuriBhoj" fill sizes="(max-width: 800px) 100vw, 50vw" priority />
        <div className="login-visual-copy"><p className="eyebrow">BHURIBHOJ / 01</p><h1>Better meals.<br />Clearer living.</h1><p>A calm shared table for the people who make a home together.</p></div>
      </section>
      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="brand-mark" aria-hidden="true">B</div>
        <div className="login-heading">
          <h1>Good food starts with a clear table.</h1>
          <p>Sign in to coordinate your mess, your way.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
          <div className="input-wrap">
            <Mail size={18} aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              className="icon-button"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button login-button" type="submit" disabled={isSigningIn}>
            {isSigningIn ? "Checking your account..." : "Sign in to BhuriBhoj"}
            {!isSigningIn && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="demo-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <div>
            <strong>Prototype access</strong>
            <span>Try admin@bhuribhoj.local / Admin@123</span>
          </div>
        </div>
      </motion.section>
      <p className="login-footer">A calm workspace for every shared meal.</p>
    </main>
  );
}