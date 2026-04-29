// ─────────────────────────────────────────────────────────────────────────────
//  NOVA AI — app.js
//  Paste your OpenRouter API key below, then open index.html in your browser.
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = "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";   // 👈 paste your key here
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Conversation history (sent to API each turn) ─────────────────────────────
let history = [
  {
    role: "system",
    content:
      "You are Nova, a sharp, friendly, and thoughtful AI assistant. " +
      "You give concise yet complete answers. Use markdown-style formatting " +
      "where helpful (code blocks, bold, lists). Be warm and engaging."
  }
];

let isThinking = false;

// ── Auto-resize textarea as user types ───────────────────────────────────────
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

// ── Enter = send, Shift+Enter = new line ─────────────────────────────────────
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── Quick-chip click handler ──────────────────────────────────────────────────
function sendChip(el) {
  // strip leading emoji + space
  const text = el.innerText.replace(/^\S+\s/, "");
  document.getElementById("input").value = text;
  sendMessage();
}

// ── Main send function ────────────────────────────────────────────────────────
async function sendMessage() {
  if (isThinking) return;

  const inputEl = document.getElementById("input");
  const text    = inputEl.value.trim();
  if (!text) return;

  // Remove welcome screen on first message
  const welcome = document.getElementById("welcome");
  if (welcome) welcome.remove();

  appendMsg("user", text);
  history.push({ role: "user", content: text });

  inputEl.value = "";
  autoResize(inputEl);
  setLoading(true);

  const typingId = showTyping();
  const model    = document.getElementById("modelSelect").value;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer":  window.location.href,
        "X-Title":       "Nova AI Chat"
      },
      body: JSON.stringify({
        model,
        messages:    history,
        temperature: 0.7
      })
    });

    const data = await response.json();
    removeTyping(typingId);

    if (data.error) throw new Error(data.error.message || "API error");

    const reply =
      data.choices?.[0]?.message?.content || "⚠️ Empty response received.";

    history.push({ role: "assistant", content: reply });
    appendMsg("ai", reply);

  } catch (err) {
    removeTyping(typingId);
    appendMsg("ai", `⚠️ **Error:** ${err.message}`);
  } finally {
    setLoading(false);
  }
}

// ── Append a message bubble to the chat ──────────────────────────────────────
function appendMsg(role, text) {
  const wrap = document.getElementById("messages");

  const row = document.createElement("div");
  row.className = `msg ${role}`;

  const av = document.createElement("div");
  av.className   = "avatar";
  av.textContent = role === "user" ? "👤" : "✦";

  const bub = document.createElement("div");
  bub.className = "bubble";
  bub.innerHTML = formatText(text);

  row.appendChild(av);
  row.appendChild(bub);
  wrap.appendChild(row);
  wrap.scrollTop = wrap.scrollHeight;
}

// ── Light markdown → HTML formatter ──────────────────────────────────────────
function formatText(text) {
  // fenced code blocks
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) =>
    `<pre><code>${escHtml(code.trim())}</code></pre>`
  );
  // inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // italic
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // h3 / h2
  text = text.replace(
    /^### (.+)$/gm,
    '<h4 style="margin:10px 0 4px;font-family:Syne,sans-serif">$1</h4>'
  );
  text = text.replace(
    /^## (.+)$/gm,
    '<h3 style="margin:12px 0 4px;font-family:Syne,sans-serif">$1</h3>'
  );
  // unordered lists
  text = text.replace(
    /^\s*[-*] (.+)$/gm,
    '<li style="margin-left:16px;margin-top:4px">$1</li>'
  );
  // newlines → <br> (outside pre blocks — simple approach)
  text = text.replace(/\n/g, "<br>");
  return text;
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Animated typing indicator ─────────────────────────────────────────────────
function showTyping() {
  const wrap = document.getElementById("messages");
  const id   = "typing-" + Date.now();

  const row = document.createElement("div");
  row.className = "msg ai";
  row.id        = id;

  const av = document.createElement("div");
  av.className   = "avatar";
  av.textContent = "✦";

  const bub = document.createElement("div");
  bub.className = "bubble typing-bubble";
  bub.innerHTML = "<span></span><span></span><span></span>";

  row.appendChild(av);
  row.appendChild(bub);
  wrap.appendChild(row);
  wrap.scrollTop = wrap.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── Disable / enable send button while waiting ────────────────────────────────
function setLoading(state) {
  isThinking = state;
  document.getElementById("sendBtn").disabled = state;
}

// ── Clear chat and restore welcome screen ─────────────────────────────────────
function clearChat() {
  const wrap = document.getElementById("messages");
  wrap.innerHTML = "";

  // Keep only the system prompt
  history = [history[0]];

  const welcome = document.createElement("div");
  welcome.className = "welcome";
  welcome.id        = "welcome";
  welcome.innerHTML = `
    <div class="big-icon">✦</div>
    <h2>Hello, I'm Nova</h2>
    <p>Your intelligent assistant. Ask me anything — I'm here to help, explain, or just chat.</p>
    <div class="chips">
      <div class="chip" onclick="sendChip(this)">✍️ Write a poem</div>
      <div class="chip" onclick="sendChip(this)">💡 Explain quantum computing</div>
      <div class="chip" onclick="sendChip(this)">🧠 What is consciousness?</div>
      <div class="chip" onclick="sendChip(this)">🌍 Fun world fact</div>
      <div class="chip" onclick="sendChip(this)">🐛 Debug my code</div>
    </div>
  `;
  wrap.appendChild(welcome);
}