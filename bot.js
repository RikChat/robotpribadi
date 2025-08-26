require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

// Variabel dari .env
const {
  PAGE_ACCESS_TOKEN,
  PHONE_NUMBER_ID,
  VERIFY_TOKEN,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  MY_PHONE_NUMBER,
} = process.env;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// webhook GET
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.send("Invalid token");
  }
});

// webhook POST
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (entry) {
      const from = entry.from;
      const msg = entry.text?.body || "";

      // jika pesan ada kata "invoice"
      if (msg.toLowerCase().includes("invoice")) {
        await axios.post(
          `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            text: { body: "📄 Invoice kamu sudah dicatat." },
          },
          {
            headers: { Authorization: `Bearer ${PAGE_ACCESS_TOKEN}` },
          }
        );
      }

      // jika pesan ada kata "telpon"
      if (msg.toLowerCase().includes("telpon")) {
        twilioClient.calls
          .create({
            url: "http://demo.twilio.com/docs/voice.xml",
            to: MY_PHONE_NUMBER, // nomor kamu dari .env
            from: TWILIO_PHONE_NUMBER,
          })
          .then((call) => console.log("✅ Call SID:", call.sid))
          .catch(console.error);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err);
    res.sendStatus(500);
  }
});

// listen port (Railway / Vercel otomatis pakai PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot aktif di port ${PORT}`));
