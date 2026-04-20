import express from "express";

const app = express();
app.use(express.json());

app.post("/chat", (req, res) => {
  const messages = req.body.messages;

  res.json({
   reply: 'ไซรัสจ้องมองคุณนิ่งๆ ก่อนจะเอ่ยเสียงต่ำ... "เจ้ากำลังพูดถึงอะไร"'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
