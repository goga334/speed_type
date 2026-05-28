const WORD_LENGTH = 5;
const STARTING_PACE = 35;
const DEMOTION_PACE_THRESHOLD = 40;
const DEMOTION_GRACE_MS = 60000;
const PASSAGES = window.SpeedType.games.typing.PASSAGES;
const PASSAGE_TIERS = window.SpeedType.games.typing.PASSAGE_TIERS;

window.SpeedType.games.typing.createTypingGame = function createTypingGame(options = {}) {
  const tiers = options.tiers ?? normalizeTiers(options.passages ?? PASSAGES);

  function createInitialState() {
    return createRoundState(1, null, performance.now());
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
        const nextTierIndex = Math.min(
          getTierIndexForRound(tiers, state.round + 1),
          state.tierIndex + 1,
        );

        return {
          ...createRoundState(state.round + 1, state.target, event.timestamp, nextTierIndex),
          status: "running",
        };
      }

      if (event.type === "session:start") {
        return {
          ...state,
          status: "running",
          updatedAt: event.timestamp,
        };
      }

      if (event.type === "clock:tick" && state.status === "running") {
        return applyDifficultyPressure(
          calculateStats({ ...state, updatedAt: event.timestamp }),
          event.timestamp,
        );
      }

      if (event.type !== "input:change") {
        return state;
      }

      const nextInput = event.value.slice(0, state.target.length);
      const nextStatus = nextInput === state.target ? "complete" : "running";
      const startedAt = state.startedAt ?? event.timestamp;

      return applyDifficultyPressure(
        calculateStats({
          ...state,
          status: nextStatus,
          startedAt,
          updatedAt: event.timestamp,
          input: nextInput,
        }),
        event.timestamp,
      );
    },
  };

  function createRoundState(
    round,
    previousTarget,
    timestamp,
    tierIndex = getTierIndexForRound(tiers, round),
  ) {
    const tier = tiers[tierIndex];
    const target = pickDifferentPassage(tier.passages, previousTarget);

    return {
      status: "idle",
      startedAt: timestamp,
      updatedAt: timestamp,
      round,
      tier: tier.label,
      tierIndex,
      targetCpm: tier.targetCpm,
      target,
      input: "",
      mistakes: 0,
      accuracy: 100,
      progress: 0,
      pace: STARTING_PACE,
      lowPaceStartedAt: STARTING_PACE < DEMOTION_PACE_THRESHOLD ? timestamp : null,
      wordsPerMinute: 0,
      elapsedMs: 0,
    };
  }

  function applyDifficultyPressure(state, timestamp) {
    if (state.status !== "running") {
      return state;
    }

    const lowPaceStartedAt =
      state.pace < DEMOTION_PACE_THRESHOLD ? (state.lowPaceStartedAt ?? timestamp) : null;

    if (
      lowPaceStartedAt !== null &&
      timestamp - lowPaceStartedAt >= DEMOTION_GRACE_MS &&
      state.tierIndex > 0
    ) {
      return {
        ...createRoundState(state.round, state.target, timestamp, state.tierIndex - 1),
        status: "running",
      };
    }

    return {
      ...state,
      lowPaceStartedAt,
    };
  }
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
  const pace = calculatePace(state.target.length, correctChars, elapsedMs, state.targetCpm);

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

function calculatePace(targetLength, correctChars, elapsedMs, targetCpm) {
  const gainPerCharacter = 100 / targetLength;
  const drainedCharacters = (elapsedMs / 60000) * targetCpm;
  const pace = STARTING_PACE + (correctChars - drainedCharacters) * gainPerCharacter;

  return Math.round(clamp(pace, 0, 100));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeTiers(passages) {
  if (Array.isArray(PASSAGE_TIERS) && PASSAGE_TIERS.length > 0) {
    return PASSAGE_TIERS;
  }

  return [
    {
      label: "Flow",
      targetCpm: 140,
      minRound: 1,
      passages,
    },
  ];
}

function getTierIndexForRound(tiers, round, maximumTierIndex = tiers.length - 1) {
  const highestUnlockedIndex = tiers.reduce(
    (bestIndex, tier, index) => (round >= tier.minRound ? index : bestIndex),
    0,
  );

  return Math.min(highestUnlockedIndex, maximumTierIndex);
}
