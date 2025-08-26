// bot.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

// langsung pakai token dari kamu
const PAGE_ACCESS_TOKEN = "EAAZAsjZAeUzvYBPeQWrgy8hugd4n90O1QjP9ZBo7K2WEtGZCKWO6BGTHycx0CSRjdgxIVxH2PjY2LkCOpuzwNQ59ZBa6XmlMOuiHW0uzMu3DxpTOPiqkS5jGWTfzVmRSfgbXSDKTOHe58uGYSK65Yb3Tp3sBETUvmJiqVwz4irbvXfJZC9nz3X73xQ9kbj070RzfgbTRUZD";
const PHONE_NUMBER_ID = "109108612078287";
const VERIFY_TOKEN = "mywa123";

const TWILIO_ACCOUNT_SID = "AC0b6ef5d86cdcfd2d5ba32d3432745164";
const TWILIO_AUTH_TOKEN = "6ed8c39207aea192cb190fe970c99de5";
const TWILIO_PHONE_NUMBER = "+15086259671";

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
          to: "+6281917651057", // nomor kamu
          from: TWILIO_PHONE_NUMBER,
        })
        .then((call) => console.log("✅ Call SID:", call.sid))
        .catch(console.error);
    }
  }
  res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Bot WhatsApp aktif di http://localhost:3000"));
