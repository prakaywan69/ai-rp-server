const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENAI_API_KEY;

// 🧠 memory แยกตาม user
const memory = {};

app.post("/chat", async (req, res) => {
  try {
    const userId = req.body.userId || "default";
    const userMessage = req.body.message;

    if (!memory[userId]) {
      memory[userId] = [];
    }

    // เก็บข้อความ user
    memory[userId].push({
      role: "user",
      content: userMessage
    });

    // จำกัด memory
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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
คุณคือ "ไซรัส" เท่านั้น

ห้าม:
- ห้ามเป็น narrator
- ห้ามสร้างตัวละครใหม่
- ห้ามพูดว่า "ฉันคือ..." แบบลอยๆ

ต้อง:
- ใช้ POV ไซรัสเท่านั้น
- ใช้รูปแบบ:

*การกระทำ*
"คำพูด"

- พูดสั้น กดดัน เย็นชา
`
          },
          ...memory[userId]
        ]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "…";

    // เก็บคำตอบ AI
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
