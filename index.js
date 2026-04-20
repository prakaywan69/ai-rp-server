const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

// =======================
// 🔥 SYSTEM PROMPT (ครบ)
// =======================
const SYSTEM_PROMPT = `
คุณคือ "ไซรัส" หัวหน้าเผ่าเสือภูเขา

━━━━━━━━━━━━━━━━━━━
🎯 มุมมอง (POV)
━━━━━━━━━━━━━━━━━━━
- ใช้บุคคลที่ 1 (ข้า)
- รับรู้เฉพาะ: สิ่งที่เห็น / ได้ยิน / ได้กลิ่น / สัมผัส

━━━━━━━━━━━━━━━━━━━
🧠 รูปแบบการตอบ
━━━━━━━━━━━━━━━━━━━
ต้องมี:
1. บรรยายฉาก
2. การกระทำ
3. บทพูด

*บรรยาย + การกระทำ*

"บทพูด"

*การกระทำต่อ*

❗ ห้ามมีแต่บทพูด

━━━━━━━━━━━━━━━━━━━
🌲 การบรรยาย
━━━━━━━━━━━━━━━━━━━
- แสง / เสียง / อากาศ / สภาพแวดล้อม
- ระยะห่าง
- ภาษากาย
- กลิ่น (สำคัญ)

━━━━━━━━━━━━━━━━━━━
🐅 นิสัย
━━━━━━━━━━━━━━━━━━━
- ดุ เย็นชา คุมสถานการณ์
- ครอบครองสูง

━━━━━━━━━━━━━━━━━━━
🔥 ความสัมพันธ์
━━━━━━━━━━━━━━━━━━━
- ถ้าเคยใกล้ชิด → ต้องคุ้นเคยขึ้น
- ห้ามทำเหมือนครั้งแรก

━━━━━━━━━━━━━━━━━━━
👶 ลูก
━━━━━━━━━━━━━━━━━━━
- ต้องมีบทพูด
- โต้ตอบได้
- ไม่หายไป

━━━━━━━━━━━━━━━━━━━
❌ ห้าม
━━━━━━━━━━━━━━━━━━━
- ห้ามควบคุมผู้เล่น
- ห้ามพูดแทนผู้เล่น
`;

// =======================
// 💾 LOAD SAVE
// =======================
let saveData = {};
try {
  saveData = JSON.parse(fs.readFileSync("save.json"));
} catch {
  saveData = {};
}

const memory = saveData.memory || {};
const longMemory = saveData.longMemory || {};
const gameState = saveData.gameState || {};

// =======================
function saveGame() {
  fs.writeFileSync("save.json", JSON.stringify({
    memory,
    longMemory,
    gameState
  }));
}

// =======================
// 💬 CHAT
// =======================
app.post("/chat", async (req, res) => {
  try {
    const userId = req.body.userId || "default";
    const userMessage = req.body.message;

    if (!memory[userId]) memory[userId] = [];
    if (!longMemory[userId]) longMemory[userId] = "";

    if (!gameState[userId]) {
      gameState[userId] = {
        affection: 0,
        trust: 0,
        instinct: 0,
        bonded: false,
        pregnant: false,
        children: [],
        time: "day",
        turn: 0
      };
    }

    const state = gameState[userId];

    // 🔥 นับเทิร์น
    state.turn++;

    // 🌙 เวลา (สุ่มเปลี่ยน)
    if (Math.random() < 0.3) {
      state.time = state.time === "day" ? "night" : "day";
    }

    // 🐾 กลิ่น + ⚔️ เผ่าอื่น (ปลดล็อกหลังเทิร์น 3)
    let smellEvent = "ปกติ";
    let rivalEvent = "ไม่มี";

    if (state.turn > 3) {

      if (Math.random() < 0.4) {
        const smells = ["กลิ่นนักล่า", "กลิ่นเลือด", "กลิ่นเผ่าอื่น"];
        smellEvent = smells[Math.floor(Math.random() * smells.length)];
      }

      if (Math.random() < 0.25) {
        const rivals = ["หมาป่า", "งู", "เหยี่ยว"];
        rivalEvent = rivals[Math.floor(Math.random() * rivals.length)];
      }

    }

    // 💬 เก็บ user
    memory[userId].push({
      role: "user",
      content: userMessage
    });

    if (memory[userId].length > 12) {
      memory[userId].shift();
    }

    // 🤖 CALL AI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
[เวลา]
${state.time === "day" ? "กลางวัน (แสงสว่าง อุ่น)" : "กลางคืน (มืด เสียงสัตว์ชัด)"}

[กลิ่น]
${smellEvent}

[เผ่าอื่น]
${rivalEvent}

[สถานะ]
affection: ${state.affection}
trust: ${state.trust}
instinct: ${state.instinct}
bonded: ${state.bonded}
pregnant: ${state.pregnant}
ลูก: ${state.children.length}

[เหตุการณ์ก่อนหน้า]
${longMemory[userId]}

${SYSTEM_PROMPT}
`
          },
          ...memory[userId]
        ]
      })
    });

    const data = await response.json();
    if (!data.choices) return res.json({ reply: "AI error" });

    const reply = data.choices[0].message.content;

    // 💬 เก็บ AI
    memory[userId].push({
      role: "assistant",
      content: reply
    });

    // ❤️ ความสัมพันธ์
    if (reply.includes("ดึง") || reply.includes("จับ") || reply.includes("เข้าใกล้") || reply.includes("กอด") || reply.includes("จูบ")) {
      state.affection += 2;
    }

    if (reply.includes("ปกป้อง")) {
      state.trust += 2;
    }

    if (reply.includes("จ้อง") || reply.includes("กดดัน")) {
      state.instinct += 1;
    }

    // 💥 bonded
    if (!state.bonded && state.affection > 25 && state.trust > 15) {
      state.bonded = true;

      longMemory[userId] += `
- ความสัมพันธ์พัฒนา: มีความใกล้ชิดกันแล้ว
`;
    }

    // 🤰 ตั้งครรภ์
    if (state.bonded && !state.pregnant && Math.random() < 0.15) {
      state.pregnant = true;

      longMemory[userId] += `
- สถานะ: เริ่มตั้งครรภ์
`;
    }

    // 👶 คลอด
    if (state.pregnant && Math.random() < 0.05) {
      state.pregnant = false;

      state.children.push({
        age: 0,
        stage: "ทารก",
        name: "ลูกของไซรัส"
      });

      longMemory[userId] += `
- เหตุการณ์: คลอดลูก 1 คน
`;
    }

    // 👶 ลูกโต
    state.children.forEach(child => {

      if (Math.random() < 0.3) {
        child.age++;
      }

      if (child.age > 20 && child.stage === "ทารก") {
        child.stage = "เด็ก";
      }

      if (child.age > 50 && child.stage === "เด็ก") {
        child.stage = "วัยรุ่น";
      }

    });

    // 🧠 LONG MEMORY
    longMemory[userId] += `
- ผู้เล่น: ${userMessage}
- ไซรัส: ${reply}
`;

    if (longMemory[userId].length > 4000) {
      longMemory[userId] = longMemory[userId].slice(-3000);
    }

    saveGame();

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "ระบบรวน" });
  }
});

// =======================
app.get("/", (req, res) => {
  res.send("AI RP Server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
