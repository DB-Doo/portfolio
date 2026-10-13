/*
The Canvas Critters (the jumping spider and the Roomba) are live on the site ahead of the Doto
update that brings them to the launcher. Set this to false to take them off the live site; local
builds and Vercel previews keep showing them either way.
*/
export const CRITTERS_RELEASED = true;

export const showCritters = CRITTERS_RELEASED || process.env.VERCEL_ENV !== "production";
