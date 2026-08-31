'use client';

// src/hooks/useEngineTranslations.ts
// Provides translations for lesson engine client components.
// Reads lang from URL query param (?lang=id or ?lang=en).
// Falls back to 'id' (Indonesian) when param is absent.
//
// Usage:
//   const t = useEngineTranslations();
//   t('quiz.title')  // returns localized string

import { useUrlParams } from './useUrlParams';
import type { Locale } from '../../i18n/request';

// Import both message files statically so no async loading is needed
import idMessages from '../../messages/id.json';
import enMessages from '../../messages/en.json';

type Messages = typeof idMessages;

const messageMap: Record<Locale, Messages> = {
  id: idMessages,
  en: enMessages,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current !== 'string') return path;
  return current;
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

export function useEngineTranslations() {
  const { lang } = useUrlParams();
  const messages = messageMap[lang] as unknown as Record<string, unknown>;

  return function t(key: string, values?: Record<string, string | number>): string {
    const raw = getNestedValue(messages, key);
    return interpolate(raw, values);
  };
}
