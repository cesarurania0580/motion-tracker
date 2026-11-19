// Decides which tracker shortcut, if any, a key press means. Kept free of React and
// the DOM so the focus rules can be tested directly (spec 22).
const TYPING = 'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]),textarea,select,[contenteditable=""],[contenteditable="true"]';
const OWN_KEYS = '[role="dialog"],[role="menu"],[role="listbox"],[role="tablist"],[role="grid"],.spreadsheet-table';
const CONTROL = 'button,a[href],input,summary,[tabindex],[role="button"]';

function keyAction(key, context) {
  if (key === ' ' || key === 'Spacebar') {
    if (context.manual) return 'record';
    return context.video && !context.automatic ? 'playPause' : null;
  }
  if (key === 'Backspace') return context.manual && context.canUndo ? 'undo' : null;
  if (key === 'ArrowRight' || key === '.') return context.video ? 'next' : null;
  if (key === 'ArrowLeft' || key === ',') return context.video ? 'previous' : null;
  return null;
}

// Remembers whether each focused element was reached with the keyboard or with a
// pointer. `:focus-visible` cannot answer this at key time: browsers turn it on for
// a mouse-focused button as soon as any key is pressed.
export function createFocusModality(target) {
  let lastInput = 'pointer';
  let keyboardElement = null;
  const onKey = () => { lastInput = 'keyboard'; };
  const onPointer = () => { lastInput = 'pointer'; };
  const onFocus = (event) => { keyboardElement = lastInput === 'keyboard' ? event.target : null; };
  target.addEventListener('keydown', onKey, true);
  target.addEventListener('pointerdown', onPointer, true);
  target.addEventListener('mousedown', onPointer, true);
  target.addEventListener('focusin', onFocus, true);
  return {
    byKeyboard: element => !!element && element === keyboardElement,
    dispose() {
      target.removeEventListener('keydown', onKey, true);
      target.removeEventListener('pointerdown', onPointer, true);
      target.removeEventListener('mousedown', onPointer, true);
      target.removeEventListener('focusin', onFocus, true);
    },
  };
}

// context: {active, video, manual, automatic, canUndo, keyboardFocused(element)}.
// Returns null, or {action, blur} where blur is a pointer-focused control to release.
export function trackerShortcut(event, context) {
  if (!context.active || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return null;
  const action = keyAction(event.key, context);
  if (!action) return null;
  const single = action === 'record' || action === 'undo' || action === 'playPause';
  if (single && event.repeat) return null;
  const target = event.target;
  if (!target || typeof target.closest !== 'function') return {action, blur: null};
  if (target.closest(TYPING) || target.closest(OWN_KEYS)) return null;
  const control = target.closest(CONTROL);
  if (!control) return {action, blur: null};
  if (context.keyboardFocused?.(control)) return null;
  if (!single && control.matches('input[type="range"]')) return null;
  return {action, blur: control};
}
