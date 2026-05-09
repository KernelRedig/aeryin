export default function handler(req, res) {
  const { value } = req.query;
  
  if (!value || isNaN(parseFloat(value))) {
    return res.status(400).json({ error: 'Please provide a valid value' });
  }
  
  const valueNum = parseFloat(value);
  const robux = Math.round(valueNum * 1.68);
  
  // 1 value = R$0.0896 (Brazil)
  // For other countries, we'll let frontend handle based on detected currency
  
  const formatNum = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
  
  return res.status(200).json({
    value: valueNum,
    robux: robux,
    robuxFormatted: formatNum(robux),
    rateRobux: 1.68,
    currencies: {
      BRL: {
        symbol: 'R$',
        value: (valueNum * 0.0896),
        formatted: formatCurrency(valueNum * 0.0896, 'BRL')
      },
      USD: {
        symbol: '$',
        value: (valueNum * 0.018),
        formatted: formatCurrency(valueNum * 0.018, 'USD')
      },
      EUR: {
        symbol: '€',
        value: (valueNum * 0.0165),
        formatted: formatCurrency(valueNum * 0.0165, 'EUR')
      }
    }
  });
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'de-DE', {
    style: 'currency',
    currency: currency
  }).format(value);
}