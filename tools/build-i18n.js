#!/usr/bin/env node
/**
 * Build missing i18n keys from data-i18n attributes in HTML pages.
 * - Reads i18n/en.json, fr.json, es.json (creates if missing)
 * - Scans services.html + how-it-works.html (edit list as needed)
 * - For EN values: uses the element's current textContent (trimmed)
 * - For FR/ES: uses a tiny built-in baseline translator (basic) OR placeholders
 *
 * NOTE: Auto-translation here is intentionally conservative. Replace with your preferred translations.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PAGES = [
  "services.html",
  "how-it-works.html",
];

const I18N_FILES = {
  en: "i18n/en.json",
  fr: "i18n/fr.json",
  es: "i18n/es.json",
};

function readJson(filePath) {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return {};
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${e.message}`);
  }
}

function writeJson(filePath, obj) {
  const full = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function getByPath(obj, keyPath) {
  return keyPath.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function extractKeysAndDefaults(html) {
  // Extract keys: data-i18n="..."
  const keyRegex = /data-i18n\s*=\s*["']([^"']+)["']/g;
  const keys = new Set();
  let m;
  while ((m = keyRegex.exec(html)) !== null) {
    keys.add(m[1].trim());
  }

  // Extract default EN text for each key (best-effort):
  // Looks for the nearest tag that contains that exact data-i18n and captures inner text.
  // This is NOT a full HTML parser, but works well for typical clean markup.
  const defaults = {};
  for (const key of keys) {
    const tagRegex = new RegExp(
      `<([a-zA-Z0-9\\-]+)([^>]*?)data-i18n\\s*=\\s*["']${escapeRegExp(
        key
      )}["']([^>]*?)>([\\s\\S]*?)<\\/\\1>`,
      "m"
    );
    const match = html.match(tagRegex);
    if (match) {
      const inner = stripTags(match[4]).replace(/\s+/g, " ").trim();
      if (inner) defaults[key] = inner;
    }
  }

  return { keys: [...keys], defaults };
}

function stripTags(s) {
  return s.replace(/<[^>]*>/g, "");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Minimal baseline translator (very small + safe).
// If you prefer placeholders instead of auto-translation, set USE_PLACEHOLDERS=true.
const USE_PLACEHOLDERS = false;

function toFR(en) {
  if (USE_PLACEHOLDERS) return `[FR] ${en}`;
  return en
    .replace(/\bRequest\b/gi, "Demander")
    .replace(/\bBook\b/gi, "Réserver")
    .replace(/\bHow it works\b/gi, "Comment ça marche")
    .replace(/\bServices\b/gi, "Services")
    .replace(/\bContact\b/gi, "Contact");
}

function toES(en) {
  if (USE_PLACEHOLDERS) return `[ES] ${en}`;
  return en
    .replace(/\bRequest\b/gi, "Solicitar")
    .replace(/\bBook\b/gi, "Reservar")
    .replace(/\bHow it works\b/gi, "Cómo funciona")
    .replace(/\bServices\b/gi, "Servicios")
    .replace(/\bContact\b/gi, "Contacto");
}

function main() {
  const dict = {
    en: readJson(I18N_FILES.en),
    fr: readJson(I18N_FILES.fr),
    es: readJson(I18N_FILES.es),
  };

  const allKeys = new Set();
  const defaultsEN = {};

  for (const page of PAGES) {
    const full = path.join(ROOT, page);
    if (!fs.existsSync(full)) {
      console.warn(`⚠️  Skipping missing page: ${page}`);
      continue;
    }
    const html = fs.readFileSync(full, "utf8");
    const { keys, defaults } = extractKeysAndDefaults(html);
    keys.forEach(k => allKeys.add(k));
    Object.assign(defaultsEN, defaults);
  }

  let addedEN = 0, addedFR = 0, addedES = 0;

  for (const key of allKeys) {
    const existingEN = getByPath(dict.en, key);
    const existingFR = getByPath(dict.fr, key);
    const existingES = getByPath(dict.es, key);

    const enValue = (existingEN !== undefined)
      ? existingEN
      : (defaultsEN[key] || key); // fallback to key itself if no text found

    if (existingEN === undefined) {
      setByPath(dict.en, key, enValue);
      addedEN++;
    }
    if (existingFR === undefined) {
      setByPath(dict.fr, key, toFR(enValue));
      addedFR++;
    }
    if (existingES === undefined) {
      setByPath(dict.es, key, toES(enValue));
      addedES++;
    }
  }

  writeJson(I18N_FILES.en, dict.en);
  writeJson(I18N_FILES.fr, dict.fr);
  writeJson(I18N_FILES.es, dict.es);

  console.log("✅ i18n JSON updated");
  console.log(`EN added: ${addedEN}`);
  console.log(`FR added: ${addedFR}`);
  console.log(`ES added: ${addedES}`);
}

main();
