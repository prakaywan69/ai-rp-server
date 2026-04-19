import express from "express";
import fetch from "node-fetch";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const memory = req.body.memory;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  model: "gpt-4.1-mini",
  input: memory
})
    });

    const data = await response.json();

  const reply = data?.output?.[0]?.content?.[0]?.text || "ไม่มีคำตอบ";

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "error" });
  }
});

app.listen(3000, () => {
  console.log("Server running");
});
