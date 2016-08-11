import Web3 from 'web3';

export class Web3OnChange {

  // TODO [todr] It creates a single instance!
  static install (web3) {
    const w = new Web3OnChange(web3);
    // We will extend prototypes
    const MethodProto = web3.eth.getBalance.constructor.prototype;
    const SolidityFuncProto = web3.eth.contract(fakeAbi).at('0x0000000000000000000000000000000000000000').xxx.constructor.prototype;

    // Make sure to install onChange
    // TODO [todr] figure out how to be able to support many web3 instances
    MethodProto.onChange = onChange(w);
    SolidityFuncProto.onChange = onChange(w);

    // return web3 back
    return web3;
  }

  constructor (web3) {
    this.web3 = web3;
    this.requests = [];
  }

  onBlock (func, args, callback) {
    const r = {
      func: func,
      args: args,
      callback: callback,
      result: null
    };

    if (this.requests.length === 0) {
      this.installBlockFilter();
    }

    this.requests.push(r);

    // Remove listener
    return () => {
      const idx = this.requests.indexOf(r);
      if (idx !== -1) {
        this.requests.splice(idx, 1);
      }

      if (this.requests.length === 0) {
        this.uninstallBlockFilter();
      }
    };
  }

  invokeBlockRequests () {
    const requests = this.requests.map(req => {
      return req.func.request(...req.args, (err, result) => {
        // Just ignore errors?
        if (err) {
          // Display error if it's the first query
          if (req.result === null) {
            console.warn(`Error while making ${req.func.name} request.`, err);
            // Fire callback with error
            req.callback(err, null);
          }
          return;
        }

        // Compare with previous result
        const j = JSON.stringify(result);
        if (req.result !== j) {
          // Save current result
          req.result = j;
          // Fire original callback, cause there was a change
          req.callback(err, result);
        }
        // Do nothing (results are the same)
      });
    });

    // create new batch
    const batch = this.web3.createBatch();
    requests.map(req => batch.add(req));
    batch.execute();
  }

  installBlockFilter () {
    this.blocks = this.web3.eth.filter('latest', () => {
      this.invokeBlockRequests();
    });
  }

  uninstallBlockFilter () {
    this.blocks.stopWatching();
    this.blocks = null;
  }

}

export const fakeAbi = [{
  name: 'xxx',
  type: 'function',
  inputs: [],
  outputs: [],
  constant: false,
}];

function onChange (web3OnChange) {
  return function onChange(...args) {
    const callback = args.pop();
    // Context is important here!
    return web3OnChange.onBlock(this, args, callback);
  }
}

global.web3 = Web3OnChange.install(new Web3(new Web3.providers.HttpProvider('http://localhost:8545')));
