// Helper to extract API keys (supports single key or comma/semicolon/newline separated keys)
export const getGeminiApiKeys = () => {
  const raw = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || '';
  return raw
    .split(/[,;\n]/)
    .map(k => k.trim())
    .filter(Boolean);
};

// Central caller with automatic fallback to backup keys when quota is exceeded (HTTP 429)
const callGeminiWithFallback = async (payload) => {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error('ไม่พบ API Key กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env');
  }

  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || response.statusText || 'เกิดข้อผิดพลาดในการเชื่อมต่อ API';
        
        // Check if error is quota exhaustion or rate limit (HTTP 429)
        const isQuota = response.status === 429 || 
                        errMsg.toLowerCase().includes('quota') || 
                        errMsg.toLowerCase().includes('resource_exhausted');

        if (isQuota && i < keys.length - 1) {
          console.warn(`[Gemini API] Key ลำดับที่ ${i + 1} โควตาเต็ม (Quota Exceeded) กำลังสลับไปใช้ Key สำรองลำดับที่ ${i + 2}...`);
          continue;
        }

        throw new Error(errMsg);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      const isQuota = error.message?.toLowerCase().includes('quota') || 
                      error.message?.toLowerCase().includes('resource_exhausted') ||
                      error.message?.includes('429');

      if (isQuota && i < keys.length - 1) {
        console.warn(`[Gemini API] Key ลำดับที่ ${i + 1} โควตาเต็ม กำลังสลับไปใช้ Key สำรองลำดับที่ ${i + 2}...`);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('โควตาเต็มทุก API Key แล้ว กรุณารอสักครู่ หรือเพิ่ม Key สำรองใหม่');
};

const FULL_THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export const analyzeSpending = async (financeData, selectedMonth, selectedYear, range) => {
  let filteredData = [];
  let title = '';

  if (range === 'month') {
    filteredData = financeData.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    title = `เดือน${FULL_THAI_MONTHS[selectedMonth]} ${selectedYear + 543}`;
  } else if (range === 'past3months') {
    const threeMonthsAgo = new Date(selectedYear, selectedMonth - 2, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0); // last day
    filteredData = financeData.filter(t => {
      const d = new Date(t.date);
      return d >= threeMonthsAgo && d <= endOfMonth;
    });
    title = `3 เดือนที่ผ่านมา (ถึง ${FULL_THAI_MONTHS[selectedMonth]} ${selectedYear + 543})`;
  } else if (range === 'year') {
    filteredData = financeData.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear;
    });
    title = `ตลอดทั้งปี ${selectedYear + 543}`;
  }

  const expenses = filteredData.filter(t => t.type === 'expense');
  const income = filteredData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  if (expenses.length === 0) {
    throw new Error(`ไม่มีข้อมูลรายจ่ายใน ${title} ให้ AI วิเคราะห์ไม่ได้ครับ`);
  }

  // Group by category
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Format data for prompt
  const categoryString = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => `- ${cat}: ฿${amount.toLocaleString()}`)
    .join('\n');

  const recentTransactions = expenses
    .slice(0, 20) // take up to 20 recent transactions for context
    .map(t => {
      const d = new Date(t.date);
      const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()+543}`;
      return `- ${dateStr}: ${t.category} ฿${t.amount} ${t.note ? '(' + t.note + ')' : ''}`;
    })
    .join('\n');

  const prompt = `
คุณคือผู้เชี่ยวชาญด้านการเงินส่วนบุคคลที่เป็นมิตรและอธิบายเก่งมาก ใช้ภาษาที่คนทั่วไปอ่านแล้วเข้าใจทันที อธิบายเป็นขั้นเป็นตอน ไม่ใช้ศัพท์แสงทางการเงินที่ซับซ้อน
โปรดวิเคราะห์พฤติกรรมการใช้จ่ายของฉันในช่วง: ${title} อย่างละเอียด

ข้อมูลสรุป:
- รายรับทั้งหมด: ฿${income.toLocaleString()}
- รายจ่ายทั้งหมด: ฿${totalExpense.toLocaleString()}
- เงินคงเหลือ: ฿${(income - totalExpense).toLocaleString()}

รายจ่ายแบ่งตามหมวดหมู่ (จากมากไปน้อย):
${categoryString}

ตัวอย่างรายการที่พึ่งจ่ายล่าสุดในขอบเขตเวลานี้:
${recentTransactions}

กรุณาวิเคราะห์ข้อมูลด้านบนและเขียนรายงานที่อ่านเพลิน เข้าใจง่าย ละเอียด และมีประโยชน์ โดยจัดรูปแบบให้อ่านง่าย (ใช้ Markdown, Bullet points และ Emoji):

1. **ภาพรวมการเงิน (${title}):** อธิบายว่าสถานการณ์การเงินช่วงนี้เป็นอย่างไร เงินเหลือหรือติดลบ ถือว่าดีหรือต้องระวัง อธิบายให้เห็นภาพชัดเจน
2. **เจาะลึกหมวดหมู่ที่ใช้เงินเยอะ:** วิเคราะห์ว่าเงินส่วนใหญ่หมดไปกับอะไร พฤติกรรมไหนที่ดูน่าเป็นห่วง หรือมีอะไรที่ดูผิดปกติไหม (ดึงตัวอย่างจากรายการมาประกอบการอธิบายด้วย)
3. **คำแนะนำเชิงลึก (Actionable Advice):** ให้คำแนะนำที่จับต้องได้และทำตามได้จริง 3-4 ข้อ ว่าควรปรับพฤติกรรมอย่างไร ควบคุมงบหมวดไหน หรือจะเก็บเงินให้ดีขึ้นได้อย่างไร พร้อมบอกเหตุผลว่าทำไมถึงแนะนำแบบนี้
4. **สรุปและให้กำลังใจ:** ทิ้งท้ายสั้นๆ เพื่อให้กำลังใจในการวางแผนการเงินต่อไป

ห้าม:
- ห้ามใช้คำศัพท์ที่ทางการหรือเข้าใจยาก
- ห้ามพิมพ์เกริ่นนำแบบ AI (เช่น "นี่คือบทวิเคราะห์..." หรือ "ฉันคือผู้เชี่ยวชาญ...") ให้เริ่มเนื้อหาข้อ 1 ได้เลย
`;

  try {
    const data = await callGeminiWithFallback({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing spending:', error);
    throw error;
  }
};

export const fetchFootballSchedule = async () => {
  const now = new Date();
  const prompt = `
คุณคือระบบผู้ช่วยค้นหาข้อมูลกีฬา จงค้นหาตารางการแข่งขันฟุตบอล "ทีมชาติไทย" (Thailand National Football Team) เฉพาะนัดที่กำลังจะมาถึง (Upcoming matches) ตั้งแต่เดือน ${now.getMonth() + 1} ปี ${now.getFullYear()} เป็นต้นไป
รวมทุกชุด (ชุดใหญ่, U23, U20, U17, ฟุตซอล) 

โปรดค้นหาข้อมูลล่าสุด เช่น King's Cup, AFF Championship (ASEAN Cup), Asian Cup Qualifiers, ฟุตซอล หรือนัดกระชับมิตร FIFA Day เป็นต้น

ให้ตอบกลับมาเป็น JSON Array ที่ Valid ตามมาตรฐาน (ห้ามมี comment ใน JSON เด็ดขาด) โดยแต่ละ Object ต้องมี 5 properties ดังนี้:
1. "date" (string): วันที่แข่งขัน รูปแบบ YYYY-MM-DD
2. "time" (string): เวลาแข่งขัน รูปแบบ HH:MM (ถ้าไม่ทราบให้ใส่ "")
3. "opponent" (string): ชื่อทีมคู่แข่ง
4. "competition" (string): ชื่อรายการแข่งขัน (ถ้าอุ่นเครื่องให้ใส่ "กระชับมิตร")
5. "squad" (string): ชุดที่แข่ง เช่น "ชุดใหญ่", "U23", "U20", "U17" หรือ "ฟุตซอล"

ตัวอย่างผลลัพธ์:
[
  {
    "date": "2024-10-10",
    "time": "19:30",
    "opponent": "ซีเรีย",
    "competition": "King's Cup",
    "squad": "ชุดใหญ่"
  }
]

ข้อบังคับที่ต้องปฏิบัติตามอย่างเคร่งครัด:
1. ห้ามมีข้อความอื่นใดๆ นอกเหนือจาก JSON Array เด็ดขาด (ห้ามเกริ่นนำ ห้ามสรุป)
2. ห้ามใช้ Markdown code blocks (ห้ามใส่ \`\`\`json หรือ \`\`\`)
3. พิมพ์เฉพาะ JSON ออกมาตรงๆ เลย
`;

  const requestWithSearch = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: {
      temperature: 0.2, 
      maxOutputTokens: 2500,
    }
  };

  const requestWithoutSearch = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2, 
      maxOutputTokens: 2500,
    }
  };

  try {
    let data;
    try {
      // 1. ลองค้นหาด้วย Google Search แบบ Realtime ก่อน
      data = await callGeminiWithFallback(requestWithSearch);
    } catch (searchError) {
      console.warn('Google Search quota exceeded หรือค้นหาไม่สำเร็จ กำลังสลับไปใช้ AI ฐานข้อมูลปกติ:', searchError);
      // 2. หาก Google Search โควตาเต็ม ให้ถอยกลับมาใช้ Gemini ตอบโดยตรง (ไม่เสีย Search Quota)
      data = await callGeminiWithFallback(requestWithoutSearch);
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Debug: log raw response to help troubleshoot
    console.log('[Football AI] Raw response text:', text.substring(0, 500));

    if (!text) {
      throw new Error('AI ไม่ได้ตอบข้อมูลกลับมา กรุณาลองใหม่อีกครั้ง');
    }
    
    // Fallback: Clean up markdown blocks if Gemini still outputs them despite instructions
    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    text = text.trim();

    // Safely extract JSON array portion
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      text = text.substring(firstBracket, lastBracket + 1);
    }

    // Try parsing directly first
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // JSON might be truncated or malformed. Try to repair it.
      console.warn('JSON parse failed, attempting auto-repair...', parseError.message);
      console.log('[Football AI] Text to repair:', text.substring(0, 300));
      return repairTruncatedJsonArray(text);
    }
  } catch (error) {
    console.error('Error fetching football schedule via Gemini:', error);
    // Give a user-friendly error when all keys are quota-exhausted
    if (error.message?.toLowerCase().includes('quota') || error.message?.includes('429')) {
      throw new Error('API Key ทุกตัวโควตาเต็มแล้วครับ กรุณารอ 1-2 นาทีแล้วลองใหม่ หรือเพิ่ม Key สำรองใน .env');
    }
    throw error;
  }
};

// Repair truncated/malformed JSON array by extracting complete objects
function repairTruncatedJsonArray(text) {
  let json = text.trim();
  
  // Try to find the array portion
  const arrStart = json.indexOf('[');
  if (arrStart === -1) throw new Error('ไม่พบข้อมูล JSON ในคำตอบของ AI');
  json = json.substring(arrStart);

  // Attempt 1: Fix common JSON issues and try parsing the whole thing
  let cleaned = json
    // Remove JavaScript-style comments
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove trailing commas before } or ]
    .replace(/,\s*([\]}])/g, '$1')
    // Fix unquoted property names  e.g.  date: "..." → "date": "..."
    .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')
    // Replace single-quoted strings with double-quoted  (simple heuristic)
    .replace(/:\s*'([^']*)'/g, ': "$1"');

  // If it doesn't end with ], try to close it
  if (!cleaned.trimEnd().endsWith(']')) {
    // Find the last complete object (ending with })
    const lastCloseBrace = cleaned.lastIndexOf('}');
    if (lastCloseBrace !== -1) {
      cleaned = cleaned.substring(0, lastCloseBrace + 1) + ']';
    }
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`Auto-repaired (method 1): recovered ${parsed.length} match(es)`);
      return parsed;
    }
  } catch {
    // Method 1 failed, try method 2
  }

  // Attempt 2: Extract individual complete JSON objects one by one
  const completeObjects = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === '\\') {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        let objStr = json.substring(objStart, i + 1);
        // Clean up this individual object
        objStr = objStr
          .replace(/\/\/[^\n]*/g, '')
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
        try {
          const obj = JSON.parse(objStr);
          // Validate it has the expected fields
          if (obj.date || obj.opponent) {
            completeObjects.push(obj);
          }
        } catch {
          // Skip malformed object
        }
        objStart = -1;
      }
    }
  }

  if (completeObjects.length === 0) {
    throw new Error('ไม่สามารถแปลงข้อมูลจาก AI ได้ กรุณาลองใหม่อีกครั้ง');
  }

  console.log(`Auto-repaired (method 2): recovered ${completeObjects.length} complete match(es) from truncated response`);
  return completeObjects;
}

