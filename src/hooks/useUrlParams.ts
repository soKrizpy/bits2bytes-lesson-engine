'use client';

// src/hooks/useUrlParams.ts
// Reads integration params from URL query string.

import { useEffect, useState } from 'react';

export type EngineTheme = 'dark' | 'light';
export type EngineLang = 'id' | 'en';

export interface UrlParams {
  theme: EngineTheme;
  lang: EngineLang;
  studentId: string | null;
  lmsOrigin: string | null;
}

const DEFAULTS: UrlParams = { theme: 'dark', lang: 'id', studentId: null, lmsOrigin: null };

function parseParams(): UrlParams {
  if (typeof window === 'undefined') return DEFAULTS;
  const sp = new URLSearchParams(window.location.search);
  const theme: EngineTheme = sp.get('theme') === 'light' ? 'light' : 'dark';
  const lang: EngineLang = sp.get('lang') === 'en' ? 'en' : 'id';
  return { theme, lang, studentId: sp.get('studentId'), lmsOrigin: sp.get('lmsOrigin') };
}

export function useUrlParams(): UrlParams {
  const [params, setParams] = useState<UrlParams>(DEFAULTS);
  useEffect(() => { setParams(parseParams()); }, []);
  return params;
}