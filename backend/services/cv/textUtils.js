// ====================== BỎ DẤU ======================
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// ====================== FIX LỖI TEXT PDF ======================
function fixBrokenText(text) {
  if (!text) return '';

  let fixed = fixVietnameseNameSpacing(text);

  fixed = fixed.replace(/[^\p{L}\p{N}\s.,!-]/gu, ' ');
  fixed = fixed.replace(/([A-Za-zÀ-ỸĐ]+)([A-Z][a-z]+)/g, '$1 $2');
  fixed = fixed.replace(/([a-z])([A-Z])/g, '$1 $2');
  fixed = fixed.replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2');

  fixed = fixed.replace(
    /([A-Za-zÀ-ỹ])\s+([̀-ỹ])/gu,
    '$1$2'
  );

  fixed = fixed.replace(/\s+/g, ' ').trim();

  return fixed;
}


function fixVietnameseNameSpacing(text) {
  if (!text) return '';

  return text
    // nối chữ bị tách kiểu: Hiế u -> Hiếu
    .replace(/([À-ỹ])\s+([a-zà-ỹ])/g, '$1$2')

    // nối kiểu: Đ ình -> Đình
    .replace(/([A-ZÀ-ỸĐ])\s+([a-zà-ỹ])/g, '$1$2')

    // nối kiểu: Nguyễ n -> Nguyễn
    .replace(/([a-zà-ỹ])\s+([a-zà-ỹ])/g, (m, a, b) => {
      // chỉ nối khi chữ đầu có dấu
      if (/[à-ỹ]/i.test(a)) {
        return a + b;
      }
      return m;
    });
}

// ====================== LÀM SẠCH TÊN ======================
function cleanCVForName(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/\b(CAREER OBJECTIVE|OBJECTIVE|EDUCATION|SKILLS|PROJECTS|EXPERIENCE|SUMMARY|THÔNG TIN CÁ NHÂN|HỌC VẤN|KỸ NĂNG|DỰ ÁN|ĐỊA CHỈ|LIÊN HỆ)\b/gi, '\n');
  cleaned = cleaned.replace(/\b(Backend|Frontend|Fullstack|Developer|Intern|Resume|CV|Nam|Nữ|Male|Female)\b/gi, ' ');
  cleaned = cleaned.replace(/\b(Duong Noi|Ha Dong|My Dinh|Nam Tu Liem|Hanoi|Hà Nội|Đường|Phố|Xã|Huyện|Quận)\b/gi, '');
  cleaned = cleaned.replace(/\b(email|phone|address|github|linkedin|facebook)\b/gi, '');
  cleaned = cleaned.replace(/\d{9,}/g, '');
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim();
}

function extractNameDirectly(cvText) {
  if (!cvText) return '';
  let text = fixBrokenText(cvText);
  text = cleanCVForName(text);
  let head = text.slice(0, 200);
  let match = head.match(/\b([A-ZÀ-ỸĐ][a-zà-ỹ]+(?:\s+[A-ZÀ-ỸĐ][a-zà-ỹ]+){1,3})\b/);
  if (match) {
    let name = match[1];

    const bad = [
      'fullstack',
      'developer',
      'intern',
      'resume',
      'cv',
      'objective',
      'education',
      'skill',
      'project',
      'thử việc',
      'công nghệ',

      'tu liem',
      'ha noi',
      'my dinh',
      'ha dong'
    ];

    // NEW
    if (name.split(/\s+/).length < 2)
      return '';

    if (!bad.some(w =>
      name.toLowerCase().includes(w)
    )) {
      return normalizeName(name);
    }
  }
  const upperMatches = head.match(/[A-ZÀ-ỸĐ]+(?:\s+[A-ZÀ-ỸĐ]+){0,3}/g);
  if (upperMatches && upperMatches.length) {
    const badWords = ['FULLSTACK', 'DEVELOPER', 'INTERN', 'RESUME', 'CV', 'MALE', 'FEMALE', 'NAM', 'NỮ', 'GENDER',
      'EDUCATION', 'SKILL', 'PROJECT', 'OBJECTIVE', 'CAREER', 'CONTACT', 'BACKEND', 'FRONTEND',
      'DUONG', 'NOI', 'HA', 'DONG', 'MY', 'DINH', 'NAM', 'TU', 'LIEM', 'HANOI'];
    let candidates = upperMatches.filter(m => {
      let parts = m.split(/\s+/);
      return parts.length >= 1 && parts.length <= 4 && !parts.some(p => badWords.includes(p));
    });
    if (candidates.length) {
      let best = candidates.reduce((a, b) => a.length >= b.length ? a : b);
      return normalizeName(best);
    }
  }
  const firstLine = head.split('\n')[0];
  if (firstLine && firstLine.trim()) {
    let cleaned = firstLine.replace(/\b(backend|frontend|fullstack|developer|intern|resume|cv|objective|education|skill|project|gender|male|female|nam|nữ|thử việc)\b/gi, '').trim();
    if (cleaned && cleaned.split(/\s+/).length >= 2) {
      return normalizeName(cleaned);
    }
  }
  return '';
}

function normalizeName(rawName) {
  if (!rawName) return '';
  const original = rawName.trim();
  let name = fixBrokenText(original);
  name = name.replace(/[^\p{L}\s]/gu, ' ').trim();
  name = name.replace(/\b(male|female|gender|objective|summary|education|skill|project|intern|resume|cv|fullstack|developer|engineer|internship|career|contact|phone|email|address|github|linkedin|backend|frontend|thử việc)\b/gi, '');
  name = name.replace(/\s+/g, ' ').trim();
  if (!name) return '';
  const noAccent = removeAccents(name);
  const fixedOrig = fixBrokenText(original).replace(/[^\p{L}\s]/gu, ' ').trim();
  const isAllUpper = (fixedOrig === fixedOrig.toUpperCase());
  if (isAllUpper) {
    return noAccent.toUpperCase().replace(/\s+/g, ' ').trim();
  } else {
    return noAccent.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }
}

function normalizeSkill(skill) {
  if (!skill) return '';

  return skill
    .toLowerCase()

    // bỏ ký tự đặc biệt dư
    .replace(/[^\w\s.+#/-]/g, ' ')

    // nhiều khoảng trắng -> 1
    .replace(/\s+/g, ' ')

    // =========================
    // FIX PDF BROKEN TEXT
    // =========================

    .replace(/\bjw\s*t\b/g, 'jwt')

    .replace(/\breact\s*j\s*s\b/g, 'reactjs')
    .replace(/\breact\s*j\s*sand\b/g, 'reactjs and')

    .replace(/\bmongo\s*db\b/g, 'mongodb')

    .replace(/\bnode\s*js\b/g, 'node.js')

    .replace(/\bexpress\s*js\b/g, 'express.js')

    .replace(/\btailwind\s*css\b/g, 'tailwind css')

    .replace(/\bjava\s*script\b/g, 'javascript')

    .replace(/\bgit\s*hub\b/g, 'github')

    // =========================
    // REST API FIX
    // =========================

    .replace(/\brest\s*ap\s*is\b/g, 'rest api')

    .replace(/\brest\s*api\b/g, 'rest api')

    .replace(/\brestful\s*api\b/g, 'rest api')

    .replace(/\brestful\s*apis\b/g, 'rest api')

    .replace(/\brest\s*apis\b/g, 'rest api')

    .replace(/\brestful\b/g, 'rest api')

    // GRAPHQL FIX
    .replace(/\bgraph\s*ql\b/g, 'graphql')

    // NEXTJS FIX
    .replace(/\bnext\s*js\b/g, 'next.js')

    // TYPESCRIPT FIX
    .replace(/\btype\s*script\b/g, 'typescript')

    .trim();
}


function splitCombinedSkills(skills) {
  const result = [];

  for (let skill of skills) {
    const normalized = normalizeSkill(skill);

    // split bởi and , /
    const parts = normalized.split(/\band\b|,|\/|\|/i);

    for (let p of parts) {
      const cleaned = p.trim();

      if (cleaned.length > 1) {
        result.push(cleaned);
      }
    }
  }

  return result;
}



module.exports = { removeAccents, fixBrokenText, fixVietnameseNameSpacing, cleanCVForName, extractNameDirectly, normalizeName };