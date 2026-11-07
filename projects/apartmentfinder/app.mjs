import { SAMPLE_LISTINGS } from "./listings.mjs";
import { filterHomes, money, monthlyEstimate, moveInCost, selectCompare, sortHomes } from "./logic.mjs";

const ui = {
  city: document.querySelector("#city"),
  zip: document.querySelector("#zip"),
  maxRent: document.querySelector("#max-rent"),
  minBeds: document.querySelector("#bedrooms"),
  moveInBudget: document.querySelector("#move-in-budget"),
  sort: document.querySelector("#sort-by"),
  petOnly: document.querySelector("#pet-friendly"),
  favoritesOnly: document.querySelector("#favorites-only"),
  grid: document.querySelector("#listing-grid"),
  count: document.querySelector("#results-count"),
  empty: document.querySelector("#empty-results"),
  compareText: document.querySelector("#compare-instruction"),
  compareWrap: document.querySelector("#compare-table-wrap"),
  compareHead: document.querySelector("#compare-head"),
  compareBody: document.querySelector("#compare-body"),
  clearCompare: document.querySelector("#clear-compare")
};

const STORAGE_KEY = "apartmentfinder-demo-favorites-v1";
const listedIds = new Set(SAMPLE_LISTINGS.map(home => home.id));
const favorites = loadFavorites();
let comparison = new Set();
let comparisonNotice = "";

function loadFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter(id => listedIds.has(id)) : []);
  } catch {
    return new Set();
  }
}

function persistFavorites() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites])); }
  catch { /* Browsers may disable local storage. The page still works. */ }
}

function node(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = String(text);
  return result;
}

function appendField(parent, label, value, valueClass = "") {
  const cell = node("div");
  const key = node("span", "", label);
  const number = node("strong", valueClass, value);
  cell.append(key, number);
  parent.append(cell);
}

function inputFilters() {
  return {
    city: ui.city.value,
    zip: ui.zip.value,
    maxRent: ui.maxRent.value,
    minBeds: ui.minBeds.value,
    maxMoveIn: ui.moveInBudget.value,
    petFriendly: ui.petOnly.checked,
    savedOnly: ui.favoritesOnly.checked,
    savedIds: favorites
  };
}

function card(home) {
  const article = node("article", "listing-card");
  const art = node("div", "listing-art " + home.tone);
  art.append(node("span", "sample-tag", "Fictional listing"));
  const body = node("div", "card-body");
  const top = node("div", "card-top");
  top.append(node("span", "city", home.city + ", " + home.state + " " + home.zip));
  const save = node("button", "save-button", favorites.has(home.id) ? "♥" : "♡");
  save.type = "button";
  save.setAttribute("aria-label", (favorites.has(home.id) ? "Unsave " : "Save ") + home.name);
  save.setAttribute("aria-pressed", String(favorites.has(home.id)));
  save.title = "Save to this browser";
  save.addEventListener("click", () => {
    if (favorites.has(home.id)) favorites.delete(home.id); else favorites.add(home.id);
    persistFavorites();
    render();
  });
  top.append(save);
  const heading = node("h3", "", home.name);
  const details = node("p", "facts", (home.beds === 0 ? "Studio" : home.beds + " bed") +
    " · " + home.baths + " bath · " + home.sqft.toLocaleString("en-US") + " sq ft");
  const pills = node("div", "pill-list");
  home.features.forEach(feature => pills.append(node("span", "pill", feature)));
  const pricing = node("div", "pricing");
  appendField(pricing, "Sample rent / month", money(home.rent));
  appendField(pricing, "Estimated move-in", money(moveInCost(home)), "secondary");
  const cardFooter = node("div", "card-footer");
  const compareButton = node("button", "compare-button", comparison.has(home.id) ? "✓ Comparing" : "+ Compare");
  compareButton.type = "button";
  compareButton.setAttribute("aria-pressed", String(comparison.has(home.id)));
  compareButton.setAttribute("aria-label", (comparison.has(home.id) ? "Remove " : "Compare ") +
    home.name + (comparison.has(home.id) ? " from comparison" : ""));
  compareButton.addEventListener("click", () => {
    const selection = selectCompare(comparison, home.id);
    comparison = selection.ids;
    comparisonNotice = selection.limited ? "You can compare a maximum of three homes. Remove one to add another." : "";
    render();
  });
  cardFooter.append(compareButton, node("small", "", "Illustrative estimate"));
  body.append(top, heading, details, pills, pricing, cardFooter);
  article.append(art, body);
  return article;
}

function renderCompare() {
  const homes = [...comparison].map(id => SAMPLE_LISTINGS.find(home => home.id === id)).filter(Boolean);
  ui.compareHead.replaceChildren();
  ui.compareBody.replaceChildren();
  ui.compareWrap.hidden = homes.length === 0;
  ui.clearCompare.hidden = homes.length === 0;
  ui.compareText.textContent = comparisonNotice ||
    (homes.length === 0 ? "Select “Compare” on a listing card to begin." :
      homes.length + " of 3 sample homes selected. These amounts are estimates, not rental quotes.");
  if (!homes.length) return;

  const headRow = node("tr");
  headRow.append(node("th", "", "Cost breakdown"));
  for (const home of homes) headRow.append(node("th", "", home.name));
  ui.compareHead.append(headRow);

  const includePetRent = ui.petOnly.checked;
  const rows = [
    ["City", home => home.city],
    ["Bedrooms", home => home.beds === 0 ? "Studio" : String(home.beds)],
    ["Rent / month", home => money(home.rent)],
    ["Estimated utilities / month", home => money(home.estimatedUtilities)],
    ["Optional parking / month", home => money(home.parkingFee)],
    ["Pet rent / month", home => money(home.petRent) + (includePetRent ? " (included)" : " (not included)")],
    ["Estimated monthly total", home => money(monthlyEstimate(home, includePetRent))],
    ["Security deposit", home => money(home.deposit)],
    ["Application fee", home => money(home.applicationFee)],
    ["Administrative fee", home => money(home.adminFee)],
    ["Estimated move-in total", home => money(moveInCost(home))]
  ];
  for (const [label, valueOf] of rows) {
    const tr = node("tr");
    const key = node("th", "", label);
    key.scope = "row";
    tr.append(key);
    homes.forEach(home => tr.append(node("td", "", valueOf(home))));
    ui.compareBody.append(tr);
  }
}

function render() {
  const filtered = filterHomes(SAMPLE_LISTINGS, inputFilters());
  const sorted = sortHomes(filtered, ui.sort.value, ui.petOnly.checked);
  ui.count.textContent = sorted.length + " sample " + (sorted.length === 1 ? "home" : "homes") + " match your filters";
  ui.empty.hidden = sorted.length > 0;
  ui.grid.replaceChildren(...sorted.map(card));
  renderCompare();
}

for (const city of [...new Set(SAMPLE_LISTINGS.map(home => home.city))].sort()) {
  const option = node("option", "", city);
  option.value = city;
  ui.city.append(option);
}

document.querySelector("#search-form").addEventListener("submit", event => event.preventDefault());
for (const element of [ui.city, ui.zip, ui.maxRent, ui.minBeds, ui.moveInBudget, ui.sort, ui.petOnly, ui.favoritesOnly]) {
  element.addEventListener(element.tagName === "INPUT" && element.type !== "checkbox" ? "input" : "change", render);
}
document.querySelector("#reset-filters").addEventListener("click", () => {
  document.querySelector("#search-form").reset();
  ui.maxRent.value = "1200";
  ui.favoritesOnly.checked = false;
  render();
});
ui.clearCompare.addEventListener("click", () => {
  comparison = new Set();
  comparisonNotice = "";
  render();
});
render();