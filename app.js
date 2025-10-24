document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("pingBtn");
  const status = document.getElementById("status");

  if (!btn) return; 

  btn.addEventListener("click", () => {
    alert("JS ist verbunden: Button wurde geklickt ✅");
    const time = new Date().toLocaleTimeString();
    status.textContent = `Letzter Klick: ${time}`;
  });
});
