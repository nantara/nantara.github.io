const BASE_URL = "https://api.switch-bot.com/v1.1";

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
