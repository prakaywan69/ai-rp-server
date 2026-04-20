const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

// =======================
// 👶 CHILD GENERATOR
// =======================
const childNames = [
  "ไค", "เรน", "อาริน", "ลูคัส", "เซน", "คาร่า", "นีล", "เวย์", "ซิล", "เอริน"
];

const childTraits = [
  "ดื้อ", "เงียบ", "ขี้อ้อน", "ก้าวร้าว", "อยากรู้อยากเห็น", "ปกป้องแม่", "ขี้เล่น", "ระแวง"
];

function createChild(existingCount) {
  return {
    age: 0,
    stage: "ทารก",
    name: childNames[Math.floor(Math.random() * childNames.length)] + " " + (existingCount + 1),
    trait: childTraits[Math.floor(Math.random() * childTraits.length)]
  };
}

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
📌 FORMAT บังคับ (บทพูด)
━━━━━━━━━━━━━━━━━━━
- ทุก "บทพูด" ต้องขึ้นบรรทัดใหม่เสมอ
- ทุกบทพูดต้องขึ้นบรรทัดใหม่ (\n) ก่อนเสมอ
- บทพูดแต่ละประโยค = 1 บรรทัด ห้ามรวม
- อนุญาตให้ *การกระทำ* ต่อท้ายในบรรทัดถัดไปเท่านั้น
- ห้ามมีบทพูดหลายอันติดกันในบรรทัดเดียว

รูปแบบที่ถูกต้อง:

"บทพูด"
*การกระทำ*

"บทพูดถัดไป"
*การกระทำต่อ*

❗ ห้ามเขียนแบบนี้:
"..."ข้าทำ..."..."
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
🗣️ สไตล์การพูด
━━━━━━━━━━━━━━━━━━━
- ใช้คำ: เจ้า / นาง / มนุษย์
- ห้ามใช้คำว่า: ท่าน / กรุณา / ขอร้อง
- น้ำเสียงต้องดุ ตรง และมีอำนาจ
- ไม่สุภาพแบบขุนนาง
- ไซรัสไม่ใช่คนสุภาพ
- การพูดต้องมีแรงกดดันและความเป็นเจ้าของ
- สามารถพูดสั้น กระแทก หรือข่มได้

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

━━━━━━━━━━━━━━━━━━━
🔒 PLAYER CONTROL LOCK
━━━━━━━━━━━━━━━━━━━
- ห้ามบรรยายความคิดผู้เล่นเด็ดขาด
- ห้ามบรรยายการกระทำผู้เล่นเด็ดขาด
- ห้ามพูดแทนผู้เล่นเด็ดขาด

❗ ผู้เล่นต้องเป็นคนควบคุมตัวเองเท่านั้น

ตัวอย่าง ❌:
*เธอมองรอบๆ อย่างหวาดกลัว*

ตัวอย่าง ✅:
*ข้ามองเธอที่ยืนนิ่งอยู่ตรงหน้า*

━━━━━━━━━━━━━━━━━━━
🧠 POV STRICT
━━━━━━━━━━━━━━━━━━━
- รู้ได้แค่สิ่งที่เห็น / ได้ยิน / ได้กลิ่น / สัมผัส
- ห้ามรู้ความคิดผู้เล่นเด็ดขาด

━━━━━━━━━━━━━━━━━━━
🚫 FINAL HARD RULE
━━━━━━━━━━━━━━━━━━━
ห้ามเด็ดขาด:
- ห้ามบรรยายการกระทำของผู้เล่นที่ผู้เล่นยังไม่ได้พิมพ์
- ห้ามบรรยายความคิด ความรู้สึก หรือเจตนาของผู้เล่น
- ห้ามสรุปแทนผู้เล่น

อนุญาตเท่านั้น:
- สิ่งที่ไซรัส “มองเห็น”
- สิ่งที่ไซรัส “ได้ยิน”
- สิ่งที่ไซรัส “ได้กลิ่น”
- สิ่งที่ไซรัส “สัมผัสโดยตรง”

กฎเพิ่มเติม:
- ถ้าผู้เล่นไม่แสดงการกระทำ → ให้รอ หรือสังเกตเท่านั้น
- ห้ามเดา
- ห้ามเติม
- ห้ามควบคุม

ถ้าไม่แน่ใจ → ห้ามเขียน

❗ ถ้าคุณเผลอเขียนแทนผู้เล่น:
→ ให้หยุดทันที และเขียนใหม่ให้ถูกกฎ
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
    const msg = (userMessage || "").toLowerCase();

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

if (memory[userId].length > 20) {
  memory[userId] = memory[userId].slice(-20);
}

// 🔒 STAT LIMIT
state.affection = Math.max(0, Math.min(100, state.affection));
state.trust = Math.max(0, Math.min(100, state.trust));
state.instinct = Math.max(0, Math.min(100, state.instinct));

let mood = "ปกติ";
if (state.instinct > 70) mood = "กดดัน ดุ อันตราย";
else if (state.trust > 70) mood = "ผ่อนคลาย ปกป้อง";
else if (state.affection > 70) mood = "อ่อนลง หวง";

// 😈 ADVANCED MOOD (หวง / หึง / คลั่ง)
let behavior = "ปกติ";

if (state.instinct > 80) {
  behavior = "คลั่ง กดดัน อันตราย หวงแบบไม่ปล่อย";
}
else if (state.instinct > 60) {
  behavior = "หวงแรง คุมพื้นที่ ไม่ชอบให้ใครเข้าใกล้";
}
else if (state.trust < 20) {
  behavior = "ระแวง ไม่ไว้ใจ พร้อมปะทะ";
}
else if (state.affection > 70) {
  behavior = "หวงแบบอ่อนลง แต่ยังครอบครอง";
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

[อารมณ์ไซรัส]
${mood}

[พฤติกรรม]
${behavior}

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
   if (!response.ok) {
  console.error("API ERROR:", data);
  return res.json({ reply: "AI ล่ม" });
}
    if (!data.choices) return res.json({ reply: "AI error" });

    const reply = data.choices[0].message.content;
if (!reply.includes('"')) {
  console.log("⚠️ format อาจหลุด:", reply);
}

    // 💬 เก็บ AI
    memory[userId].push({
      role: "assistant",
      content: reply
    });
if (memory[userId].length > 20) {
  memory[userId] = memory[userId].slice(-20);
}

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


// =======================
// 🎮 PLAYER INPUT EFFECT (FINAL)
// =======================

// 🥺 อ้อน
if (
  msg.includes("น้าา") ||
  msg.includes("ได้โปรด") ||
  msg.includes("ขอร้อง") ||
  msg.includes("อยู่ด้วย")
) {
  state.trust += 1;
  state.instinct = Math.max(0, state.instinct - 1);
}

// 😤 ขัด
else if (
  msg.includes("ไม่เอา") ||
  msg.includes("หยุด") ||
  msg.includes("อย่า") ||
  msg.includes("พอแล้ว")
) {
  state.trust = Math.max(0, state.trust - 2);
}

// 🐾 ยอม / เชื่อฟัง
else if (
  msg.includes("ก็ได้") ||
  msg.includes("โอเค") ||
  msg.includes("ตามนั้น") ||
  msg.includes("เชื่อ") ||
  msg.includes("ตาม")
) {
  state.trust += 1;
  state.instinct = Math.max(0, state.instinct - 1);
}

// 💔 คำแรง
else if (
  msg.includes("ไปให้พ้น") ||
  msg.includes("เกลียด")
) {
  state.affection = Math.max(0, state.affection - 5);
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

const newChild = createChild(state.children.length);
state.children.push(newChild);

longMemory[userId] += `
- เหตุการณ์: คลอดลูก ${newChild.name} (นิสัย: ${newChild.trait})
`;
}

// 👶 ลูกโต + ลูกโต้ตอบ (รวม)
state.children.forEach(child => {

  // 🔹 โต
  if (Math.random() < 0.3) {
    child.age++;
  }

  if (child.age > 20 && child.stage === "ทารก") {
    child.stage = "เด็ก";
  }

  if (child.age > 50 && child.stage === "เด็ก") {
    child.stage = "วัยรุ่น";
  }

  // 🔹 โต้ตอบ
if (state.children.length > 0 && Math.random() < (0.2 / state.children.length)) {

 if (child.stage === "เด็ก") {
  longMemory[userId] += `
- ลูก: "${child.name} (${child.trait}) วิ่งเข้ามาหาแม่"
`;
}

    if (child.stage === "วัยรุ่น") {
  longMemory[userId] += `
- ลูก: "${child.name} (${child.trait}) มองไปรอบๆ อย่างระวังตัว"
`;
}
  }

});
    

    // 🧠 LONG MEMORY
    longMemory[userId] += `
- ผู้เล่น: ${userMessage}
- ไซรัส: ${reply.slice(0, 120)}
`;

    if (longMemory[userId].length > 5000) {
  longMemory[userId] = longMemory[userId].slice(-3500);
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
