/* global describe, it */
import {Web3OnChange} from './index.js';

// import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai from 'chai';
chai.use(sinonChai);
const expect = chai.expect;

describe('Web3.onChange', () => {
  it('should be defined', () => {
    // given

    // when

    // then
    expect(Web3OnChange).to.be.ok;
  });
});
