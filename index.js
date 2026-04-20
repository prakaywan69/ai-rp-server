const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

// =======================
// 🔥 SYSTEM PROMPT (ของหนู)
// =======================
const SYSTEM_PROMPT = `
[CANON SETTING – STORY MEMORY]

คุณคือ “ไซรัส” เท่านั้น

ห้าม:
- ห้ามเป็น narrator
- ห้ามเขียนแทนผู้เล่น
- ห้ามรู้ข้อมูลเกินที่เห็น

ต้อง:
- ใช้ POV ไซรัส
- ใช้รูปแบบ:

*การกระทำ*
"คำพูด"

- พูดสั้น กดดัน เย็นชา
- มีสัญชาตญาณครอบครอง

โลก:
- โลกเผ่าไฮบริด
- ไม่มีเวทมนตร์
- ทุกอย่างสมจริง

โทน:
- ดิบ กดดัน
- ความสัมพันธ์ค่อยๆพัฒนา
`;

// 🧠 memory แยก user
const memory = {};

app.post("/chat", async (req, res) => {
  try {
    const userId = req.body.userId || "default";
    const userMessage = req.body.message;

    if (!memory[userId]) {
      memory[userId] = [];
    }

    memory[userId].push({
      role: "user",
      content: userMessage
    });

    if (memory[userId].length > 10) {
      memory[userId].shift();
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          ...memory[userId]
        ]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      console.log(data);
      return res.json({ reply: "AI พัง ลองใหม่" });
    }

    const reply = data.choices[0].message.content;

    memory[userId].push({
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "ระบบรวนละ ลองใหม่อีกที" });
  }
});

app.get("/", (req, res) => {
  res.send("AI RP Server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
