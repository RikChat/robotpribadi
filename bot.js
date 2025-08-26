import express from "express";
import bodyParser from "body-parser";
import { Boom } from "@hapi/boom";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import schedule from "node-schedule";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// ====== WHATSAPP BOT SETUP ======
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session_auth");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect.error = new Boom(lastDisconnect.error))
          .output.statusCode !== DisconnectReason.loggedOut;
      console.log("Koneksi putus, reconnect:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot WhatsApp siap!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Fitur: Balas chat sederhana
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const pesan = m.message.conversation || "";
    const from = m.key.remoteJid;

    if (pesan.toLowerCase() === "halo") {
      await sock.sendMessage(from, { text: "Hai! Ada yang bisa saya bantu? 🤖" });
    }

    if (pesan.toLowerCase().includes("invoice")) {
      await sock.sendMessage(from, {
        text: "📄 Berikut contoh invoice: \nNama: User\nTagihan: Rp. 100.000\nJatuh tempo: Besok",
      });
    }
  });

  // ====== FITUR JADWAL & REMINDER ======
  // Contoh: Kirim pesan tiap jam 9 pagi
  schedule.scheduleJob("0 9 * * *", async () => {
    await sock.sendMessage(process.env.OWNER_NUMBER + "@s.whatsapp.net", {
      text: "⏰ Waktunya kerja!",
    });
  });

  // Fitur telpon reminder (simulasi, WhatsApp API belum support panggilan real)
  schedule.scheduleJob("0 17 * * *", async () => {
    await sock.sendMessage(process.env.OWNER_NUMBER + "@s.whatsapp.net", {
      text: "📞 Saatnya pulang kerja! (Bayangkan saya telpon 😅)",
    });
  });
}

// Mulai bot
startBot();

// ====== EXPRESS SERVER (UNTUK RAILWAY) ======
app.get("/", (req, res) => {
  res.send("🤖 WhatsApp Bot aktif di Railway!");
});

// Gunakan port dari Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
