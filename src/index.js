import {
  fetchCountryTotals,
  loadScrollytellers,
  renderCasesGraphics,
  renderScrollytellerApps,
  selectCasesGraphicsRoots
} from './utils';

const casesGraphicsRoots = selectCasesGraphicsRoots();
const whenScrollytellersLoaded = loadScrollytellers();
const whenCountryTotalsFetched = fetchCountryTotals();

function render(scrollyDatas, countryTotals) {
  renderScrollytellerApps(scrollyDatas, countryTotals);
  renderCasesGraphics(casesGraphicsRoots, countryTotals);
}

document.documentElement.style.setProperty('--bg', '#f3fcfc');

Promise.all([whenScrollytellersLoaded, whenCountryTotalsFetched])
  .then(results => render.apply(null, results))
  .catch(console.error);
