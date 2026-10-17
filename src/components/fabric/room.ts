/*
What the page's room is made of, for the sheet and the critters alike. Walls are text and
controls: the sheet thins behind them and the critters drive around them. Ledges are cards,
phones and pictures: the sheet gathers at their rims and the critters can stand on them. Only
the outermost match counts, so a paragraph inside a card does not become a second wall.
*/

const WALLS = [
  '[data-critter="wall"]',
  "main h1",
  "main h2",
  "main h3",
  "main p",
  "main li",
  "main dl",
  "main blockquote",
  "main figcaption",
  "main a",
  "main button",
  "nav",
  "footer",
].join(",");

const LEDGES = ['[data-critter="ledge"]', '[data-fabric="well"]', "main figure", "main img"].join(",");

function outermost(elements: Element[], within: Element[] = []) {
  const set = new Set(elements);
  return elements.filter((el) => {
    for (let up = el.parentElement; up; up = up.parentElement) {
      if (set.has(up)) return false;
      if (within.includes(up)) return false;
    }
    return true;
  });
}

export function ledges(): Element[] {
  return outermost([...document.querySelectorAll(LEDGES)]).filter((el) => !el.closest('[data-critter="wall"]'));
}

/** Text inside a ledge is part of the ledge: you stand on a card, not on its words. */
export function walls(): Element[] {
  const cards = ledges();
  return outermost([...document.querySelectorAll(WALLS)], cards).filter(
    (el) => !el.closest('[aria-hidden="true"]') && !cards.some((card) => el.contains(card)),
  );
}
