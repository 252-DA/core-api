import { TRUE_FALSE_OPTIONS } from '../../question/question-types';
import { zip } from './zip';

/**
 * Gói QTI 2.1 cho ngân hàng Classic của Canvas (docs/question-bank-design.md
 * §8.3). Các điểm Canvas kén, đã kiểm trong spike 2026-10-22 (§8.5):
 *
 * - Tên ngân hàng phải nằm trong từng item (`instructureField question_bank`);
 *   `settings[question_bank_name|question_bank_id]` của API bị bỏ qua.
 * - `identifier` cố định theo câu (`daq-<quiz_id>`): import lại kèm
 *   `overwrite_quizzes=true` thì Canvas cập nhật đúng câu cũ, giữ id.
 * - Lời phương án bọc `<div class="text">`, nếu không Canvas chạy clear_html và
 *   xoá mất phương án trông giống thẻ HTML (vd. "<tag>").
 * - API đọc của Canvas không trả migration_id, nên `title` mang `#<quiz_id>`
 *   để khớp lại câu sau khi import.
 * - Canvas ghép MỌI `div` con trực tiếp của itemBody thành lời câu hỏi, nên
 *   lời câu chỉ nằm trong một `div`; xuống dòng đổi thành `<br/>`.
 */
export type QtiItem = {
  quiz_id: string;
  type: string;
  question: string;
  options: unknown;
  correct_answer: unknown;
  explanation: string | null;
  lo_code: string | null;
  /** Tên ngân hàng bên Canvas mà câu này rơi vào. */
  bank_name: string;
};

export type QtiSkipped = { quiz_id: string; reason: string };

const QTI_NS = 'http://www.imsglobal.org/xsd/imsqti_v2p1';
const MATCH_CORRECT =
  'http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct';
const QUIZ_ID_IN_NAME = /#([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})\s*$/i;
/** Ký tự điều khiển XML 1.0 không cho phép; một ký tự lọt vào là hỏng cả gói. */
// eslint-disable-next-line no-control-regex
const XML_INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
export const NO_LO_LABEL = 'Chưa gắn LO';

export const qtiIdentifier = (quizId: string) => `daq-${quizId}`;
export const qtiTitle = (loCode: string | null, quizId: string) =>
  `${loCode ?? NO_LO_LABEL} #${quizId}`;

/** quiz_id từ `question_name` mà Canvas trả về; null nếu không phải câu của mình. */
export function quizIdFromQuestionName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  return QUIZ_ID_IN_NAME.exec(name)?.[1]?.toLowerCase() ?? null;
}

export function xmlText(value: string): string {
  return value
    .replace(XML_INVALID, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function xmlAttr(value: string): string {
  return xmlText(value).replace(/"/g, '&quot;');
}

/** Văn bản nhiều dòng trong phần HTML của Canvas: escape rồi đổi xuống dòng thành `<br/>`. */
function xmlLines(value: string): string {
  return xmlText(value.replace(/\r\n?/g, '\n').trim()).replace(/\n/g, '<br/>');
}

function texts(value: unknown): string[] {
  if (typeof value === 'string') return [value.trim()];
  return Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v.trim() : String(v)))
    : [];
}

function feedback(text: string | null): string {
  if (!text?.trim()) return '';
  return (
    `  <modalFeedback outcomeIdentifier="FEEDBACK" identifier="general_fb" showHide="show">` +
    `${xmlLines(text)}</modalFeedback>\n`
  );
}

export class UnsupportedQtiItem extends Error {}

function choiceItem(
  head: string,
  stem: string,
  outcomes: string,
  item: QtiItem,
  options: string[],
  correct: string[],
  multi: boolean,
): string {
  const ids = options.map((_, i) => `C${i + 1}`);
  const values = options
    .map((o, i) => (correct.includes(o) ? `<value>${ids[i]}</value>` : ''))
    .join('');
  if (!values) {
    throw new UnsupportedQtiItem('Đáp án đúng không nằm trong các phương án.');
  }
  const choices = options
    .map(
      (o, i) =>
        `      <simpleChoice identifier="${ids[i]}"><div class="text">${xmlText(o)}</div></simpleChoice>\n`,
    )
    .join('');
  return (
    head +
    `  <responseDeclaration identifier="RESPONSE" cardinality="${multi ? 'multiple' : 'single'}" baseType="identifier">\n` +
    `    <correctResponse>${values}</correctResponse>\n  </responseDeclaration>\n` +
    outcomes +
    `  <itemBody>\n${stem}` +
    `    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="${multi ? 0 : 1}">\n` +
    choices +
    `    </choiceInteraction>\n  </itemBody>\n` +
    `  <responseProcessing template="${MATCH_CORRECT}"/>\n` +
    feedback(item.explanation) +
    `</assessmentItem>\n`
  );
}

/** Một assessmentItem QTI 2.1; ném UnsupportedQtiItem nếu câu không xuất được. */
export function itemXml(item: QtiItem): string {
  if (!item.question?.trim()) {
    throw new UnsupportedQtiItem('Câu hỏi trống.');
  }
  const head =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<assessmentItem xmlns="${QTI_NS}" identifier="${qtiIdentifier(item.quiz_id)}" ` +
    `title="${xmlAttr(qtiTitle(item.lo_code, item.quiz_id))}" adaptive="false" timeDependent="false">\n` +
    `  <instructureMetadata><instructureField name="question_bank" value="${xmlAttr(item.bank_name)}"/></instructureMetadata>\n`;
  const stem = `    <div>${xmlLines(item.question)}</div>\n`;
  const outcomes =
    `  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n` +
    `  <outcomeDeclaration identifier="FEEDBACK" cardinality="single" baseType="identifier"/>\n`;

  switch (item.type) {
    case 'MCQ_SINGLE':
      return choiceItem(
        head,
        stem,
        outcomes,
        item,
        texts(item.options),
        texts(item.correct_answer).slice(0, 1),
        false,
      );
    case 'MCQ_MULTI':
      return choiceItem(
        head,
        stem,
        outcomes,
        item,
        texts(item.options),
        texts(item.correct_answer),
        true,
      );
    case 'TRUE_FALSE': {
      const options = texts(item.options);
      return choiceItem(
        head,
        stem,
        outcomes,
        item,
        options.length === 2 ? options : TRUE_FALSE_OPTIONS,
        texts(item.correct_answer).slice(0, 1),
        false,
      );
    }
    case 'FILL_BLANK': {
      const accepted = texts(item.correct_answer).filter(Boolean);
      if (!accepted.length) {
        throw new UnsupportedQtiItem('Câu điền khuyết không có đáp án.');
      }
      return (
        head +
        `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">\n` +
        `    <correctResponse>${accepted.map((a) => `<value>${xmlText(a)}</value>`).join('')}</correctResponse>\n` +
        `  </responseDeclaration>\n` +
        outcomes +
        `  <itemBody>\n${stem}    <extendedTextInteraction responseIdentifier="RESPONSE"/>\n  </itemBody>\n` +
        feedback(item.explanation) +
        `</assessmentItem>\n`
      );
    }
    case 'SHORT_ANSWER': {
      // Canvas không chấm tự luận: bài mẫu và ý chấm đi vào phần nhận xét
      // (neutral_comments) để giảng viên chấm tay trong SpeedGrader.
      const key = (item.correct_answer ?? {}) as {
        model_answer?: unknown;
        rubric?: unknown;
      };
      const rubric = texts(key.rubric).filter(Boolean);
      const guide = [
        typeof key.model_answer === 'string' && key.model_answer.trim()
          ? `Bài mẫu: ${key.model_answer.trim()}`
          : null,
        rubric.length
          ? `Ý chấm:\n${rubric.map((r) => `- ${r}`).join('\n')}`
          : null,
        item.explanation,
      ]
        .filter(Boolean)
        .join('\n');
      return (
        head +
        `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>\n` +
        outcomes +
        `  <itemBody>\n${stem}    <extendedTextInteraction responseIdentifier="RESPONSE"/>\n  </itemBody>\n` +
        feedback(guide || null) +
        `</assessmentItem>\n`
      );
    }
    default:
      throw new UnsupportedQtiItem(
        `Kiểu câu ${item.type} chưa xuất được sang Canvas.`,
      );
  }
}

export function manifestXml(
  identifier: string,
  items: { quiz_id: string }[],
): string {
  const resources = items
    .map((item) => {
      const id = qtiIdentifier(item.quiz_id);
      return (
        `    <resource identifier="${id}" type="imsqti_item_xmlv2p1" href="items/${id}.xml">\n` +
        `      <file href="items/${id}.xml"/>\n    </resource>\n`
      );
    })
    .join('');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<manifest identifier="${xmlAttr(identifier)}" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" ` +
    `xmlns:imsqti="${QTI_NS}">\n` +
    `  <metadata><schema>QTIv2.1 Package</schema><schemaversion>1.0.0</schemaversion></metadata>\n` +
    `  <organizations/>\n  <resources>\n${resources}  </resources>\n</manifest>\n`
  );
}

/** Gói zip; câu không xuất được trả về trong `skipped` kèm lý do. */
export function buildQtiPackage(identifier: string, items: QtiItem[]) {
  const ok: { item: QtiItem; xml: string }[] = [];
  const skipped: QtiSkipped[] = [];
  for (const item of items) {
    try {
      ok.push({ item, xml: itemXml(item) });
    } catch (error) {
      if (!(error instanceof UnsupportedQtiItem)) throw error;
      skipped.push({ quiz_id: item.quiz_id, reason: error.message });
    }
  }
  const data = ok.length
    ? zip([
        {
          name: 'imsmanifest.xml',
          data: manifestXml(
            identifier,
            ok.map((o) => o.item),
          ),
        },
        ...ok.map(({ item, xml }) => ({
          name: `items/${qtiIdentifier(item.quiz_id)}.xml`,
          data: xml,
        })),
      ])
    : null;
  return { data, included: ok.map((o) => o.item), skipped };
}
