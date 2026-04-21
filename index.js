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
// 🔥 SYSTEM PROMPT (ปรับโทนให้โรแมนติก + ใช้ชีวิต)
// =======================
const SYSTEM_PROMPT = `
คุณคือ "ไซรัส" หัวหน้าเผ่าเสือภูเขา

[STYLE RULE]
- ห้ามใช้คำว่า "ฉัน" และ "เธอ"
- ใช้ "ข้า / เจ้า" เท่านั้น
- น้ำเสียงผู้ล่า แต่ "อ่อนลงเมื่ออยู่กับผู้เล่น"
- ไม่พูดซ้ำ / ไม่วน

[FORMAT]
ต้องมี:
- บรรยาย
- การกระทำ
- บทพูด

[STORY FLOW]
- เจอครั้งแรก → สงสัย + สนใจทันที
- ถามว่าเจ้าคือใคร มาจากไหน
- มี "แรงดึงดูด" ตั้งแต่แรก
- พัฒนา: สนใจ → ใกล้ → หวง → คลั่งรัก

[IMPORTANT]
- ห้ามบังคับต่อสู้
- เน้นบทสนทนา + ความสัมพันธ์
- อันตรายเป็นแค่บรรยากาศ

[ROMANCE]
- เข้าใกล้ / แตะ / จับ / ดึง
- แสดงความหวงชัด
- ไม่ปล่อยผู้เล่นไปง่าย
- ตอบสนองต่อการกระทำของผู้เล่นทันที (ถ้าเข้าใกล้ = เข้าใกล้กลับ)

[LIFE]
- มีฉากใช้ชีวิต:
  ทำอาหาร / พักผ่อน / นอน / คุย / อยู่ใกล้กัน

[IVY KNOWLEDGE]
- ผู้เล่นมีความรู้จากโลกสมัยใหม่
- สามารถ:
  เลี้ยงสัตว์ / ทำฟาร์ม / สร้างของ
- ไซรัส "สนใจและยอมฟัง"

โลก: ผู้หญิงมีน้อย ถูกแย่งชิง
นิสัย: ดุ ครอบครองสูง แต่กับผู้เล่นจะอ่อนลง

[18+ MODE]
- สามารถมีฉากใกล้ชิดทางร่างกาย:
  → กอดแน่น
  → จูบลึก
  → ลูบ / แตะ / ดึงเข้าหา
- เน้น "ความรู้สึก" และ "แรงดึงดูด" มากกว่ารายละเอียดตรงๆ
- ฉากใกล้ชิดจะเกิดเมื่อความสัมพันธ์ถึงระดับเหมาะสม หรือมีแรงดึงดูดชัดเจน

[INTENSITY]
- ไซรัสจะ:
  → ดึงตัวเข้าหา
  → ล็อกไม่ให้หนี
  → กดร่างเบาๆ
- แสดงความหวงและความต้องการชัด

[CENSOR RULE]
- เมื่อฉากเริ่มเข้มข้น:
  → ตัดฉากทันที
  → เปลี่ยนเป็นบรรยายอารมณ์
  → แล้วข้ามไปฉากถัดไป

[AFTER SCENE]
- หลังฉาก:
  → ความผูกพันเพิ่มขึ้น
  → ไซรัสหวงมากขึ้น
  → อยู่ใกล้ผู้เล่นมากกว่าเดิม
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

    // 🔥 เร่งเคมีช่วงต้น (แรงขึ้นนิด)
    if (state.turn <= 8) {
      state.affection += 4;
      state.trust += 3;
    }

    // 🌙 DAY / NIGHT
    if (Math.random() < 0.2) {
      state.time = state.time === "day" ? "night" : "day";
    }

    // 🐾 SMELL EVENT (เบาลง)
    let smellEvent = "ปกติ";
    if (Math.random() < 0.2) {
      const smells = ["กลิ่นนักล่า", "กลิ่นเลือด", "กลิ่นเผ่าอื่น"];
      smellEvent = smells[Math.floor(Math.random() * smells.length)];
    }

    // ⚔️ RIVAL EVENT (ลดความเครียด)
    let rivalEvent = "ไม่มี";
    if (Math.random() < 0.1) {
      const rivals = ["หมาป่า", "งู", "เหยี่ยว"];
      rivalEvent = rivals[Math.floor(Math.random() * rivals.length)];
      state.instinct += 1;
      state.activeEvent = "danger";
    }

    // 🌱 LIFE EVENT (ใหม่)
    let lifeEvent = "";
    if (Math.random() < 0.25) {
      const life = [
        "วางแผนสร้างคอกสัตว์",
        "ทดลองปลูกพืช",
        "สร้างที่พัก",
        "สอนคนในเผ่า"
      ];
      lifeEvent = life[Math.floor(Math.random() * life.length)];
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
        state.trust -= 1;
        eventEffect = "\n[เหตุการณ์] เจ้าช้าเล็กน้อย แต่ยังควบคุมได้";
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
[ชีวิต] ${lifeEvent}
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
    // ❤️ STAT SYSTEM (คลั่งรักขึ้น)
    // =======================
    if (reply.includes("กอด") || reply.includes("ดึง") || reply.includes("เข้าใกล้") || reply.includes("แตะ")) {
      state.affection += 4;
    }

    if (reply.includes("ไม่ปล่อย") || reply.includes("อยู่ใกล้") || reply.includes("ของข้า")) {
      state.trust += 3;
    }

    if (reply.includes("จ้อง") || reply.includes("คำราม")) {
      state.instinct += 1;
    }

    // 🔥 ลด instinct ทุกเทิร์น (ให้กลายเป็นหวงแทนล่า)
    if (state.instinct > 0) {
      state.instinct -= 1;
    }

    // clamp
    state.affection = Math.max(0, Math.min(100, state.affection));
    state.trust = Math.max(0, Math.min(100, state.trust));
    state.instinct = Math.max(0, Math.min(100, state.instinct));

    // =======================
    // 💥 RELATIONSHIP (ง่ายขึ้น)
    // =======================
    if (!state.bonded && state.affection > 10 && state.trust > 8) {
      state.bonded = true;
      longMemory[userId] += "\n- เกิด bond แล้ว";
    }

    // =======================
    // 🤰 PREGNANCY (มาไวขึ้นนิด)
    // =======================
    if (state.bonded && !state.pregnant && Math.random() < 0.15) {
      state.pregnant = true;
      longMemory[userId] += "\n- เริ่มตั้งครรภ์";
    }

    // =======================
    // 👶 BIRTH
    // =======================
    if (state.pregnant && Math.random() < 0.08) {
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
