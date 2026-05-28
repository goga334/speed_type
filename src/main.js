const game = SpeedType.games.typing.createTypingGame();
const view = SpeedType.games.typing.createTypingView(document);

SpeedType.core.createGameApp({ game, view }).mount();
