export type ChessoraSettings = { sound: boolean; moveSound: boolean; captureSound: boolean; board: "classic" | "blue" | "wood" | "green"; pieces: "classic" | "minimal"; coordinates: boolean };
export const defaultSettings: ChessoraSettings = { sound: true, moveSound: true, captureSound: true, board: "classic", pieces: "classic", coordinates: true };
export const settingsKey = "chessora-settings";
export function readSettings(): ChessoraSettings {
  if (typeof window === "undefined") return defaultSettings;
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") }; } catch { return defaultSettings; }
}
export function saveSettings(value: ChessoraSettings) {
  localStorage.setItem(settingsKey, JSON.stringify(value));
  window.dispatchEvent(new Event("chessora-settings"));
}
export function playChessSound(kind: "move" | "capture") {
  const prefs = readSettings();
  if (!prefs.sound || (kind === "move" && !prefs.moveSound) || (kind === "capture" && !prefs.captureSound)) return;
  try {
    const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    const context = new Audio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = kind === "capture" ? 520 : 660;
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.09);
    oscillator.onended = () => void context.close();
  } catch {}
}
