export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const STOPWORDS = new Set([
  // Tiếng Việt thông dụng
  'va', 'cua', 'la', 'trong', 'cac', 'cho', 'voi', 'mot', 'nhung', 'nay',
  'khi', 'theo', 'tu', 've', 'bai', 'hoc', 'phan', 'chuong', 'muc', 'noi',
  'dung', 'video', 'slide', 'giang', 'vien', 'sinh', 'hay', 'duoc', 'nhu',
  'tren', 'duoi', 'sau', 'truoc', 'de', 'bang', 'qua', 'tai', 'den', 'ra',
  'vao', 'len', 'xuong', 'co', 'khong', 'da', 'se', 'dang', 'biet', 'hieu',
  'tim', 'cach', 'dung', 'su', 'lam', 'xem', 'minh', 'hoa', 'vi', 'du',
  'gioi', 'thieu', 'tong', 'quan', 'tom', 'tat', 'khai', 'niem', 'co', 'ban',
  // Tiếng Anh thông dụng
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'how', 'what',
  'are', 'was', 'were', 'been', 'have', 'has', 'had', 'about', 'lesson',
  'course', 'part', 'section', 'chapter', 'intro', 'introduction', 'overview',
  'tutorial', 'explained', 'example', 'examples', 'using', 'used', 'can', 'will',
  'not', 'but', 'all', 'its', 'your', 'you', 'our', 'more', 'most', 'step',
]);

export interface YoutubeDetails {
  youtubeVideoId: string | null;
  youtubeEmbedUrl: string | null;
  youtubeWatchUrl: string | null;
  youtubeThumbnailUrl: string | null;
  youtubeChannelTitle: string | null;
  youtubeStartSec: number | null;
  youtubeEndSec: number | null;
}

export interface MicroContentQueryProfile {
  unigramWeights: Map<string, number>;
  bigramWeights: Map<string, number>;
  titleTokens: string[];
  topKeywords: string[];
  suggestedQuery: string;
}

export interface VideoSimilarityResult {
  matchScore: number;
  matchReasons: string[];
  matchedKeywords: string[];
}

export function extractYoutubeVideoId(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('youtube:')) {
    const id = trimmed.slice('youtube:'.length).trim();
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  if (YOUTUBE_ID_RE.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const seg = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return YOUTUBE_ID_RE.test(seg) ? seg : null;
    }
    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && YOUTUBE_ID_RE.test(vParam)) return vParam;

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0]) &&
        YOUTUBE_ID_RE.test(segments[1])
      ) {
        return segments[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYoutubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function buildYoutubeEmbedUrl(
  videoId: string,
  opts?: {
    startSec?: number | null;
    endSec?: number | null;
    enableJsApi?: boolean;
  },
): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
  });
  if (
    typeof opts?.startSec === 'number' &&
    Number.isFinite(opts.startSec) &&
    opts.startSec > 0
  ) {
    params.set('start', String(Math.floor(opts.startSec)));
  }
  if (
    typeof opts?.endSec === 'number' &&
    Number.isFinite(opts.endSec) &&
    opts.endSec > 0
  ) {
    params.set('end', String(Math.floor(opts.endSec)));
  }
  if (opts?.enableJsApi) {
    params.set('enablejsapi', '1');
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function readOptionalInt(val: unknown): number | null {
  if (typeof val !== 'number' || !Number.isFinite(val)) return null;
  const n = Math.floor(val);
  return n >= 0 ? n : null;
}

export function extractYoutubeDetails(
  objectKey?: string | null,
  aiOptions?: unknown,
): YoutubeDetails {
  const opts =
    aiOptions && typeof aiOptions === 'object' && !Array.isArray(aiOptions)
      ? (aiOptions as Record<string, unknown>)
      : null;

  const rawId =
    (typeof opts?.youtubeVideoId === 'string' ? opts.youtubeVideoId : null) ??
    objectKey ??
    null;
  const videoId = extractYoutubeVideoId(rawId);

  if (!videoId) {
    return {
      youtubeVideoId: null,
      youtubeEmbedUrl: null,
      youtubeWatchUrl: null,
      youtubeThumbnailUrl: null,
      youtubeChannelTitle: null,
      youtubeStartSec: null,
      youtubeEndSec: null,
    };
  }

  const startSec = readOptionalInt(opts?.startSec);
  const endSec = readOptionalInt(opts?.endSec);
  const validEndSec =
    endSec !== null && endSec > (startSec ?? 0) ? endSec : null;

  return {
    youtubeVideoId: videoId,
    youtubeEmbedUrl: buildYoutubeEmbedUrl(videoId, {
      startSec,
      endSec: validEndSec,
      enableJsApi: true,
    }),
    youtubeWatchUrl:
      typeof opts?.watchUrl === 'string' && opts.watchUrl.startsWith('https://')
        ? opts.watchUrl
        : buildYoutubeWatchUrl(videoId),
    youtubeThumbnailUrl:
      typeof opts?.thumbnailUrl === 'string' &&
      opts.thumbnailUrl.startsWith('https://')
        ? opts.thumbnailUrl
        : buildYoutubeThumbnailUrl(videoId),
    youtubeChannelTitle:
      typeof opts?.channelTitle === 'string' && opts.channelTitle.trim()
        ? opts.channelTitle.trim()
        : null,
    youtubeStartSec: startSec,
    youtubeEndSec: validEndSec,
  };
}

export function normalizeViText(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  const normalized = normalizeViText(text);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

export function extractBigrams(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    out.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return out;
}

export function extractAiScriptText(aiScript: unknown): string {
  if (!aiScript || typeof aiScript !== 'object' || Array.isArray(aiScript)) {
    return '';
  }
  const obj = aiScript as {
    topic?: unknown;
    scenes?: Array<{
      title?: unknown;
      bullets?: unknown;
      narration?: unknown;
    }>;
  };
  const parts: string[] = [];
  if (typeof obj.topic === 'string') {
    parts.push(obj.topic);
  }
  if (Array.isArray(obj.scenes)) {
    for (const sc of obj.scenes) {
      if (!sc || typeof sc !== 'object') continue;
      if (typeof sc.title === 'string') parts.push(sc.title);
      if (Array.isArray(sc.bullets)) {
        for (const b of sc.bullets) {
          if (typeof b === 'string') parts.push(b);
        }
      }
      if (typeof sc.narration === 'string') parts.push(sc.narration);
    }
  }
  return parts.join(' ');
}

function addWeightedTerms(
  uniMap: Map<string, number>,
  biMap: Map<string, number>,
  displayMap: Map<string, string> | null,
  rawText: string | null | undefined,
  weight: number,
  maxChars = 4000,
) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) return;
  const clipped = rawText.slice(0, maxChars);
  const tokens = tokenize(clipped);
  if (tokens.length === 0) return;

  // Giảm nhẹ trọng số nếu cùng 1 từ lặp nhiều lần trong trường văn bản dài
  const seenUni = new Map<string, number>();
  for (const t of tokens) {
    const count = (seenUni.get(t) ?? 0) + 1;
    seenUni.set(t, count);
    const factor = count === 1 ? 1 : count <= 3 ? 0.35 : 0.1;
    uniMap.set(t, (uniMap.get(t) ?? 0) + weight * factor);
    if (displayMap && !displayMap.has(t)) {
      displayMap.set(t, t);
    }
  }

  const bigrams = extractBigrams(tokens);
  const seenBi = new Map<string, number>();
  for (const bg of bigrams) {
    const count = (seenBi.get(bg) ?? 0) + 1;
    seenBi.set(bg, count);
    const factor = count === 1 ? 1 : 0.25;
    biMap.set(bg, (biMap.get(bg) ?? 0) + weight * factor);
    if (displayMap && !displayMap.has(bg)) {
      displayMap.set(bg, bg);
    }
  }
}

function cleanTitleForSearchQuery(title: string): string {
  return title
    .replace(/^\[?(draft|bản nháp|micro[\s-]*content|bài\s*\d+|chương\s*\d+)\]?\s*[:\-–.]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildMicroContentQueryProfile(input: {
  title: string;
  description?: string | null;
  loCode?: string | null;
  loStatement?: string | null;
  sourceDocumentTitle?: string | null;
  aiPrompt?: string | null;
  aiScript?: unknown;
  slideChunkTexts?: string[];
}): MicroContentQueryProfile {
  const unigramWeights = new Map<string, number>();
  const bigramWeights = new Map<string, number>();
  const displayMap = new Map<string, string>();

  addWeightedTerms(unigramWeights, bigramWeights, displayMap, input.title, 3.0, 400);
  addWeightedTerms(unigramWeights, bigramWeights, displayMap, input.loStatement, 2.0, 600);
  addWeightedTerms(unigramWeights, bigramWeights, displayMap, input.description, 1.8, 1200);
  addWeightedTerms(unigramWeights, bigramWeights, displayMap, input.aiPrompt, 1.4, 800);
  addWeightedTerms(
    unigramWeights,
    bigramWeights,
    displayMap,
    extractAiScriptText(input.aiScript),
    1.4,
    3500,
  );
  addWeightedTerms(
    unigramWeights,
    bigramWeights,
    displayMap,
    input.sourceDocumentTitle,
    1.1,
    300,
  );
  if (Array.isArray(input.slideChunkTexts) && input.slideChunkTexts.length > 0) {
    addWeightedTerms(
      unigramWeights,
      bigramWeights,
      displayMap,
      input.slideChunkTexts.join(' '),
      0.9,
      2500,
    );
  }

  const titleTokens = Array.from(new Set(tokenize(input.title || '')));

  // Sắp xếp từ khóa đại diện ưu tiên cụm 2 từ rồi tới 1 từ có trọng số cao
  const topBigrams = Array.from(bigramWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k);
  const topUnigrams = Array.from(unigramWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);

  const topKeywords: string[] = [];
  for (const kw of [...topBigrams, ...topUnigrams]) {
    if (!topKeywords.includes(kw)) topKeywords.push(kw);
    if (topKeywords.length >= 6) break;
  }

  const baseTitle = cleanTitleForSearchQuery(input.title || '');
  let suggestedQuery = baseTitle;
  if (suggestedQuery.length < 25) {
    const titleNorm = new Set(tokenize(suggestedQuery));
    const extras = topUnigrams.filter((u) => !titleNorm.has(u)).slice(0, 2);
    if (extras.length > 0) {
      suggestedQuery = `${suggestedQuery} ${extras.join(' ')}`.trim();
    }
  }
  if (!suggestedQuery) {
    suggestedQuery = topKeywords.slice(0, 3).join(' ');
  }
  if (suggestedQuery.length > 90) {
    suggestedQuery = suggestedQuery.slice(0, 90).replace(/\s+\S*$/, '').trim();
  }

  return {
    unigramWeights,
    bigramWeights,
    titleTokens,
    topKeywords,
    suggestedQuery,
  };
}

function weightedCosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const v of a.values()) normA += v * v;
  for (const v of b.values()) normB += v * v;
  if (normA === 0 || normB === 0) return 0;

  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const [k, v] of smaller.entries()) {
    const other = larger.get(k);
    if (other !== undefined) {
      dot += v * other;
    }
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function scoreVideoAssetSimilarity(
  profile: MicroContentQueryProfile,
  candidate: {
    title: string;
    description?: string | null;
    tags?: string[] | null;
    transcript_text?: string | null;
    ai_prompt?: string | null;
    ai_script?: unknown;
    course_id?: string | null;
  },
  contextCourseId: string,
): VideoSimilarityResult {
  const candUni = new Map<string, number>();
  const candBi = new Map<string, number>();

  addWeightedTerms(candUni, candBi, null, candidate.title, 3.0, 400);
  if (Array.isArray(candidate.tags) && candidate.tags.length > 0) {
    addWeightedTerms(
      candUni,
      candBi,
      null,
      candidate.tags.filter((t) => t.toLowerCase() !== 'youtube').join(' '),
      2.6,
      500,
    );
  }
  addWeightedTerms(candUni, candBi, null, candidate.description, 1.8, 1200);
  const bodyUniBefore = candUni.size;
  addWeightedTerms(candUni, candBi, null, candidate.ai_prompt, 1.2, 800);
  addWeightedTerms(
    candUni,
    candBi,
    null,
    extractAiScriptText(candidate.ai_script),
    1.2,
    3000,
  );
  addWeightedTerms(candUni, candBi, null, candidate.transcript_text, 1.2, 3500);
  const hasRichBody = candUni.size > bodyUniBefore;

  const uniSim = weightedCosineSimilarity(profile.unigramWeights, candUni);
  const biSim = weightedCosineSimilarity(profile.bigramWeights, candBi);

  let titleHits = 0;
  for (const t of profile.titleTokens) {
    if (candUni.has(t)) titleHits += 1;
  }
  const titleRecall =
    profile.titleTokens.length > 0 ? titleHits / profile.titleTokens.length : 0;

  const lexical = 0.45 * uniSim + 0.3 * biSim + 0.25 * titleRecall;
  const sameCourse =
    Boolean(contextCourseId) && candidate.course_id === contextCourseId;
  const courseBonus = sameCourse && lexical > 0.05 ? 0.08 : 0;

  if (lexical <= 0) {
    return {
      matchScore: 0,
      matchReasons: [],
      matchedKeywords: [],
    };
  }

  const matchScore = Math.min(
    99,
    Math.max(1, Math.round((lexical + courseBonus) * 100)),
  );

  // Gom các từ/cụm từ trùng lặp đáng kể nhất
  const overlaps: Array<{ term: string; score: number; isBigram: boolean }> = [];
  for (const [term, pw] of profile.bigramWeights.entries()) {
    const cw = candBi.get(term);
    if (cw !== undefined) {
      overlaps.push({ term, score: pw * cw * 1.6, isBigram: true });
    }
  }
  for (const [term, pw] of profile.unigramWeights.entries()) {
    const cw = candUni.get(term);
    if (cw !== undefined) {
      overlaps.push({ term, score: pw * cw, isBigram: false });
    }
  }
  overlaps.sort((a, b) => b.score - a.score);

  const matchedKeywords: string[] = [];
  for (const item of overlaps) {
    // Tránh lặp unigram đã nằm trong bigram đã chọn
    const redundant =
      !item.isBigram &&
      matchedKeywords.some((kw) => kw.split(' ').includes(item.term));
    if (!redundant && !matchedKeywords.includes(item.term)) {
      matchedKeywords.push(item.term);
    }
    if (matchedKeywords.length >= 4) break;
  }

  const matchReasons: string[] = [];
  if (matchedKeywords.length > 0) {
    matchReasons.push(`Khớp từ khóa: ${matchedKeywords.join(', ')}`);
  }
  if (sameCourse) {
    matchReasons.push('Cùng khóa học');
  }
  if (hasRichBody && uniSim > 0.12) {
    matchReasons.push('Trùng nội dung lời giảng / kịch bản');
  }

  return {
    matchScore,
    matchReasons,
    matchedKeywords,
  };
}
