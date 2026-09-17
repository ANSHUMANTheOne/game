// ===========================================================================
//  LowPoly Games — touch controls + settings (self-contained module)
// ===========================================================================
const LS_KEY = "lp_touch_enabled";

let enabled = localStorage.getItem(LS_KEY) === "1";
if (localStorage.getItem(LS_KEY) === null && window.matchMedia("(pointer: coarse)").matches) {
  enabled = true;
}

// ------------------------------ styles ------------------------------------
const style = document.createElement("style");
style.textContent = `
#lp-gear {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.75);
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(16px);
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(80,90,160,0.15);
}
#lp-settings {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(120, 130, 180, 0.25);
  backdrop-filter: blur(8px);
}
#lp-settings.open { display: flex; }
#lp-settings .panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px 34px;
  border-radius: 24px;
  border: 2px solid #fff;
  background: rgba(255,255,255,0.85);
  box-shadow: 0 16px 40px rgba(80,90,160,0.25);
  font-family: "Segoe UI", system-ui, sans-serif;
  color: #3a3a55;
}
#lp-settings h3 { font-size: 22px; font-weight: 900; text-align: center; }
.lp-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  font-size: 15px;
  font-weight: 700;
}
.lp-switch {
  position: relative;
  width: 52px;
  height: 30px;
  border-radius: 99px;
  background: #cfd4ea;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.lp-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: left 0.2s ease;
}
.lp-switch.on { background: #7ec8f7; }
.lp-switch.on::after { left: 25px; }
#lp-settings .note { font-size: 12px; color: #8a8aa5; font-weight: 600; }

/* --------------------------- touch buttons ------------------------------ */
#lp-clusters {
  position: fixed;
  inset: 0;
  z-index: 12;
  pointer-events: none;
  display: none;
  user-select: none;
  -webkit-user-select: none;
}
#lp-clusters.show { display: block; }
.lp-btn {
  position: absolute;
  pointer-events: auto;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  border: 2px solid rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.45);
  backdrop-filter: blur(10px);
  font-size: 26px;
  font-weight: 900;
  color: #3a3a55;
  width: 64px;
  height: 64px;
}
.lp-btn:active { background: rgba(126, 200, 247, 0.7); }
.lp-btn.small { width: 56px; height: 56px; font-size: 20px; }
#game-canvas { touch-action: none; }
`;
document.head.appendChild(style);

// ------------------------------ settings UI --------------------------------
const gear = document.createElement("button");
gear.id = "lp-gear";
gear.textContent = "⚙️";
document.body.appendChild(gear);

const settings = document.createElement("div");
settings.id = "lp-settings";
settings.innerHTML = `
  <div class="panel">
    <h3>Settings</h3>
    <div class="lp-setting-row">
      <span>📱 Touch controls</span>
      <div class="lp-switch" id="lp-touch-switch"></div>
    </div>
    <p class="note">On-screen steering, gas, brake &amp; drift buttons for touch screens.</p>
  </div>`;
document.body.appendChild(settings);

gear.addEventListener("click", () => settings.classList.add("open"));
settings.addEventListener("click", (e) => {
  if (e.target === settings) settings.classList.remove("open");
});

// --------------------------- touch button clusters --------------------------
const clusters = document.createElement("div");
clusters.id = "lp-clusters";
clusters.innerHTML = `
  <div class="lp-btn" id="lp-left"  style="left:26px;  bottom:40px;">◀</div>
  <div class="lp-btn" id="lp-right" style="left:110px; bottom:40px;">▶</div>
  <div class="lp-btn" id="lp-brake" style="right:110px; bottom:40px;">▼</div>
  <div class="lp-btn" id="lp-gas"   style="right:26px;  bottom:40px;">▲</div>
  <div class="lp-btn small" id="lp-drift" style="right:26px; bottom:120px;">DRIFT</div>`;
document.body.appendChild(clusters);

const switchEl = settings.querySelector("#lp-touch-switch");
function renderSwitch() {
  switchEl.classList.toggle("on", enabled);
  clusters.classList.toggle("show", enabled);
}
switchEl.addEventListener("click", () => {
  enabled = !enabled;
  localStorage.setItem(LS_KEY, enabled ? "1" : "0");
  renderSwitch();
});
renderSwitch();

// ---------------------------- key injection --------------------------------
// Buttons simulate the same KeyboardEvent codes the game listens to.
function bindButton(id, code) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    window.dispatchEvent(new KeyboardEvent("keydown", { code }));
  };
  const up = (e) => {
    e.preventDefault();
    window.dispatchEvent(new KeyboardEvent("keyup", { code }));
  };
  el.addEventListener("touchstart", down, { passive: false });
  el.addEventListener("touchend", up, { passive: false });
  el.addEventListener("touchcancel", up, { passive: false });
  el.addEventListener("mousedown", down);
  el.addEventListener("mouseup", up);
  el.addEventListener("mouseleave", up);
}

bindButton("lp-gas", "KeyW");
bindButton("lp-brake", "KeyS");
bindButton("lp-left", "KeyA");
bindButton("lp-right", "KeyD");
bindButton("lp-drift", "ShiftLeft");