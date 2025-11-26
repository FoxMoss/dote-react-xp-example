import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Type definitions
type WindowData = {
  window: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  image: string | null;
};

type WindowMapReply = {
  t: "window_map";
  window: string;
  name: string;
  visible: boolean;
  has_border: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  win_t: string;
};

const BORDER_WIDTH = 26;
const MIN_SIZE = 150;
const BORDER_BASE = 3;

// Mock cefQuery for demo purposes (replace with actual implementation)
const mockCefQuery = (options: any) => {
  setTimeout(() => {
    options.onSuccess('[]');
  }, 16);
};

const WindowFrame = ({ 
  windowId, 
  windowData, 
  zIndex, 
  onFocus, 
  onClose,
  onMove,
  onResize 
}: any) => {
  const [state, setState] = useState({
    mousedown: false,
    offset_x: 0,
    offset_y: 0,
    fullscreen: false,
    mouse_x: 0,
    mouse_y: 0,
    n_resize: false,
    e_resize: false,
    s_resize: false,
    w_resize: false,
    se_resize: false,
    ne_resize: false,
    sw_resize: false,
    nw_resize: false,
    old_x: 0,
    old_y: 0,
    old_width: 0,
    old_height: 0
  });

  useEffect(() => {
    const handleMouseUp = () => {
      if (state.mousedown || 
          state.n_resize || state.e_resize || state.s_resize || state.w_resize ||
          state.se_resize || state.ne_resize || state.sw_resize || state.nw_resize) {
        
        if (state.mousedown) {
          onFocus(windowId);
        }
        
        setState(prev => ({
          ...prev,
          mousedown: false,
          n_resize: false,
          e_resize: false,
          s_resize: false,
          w_resize: false,
          se_resize: false,
          ne_resize: false,
          sw_resize: false,
          nw_resize: false
        }));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const window_corrected_x = Math.max(windowData.x, 0);
      const window_corrected_y = Math.max(windowData.y, BORDER_WIDTH);

      if (state.fullscreen && (state.mousedown || 
          state.n_resize || state.e_resize || state.s_resize || state.w_resize ||
          state.se_resize || state.ne_resize || state.sw_resize || state.nw_resize)) {
        setState(prev => ({ ...prev, fullscreen: false }));
        onMove(windowId, state.old_x, state.old_y);
        onResize(windowId, state.old_width, state.old_height);
        setState(prev => ({ ...prev, offset_x: -(state.old_width / 2) }));
      }

      if (state.mousedown) {
        const window_x = Math.max(e.clientX + state.offset_x, 0);
        const window_y = Math.max(e.clientY + state.offset_y, BORDER_WIDTH);
        onMove(windowId, window_x, window_y);
        onFocus(windowId);
      }

      if (state.e_resize) {
        const delta_x = e.clientX - state.mouse_x;
        const new_width = Math.max(state.old_width + delta_x, MIN_SIZE);
        onResize(windowId, new_width, windowData.height);
        onFocus(windowId);
      }

      if (state.n_resize) {
        const delta_y = e.clientY - state.mouse_y;
        const new_height = Math.max(state.old_height - delta_y, MIN_SIZE);
        const new_y = Math.max(state.old_y + delta_y, BORDER_WIDTH);
        onMove(windowId, windowData.x, new_y);
        onResize(windowId, windowData.width, new_height);
        onFocus(windowId);
      }

      if (state.ne_resize) {
        const delta_y = e.clientY - state.mouse_y;
        const delta_x = e.clientX - state.mouse_x;
        const new_height = Math.max(state.old_height - delta_y, MIN_SIZE);
        const new_width = Math.max(state.old_width + delta_x, MIN_SIZE);
        const new_y = Math.max(state.old_y + delta_y, BORDER_WIDTH);
        onMove(windowId, windowData.x, new_y);
        onResize(windowId, new_width, new_height);
        onFocus(windowId);
      }

      if (state.nw_resize) {
        const delta_y = e.clientY - state.mouse_y;
        const delta_x = e.clientX - state.mouse_x;
        const new_height = Math.max(state.old_height - delta_y, MIN_SIZE);
        const new_width = Math.max(state.old_width - delta_x, MIN_SIZE);
        const new_y = Math.max(state.old_y + delta_y, BORDER_WIDTH);
        const new_x = Math.max(state.old_x + delta_x, 0);
        onMove(windowId, new_x, new_y);
        onResize(windowId, new_width, new_height);
        onFocus(windowId);
      }

      if (state.s_resize) {
        const delta_y = e.clientY - state.mouse_y;
        const new_height = Math.max(state.old_height + delta_y, MIN_SIZE);
        onResize(windowId, windowData.width, new_height);
        onFocus(windowId);
      }

      if (state.se_resize) {
        const delta_y = e.clientY - state.mouse_y;
        const delta_x = e.clientX - state.mouse_x;
        const new_height = Math.max(state.old_height + delta_y, MIN_SIZE);
        const new_width = Math.max(state.old_width + delta_x, MIN_SIZE);
        onResize(windowId, new_width, new_height);
        onFocus(windowId);
      }

      if (state.w_resize) {
        const delta_x = e.clientX - state.mouse_x;
        const new_width = Math.max(state.old_width - delta_x, MIN_SIZE);
        const new_x = Math.max(state.old_x + delta_x, 0);
        onMove(windowId, new_x, windowData.y);
        onResize(windowId, new_width, windowData.height);
        onFocus(windowId);
      }

      if (state.sw_resize) {
        const delta_x = e.clientX - state.mouse_x;
        const delta_y = e.clientY - state.mouse_y;
        const new_width = Math.max(state.old_width - delta_x, MIN_SIZE);
        const new_x = Math.max(state.old_x + delta_x, 0);
        const new_height = Math.max(state.old_height + delta_y, MIN_SIZE);
        onMove(windowId, new_x, windowData.y);
        onResize(windowId, new_width, new_height);
        onFocus(windowId);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [state, windowId, windowData, onFocus, onMove, onResize]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id !== 'title-bar') return;
    
    setState(prev => ({
      ...prev,
      mousedown: true,
      offset_x: windowData.x - e.clientX,
      offset_y: windowData.y - e.clientY,
      mouse_x: e.clientX,
      mouse_y: e.clientY
    }));
    onFocus(windowId);
  };

  const handleMaximize = () => {
    setState(prev => ({
      ...prev,
      fullscreen: true,
      old_x: windowData.x,
      old_y: windowData.y,
      old_width: windowData.width,
      old_height: windowData.height
    }));
    
    onMove(windowId, BORDER_BASE, BORDER_WIDTH + BORDER_BASE);
    onResize(windowId, window.screen.width - BORDER_BASE * 2, window.screen.height - BORDER_WIDTH - BORDER_BASE * 2);
  };

  const startResize = (direction: string) => (e: React.MouseEvent) => {
    setState(prev => ({
      ...prev,
      [`${direction}_resize`]: true,
      mouse_x: e.clientX,
      mouse_y: e.clientY,
      old_x: windowData.x,
      old_y: windowData.y,
      old_width: windowData.width,
      old_height: windowData.height
    }));
  };

  if (!windowData.visible) return null;

  return (
    <>
      <div
        id="window-base"
        style={{
          position: 'absolute',
          left: windowData.x - BORDER_BASE,
          top: windowData.y - BORDER_WIDTH - BORDER_BASE,
          width: windowData.width + BORDER_BASE * 2,
          height: windowData.height + BORDER_WIDTH + BORDER_BASE - 1,
          zIndex
        }}
        className="window"
        onMouseDown={(e: React.MouseEvent) => {
          if ((e.target as HTMLElement).id === 'window-base') {
            onFocus(windowId);
          }
        }}
      >
        <div
          className={state.mousedown ? "title-bar title-bar-active" : "title-bar"}
          id="title-bar"
          onMouseDown={handleTitleBarMouseDown}
        >
          <div className="title-bar-text" id="title-bar">
            {windowData.image && (
              <img
                width={BORDER_WIDTH - 8}
                height={BORDER_WIDTH - 8}
                src={windowData.image}
                style={{ marginRight: '10px' }}
                alt=""
              />
            )}
            {windowData.name}
          </div>
          <div className="title-bar-controls">
            <button aria-label="Maximize" onMouseDown={handleMaximize}></button>
            <button aria-label="Close" onMouseDown={() => onClose(windowId)}></button>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: windowData.x - BORDER_BASE,
          top: windowData.y - BORDER_WIDTH - BORDER_BASE,
          width: windowData.width + BORDER_BASE * 2,
          height: windowData.height + BORDER_WIDTH + BORDER_BASE * 2,
          display: 'grid',
          gridTemplateColumns: `${BORDER_BASE}px 1fr ${BORDER_BASE}px`,
          gridTemplateRows: `${BORDER_BASE}px 1fr ${BORDER_BASE}px`,
          zIndex,
          pointerEvents: 'none'
        }}
      >
        <div style={{ pointerEvents: 'auto', cursor: 'nwse-resize' }} onMouseDown={startResize('nw')}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'ns-resize' }} onMouseDown={startResize('n')}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'nesw-resize' }} onMouseDown={startResize('ne')}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'ew-resize' }} onMouseDown={startResize('w')}></div>
        <div style={{ backgroundColor: 'transparent', pointerEvents: 'none' }}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'ew-resize' }} onMouseDown={startResize('e')}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'nesw-resize' }} onMouseDown={startResize('sw')}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'ns-resize' }} onMouseDown={startResize('s')}></div>
        <div style={{ pointerEvents: 'auto', cursor: 'nwse-resize' }} onMouseDown={startResize('se')}></div>
      </div>
    </>
  );
};

export default function App() {
  const [windows, setWindows] = useState<Record<string, WindowData>>({});
  const [windowOrder, setWindowOrder] = useState<string[]>([]);
  const [showLauncher, setShowLauncher] = useState(false);
  const [programInput, setProgramInput] = useState('');
  const messageQueueRef = useRef<any[]>([{ t: 'browser_start' }]);
  const launcherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const step = () => {
      const messageQueue = messageQueueRef.current;
      messageQueueRef.current = [];

      const cefQuery = (window as any).cefQuery || mockCefQuery;
      
      cefQuery({
        request: JSON.stringify(messageQueue),
        onSuccess: (response: string) => {
          if (response !== '[]') {
            const responseParsed = JSON.parse(response);
            
            responseParsed.forEach((segment: any) => {
              if (segment.t === 'window_focus') {
                // Handle window focus reply from backend
                const windowId = segment.window;
                setWindowOrder(prev => {
                  const filtered = prev.filter(id => id !== windowId);
                  return [...filtered, windowId];
                });
              } else if (segment.t === 'window_icon') {
                // Handle window icon update
                const windowId = segment.window;
                const image = segment.image;
                setWindows(prev => ({
                  ...prev,
                  [windowId]: {
                    ...prev[windowId],
                    image
                  }
                }));
              } else if (segment.t === 'reload') {
                // Handle reload request
                window.location.reload();
              } else if (segment.t === 'window_map') {
                const reply = segment as WindowMapReply;
                
                if (reply.win_t === 'WINDOW_TYPE_NORMAL') {
                  setWindows(prev => {
                    const existing = prev[reply.window];
                    
                    if (!existing) {
                      let x = reply.x;
                      let y = reply.y;
                      
                      if (x === 0 && y === 0 && reply.visible) {
                        x = 100;
                        y = 100;
                        messageQueueRef.current.push({
                          t: 'window_map',
                          x: 100,
                          y: 100,
                          window: reply.window,
                          width: 500,
                          height: 500
                        });
                      }
                      
                      return {
                        ...prev,
                        [reply.window]: {
                          window: reply.window,
                          name: reply.name,
                          visible: reply.visible,
                          x,
                          y,
                          width: reply.width,
                          height: reply.height,
                          image: null
                        }
                      };
                    }
                    
                    return prev;
                  });
                  
                  setWindowOrder(prev => {
                    if (!prev.includes(reply.window)) {
                      return [...prev, reply.window];
                    }
                    return prev;
                  });

                  if (!reply.has_border) {
                    messageQueueRef.current.push({
                      t: 'window_register_border',
                      window: reply.window,
                      x: -BORDER_BASE,
                      y: -BORDER_WIDTH - BORDER_BASE,
                      width: BORDER_BASE,
                      height: BORDER_BASE
                    });
                  }
                }
              }
            });
          }
        },
        onFailure: () => {
          messageQueueRef.current = [];
        }
      });

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (showLauncher) {
      setTimeout(() => launcherInputRef.current?.focus(), 100);
    }
  }, [showLauncher]);

  useEffect(() => {
    messageQueueRef.current.push({
      t: 'window_reorder',
      windows: windowOrder
    });
  }, [windowOrder]);

  const handleFocus = useCallback((windowId: string) => {
    setWindowOrder(prev => {
      const filtered = prev.filter(id => id !== windowId);
      return [...filtered, windowId];
    });
    
    messageQueueRef.current.push({
      t: 'window_focus',
      window: windowId
    });
  }, []);

  const handleClose = useCallback((windowId: string) => {
    messageQueueRef.current.push({
      t: 'window_close',
      window: windowId
    });
    
    setWindows(prev => ({
      ...prev,
      [windowId]: { ...prev[windowId], visible: false }
    }));
  }, []);

  const handleMove = useCallback((windowId: string, x: number, y: number) => {
    setWindows(prev => ({
      ...prev,
      [windowId]: { ...prev[windowId], x, y }
    }));
    
    messageQueueRef.current.push({
      t: 'window_map',
      x,
      y,
      window: windowId,
      width: windows[windowId]?.width || 0,
      height: windows[windowId]?.height || 0
    });
  }, [windows]);

  const handleResize = useCallback((windowId: string, width: number, height: number) => {
    setWindows(prev => ({
      ...prev,
      [windowId]: { ...prev[windowId], width, height }
    }));
    
    messageQueueRef.current.push({
      t: 'window_map',
      x: windows[windowId]?.x || 0,
      y: windows[windowId]?.y || 0,
      window: windowId,
      width,
      height
    });
  }, [windows]);

  const runProgram = () => {
    if (programInput.trim()) {
      messageQueueRef.current.push({
        t: 'run_program',
        command: programInput.trim().split(' ')
      });
      setProgramInput('');
      setShowLauncher(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/xp.css/0.3.2/xp.min.css" />
      
      <div
        onMouseDown={() => setShowLauncher(!showLauncher)}
        style={{ width: '100%', height: '100%' }}
      />

      {showLauncher && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
          }}
          className="window"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="window-body">
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
              Run Program
            </div>
            <input
              ref={launcherInputRef}
              type="text"
              value={programInput}
              autoComplete="off"
              onChange={(e) => setProgramInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runProgram();
                else if (e.key === 'Escape') {
                  setShowLauncher(false);
                  setProgramInput('');
                }
              }}
              placeholder="Enter program name..."
              style={{ width: '300px', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={runProgram}>Run</button>
              <button onClick={() => {
                setShowLauncher(false);
                setProgramInput('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {Object.entries(windows).map(([windowId, windowData]) => (
        <WindowFrame
          key={windowId}
          windowId={windowId}
          windowData={windowData}
          zIndex={windowOrder.indexOf(windowId) + 1}
          onFocus={handleFocus}
          onClose={handleClose}
          onMove={handleMove}
          onResize={handleResize}
        />
      ))}
    </div>
  );
}
