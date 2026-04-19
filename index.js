import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  model: "gpt-4.1-mini",
  input: [
    {
      role: "user",
      content: userMessage
    }
  ]
})
    });

    const data = await response.json();

    const reply =
  data.output?.[0]?.content?.[0]?.text ||
  "ไม่มีคำตอบ";

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "error" });
  }
});

app.listen(3000, () => {
  console.log("Server running");
});
