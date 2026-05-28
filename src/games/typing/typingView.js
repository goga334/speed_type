window.SpeedType.games.typing.createTypingView = function createTypingView(root) {
  const DEFAULT_VIDEO_URL =
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/Flor_de_Suculenta.webm";
  const prompt = root.querySelector("[data-prompt]");
  const input = root.querySelector("[data-input]");
  const progress = root.querySelector("[data-progress]");
  const pace = root.querySelector("[data-pace]");
  const rewardVideo = root.querySelector("[data-reward-video]");
  const rewardVideoSource = rewardVideo.querySelector("source");
  const videoFile = root.querySelector("[data-video-file]");
  const status = root.querySelector("[data-status]");
  const resetButton = root.querySelector("#reset-button");
  const focusButton = root.querySelector("#focus-button");
  const stats = {
    wordsPerMinute: root.querySelector('[data-stat="wordsPerMinute"]'),
    accuracy: root.querySelector('[data-stat="accuracy"]'),
    mistakes: root.querySelector('[data-stat="mistakes"]'),
    time: root.querySelector('[data-stat="time"]'),
  };

  let currentState = null;
  let dispatchRef = null;
  let videoSources = [DEFAULT_VIDEO_URL];
  let activeVideoUrl = DEFAULT_VIDEO_URL;

  return {
    bind(dispatch) {
      dispatchRef = dispatch;

      input.addEventListener("focus", () => startIfNeeded());
      input.addEventListener("input", () => {
        startIfNeeded();
        dispatch({
          type: "input:change",
          value: input.value,
          timestamp: performance.now(),
        });
      });
      root.addEventListener("keydown", (event) => {
        if (currentState?.status !== "complete") {
          return;
        }

        if (event.key !== " " && event.key !== "Enter") {
          return;
        }

        event.preventDefault();
        dispatch({ type: "round:next", timestamp: performance.now() });
        window.setTimeout(() => input.focus(), 0);
      });
      prompt.addEventListener("click", () => input.focus());
      rewardVideo.addEventListener("ended", () => {
        chooseRandomVideo();
        syncRewardVideo(rewardVideo, currentState?.pace ?? 0, currentState?.status ?? "idle");
      });
      videoFile.addEventListener("change", async () => {
        const file = videoFile.files?.[0];

        if (!file) {
          return;
        }

        const nextSources = parseVideoLinks(await file.text());
        videoSources = nextSources.length > 0 ? nextSources : [DEFAULT_VIDEO_URL];
        chooseRandomVideo();
        syncRewardVideo(rewardVideo, currentState?.pace ?? 0, currentState?.status ?? "idle");
        videoFile.value = "";
      });
      resetButton.addEventListener("click", () => {
        dispatch({ type: "session:reset", timestamp: performance.now() });
        window.setTimeout(() => input.focus(), 0);
      });
      focusButton.addEventListener("click", () => input.focus());
    },
    render(state) {
      currentState = state;
      stats.wordsPerMinute.textContent = state.wordsPerMinute;
      stats.accuracy.textContent = `${state.accuracy}%`;
      stats.mistakes.textContent = state.mistakes;
      stats.time.textContent = `${Math.max(0, Math.round(state.elapsedMs / 1000))}s`;
      input.value = state.input;
      input.disabled = false;
      progress.style.width = `${state.progress}%`;
      progress.parentElement.setAttribute("aria-label", `Progress ${state.progress}%`);
      pace.style.width = `${state.pace}%`;
      pace.parentElement.setAttribute("aria-label", `Pace meter ${state.pace}%`);
      syncRewardVideo(rewardVideo, state.pace, state.status);
      status.lastChild.textContent = state.status === "complete" ? "Space / Enter" : "Ready";
      status.className = state.status === "complete" ? "completeBadge" : "quietBadge";
      renderPrompt(prompt, state.target, state.input);
    },
  };

  function startIfNeeded() {
    if (currentState?.status === "idle") {
      dispatchRef({ type: "session:start", timestamp: performance.now() });
    }
  }

  function chooseRandomVideo() {
    const nextUrl = pickRandomVideo(videoSources, activeVideoUrl);

    if (nextUrl === activeVideoUrl && rewardVideo.currentSrc) {
      rewardVideo.currentTime = 0;
      return;
    }

    activeVideoUrl = nextUrl;
    rewardVideo.loop = videoSources.length === 1;
    rewardVideoSource.src = nextUrl;
    rewardVideo.load();
  }
};

function parseVideoLinks(text) {
  const urls = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .flatMap((line) => line.match(/https?:\/\/[^\s,"'<>]+/g) ?? [])
    .filter(isPlayableVideoUrl);

  return [...new Set(urls)];
}

function isPlayableVideoUrl(url) {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url);
}

function pickRandomVideo(sources, activeUrl) {
  if (sources.length <= 1) {
    return sources[0];
  }

  const candidates = sources.filter((source) => source !== activeUrl);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function syncRewardVideo(video, pace, status) {
  const speed = pace >= 40 ? 1 : pace > 20 ? (pace - 20) / 20 : 0;
  const brightness = pace > 20 ? 1 : pace / 20;

  video.style.filter = `brightness(${Math.max(0, brightness)})`;

  video.playbackRate = Math.max(speed, 0.0625);

  if (speed === 0) {
    video.pause();
    return;
  }

  video.play().catch(() => {});
}

function renderPrompt(prompt, target, input) {
  prompt.replaceChildren(
    ...[...target].map((char, index) => {
      const typed = input[index];
      const state = typed == null ? "pending" : typed === char ? "correct" : "incorrect";
      const node = document.createElement("span");
      node.className = state;
      node.textContent = char;
      return node;
    }),
  );
}
