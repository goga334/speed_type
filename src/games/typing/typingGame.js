const WORD_LENGTH = 5;
const TARGET_CPM = 140;
const STARTING_PACE = 35;
const PASSAGES = window.SpeedType.games.typing.PASSAGES;

window.SpeedType.games.typing.createTypingGame = function createTypingGame(options = {}) {
  const passages = options.passages ?? PASSAGES;

  function createInitialState() {
    return createRoundState(pickPassage(passages), performance.now());
  }

  function createRoundState(target, timestamp) {
    return {
      status: "idle",
      startedAt: timestamp,
      updatedAt: timestamp,
      target,
      input: "",
      mistakes: 0,
      accuracy: 100,
      progress: 0,
      pace: STARTING_PACE,
      wordsPerMinute: 0,
      elapsedMs: 0,
    };
  }

  return {
    id: "typing-speed",
    title: "Speed Type",
    createInitialState,
    reduce(state, event) {
      if (event.type === "session:reset") {
        return createInitialState();
      }

      if (event.type === "round:next") {
        return createRoundState(pickDifferentPassage(passages, state.target), event.timestamp);
      }

      if (event.type === "session:start") {
        return {
          ...state,
          status: "running",
          updatedAt: event.timestamp,
        };
      }

      if (event.type === "clock:tick" && state.status === "running") {
        return calculateStats({ ...state, updatedAt: event.timestamp });
      }

      if (event.type !== "input:change") {
        return state;
      }

      const nextInput = event.value.slice(0, state.target.length);
      const nextStatus = nextInput === state.target ? "complete" : "running";
      const startedAt = state.startedAt ?? event.timestamp;

      return calculateStats({
        ...state,
        status: nextStatus,
        startedAt,
        updatedAt: event.timestamp,
        input: nextInput,
      });
    },
  };
};

function pickPassage(passages) {
  return passages[Math.floor(Math.random() * passages.length)] ?? PASSAGES[0];
}

function pickDifferentPassage(passages, currentPassage) {
  if (passages.length <= 1) {
    return passages[0] ?? PASSAGES[0];
  }

  const candidates = passages.filter((passage) => passage !== currentPassage);
  return pickPassage(candidates);
}

function calculateStats(state) {
  const elapsedMs =
    state.startedAt !== null && state.updatedAt !== null ? state.updatedAt - state.startedAt : 0;
  const mistakes = countMistakes(state.target, state.input);
  const typedChars = state.input.length;
  const correctChars = Math.max(typedChars - mistakes, 0);
  const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
  const wordsPerMinute = Math.round(correctChars / WORD_LENGTH / minutes);
  const accuracy = typedChars === 0 ? 100 : Math.round((correctChars / typedChars) * 100);
  const progress = Math.round((typedChars / state.target.length) * 100);
  const pace = calculatePace(state.target.length, correctChars, elapsedMs);

  return {
    ...state,
    mistakes,
    accuracy,
    progress,
    pace,
    wordsPerMinute,
    elapsedMs,
  };
}

function countMistakes(target, input) {
  return [...input].reduce((count, char, index) => count + (char === target[index] ? 0 : 1), 0);
}

function calculatePace(targetLength, correctChars, elapsedMs) {
  const gainPerCharacter = 100 / targetLength;
  const drainedCharacters = (elapsedMs / 60000) * TARGET_CPM;
  const pace = STARTING_PACE + (correctChars - drainedCharacters) * gainPerCharacter;

  return Math.round(clamp(pace, 0, 100));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
