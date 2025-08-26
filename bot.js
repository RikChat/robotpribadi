// bot.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

// ambil dari .env
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const MY_PHONE_NUMBER = process.env.MY_PHONE_NUMBER;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// webhook
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.send("Invalid token");
  }
});

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (entry) {
    const from = entry.from;
    const msg = entry.text?.body || "";

    // kalau pesan "invoice"
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

    // kalau pesan "telpon"
    if (msg.toLowerCase().includes("telpon")) {
      twilioClient.calls
        .create({
          url: "http://demo.twilio.com/docs/voice.xml",
          to: MY_PHONE_NUMBER, // dari .env
          from: TWILIO_PHONE_NUMBER,
        })
        .then((call) => console.log("✅ Call SID:", call.sid))
        .catch(console.error);
    }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot WhatsApp aktif di port ${PORT}`));
