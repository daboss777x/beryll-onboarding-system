// Tiny in-memory event bus between the Beryll Contracts mini-app and the walkthrough engine.
// The app calls emitTour() after real user actions; the engine subscribes with onTour().
// Commands go the other way: in Watch mode the engine asks the app to perform drags it can't
// fake with DOM events (dnd-kit), via runTourCommand().
import type { TourEventName } from "@/content/walkthroughs/types";

export type TourPayload = Record<string, unknown>;
type Listener = (name: TourEventName, payload: TourPayload) => void;

const listeners = new Set<Listener>();

export function emitTour(name: TourEventName, payload: TourPayload = {}): void {
  for (const l of [...listeners]) l(name, payload);
}

export function onTour(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Drag from one data-tour id to another (Watch mode). */
export interface TourCommand {
  kind: "drag";
  source: string;
  target: string;
}
type CommandHandler = (cmd: TourCommand) => boolean;
const handlers = new Set<CommandHandler>();

/** Returns true when some mounted component handled the command. */
export function runTourCommand(cmd: TourCommand): boolean {
  for (const h of [...handlers]) if (h(cmd)) return true;
  return false;
}

export function onTourCommand(handler: CommandHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
