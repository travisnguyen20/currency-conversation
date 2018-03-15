const Graph = require('node-dijkstra')

module.exports = class CurrencyConversation {
    constructor (options, exchanges) {
        this._options = options;
        this._route = this._buildMap(this._exchanges)
        this._exchanges = exchanges;
    }

    findConversationPath(sourceExchange, sourceCurrency, destExchange, destCurrency ) {
        let path = this._findPath(sourceExchange, sourceCurrency, destExchange, destCurrency)
        return this._normalizePath(path)
    }

    _buildMap() {
        let route = new Graph()
        let map = {}
        this._exchanges.forEach((ex) => {
            ex.pairs.forEach(pair => {
                if (map[this._prefix(ex.exchange, pair.left_pair)]) {
                    map[this._prefix(ex.exchange, pair.left_pair)].set([this._prefix(ex.exchange, pair.right_pair)], 1)
                } else {
                    map[this._prefix(ex.exchange, pair.left_pair)] = new Map()
                    map[this._prefix(ex.exchange, pair.left_pair)].set([this._prefix(ex.exchange, pair.right_pair)], 1)
                }
                if (map[this._prefix(ex.exchange, pair.right_pair)]) {
                    map[this._prefix(ex.exchange, pair.right_pair)].set([this._prefix(ex.exchange, pair.left_pair)], 1)
                } else {
                    map[this._prefix(ex.exchange, pair.right_pair)] = new Map()
                    map[this._prefix(ex.exchange, pair.right_pair)].set([this._prefix(ex.exchange, pair.left_pair)], 1)
                }
            })
        })

        const keys = Object.keys(map);

        keys.forEach((k) => {
            let obj = Array.from(map[k]).reduce((obj, [key, value]) => (
                Object.assign(obj, {[key]: value})
            ), {});
            route.addNode(k, obj)
        })

        return route
    }

    _prefix(exchange, pair) {
        return exchange + "_" + pair;
    }

    _findPath(sourceExchange, sourceCurrency, destExchange, destCurrency ) {
        let result = this._route.path(this._prefix(sourceExchange, sourceCurrency), this._prefix(destExchange, destCurrency))
        let fiatResult = null;
        if (result) {
            console.log("Found without cross exchange")
            return result;
        } else {
            let selectedCurrency = null;
            for (let i = 0; i < this._options.popularCurrencies.length; i++) {
                result = this._route.path(this._prefix(sourceExchange, sourceCurrency), this._prefix(destExchange, this._options.popularCurrencies[i]))
                if (result) {
                    selectedCurrency = this._options.popularCurrencies[i]
                    break
                }
            }
            if (selectedCurrency) {
                fiatResult = this._route.path(this._prefix(this._options.fiatExchange, selectedCurrency), this._prefix(this._options.fiatExchange, destCurrency))
                if (fiatResult) {
                    console.log("Found with cross exchange")
                    return result.concat(fiatResult);
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }
    }

    _extractPair(pair) {
        let result = pair.split("_");
        return {
            "exchange": result[0],
            "currency": result[1]
        }
    }

    _getPairDirection(exchange, left_pair, right_pair) {
        for (let i = 0; i < this._exchanges.length; i++) {
            if (this._exchanges[i].exchange === exchange) {
                for (let j = 0; j < this._exchanges[i].pairs.length; j++) {
                    let pair = this._exchanges[i].pairs[j]
                    if (pair.left_pair === left_pair && pair.right_pair === right_pair) {
                        return true
                    }
                    if (pair.left_pair === right_pair && pair.right_pair === left_pair) {
                        return false
                    }
                }
            }
        }
        throw new Error("Invalid pair")
    }

    _normalizePath(path) {
        if (!path) {
            return path
        }
        let result = []
        for (let i = 0; i < path.length - 1; i++) {
            let pair1 = this._extractPair(path[i])
            let pair2 = this._extractPair(path[i + 1])
            if (pair1.exchange === pair2.exchange) {
                result.push({
                    "exchange": pair1.exchange,
                    "left_pair": pair1.currency,
                    "right_pair": pair2.currency,
                    "normal": this._getPairDirection(pair1.exchange, pair1.currency, pair2.currency)
                })
            }
        }
        return result
    }
}







