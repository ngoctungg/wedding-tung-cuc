const $ = (s) => document.querySelector(s);
let photos = [
  { label: "Khoảnh khắc bên nhau", src: null },
  { label: "Một ngày yêu thương", src: null },
  { label: "Hạnh phúc nên duyên", src: null },
];
let selected = 0,
  musicReady = false;
function photoNode(photo) {
  if (photo.src) {
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.label;
    img.loading = "lazy";
    img.addEventListener(
      "error",
      () => {
        img.replaceWith(photoNode({ ...photo, src: null }));
      },
      { once: true },
    );
    img.width = 600;
    img.height = 800;
    return img;
  }
  const node = document.createElement("div");
  node.className = "photo";
  const monogram = document.createElement("span");
  monogram.className = "photo-monogram";
  monogram.textContent = "T & C";
  const label = document.createElement("span");
  label.textContent = photo.label;
  const note = document.createElement("small");
  note.textContent = "Ảnh cưới sẽ được cập nhật";
  node.append(monogram, label, note);
  return node;
}
function renderPhotos() {
  const list = $("#photos");
  list.replaceChildren();
  photos.forEach((p, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Xem ảnh: " + p.label);
    button.append(photoNode(p));
    button.onclick = () => {
      selected = i;
      showPhoto();
      $("#lightbox").showModal();
    };
    list.append(button);
  });
  if (photos[0].src) {
    const hero = photoNode(photos[0]);
    hero.loading = "eager";
    $(".hero-photo").replaceChildren(hero);
  }
}
function showPhoto() {
  $("#large-photo").replaceChildren(photoNode(photos[selected]));
  $("#photo-count").textContent = `${selected + 1} / ${photos.length}`;
}
$("#close-photo").onclick = () => $("#lightbox").close();
$("#prev-photo").onclick = () => {
  selected = (selected + photos.length - 1) % photos.length;
  showPhoto();
};
$("#next-photo").onclick = () => {
  selected = (selected + 1) % photos.length;
  showPhoto();
};
$("#lightbox").addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") $("#prev-photo").click();
  if (e.key === "ArrowRight") $("#next-photo").click();
});
const audio = $("#audio");
function setMusic(on) {
  $("#music").setAttribute("aria-pressed", String(on));
  $("#music").setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc");
  $("#music").textContent = on ? "♫" : "♪";
}
async function play() {
  try {
    await audio.play();
    setMusic(true);
  } catch {
    setMusic(false);
  }
}
$("#music").onclick = () => {
  if (audio.paused) play();
  else {
    audio.pause();
    setMusic(false);
  }
};
audio.addEventListener("error", () => {
  setMusic(false);
  $("#music").hidden = true;
});
$("#open").onclick = () => {
  $("#cover").hidden = true;
  $("#invitation").hidden = false;
  window.scrollTo(0, 0);
  $("#invitation").setAttribute("tabindex", "-1");
  $("#invitation").focus({ preventScroll: true });
  if (musicReady) {
    $("#music").hidden = false;
    play();
  }
};
fetch("/config.json")
  .then((r) => r.json())
  .then((c) => {
    if (c.music) {
      audio.src = c.music;
      musicReady = true;
      if (!$("#invitation").hidden) $("#music").hidden = false;
    }
  })
  .catch(() => {});
fetch("/photos.json")
  .then((r) => r.json())
  .then((p) => {
    if (Array.isArray(p)) {
      const valid = p.filter(
        (x) =>
          x &&
          typeof x.label === "string" &&
          (x.src === null ||
            (typeof x.src === "string" &&
              x.src.startsWith("/photos/") &&
              !x.src.includes(".."))),
      );
      if (valid.length) {
        photos = valid;
        renderPhotos();
      }
    }
  })
  .catch(() => {});
renderPhotos();
async function request(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw Error("Chưa gửi được do mất kết nối. Vui lòng thử lại.");
  }
  const data = await response
    .json()
    .catch(() => ({ error: "Chưa thể gửi. Vui lòng thử lại." }));
  if (!response.ok)
    throw Error(data.error || "Chưa thể gửi. Vui lòng thử lại.");
  return data;
}
function feedback(form, text, error = false) {
  const p = form.querySelector(".feedback");
  p.textContent = text;
  p.classList.toggle("error", error);
}
const rsvp = $("#rsvp-form");
rsvp.addEventListener("change", () => {
  const no = rsvp.elements.status.value === "no";
  const guests = rsvp.elements.guests;
  guests.disabled = no;
  guests.min = no ? "0" : "1";
  if (no) guests.value = 0;
  else if (Number(guests.value) < 1) guests.value = 1;
});
rsvp.onsubmit = async (e) => {
  e.preventDefault();
  const button = rsvp.querySelector("button");
  button.disabled = true;
  feedback(rsvp, "Đang gửi…");
  try {
    await request("/api/rsvp", {
      name: rsvp.elements.name.value,
      status: rsvp.elements.status.value,
      guests: Number(rsvp.elements.guests.value),
    });
    feedback(rsvp, "Đã lưu xác nhận của bạn. Cảm ơn bạn đã hồi đáp!");
    rsvp.reset();
    rsvp.elements.guests.disabled = false;
    rsvp.elements.guests.min = 1;
  } catch (error) {
    feedback(rsvp, error.message, true);
  } finally {
    button.disabled = false;
  }
};
const wish = $("#wish-form");
wish.onsubmit = async (e) => {
  e.preventDefault();
  const button = wish.querySelector("button");
  button.disabled = true;
  feedback(wish, "Đang gửi…");
  try {
    await request("/api/wishes", {
      name: wish.elements.name.value,
      message: wish.elements.message.value,
    });
    feedback(
      wish,
      "Đã lưu lời chúc. Lời chúc sẽ hiển thị sau khi được duyệt. Cảm ơn bạn!",
    );
    wish.reset();
  } catch (error) {
    feedback(wish, error.message, true);
  } finally {
    button.disabled = false;
  }
};
async function loadWishes() {
  try {
    const response = await fetch("/api/wishes");
    if (!response.ok) throw Error();
    const data = await response.json();
    const list = $("#wishes");
    list.replaceChildren();
    if (!data.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "Hãy là người đầu tiên gửi lời chúc đến chúng mình.";
      list.append(p);
    }
    data.forEach((w) => {
      const quote = document.createElement("blockquote"),
        p = document.createElement("p"),
        cite = document.createElement("cite");
      p.textContent = w.message;
      cite.textContent = w.name;
      const header = document.createElement("div"),
        time = document.createElement("time");
      header.className = "wish-header";
      const date = new Date(w.created.replace(" ", "T") + "Z");
      if (!Number.isNaN(date.valueOf())) {
        time.dateTime = date.toISOString();
        time.textContent = new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          dateStyle: "short",
          timeStyle: "short",
        }).format(date);
      }
      header.append(cite, time);
      quote.append(header, p);
      list.append(quote);
    });
  } catch {
    $("#wishes").textContent =
      "Chưa tải được lời chúc. Vui lòng tải lại trang.";
  }
}
loadWishes();

let touchStart = null;
$("#large-photo").addEventListener(
  "touchstart",
  (e) => {
    touchStart =
      e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : null;
  },
  { passive: true },
);
$("#large-photo").addEventListener(
  "touchend",
  (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x,
      dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
      (dx < 0 ? $("#next-photo") : $("#prev-photo")).click();
  },
  { passive: true },
);
