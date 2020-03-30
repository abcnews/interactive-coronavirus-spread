import { fetchCountryTotals, renderCasesGraphics, selectCasesGraphicsRoots } from './utils';

const casesGraphicsRoots = selectCasesGraphicsRoots();
const whenCountryTotalsFetched = fetchCountryTotals();

function render(countryTotals) {
  renderCasesGraphics(casesGraphicsRoots, countryTotals);
}

Promise.all([whenCountryTotalsFetched])
  .then(results => render.apply(null, results))
  .catch(console.error);
