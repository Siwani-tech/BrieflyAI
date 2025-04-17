
if ("Notification" in window) {
  Notification.requestPermission().then(permission => {
    console.log("Notification permission:", permission);
  });
}


const textareaddiv      = document.getElementById("noteInput");
const summarizebtn      = document.getElementById("summarizeBtn");
const summarydiv        = document.getElementById("summaryOutput");
const downloadContainer = document.querySelector(".download-container");
const downloadLink      = document.getElementById("downloadLink");

const reminderDateInput = document.getElementById("reminderDate");
const reminderTimeInput = document.getElementById("reminderTime");
const setReminderBtn    = document.getElementById("setReminderBtn");
const quickPick         = document.getElementById("quickPick");
const reminderOutput    = document.getElementById("reminderOutput");

const modediv           = document.querySelector(".mode-toggle");

let reminderTimeout;
let reminderAudio;
let lastInputText = "";

modediv.addEventListener("click", () => {
  document.body.classList.toggle("darkmode");
  modediv.textContent = document.body.classList.contains("darkmode") ? "☀️" : "🌙";
});


summarizebtn.addEventListener("click", async () => {
 
  if (reminderTimeout) clearTimeout(reminderTimeout);
  if (reminderAudio) {
    reminderAudio.pause();
    reminderAudio.currentTime = 0;
    reminderAudio = null;
  }
  reminderOutput.textContent = "No reminders set.";
  downloadContainer.style.display = "none";

  const inputtext = textareaddiv.value.trim();
  lastInputText = inputtext;
  if (!inputtext) {
    summarydiv.textContent = "Please enter some text first.";
    return;
  }

  summarydiv.textContent = "Summarizing…";
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/philschmid/bart-large-cnn-samsum",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: inputtext,
          parameters: { max_length: 60, min_length: 10, do_sample: false },
        }),
      }
    );
    const data = await res.json();
    const summary = data[0]?.summary_text || "No summary generated.";
    summarydiv.textContent = summary;

    downloadLink.href = "data:text/plain;charset=utf-8," +
                        encodeURIComponent(summary);
    downloadContainer.style.display = "block";
  } catch (err) {
    console.error(err);
    summarydiv.textContent = "Error: Could not summarize.";
  }
});

quickPick.addEventListener("change", e => {
  const days = parseInt(e.target.value, 10);
  if (isNaN(days)) return;

  const now = new Date();
  now.setDate(now.getDate() + days);

  reminderDateInput.value = now.toISOString().slice(0, 10);   // YYYY-MM-DD
  reminderTimeInput.value = now.toTimeString().slice(0, 5);  // HH:MM
});


setReminderBtn.addEventListener("click", () => {
  const dateVal = reminderDateInput.value; // "2025-04-18"
  const timeVal = reminderTimeInput.value; //  "14:30"

  if (!dateVal || !timeVal) {
    reminderOutput.textContent = "⚠️ Please pick both date and time.";
    return;
  }

  const [y, m, d]   = dateVal.split("-").map(Number);
  const [h, min]    = timeVal.split(":").map(Number);
  const remindDate  = new Date(y, m - 1, d, h, min, 0, 0);

  const delayMs = remindDate.getTime() - Date.now();
  if (delayMs <= 0) {
    reminderOutput.textContent = "⚠️ Cannot set a reminder in the past.";
    return;
  }


  if (reminderTimeout) clearTimeout(reminderTimeout);

  reminderTimeout = setTimeout(() => {
    reminderAudio = new Audio("rington.mp3");
    reminderAudio.loop = true;
    reminderAudio.play().catch(console.error);
    if (Notification.permission === "granted") {
      new Notification("Reminder", {
        body: lastInputText || `Reminder for ${remindDate.toLocaleString()}`,
        icon: "icon.png",
      });
    }
    if (confirm(`🔔 Reminder: ${remindDate.toLocaleString()}\n\nClick OK to stop`)) {
      if (reminderAudio) {
        reminderAudio.pause();
        reminderAudio.currentTime = 0;
        reminderAudio = null;
      }
      reminderOutput.textContent = "No reminders set.";
    }
  }, delayMs);

  reminderOutput.textContent = `⏰ Reminder set for ${remindDate.toLocaleString()}`;
});
