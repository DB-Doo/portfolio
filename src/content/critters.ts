/*
The Canvas Critters (the jumping spider and the Roomba) ship in a Doto update ahead of
Halloween 2026. Until it is out they show on local builds and Vercel previews only, so the live site
never shows a feature people can't get. Set this to true when the update is live on Google Play.
*/
export const CRITTERS_RELEASED = false;

export const showCritters = CRITTERS_RELEASED || process.env.VERCEL_ENV !== "production";
