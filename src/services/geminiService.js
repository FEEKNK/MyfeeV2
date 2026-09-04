const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

const FULL_THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export const analyzeSpending = async (financeData, selectedMonth, selectedYear, range) => {
  if (!API_KEY) {
    throw new Error('ไม่พบ API Key กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env');
  }

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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing spending:', error);
    throw error;
  }
};
