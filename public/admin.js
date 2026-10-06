const $ = (s) => document.querySelector(s);
async function api(url, method = "GET", body) {
  const r = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Object.assign(Error(data.error), { status: r.status });
  return data;
}
async function load() {
  try {
    const data = await api("/api/admin");
    $("#login").hidden = true;
    $("#dashboard").hidden = false;
    $("#rows").replaceChildren();
    data.rsvp.forEach((r) => {
      const tr = document.createElement("tr");
      [
        r.name,
        { yes: "Có", no: "Không", maybe: "Chưa chắc" }[r.status],
        r.guests,
        r.created,
      ].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });
      $("#rows").append(tr);
    });
    $("#totals").textContent =
      `${data.rsvp.length} phản hồi · ${data.rsvp.filter((r) => r.status === "yes").reduce((n, r) => n + r.guests, 0)} người xác nhận đến · ${data.rsvp.filter((r) => r.status === "maybe").reduce((n, r) => n + r.guests, 0)} người chưa chắc`;
    $("#moderation").replaceChildren();
    if (!data.wishes.length) $("#moderation").textContent = "Chưa có lời chúc.";
    data.wishes.forEach((w) => {
      const article = document.createElement("article"),
        p = document.createElement("p"),
        author = document.createElement("p"),
        button = document.createElement("button");
      p.textContent = w.message;
      author.textContent = w.name + " · " + w.created + " UTC";
      button.textContent = w.approved ? "Ẩn lời chúc" : "Duyệt lời chúc";
      button.onclick = async () => {
        button.disabled = true;
        try {
          await api("/api/admin/wishes/" + w.id, "PATCH", {
            approved: !w.approved,
          });
          await load();
        } catch (e) {
          $("#admin-status").textContent = e.message;
          button.disabled = false;
        }
      };
      article.append(p, author, button);
      $("#moderation").append(article);
    });
    $("#admin-status").textContent = "";
  } catch (e) {
    if (e.status === 401) {
      $("#login").hidden = false;
      $("#dashboard").hidden = true;
    } else $("#admin-status").textContent = e.message;
  }
}
$("#login").onsubmit = async (e) => {
  e.preventDefault();
  const button = $("#login button");
  button.disabled = true;
  try {
    await api("/api/login", "POST", {
      password: $("#login").elements.password.value,
    });
    $("#login").reset();
    $("#login-status").textContent = "";
    await load();
  } catch (e) {
    $("#login-status").textContent = e.message;
  } finally {
    button.disabled = false;
  }
};
$("#logout").onclick = async () => {
  try {
    await api("/api/logout", "POST", {});
    await load();
  } catch (e) {
    $("#admin-status").textContent = e.message;
  }
};
$("#refresh").onclick = load;
load();
