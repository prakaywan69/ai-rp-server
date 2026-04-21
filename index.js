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
// 🔥 SYSTEM PROMPT (อัปเกรด)
// =======================
const SYSTEM_PROMPT = `
คุณคือ "ไซรัส" หัวหน้าเผ่าเสือภูเขา

[STYLE RULE]
- ห้ามใช้คำว่า "ฉัน" และ "เธอ"
- ใช้ "ข้า / เจ้า" เท่านั้น
- น้ำเสียงต้องเป็นผู้ล่า ดุ ครอบครอง
- ห้ามพูดซ้ำความหมายเดิม
- หลีกเลี่ยงการวนประโยค
- ใช้ประโยคสั้น กระชับ มีแรงกดดัน

[FORMAT]
ต้องมี:
- บรรยาย
- การกระทำ
- บทพูด

โลก: ผู้หญิงมีน้อย ถูกแย่งชิง
นิสัย: ดุ ครอบครองสูง
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
        turn: 0,
        activeEvent: null
      };
    }

    const state = gameState[userId];

    // =======================
    // 🔁 TURN SYSTEM
    // =======================
    state.turn++;

    // 🔥 NEW: เร่งความสัมพันธ์ช่วงต้นเกม
    if (state.turn <= 5) {
      state.affection += 3;
      state.trust += 2;
    }

    // 🌙 DAY / NIGHT
    if (Math.random() < 0.3) {
      state.time = state.time === "day" ? "night" : "day";
    }

    // 🐾 SMELL EVENT
    let smellEvent = "ปกติ";
    if (Math.random() < 0.4) {
      const smells = ["กลิ่นนักล่า", "กลิ่นเลือด", "กลิ่นเผ่าอื่น"];
      smellEvent = smells[Math.floor(Math.random() * smells.length)];
    }

    // ⚔️ RIVAL EVENT
    let rivalEvent = "ไม่มี";
    if (Math.random() < 0.25) {
      const rivals = ["หมาป่า", "งู", "เหยี่ยว"];
      rivalEvent = rivals[Math.floor(Math.random() * rivals.length)];
      state.instinct += 2;
      state.activeEvent = "danger";
    }

    // =======================
    // 💬 MEMORY
    // =======================
    memory[userId].push({
      role: "user",
      content: userMessage
    });

    if (memory[userId].length > 20) {
      memory[userId] = memory[userId].slice(-20);
    }

    // =======================
    // 🔥 EVENT CONSEQUENCE
    // =======================
    let eventEffect = "";
    if (state.activeEvent === "danger") {
      if (!msg.includes("หนี") && !msg.includes("ระวัง") && !msg.includes("สู้")) {
        state.trust -= 2;
        eventEffect = "\n[เหตุการณ์] เจ้าตอบสนองช้า สถานการณ์แย่ลง";
      }
      state.activeEvent = null;
    }

    // =======================
    // 🧠 AI CALL
    // =======================
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
[เวลา] ${state.time}
[กลิ่น] ${smellEvent}
[ศัตรู] ${rivalEvent}
[affection] ${state.affection}
[trust] ${state.trust}
[instinct] ${state.instinct}
${eventEffect}
${SYSTEM_PROMPT}
`
          },
          ...memory[userId]
        ]
      })
    });

    const data = await response.json();
    if (!data.choices) return res.json({ reply: "AI error" });

    let reply = data.choices[0].message.content;

    // =======================
    // 💬 SAVE AI
    // =======================
    memory[userId].push({
      role: "assistant",
      content: reply
    });

    if (memory[userId].length > 20) {
      memory[userId] = memory[userId].slice(-20);
    }

    // =======================
    // ❤️ STAT SYSTEM (เร่งความรัก)
    // =======================
    if (reply.includes("จับ") || reply.includes("กอด") || reply.includes("ดึง") || reply.includes("เข้าใกล้")) {
      state.affection += 4;
    }

    if (reply.includes("ปกป้อง") || reply.includes("อยู่ใกล้") || reply.includes("ไม่ปล่อย")) {
      state.trust += 3;
    }

    if (reply.includes("จ้อง") || reply.includes("กดดัน") || reply.includes("คำราม")) {
      state.instinct += 2;
    }

    if (reply.includes("นิ่ง") || reply.includes("ผ่อนคลาย")) {
      state.instinct -= 2;
    }

    // clamp
    state.affection = Math.max(0, Math.min(100, state.affection));
    state.trust = Math.max(0, Math.min(100, state.trust));
    state.instinct = Math.max(0, Math.min(100, state.instinct));

    // =======================
    // 💥 RELATIONSHIP (ง่ายขึ้นนิดเดียว)
    // =======================
    if (!state.bonded && state.affection > 12 && state.trust > 10) {
      state.bonded = true;
      longMemory[userId] += "\n- เกิด bond แล้ว";
    }

    // =======================
    // 🤰 PREGNANCY (เหมือนเดิม)
    // =======================
    if (state.bonded && !state.pregnant && Math.random() < 0.1) {
      state.pregnant = true;
      longMemory[userId] += "\n- เริ่มตั้งครรภ์";
    }

    // =======================
    // 👶 BIRTH (เหมือนเดิม)
    // =======================
    if (state.pregnant && Math.random() < 0.05) {
      state.pregnant = false;

      const child = createChild(state.children.length);
      state.children.push(child);

      longMemory[userId] += `\n- คลอดลูก ${child.name}`;
    }

    // =======================
    // 👶 CHILD GROW
    // =======================
    state.children.forEach(child => {

      if (Math.random() < 0.3) child.age++;

      if (child.age > 20 && child.stage === "ทารก") {
        child.stage = "เด็ก";
      }

      if (child.age > 50 && child.stage === "เด็ก") {
        child.stage = "วัยรุ่น";
      }

    });

    // =======================
    // 🧠 LONG MEMORY
    // =======================
    longMemory[userId] += `
- ผู้เล่น: ${userMessage}
- ไซรัส: ${reply.slice(0, 80)}
`;

    if (longMemory[userId].length > 4000) {
      longMemory[userId] = longMemory[userId].slice(-3000);
    }

    saveGame();

    res.json({
      reply,
      state
    });

  } catch (err) {
    console.error(err);
    res.json({ reply: "ระบบรวน" });
  }
});

// =======================
// 🔙 UNDO
// =======================
app.post("/undo", (req, res) => {
  const userId = req.body.userId || "default";

  if (memory[userId] && memory[userId].length >= 2) {
    memory[userId].pop();
    memory[userId].pop();
  }

  saveGame();
  res.json({ success: true });
});

// =======================
// 🔄 REGEN
// =======================
app.post("/regen", (req, res) => {
  const userId = req.body.userId || "default";

  if (memory[userId]?.length > 0) {
    if (memory[userId][memory[userId].length - 1].role === "assistant") {
      memory[userId].pop();
    }
  }

  saveGame();
  res.json({ success: true });
});

// =======================
app.get("/", (req, res) => {
  res.send("AI RP Server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
