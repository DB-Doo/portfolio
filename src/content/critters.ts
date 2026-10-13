/*
The Canvas Critters (the jumping spider and the Roomba) ship in Doto's Halloween update on
Oct 31, 2026. Until then they show on local builds and Vercel previews only, so the live site
never shows a feature people can't get. Set this to true when the update is live on Google Play.
*/
export const CRITTERS_RELEASED = false;

export const showCritters = CRITTERS_RELEASED || process.env.VERCEL_ENV !== "production";
