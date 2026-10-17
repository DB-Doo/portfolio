import type { Collider, Press } from "./engine";

/*
Lets a component outside the site fabric press into it for a moment, such as a project card
widening into its case study. Colliders added here are read every frame while `busy` is set.
*/
export const fabricBus = {
  colliders: new Set<Collider>(),
  busy: false,
  /** The critters' dents this frame, in window pixels. */
  presses: [] as Press[],
  wake: () => {},
  /** Lets the sheet go slack, for a new page arriving. */
  calm: () => {},
};
