import { inflateRawSync } from 'node:zlib';
import {
  buildQtiPackage,
  itemXml,
  manifestXml,
  quizIdFromQuestionName,
  qtiTitle,
  type QtiItem,
} from './qti';
import { zip } from './zip';

const QID = '019a0000-0000-7000-8000-000000000001';

function item(overrides: Partial<QtiItem>): QtiItem {
  return {
    quiz_id: QID,
    type: 'MCQ_SINGLE',
    question: 'HDFS lưu mỗi khối mặc định bao nhiêu bản sao?',
    options: ['1', '3', '5', 'Tuỳ dung lượng đĩa'],
    correct_answer: '3',
    explanation: null,
    lo_code: 'L.O.2.1',
    bank_name: 'CO3137 · L.O.2.1 · Ngân hàng chung',
    ...overrides,
  };
}

/** Đọc lại file ZIP do zip() ghi (qua central directory) để kiểm nội dung. */
function unzip(data: Buffer): Map<string, string> {
  const end = data.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = data.readUInt16LE(end + 10);
  let p = data.readUInt32LE(end + 16);
  const out = new Map<string, string>();
  for (let i = 0; i < count; i += 1) {
    expect(data.readUInt32LE(p)).toBe(0x02014b50);
    const size = data.readUInt32LE(p + 20);
    const nameLen = data.readUInt16LE(p + 28);
    const localAt = data.readUInt32LE(p + 42);
    const name = data.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const localNameLen = data.readUInt16LE(localAt + 26);
    const start = localAt + 30 + localNameLen;
    out.set(
      name,
      inflateRawSync(data.subarray(start, start + size)).toString('utf8'),
    );
    p += 46 + nameLen;
  }
  return out;
}

describe('QTI 2.1 cho Canvas', () => {
  it('MCQ_SINGLE: đúng dạng đã import được trong spike (identifier, title, tên ngân hàng trong item, div.text)', () => {
    const xml = itemXml(item({}));
    expect(xml).toContain(`identifier="daq-${QID}"`);
    expect(xml).toContain(`title="L.O.2.1 #${QID}"`);
    expect(xml).toContain(
      '<instructureField name="question_bank" value="CO3137 · L.O.2.1 · Ngân hàng chung"/>',
    );
    expect(xml).toContain('cardinality="single" baseType="identifier"');
    expect(xml).toContain(
      '<correctResponse><value>C2</value></correctResponse>',
    );
    expect(xml).toContain('maxChoices="1"');
    expect(xml).toContain(
      '<simpleChoice identifier="C4"><div class="text">Tuỳ dung lượng đĩa</div></simpleChoice>',
    );
    expect(xml).toContain('rptemplates/match_correct');
  });

  it('MCQ_MULTI: nhiều đáp án đúng, maxChoices=0', () => {
    const xml = itemXml(
      item({
        type: 'MCQ_MULTI',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: ['A', 'C'],
      }),
    );
    expect(xml).toContain('cardinality="multiple"');
    expect(xml).toContain('<value>C1</value><value>C3</value>');
    expect(xml).toContain('maxChoices="0"');
  });

  it('TRUE_FALSE: hai lựa chọn Đúng/Sai, kể cả khi options trống', () => {
    const xml = itemXml(
      item({ type: 'TRUE_FALSE', options: null, correct_answer: 'Sai' }),
    );
    expect(xml).toContain('<div class="text">Đúng</div>');
    expect(xml).toContain('<div class="text">Sai</div>');
    expect(xml).toContain(
      '<correctResponse><value>C2</value></correctResponse>',
    );
  });

  it('FILL_BLANK: mỗi cách viết chấp nhận là một value kiểu string', () => {
    const xml = itemXml(
      item({
        type: 'FILL_BLANK',
        question: 'Hadoop là nền tảng ____.',
        options: null,
        correct_answer: ['BIG DATA', 'dữ liệu lớn'],
      }),
    );
    expect(xml).toContain('baseType="string"');
    expect(xml).toContain(
      '<correctResponse><value>BIG DATA</value><value>dữ liệu lớn</value></correctResponse>',
    );
    expect(xml).toContain(
      '<extendedTextInteraction responseIdentifier="RESPONSE"/>',
    );
    expect(xml).not.toContain('choiceInteraction');
  });

  it('FILL_BLANK dạng cũ (chuỗi) vẫn xuất được', () => {
    const xml = itemXml(
      item({ type: 'FILL_BLANK', options: null, correct_answer: 'HDFS' }),
    );
    expect(xml).toContain('<value>HDFS</value>');
  });

  it('SHORT_ANSWER: không có correctResponse, bài mẫu + ý chấm vào modalFeedback', () => {
    const xml = itemXml(
      item({
        type: 'SHORT_ANSWER',
        options: null,
        correct_answer: {
          model_answer: 'NameNode giữ metadata.',
          rubric: ['Nêu NameNode', 'Nêu metadata'],
        },
        explanation: 'Xem chương 2.',
      }),
    );
    expect(xml).not.toContain('correctResponse');
    expect(xml).toContain('identifier="general_fb"');
    expect(xml).toContain(
      'Bài mẫu: NameNode giữ metadata.<br/>Ý chấm:<br/>- Nêu NameNode<br/>- Nêu metadata<br/>Xem chương 2.',
    );
  });

  it('escape ký tự đặc biệt, giữ tiếng Việt, bỏ ký tự điều khiển, đổi xuống dòng thành <br/>', () => {
    const xml = itemXml(
      item({
        question: 'So sánh a < b && c > "d"\nDòng hai\u0007',
        options: ['<tag>', 'x & y', '"q"', '∑ᵢ x²'],
        correct_answer: '<tag>',
        bank_name: 'A "B" & <C>',
      }),
    );
    expect(xml).toContain(
      '<div>So sánh a &lt; b &amp;&amp; c &gt; "d"<br/>Dòng hai</div>',
    );
    expect(xml).toContain('<div class="text">&lt;tag&gt;</div>');
    expect(xml).toContain('<div class="text">x &amp; y</div>');
    expect(xml).toContain('<div class="text">∑ᵢ x²</div>');
    expect(xml).toContain('value="A &quot;B&quot; &amp; &lt;C&gt;"');
    expect(xml).not.toContain('\u0007');
  });

  it('câu không có LO vẫn có title để khớp lại', () => {
    expect(qtiTitle(null, QID)).toBe(`Chưa gắn LO #${QID}`);
  });

  it('đọc lại quiz_id từ question_name của Canvas', () => {
    expect(quizIdFromQuestionName(`L.O.2.1 #${QID.toUpperCase()}`)).toBe(QID);
    expect(quizIdFromQuestionName('Câu viết tay')).toBeNull();
    expect(quizIdFromQuestionName(undefined)).toBeNull();
  });

  it('manifest khai schema QTIv2.1 và một resource cho mỗi câu', () => {
    const xml = manifestXml('da-bank-1', [{ quiz_id: QID }]);
    expect(xml).toContain('<schema>QTIv2.1 Package</schema>');
    expect(xml).toContain(`href="items/daq-${QID}.xml"`);
  });

  it('đóng gói: câu sai dạng bị bỏ kèm lý do, phần còn lại nằm trong zip', () => {
    const bad = item({
      quiz_id: '019a0000-0000-7000-8000-000000000002',
      correct_answer: 'Không có trong phương án',
    });
    const odd = item({
      quiz_id: '019a0000-0000-7000-8000-000000000003',
      type: 'MATCHING',
    });
    const pkg = buildQtiPackage('da-bank-1', [item({}), bad, odd]);
    expect(pkg.included.map((i) => i.quiz_id)).toEqual([QID]);
    expect(pkg.skipped).toEqual([
      {
        quiz_id: bad.quiz_id,
        reason: 'Đáp án đúng không nằm trong các phương án.',
      },
      {
        quiz_id: odd.quiz_id,
        reason: 'Kiểu câu MATCHING chưa xuất được sang Canvas.',
      },
    ]);
    const files = unzip(pkg.data!);
    expect([...files.keys()]).toEqual([
      'imsmanifest.xml',
      `items/daq-${QID}.xml`,
    ]);
    expect(files.get(`items/daq-${QID}.xml`)).toBe(itemXml(item({})));
  });

  it('không câu nào đóng gói được thì không có zip', () => {
    const pkg = buildQtiPackage('da-bank-1', [item({ type: 'MATCHING' })]);
    expect(pkg.data).toBeNull();
    expect(pkg.skipped).toHaveLength(1);
  });
});

describe('zip', () => {
  it('cùng nội dung ra cùng gói (ngày giờ cố định), tên file UTF-8', () => {
    const a = zip([{ name: 'tệp.xml', data: 'xin chào' }]);
    const b = zip([{ name: 'tệp.xml', data: 'xin chào' }]);
    expect(a.equals(b)).toBe(true);
    expect(unzip(a).get('tệp.xml')).toBe('xin chào');
  });
});
