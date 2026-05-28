window.SpeedType = window.SpeedType ?? {};
window.SpeedType.core = window.SpeedType.core ?? {};

window.SpeedType.core.createGameApp = function createGameApp({ game, view }) {
  let state = game.createInitialState();
  let tickTimer = null;

  const dispatch = (event) => {
    state = game.reduce(state, event);
    view.render(state, dispatch);
    syncClock();
  };

  const syncClock = () => {
    if (state.status === "running" && tickTimer === null) {
      tickTimer = window.setInterval(() => {
        dispatch({ type: "clock:tick", timestamp: performance.now() });
      }, 250);
    }

    if (state.status !== "running" && tickTimer !== null) {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
  };

  return {
    mount() {
      view.bind(dispatch);
      view.render(state, dispatch);
    },
  };
};
