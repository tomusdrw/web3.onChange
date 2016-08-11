[![NPM version][npm-image]][npm-url] 
[![Build Status][travis-image]][travis-url]
[![Join the chat at https://gitter.im/ethcore/parity][gitter-image]][gitter-url]
[![GPLv3][license-image]][license-url]

[npm-image]: https://badge.fury.io/js/web3.onChange.png
[npm-url]: https://npmjs.org/package/web3.onChange
[travis-image]: https://travis-ci.org/tomusdrw/web3.onChange.svg?branch=master
[travis-url]: https://travis-ci.org/tomusdrw/web3.onChange
[gitter-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/ethcore/parity?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[license-image]: https://img.shields.io/badge/license-GPL%20v3-green.svg
[license-url]: http://www.gnu.org/licenses/gpl-3.0.en.html

# web3.onChange

Wondering how often / when you should call Web3 methods again to refresh the content?


## Usage

### Install

```bash
$ npm install web3.onChange --save
```

### In short

```javascript
web3.eth.getBalance.onChange('0xbb9bc244d798123fde783fcc1c72d3bb8c189413', (err, balance) => {
  console.log(`Your new balance is: ${balance}`);
});
```

### Full version

```javascript
import {Web3OnChange} from 'web3.onChange';
import {Web3} from 'web3';

// Initialize web3
let web3 = typeof web3 === 'undefined' ? new Web3(new Web3.providers.HttpProvider('http://localhost:8545')) : web3;

// Install .onChange plugin
web3 = Web3OnChange.install(web3);

// Instead of polling manually for every call
setTimeout(() => {
  web3.eth.getBalance('0xbb9bc244d798123fde783fcc1c72d3bb8c189413', (err, result) => {
    console.log(result);
  });
}, 1000);

// Just listen to changes
const off = web3.eth.getBalance.onChange('0xbb9bc244d798123fde783fcc1c72d3bb8c189413', (err, result) => {
  console.log(result);
});

// and to stop listening call
off();

// You can do the same with every web3 method.
// Also in contracts:
const off2 = web3.eth.contract(abi).at('0xbb9bc244d798123fde783fcc1c72d3bb8c189413').balance.onChange((err, result) => {
  console.log(result);
});
```


## How it works

Library is doing a batch request each time new block is imported.

After a request is made response is compared with previous value and callback is fired only if current value is different then the previous one.

By default all queries are made (batched) only when new block is imported (`eth.filter('latest')` fires). By passing additional argument (number) you can specify polling interval manually.

## TODO
- [x] - Support time-based polling (`.onChange(...args, callback, 500)` - polls every 500s)
- [ ] - Support lightweight, promise-based Web3 replacement [jacogr/ethapi-js](https://github.com/jacogr/ethapi-js)
- [ ] - Support pending-transactions polling (`.onChange(...args, callback, 'pending')`)
- [ ] - Support Filter/Logs polling?
- [ ] - Passing old value?
