const calculateMarketStats = (priceData) => {
  if (!priceData || Object.keys(priceData).length === 0) {
    return null;
  }

  const prices = Object.values(priceData)
    .map(price => parseFloat(price))
    .filter(price => !isNaN(price) && price > 0);
  
  if (prices.length === 0) {
    return null;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  // Calculate median
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
    : sortedPrices[Math.floor(sortedPrices.length / 2)];

  // Calculate price range percentage
  const priceRange = maxPrice - minPrice;
  const rangePercentage = maxPrice > 0 ? (priceRange / maxPrice) * 100 : 0;

  return {
    min: minPrice,
    max: maxPrice,
    average: avgPrice,
    median: medianPrice,
    count: prices.length,
    range: priceRange,
    rangePercentage: rangePercentage
  };
};

export default calculateMarketStats;
