import { FULL_THAI_MONTHS } from '../constants/appConstants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isValidIsoDate } from '../utils/dateUtils';
import { sumMoney } from '../utils/moneyUtils';

const callGeminiProxy = async (action, input = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        const err = new Error('กรุณาเข้าสู่ระบบ Cloud Sync ก่อนใช้งานฟีเจอร์ AI');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, input }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อบริการ AI');
      if (response.status === 401) err.code = 'AUTH_REQUIRED';
      if (response.status === 403) err.code = 'NOT_ALLOWED';
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('คำขอ AI หมดเวลา กรุณาลองใหม่อีกครั้ง');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

export const analyzeSpending = async (financeData, selectedMonth, selectedYear, range) => {
  const safeData = Array.isArray(financeData) ? financeData : [];
  let filteredData = [];
  let title = '';

  if (range === 'month') {
    filteredData = safeData.filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    title = `เดือน${FULL_THAI_MONTHS[selectedMonth]} ${selectedYear + 543}`;
  } else if (range === 'past3months') {
    const threeMonthsAgo = new Date(selectedYear, selectedMonth - 2, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    filteredData = safeData.filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d >= threeMonthsAgo && d <= endOfMonth;
    });
    title = `3 เดือนที่ผ่านมา (ถึง ${FULL_THAI_MONTHS[selectedMonth]} ${selectedYear + 543})`;
  } else if (range === 'year') {
    filteredData = safeData.filter((t) => {
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
    });
    title = `ตลอดทั้งปี ${selectedYear + 543}`;
  }

  const expenses = filteredData
    .filter((t) => t.type === 'expense')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const income = sumMoney(filteredData.filter((t) => t.type === 'income'));
  const totalExpense = sumMoney(expenses);

  if (expenses.length === 0) {
    throw new Error(`ไม่มีข้อมูลรายจ่ายใน ${title} ให้ AI วิเคราะห์ไม่ได้ครับ`);
  }

  const categoryTotals = expenses.reduce((acc, t) => {
    const cat = String(t.category || 'อื่นๆ').slice(0, 40);
    acc[cat] = (acc[cat] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});

  const categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([category, amount]) => ({ category, amount }));

  const recentTransactions = expenses.slice(0, 20).map((t) => {
    const d = new Date(t.date);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
    return {
      dateStr,
      category: String(t.category || 'อื่นๆ').slice(0, 40),
      amount: Number(t.amount) || 0,
      note: String(t.note || '').slice(0, 80),
    };
  });

  const data = await callGeminiProxy('analyze_spending', {
    title,
    income,
    totalExpense,
    categories,
    recentTransactions,
  });

  const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!replyText) {
    throw new Error('AI ไม่สามารถสร้างบทวิเคราะห์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
  }
  return replyText;
};

const normalizeMatchList = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      date: typeof item.date === 'string' ? item.date.trim() : '',
      time: typeof item.time === 'string' ? item.time.trim() : '',
      opponent: typeof item.opponent === 'string' ? item.opponent.trim() : '',
      competition: typeof item.competition === 'string' ? item.competition.trim() : '',
      squad: typeof item.squad === 'string' && item.squad.trim() ? item.squad.trim() : 'ชุดใหญ่',
    }))
    .filter((item) => isValidIsoDate(item.date) && item.opponent.length > 0);
};

export const fetchFootballSchedule = async () => {
  const data = await callGeminiProxy('football_schedule', {});
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  if (!text) {
    throw new Error('AI ไม่ได้ตอบข้อมูลกลับมา กรุณาลองใหม่อีกครั้ง');
  }

  if (text.startsWith('```json')) text = text.substring(7);
  if (text.startsWith('```')) text = text.substring(3);
  if (text.endsWith('```')) text = text.substring(0, text.length - 3);
  text = text.trim();

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    text = text.substring(firstBracket, lastBracket + 1);
  }

  try {
    return normalizeMatchList(JSON.parse(text));
  } catch {
    return normalizeMatchList(repairTruncatedJsonArray(text));
  }
};

function repairTruncatedJsonArray(text) {
  let json = text.trim();
  const arrStart = json.indexOf('[');
  if (arrStart === -1) throw new Error('ไม่พบข้อมูล JSON ในคำตอบของ AI');
  json = json.substring(arrStart);

  let cleaned = json
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"');

  if (!cleaned.trimEnd().endsWith(']')) {
    const lastCloseBrace = cleaned.lastIndexOf('}');
    if (lastCloseBrace !== -1) {
      cleaned = cleaned.substring(0, lastCloseBrace + 1) + ']';
    }
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall through to object-by-object recovery
  }

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
        const objStr = json
          .substring(objStart, i + 1)
          .replace(/\/\/[^\n]*/g, '')
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
        try {
          const obj = JSON.parse(objStr);
          if (obj && typeof obj.date === 'string' && typeof obj.opponent === 'string') {
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

  return completeObjects;
}
