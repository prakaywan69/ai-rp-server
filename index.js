const express = require("express");

const app = express();
app.use(express.json());

app.post("/chat", (req, res) => {
  res.json({
    reply: "ไซรัสจ้องมองคุณนิ่งๆ ก่อนจะเอ่ยเสียงต่ำ... \"เจ้ากำลังพูดถึงอะไร\""
  });
});

app.get("/", (req, res) => {
  res.send("AI RP Server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
