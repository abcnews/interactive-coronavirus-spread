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
  document.documentElement.style.setProperty('--bg', '#f3f3f3');
  renderScrollytellerApps(scrollyDatas, countryTotals);
  renderCasesGraphics(casesGraphicsRoots, countryTotals);
}

Promise.all([whenScrollytellersLoaded, whenCountryTotalsFetched])
  .then(results => render.apply(null, results))
  .catch(console.error);
