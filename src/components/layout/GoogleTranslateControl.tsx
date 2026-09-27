"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown;
      };
    };
    bhuriBhojGoogleTranslateInit?: () => void;
    __bhuriBhojGoogleTranslateInitialized?: boolean;
  }
}

const SCRIPT_SELECTOR = "script[data-bhuribhoj-google-translate]";
const WIDGET_ID = "bhuribhoj-google-translate";

export function GoogleTranslateControl() {
  const [isBengali, setIsBengali] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const initialize = () => {
      if (!active || !window.google?.translate?.TranslateElement) return;
      if (!window.__bhuriBhojGoogleTranslateInitialized) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,bn",
            autoDisplay: false,
          },
          WIDGET_ID,
        );
        window.__bhuriBhojGoogleTranslateInitialized = true;
      }
      setIsReady(true);
    };

    window.bhuriBhojGoogleTranslateInit = initialize;
    const existingScript = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);

    if (existingScript) {
      initialize();
    } else {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=bhuriBhojGoogleTranslateInit";
      script.async = true;
      script.dataset.bhuribhojGoogleTranslate = "true";
      script.onload = initialize;
      document.head.appendChild(script);
    }

    return () => {
      active = false;
    };
  }, []);

  const selectLanguage = (language: "en" | "bn") => {
    const applyLanguage = (attempt = 0) => {
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (!select) {
        if (attempt < 20) window.setTimeout(() => applyLanguage(attempt + 1), 100);
        return;
      }
      select.value = language;
      select.dispatchEvent(new Event("change"));
    };

    setIsBengali(language === "bn");
    applyLanguage();
  };

  return (
    <>
      <div id={WIDGET_ID} className="google-translate-host" aria-hidden="true" />
      <button
        className="translate-control"
        type="button"
        onClick={() => selectLanguage(isBengali ? "en" : "bn")}
        aria-label={isBengali ? "Translate website to English" : "Translate website to Bengali"}
        aria-pressed={isBengali}
        title={isReady ? undefined : "Loading translation"}
      >
        <Globe2 size={16} aria-hidden="true" />
        <span>{isBengali ? "English" : "বাংলা"}</span>
      </button>
    </>
  );
}