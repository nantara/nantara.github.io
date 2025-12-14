// SwitchBot API v1.1 base URL
const BASE_URL = "https://api.switch-bot.com/v1.1";

const tokenInput = document.getElementById("token");
const btnDevices = document.getElementById("btn-devices");
const btnScenes = document.getElementById("btn-scenes");
const statusElm = document.getElementById("status");
const devicesContainer = document.getElementById("devices-container");
const scenesContainer = document.getElementById("scenes-container");
const rawResponseElm = document.getElementById("raw-response");

// HMAC-SHA256署名を生成（Web Crypto APIを使用）
async function createSignature(token, secret) {
  // v1.1の仕様に合わせて必要な場合だけsecretを使う構成に変更可能
  // ここではtokenのみで署名を行う簡易版ではなく、
  // "token + timestamp + nonce" を署名対象としているパターンを例示する。
  // 実際の仕様に合わせて message 部分は調整してほしい。

  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const message = `${token}${timestamp}${nonce}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(message));

  // base64エンコード
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = btoa(String.fromCharCode.apply(null, signatureArray));

  return { timestamp, nonce, signature };
}

// 共通のfetchラッパ
async function callSwitchBot(endpoint, token) {
  if (!token || token.trim() === "") {
    throw new Error("API tokenを入力してください。");
  }

  // ここでsecretが別にある仕様なら、tokenとは別に入力欄を作る必要がある。
  // ひとまず token を secret相当として扱うパターンにしてある。
  const secret = token;

  const { timestamp, nonce, signature } = await createSignature(token, secret);

  const headers = {
    "Content-Type": "application/json; charset=utf8",
    "Authorization": token,
    "t": timestamp,
    "nonce": nonce,
    "sign": signature
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data;
}

function setStatus(msg, type = "") {
  statusElm.textContent = msg;
  statusElm.className = "status" + (type ? " " + type : "");
}

function renderDevices(devices) {
  if (!devices || devices.length === 0) {
    devicesContainer.innerHTML = "<div class=\"hint\">デバイスが見つかりませんでした。</div>";
    return;
  }

  let html = "<table><thead><tr>";
  html += "<th>name</th><th>deviceId</th><th>deviceType</th><th>hubDeviceId</th>";
  html += "</tr></thead><tbody>";

  for (const d of devices) {
    html += "<tr>";
    html += `<td>${escapeHtml(d.deviceName || d.deviceId || "")}</td>`;
    html += `<td>${escapeHtml(d.deviceId || "")}<button class="copy-btn" data-copy="${escapeHtmlAttr(d.deviceId || "")}">copy</button></td>`;
    html += `<td>${escapeHtml(d.deviceType || "")}</td>`;
    html += `<td>${escapeHtml(d.hubDeviceId || "")}</td>`;
    html += "</tr>";
  }

  html += "</tbody></table>";
  devicesContainer.innerHTML = html;
  attachCopyHandlers(devicesContainer);
}

function renderScenes(scenes) {
  if (!scenes || scenes.length === 0) {
    scenesContainer.innerHTML = "<div class=\"hint\">シーンが見つかりませんでした。</div>";
    return;
  }

  let html = "<table><thead><tr>";
  html += "<th>name</th><th>sceneId</th>";
  html += "</tr></thead><tbody>";

  for (const s of scenes) {
    html += "<tr>";
    html += `<td>${escapeHtml(s.sceneName || s.sceneId || "")}</td>`;
    html += `<td>${escapeHtml(s.sceneId || "")}<button class="copy-btn" data-copy="${escapeHtmlAttr(s.sceneId || "")}">copy</button></td>`;
    html += "</tr>";
  }

  html += "</tbody></table>";
  scenesContainer.innerHTML = html;
  attachCopyHandlers(scenesContainer);
}

function attachCopyHandlers(container) {
  const buttons = container.querySelectorAll(".copy-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
        setStatus(`copied: ${value}`, "success");
      } catch (e) {
        setStatus("クリップボードにコピーできませんでした。", "error");
      }
    });
  });
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[m]));
}

function escapeHtmlAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

// デバイス一覧取得
btnDevices.addEventListener("click", async () => {
  setStatus("デバイス一覧を取得中...", "");
  btnDevices.disabled = true;
  btnScenes.disabled = true;
  devicesContainer.innerHTML = "";
  const token = tokenInput.value;

  try {
    const data = await callSwitchBot("/devices", token);
    rawResponseElm.textContent = JSON.stringify(data, null, 2);

    if (data.statusCode !== 100) {
      setStatus(`API error: ${data.statusCode} ${data.message || ""}`, "error");
      return;
    }

    renderDevices(data.body && data.body.deviceList ? data.body.deviceList : []);
    setStatus("デバイス一覧の取得が完了しました。", "success");
  } catch (e) {
    setStatus(e.message, "error");
    rawResponseElm.textContent = String(e);
  } finally {
    btnDevices.disabled = false;
    btnScenes.disabled = false;
  }
});

// シーン一覧取得
btnScenes.addEventListener("click", async () => {
  setStatus("シーン一覧を取得中...", "");
  btnDevices.disabled = true;
  btnScenes.disabled = true;
  scenesContainer.innerHTML = "";
  const token = tokenInput.value;

  try {
    const data = await callSwitchBot("/scenes", token);
    rawResponseElm.textContent = JSON.stringify(data, null, 2);

    if (data.statusCode !== 100) {
      setStatus(`API error: ${data.statusCode} ${data.message || ""}`, "error");
      return;
    }

    renderScenes(data.body && data.body.sceneList ? data.body.sceneList : []);
    setStatus("シーン一覧の取得が完了しました。", "success");
  } catch (e) {
    setStatus(e.message, "error");
    rawResponseElm.textContent = String(e);
  } finally {
    btnDevices.disabled = false;
    btnScenes.disabled = false;
  }
});
