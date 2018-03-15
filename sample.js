const CurrencyConversation = require('./currency-conversation')
const exchanges = require('./sample-data')

var currencyConversation = new CurrencyConversation({
    popularCurrencies:['BTC', 'ETH'],
    fiatExchange: ['GDAX']
}, exchanges);

let res = currencyConversation.findConversationPath('BINANCE', 'ADA', 'BINANCE', 'USD')
console.log(res)







