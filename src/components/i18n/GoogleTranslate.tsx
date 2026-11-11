"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bhuribhoj-lang";
const DEFAULT_LANG = "bn";

const LANGS = [
  { code: "bn", label: "বাংলা" },
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "as", label: "অসমীয়া" },
  { code: "or", label: "ଓଡ଼ିଆ" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
  }
}

function readStoredLang(): LangCode {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (LANGS.some((lang) => lang.code === value)) return value as LangCode;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

function writeStoredLang(lang: LangCode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

function setTranslateCookie(lang: LangCode) {
  const value = lang === "en" ? "/en/en" : `/en/${lang}`;
  const host = window.location.hostname;
  document.cookie = `googtrans=${value};path=/`;
  if (host && host !== "localhost") {
    document.cookie = `googtrans=${value};path=/;domain=${host}`;
  }
}

function hideGoogleChrome() {
  document.body.style.top = "0px";
  document.documentElement.style.top = "0px";

  document.querySelectorAll<HTMLElement>(".goog-te-banner-frame, .skiptranslate, iframe.skiptranslate").forEach((node) => {
    if (node.id === "google_translate_element") return;
    if (node.classList.contains("google-translate-host")) return;
    node.style.setProperty("display", "none", "important");
    node.style.setProperty("visibility", "hidden", "important");
  });

  document.querySelectorAll<HTMLElement>("iframe.goog-te-banner-frame, iframe[id^='google_translate']").forEach((node) => {
    node.style.setProperty("display", "none", "important");
    node.style.setProperty("visibility", "hidden", "important");
  });
}

function loadTranslateScript() {
  if (document.getElementById("google-translate-script")) return;
  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

function ensureHost() {
  let host = document.getElementById("google_translate_element");
  if (!host) {
    host = document.createElement("div");
    host.id = "google_translate_element";
    host.className = "google-translate-host";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);
  }
  return host;
}

export function GoogleTranslate() {
  const [lang, setLang] = useState<LangCode>(DEFAULT_LANG);

  useEffect(() => {
    const preferred = readStoredLang();
    setLang(preferred);
    setTranslateCookie(preferred);
    writeStoredLang(preferred);
    ensureHost();

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      ensureHost();
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGS.map((item) => item.code).join(","),
          autoDisplay: false,
        },
        "google_translate_element",
      );
      hideGoogleChrome();
      window.setTimeout(hideGoogleChrome, 300);
      window.setTimeout(hideGoogleChrome, 1000);
    };

    loadTranslateScript();
    hideGoogleChrome();

    const observer = new MutationObserver(() => hideGoogleChrome());
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  function onChange(next: LangCode) {
    setLang(next);
    writeStoredLang(next);
    setTranslateCookie(next);
    window.location.reload();
  }

  return (
    <div className="notranslate flex items-center">
      <label htmlFor="page-lang" className="sr-only">
        Language
      </label>
      <select
        id="page-lang"
        value={lang}
        onChange={(event) => onChange(event.target.value as LangCode)}
        className="h-9 max-w-[7.5rem] rounded-xl border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-800 outline-none focus:border-[var(--accent)]"
        aria-label="Change language"
      >
        {LANGS.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
