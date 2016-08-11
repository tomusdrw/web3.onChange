/* global describe, it, beforeEach, afterEach */
import {Web3OnChange, fakeAbi} from './index.js';
import Web3 from 'web3';

import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai from 'chai';
chai.use(sinonChai);
const expect = chai.expect;

describe('Web3.onChange', () => {
  function fakeWeb3 () {
    const fakeProvider = {
      sent: [],
      isConnected () {
        return true;
      },
      send (payload) {
        throw new Error('not supported');
      },
      sendAsync (payload, callback) {
        this.sent.push([payload, callback]);
      }
    };
    const web3 = new Web3(fakeProvider);
    web3.provider = fakeProvider;
    return web3;
  }

  function resLast (web3, response) {
    // Respond only too single request
    expect(web3.provider.sent).to.have.length(1);

    let [request, callback] = web3.provider.sent.pop();

    // batch requests?
    if (request.length) {
      callback(null, request.map(req => ({
        jsonrpc: '2.0',
        result: response,
        id: req.id
      })));
      return;
    }
    callback(null, {
      jsonrpc: '2.0',
      result: response,
      id: request.id
    });
  }

  const address = '0x0000000000000000000000000000000000000000';

  let clock = null;
  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should be defined', () => {
    // given

    // when

    // then
    expect(Web3OnChange).to.be.ok;
  });

  it('should install onChange function', () => {
    // given
    const web3 = fakeWeb3();

    // when
    const w = Web3OnChange.install(web3);

    // then
    expect(web3.eth.getGasPrice.onChange).to.be.ok;
    expect(web3.eth.contract(fakeAbi).at(address).xxx.onChange).to.be.ok;
    expect(w).to.be.equal(web3);
  });

  it('should install latest block filter', done => {
    // given
    const web3 = Web3OnChange.install(fakeWeb3());

    // when
    const off = web3.eth.getBalance.onChange(address, (err, balance) => {
      expect(err).to.equal(null);
      // then
      expect(balance.toNumber()).to.equal(10);
      done();
    });

    // invoke filter callback
    resLast(web3, '0x1');
    // return change to filter
    resLast(web3, ['0x01']);
    // Return a balance
    resLast(web3, [10]);

    // then
    expect(off).to.be.a('function');
  });

  it('should not fire callback twice if value is the same', () => {
    // given
    const web3 = Web3OnChange.install(fakeWeb3());
    let times = 0;

    // when
    const off = web3.eth.getBalance.onChange(address, (err, balance) => {
      times += 1;
      expect(err).to.equal(null);
      expect(balance.toNumber()).to.equal(10);
    });

    // invoke filter callback
    resLast(web3, '0x1');
    // return change to filter
    resLast(web3, ['0x01']);
    // Return a balance
    resLast(web3, [10]);
    clock.tick(500);
    resLast(web3, ['0x02']);
    resLast(web3, [10]);

    // then
    expect(times).to.equal(1);
    off();
  });

  it('should support time-based polling', () => {
    // given
    const web3 = Web3OnChange.install(fakeWeb3());
    let times = 0;

    // when
    const off = web3.eth.getBalance.onChange(address, (err, balance) => {
      times += 1;
      expect(err).to.equal(null);
      expect(balance.toNumber()).to.equal(10);
    }, 500);

    // then
    // Respond with balance
    resLast(web3, [10]);
    expect(times).to.equal(1);

    // should make another query
    clock.tick(500);
    resLast(web3, [10]);
    // but callback should not be invoked
    expect(times).to.equal(1);
    off();
  });
});
