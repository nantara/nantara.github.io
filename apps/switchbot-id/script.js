const BASE_URL = "https://api.switch-bot.com/v1.1";

const tokenInput = document.getElementById("token");
const btnDevices = document.getElementById("btn-devices");
const btnScenes = document.getElementById("btn-scenes");
const statusElm = document.getElementById("status");
const devicesContainer = document.getElementById("devices-container");
const scenesContainer = document.getElementById("scenes-container");
const rawResponseElm = document.getElementById("raw-response");

function setStatus(msg, type = "") {
  statusElm.textContent = msg;
  statusElm.className = "status" + (type ? " " + type : "");
}

async function callSwitchBot(endpoint, token) {
  const res = await fetch(BASE_URL + endpoint, {
    method: "GET",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json; charset=utf8"
    }
  });

  if (!res.ok) {
    throw new Error("HTTP error " + res.status);
  }

  return await res.json();
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

function attachCopyHandlers(container) {
  const buttons = container.querySelectorAll(".copy-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
        setStatus(`copied: ${value}`, "success");
      } catch {
        setStatus("コピーに失敗しました。", "error");
      }
    });
  });
}

function renderDevices(list) {
  if (!list || list.length === 0) {
    devicesContainer.innerHTML = "<div>デバイスがありません。</div>";
    return;
  }

  let html = "<table><thead><tr>";
  html += "<th>name</th><th>deviceId</th><th>type</th><th>hub</th>";
  html += "</tr></thead><tbody>";

  for (const d of list) {
    html += "<tr>";
    html += `<td>${escapeHtml(d.deviceName)}</td>`;
    html += `<td>${escapeHtml(d.deviceId)} <button class="copy-btn" data-copy="${escapeHtml(d.deviceId)}">copy</button></td>`;
    html += `<td>${escapeHtml(d.deviceType)}</td>`;
    html += `<td>${escapeHtml(d.hubDeviceId)}</td>`;
    html += "</tr>";
  }

  html += "</tbody></table>";
  devicesContainer.innerHTML = html;
  attachCopyHandlers(devicesContainer);
}

function renderScenes(list) {
  if (!list || list.length === 0) {
    scenesContainer.innerHTML = "<div>シーンがありません。</div>";
    return;
  }

  let html = "<table><thead><tr>";
  html += "<th>name</th><th>sceneId</th>";
  html += "</tr></thead><tbody>";

  for (const s of list) {
    html += "<tr>";
    html += `<td>${escapeHtml(s.sceneName)}</td>`;
    html += `<td>${escapeHtml(s.sceneId)} <button class="copy-btn" data-copy="${escapeHtml(s.sceneId)}">copy</button></td>`;
    html += "</tr>";
  }

  html += "</tbody></table>";
  scenesContainer.innerHTML = html;
  attachCopyHandlers(scenesContainer);
}

btnDevices.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  if (!token) return setStatus("Tokenを入力してください。", "error");

  setStatus("デバイス一覧を取得中…");
  devicesContainer.innerHTML = "";
  try {
    const data = await callSwitchBot("/devices", token);
    rawResponseElm.textContent = JSON.stringify(data, null, 2);

    if (data.statusCode !== 100) {
      return setStatus("APIエラー: " + data.message, "error");
    }

    renderDevices(data.body.deviceList);
    setStatus("デバイス一覧を取得しました。", "success");
  } catch (e) {
    setStatus(e.message, "error");
  }
});

btnScenes.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  if (!token) return setStatus("Tokenを入力してください。", "error");

  setStatus("シーン一覧を取得中…");
  scenesContainer.innerHTML = "";
  try {
    const data = await callSwitchBot("/scenes", token);
    rawResponseElm.textContent = JSON.stringify(data, null, 2);

    if (data.statusCode !== 100) {
      return setStatus("APIエラー: " + data.message, "error");
    }

    renderScenes(data.body.sceneList);
    setStatus("シーン一覧を取得しました。", "success");
  } catch (e) {
    setStatus(e.message, "error");
  }
});
