window.SpeedType = window.SpeedType ?? {};
window.SpeedType.games = window.SpeedType.games ?? {};
window.SpeedType.games.typing = window.SpeedType.games.typing ?? {};

window.SpeedType.games.typing.PASSAGE_TIERS = [
  {
    label: "Warmup",
    targetCpm: 120,
    minRound: 1,
    passages: [
      "Keep a light rhythm and breathe.",
      "Clean keys make fast hands.",
      "Stay loose and follow the line.",
      "Calm fingers find the letters.",
      "A smooth start wins the run.",
    ],
  },
  {
    label: "Flow",
    targetCpm: 140,
    minRound: 4,
    passages: [
      "Focus lands softly when the hands know where to go.",
      "Small deliberate motions become speed when rhythm stays calm.",
      "Fast typing starts with patient accuracy and an easy breath.",
      "A steady cadence beats a frantic sprint across the keyboard.",
      "Practice turns scattered letters into a smooth line of intent.",
    ],
  },
  {
    label: "Pulse",
    targetCpm: 165,
    minRound: 7,
    passages: [
      "Sharp timing, crisp spacing, and quick recovery keep the screen alive.",
      "Velocity is earned by accuracy; rush the phrase and the rhythm breaks.",
      "Type the comma, catch the capital, and keep the cadence moving forward.",
      "When the text twists, slow the panic and let the pattern come back.",
    ],
  },
  {
    label: "Overdrive",
    targetCpm: 190,
    minRound: 10,
    passages: [
      "Noisy little sequences, awkward punctuation, and sudden Capitals demand control.",
      "Hold the line: accuracy first, acceleration second, hesitation absolutely last.",
      "Every symbol matters; miss one beat and the whole visual field starts to dim.",
      "Fast hands survive by reading ahead, correcting early, and refusing to tense up.",
    ],
  },
];

window.SpeedType.games.typing.PASSAGES = window.SpeedType.games.typing.PASSAGE_TIERS.flatMap(
  (tier) => tier.passages,
);
