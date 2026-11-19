import { withoutTrailingSlash } from '../common/utils/url';

export interface CanvasApiConfig {
  baseUrl?: string;
  token?: string;
}

export function loadCanvasApiEnv(): NodeJS.ProcessEnv {
  return {
    CANVAS_API_URL: process.env.CANVAS_API_URL,
    LTI_PLATFORM_URL: process.env.LTI_PLATFORM_URL,
    CANVAS_PUBLIC_URL: process.env.CANVAS_PUBLIC_URL,
  };
}

export function loadCanvasApiConfig(): CanvasApiConfig {
  const url = process.env.CANVAS_API_URL || process.env.LTI_PLATFORM_URL;
  return {
    baseUrl: url ? withoutTrailingSlash(url) : undefined,
    token: process.env.CANVAS_API_TOKEN,
  };
}
