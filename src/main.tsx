import {
  css,
  type Component,
  type Stateful,
  createState,
} from "dreamland/core";

type WindowDataSegment = { t: string };
type WindowMapReply = {
  t: "window_map";
  window: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

type WindowMapRequest = {
  t: "window_map";
  window: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type WindowData = {
  window: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

let WindowFrame: Component<
  {
    visible: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    window: string;
  },
  {}
> = function (ctx) {
  ctx.mount = () => {
    let mousedown = false;
    let offsetX = 0;
    let offsetY = 0;

    ctx.root.addEventListener("mousedown", (e) => {
      mousedown = true;
      offsetX = this.x - e.clientX;
      offsetY = this.y - e.clientY;
    });
    document.addEventListener("mouseup", () => {
      mousedown = false;
    });
    document.addEventListener("mousemove", (e) => {
      if (mousedown) {
        message_queue.push({
          t: "window_map",
          x: e.clientX + offsetX,
          y: e.clientY + offsetY,
          window: state.windows[this.window].window,
          width: state.windows[this.window].width,
          height: state.windows[this.window].height,
        } as WindowMapRequest);
      }
    
    });
  };
  return (
    <div
      style={{
        position: "absolute",
        left: use(this.x).map((x) => x - 10 + "px"),
        top: use(this.y).map((y) => y - 10 + "px"),
        width: use(this.width).map((w) => w + 20 + "px"),
        height: use(this.height).map((h) => h + 20 + "px"),
        background: "black",
        display: use(this.visible).map((v) => (v ? "block" : "none")),
        cursor: "pointer",
      }}
    >
    </div>
  );
};

let state: Stateful<{
  windows: Record<string, WindowData>;
  window_frames: Record<string, HTMLElement>;
}> = createState({
  windows: {},
  window_frames: {},
});
let message_queue: WindowDataSegment[] = [];

let start: DOMHighResTimeStamp;
function step(timestamp: DOMHighResTimeStamp) {
  if (start === undefined) {
    start = timestamp;
  }
  const elapsed = timestamp - start;

  window.cefQuery({
    request: JSON.stringify(message_queue),
    onSuccess: (response: string) => {
      message_queue = [];
      if (response != "[]") console.log(response, elapsed);

      const response_parsed = JSON.parse(response) as WindowDataSegment[];
      for (let segment in response_parsed) {
        if (response_parsed[segment]["t"] == "window_map") {
          let window_map_reply = response_parsed[segment] as WindowMapReply;

          if (
            !state.windows[window_map_reply.window] &&
            window_map_reply.x == 0 &&
            window_map_reply.y == 0 &&
            window_map_reply.visible
          ) {
            message_queue.push({
              t: "window_map",
              x: 100,
              y: 100,
              window: window_map_reply.window,
              width: window_map_reply.width,
              height: window_map_reply.height,
            } as WindowMapRequest);
          }

          state.windows[window_map_reply.window] = {
            window: window_map_reply.window,
            visible: window_map_reply.visible,
            x: window_map_reply.x,
            y: window_map_reply.y,
            width: window_map_reply.width,
            height: window_map_reply.height,
          };

          if (!state.window_frames[window_map_reply.window]) {
            state.window_frames[window_map_reply.window] = (
              <WindowFrame
                x={use(state.windows).map(
                  () => state.windows[window_map_reply.window].x,
                )}
                y={use(state.windows).map(
                  () => state.windows[window_map_reply.window].y,
                )}
                width={use(state.windows).map(
                  () => state.windows[window_map_reply.window].width,
                )}
                height={use(state.windows).map(
                  () => state.windows[window_map_reply.window].height,
                )}
                visible={use(state.windows).map(
                  () => state.windows[window_map_reply.window].visible,
                )}
                window={window_map_reply.window}
              />
            );
          }

          state.windows = state.windows;
          state.window_frames = state.window_frames;
        }
      }
    },
    onFailure: function (_error_code: number, _error_message: string) {},
  });

  requestAnimationFrame(step);
}

requestAnimationFrame(step);

let App: Component<{}, { counter: number; x: number; y: number }> =
  function () {
    this.counter = 0;
    this.x = 0;
    this.y = 0;

    return (
      <div>
        {use(state.windows).map((wins) => JSON.stringify(wins))}
        {use(state.window_frames).map((wins) => {
          return Object.values(wins);
        })}
      </div>
    );
  };
App.style = css`
  :scope {
    border: 4px dashed cornflowerblue;
    padding: 1em;
  }
`;

document.querySelector("#app")?.replaceWith(<App />);
document.addEventListener("contextmenu", () => {return false});
