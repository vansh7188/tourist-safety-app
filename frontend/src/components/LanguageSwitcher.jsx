import React from "react";
import { useLanguage } from "../context/LanguageContext";

function LanguageSwitcher({ dark = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`flex items-center gap-2 text-xs font-semibold ${dark ? "text-white" : "text-slate-700"}`}>
      <span className="sr-only">{t("language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("language")}
        className={`rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none ${
          dark
            ? "border-white/25 bg-white/10 text-white"
            : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <option value="en" className="text-slate-900">{t("english")}</option>
        <option value="hi" className="text-slate-900">{t("hindi")}</option>
      </select>
    </label>
  );
}

export default LanguageSwitcher;
