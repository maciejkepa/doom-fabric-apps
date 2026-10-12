const canvas = document.querySelector("#canvas");
const launch = document.querySelector("#launch");
const loader = document.querySelector("#loader");
const progress = document.querySelector("#loader-progress");
const status = document.querySelector("#status");
const runtimeState = document.querySelector("#runtime-state");
const startButton = document.querySelector("#start");
const fullscreenButton = document.querySelector("#fullscreen");
const screenWrap = document.querySelector("#screen-wrap");
const appScriptUrl = document.currentScript?.src ?? new URL("./app.js", document.baseURI);
const engineBaseUrl = new URL("./vendor/doomgeneric/", appScriptUrl);

let started = false;

function setStatus(text) {
  const match = text.match(/\((\d+(?:\.\d+)?)\/(\d+)\)/);
  status.textContent = text || "Ready";
  if (match) {
    progress.style.width = `${Math.min(100, (Number(match[1]) / Number(match[2])) * 100)}%`;
  }
  if (!text && started) {
    loader.hidden = true;
    runtimeState.textContent = "Engine running";
    fullscreenButton.disabled = false;
    canvas.focus();
  }
}

window.Module = {
  canvas,
  preRun: [],
  postRun: [() => setStatus("")],
  locateFile: (fileName) => new URL(fileName, engineBaseUrl).href,
  print: (...messages) => console.log(...messages),
  printErr: (...messages) => console.error(...messages),
  setStatus,
  monitorRunDependencies(left) {
    this.totalDependencies = Math.max(this.totalDependencies ?? 0, left);
    setStatus(
      left
        ? `Preparing... (${this.totalDependencies - left}/${this.totalDependencies})`
        : "Starting engine...",
    );
  },
};

startButton.addEventListener("click", async () => {
  if (started) return;
  started = true;
  launch.hidden = true;
  loader.hidden = false;
  runtimeState.textContent = "Loading 11 MB of local assets...";

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    try {
      const audio = new AudioContext();
      await audio.resume();
      await audio.close();
    } catch (error) {
      console.warn("Could not unlock audio:", error);
    }
  }

  const engine = document.createElement("script");
  engine.src = new URL("doomgeneric.js", engineBaseUrl).href;
  engine.async = true;
  engine.onerror = () => {
    status.textContent = "The engine failed to load. Refresh the page and try again.";
    runtimeState.textContent = "Loading error";
  };
  document.body.append(engine);
});

fullscreenButton.addEventListener("click", async () => {
  try {
    await screenWrap.requestFullscreen();
    canvas.focus();
  } catch (error) {
    console.error("Fullscreen mode is unavailable:", error);
  }
});

for (const eventName of ["keydown", "keyup"]) {
  window.addEventListener(eventName, (event) => {
    if (started && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
  });
}

window.addEventListener("error", (event) => {
  if (!started) return;
  console.error(event.error ?? event.message);
  status.textContent = "Runtime error. Details are available in the browser console.";
});
