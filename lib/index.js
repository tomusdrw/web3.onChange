
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
    this.requests = {};
    this.polling = {};
  }

  on (change, func, args, callback) {
    const r = {
      func: func,
      args: args,
      callback: callback,
      result: null
    };

    this.requests[change] = this.requests[change] || [];
    const requests = this.requests[change];

    requests.push(r);

    if (requests.length === 1) {
      this.installPolling(change);
    } else {
      // Fire request right now
      this.invokeBatch([this.prepareRequest(r)]);
    }

    // Remove listener
    return () => {
      const idx = requests.indexOf(r);
      if (idx !== -1) {
        requests.splice(idx, 1);
      }

      if (requests.length === 0) {
        this.uninstallPolling(change);
      }
    };
  }

  invokeRequests (param) {
    const requests = this.requests[param].map(req => {
      return this.prepareRequest(req);
    });

    this.invokeBatch(requests);
  }

  invokeBatch (requests) {
    // create new batch
    const batch = this.web3.createBatch();
    requests.map(req => batch.add(req));
    batch.execute();
  }

  prepareRequest (req) {
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
  }

  installPolling (param) {
    // And add polling
    if (param === 'latest') {
      this.polling[param] = this.web3.eth.filter('latest', () => {
        this.invokeRequests(param);
      });
      return;
    }

    // TODO [todr] use setTimeout to get more uniform poll
    this.polling[param] = setInterval(() => {
      this.invokeRequests(param);
    }, param);
    // Invoke request right now
    this.invokeRequests(param);
  }

  uninstallPolling (param) {
    const poll = this.polling[param];
    this.polling[param] = null;

    if (param === 'latest') {
      poll.stopWatching();
      return;
    }

    clearInterval(poll);
  }

}

export const fakeAbi = [{
  name: 'xxx',
  type: 'function',
  inputs: [],
  outputs: [],
  constant: false
}];

function onChange (web3OnChange) {
  return function onChange (...args) {
    let changeParam = 'latest';
    let callback = args.pop();

    // check if last argument is function
    if (!isFunction(callback)) {
      changeParam = callback;
      callback = args.pop();
    }

    if (!isFunction(callback)) {
      throw new Error('You need to provide callback.');
    }

    // Context is important here!
    return web3OnChange.on(changeParam, this, args, callback);
  };
}

function isFunction (thing) {
  return typeof thing === 'function';
}

// import Web3 from 'web3';
// global.web3 = Web3OnChange.install(new Web3(new Web3.providers.HttpProvider('http://localhost:8545')));
