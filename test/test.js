const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
var electron = require('electron');

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

if (process.platform === 'win32') {
    electronPath += '.cmd';
}

var appPath = path.join(__dirname, '..', 'HCCGo');

var app = new Application({
            path: electron,
            args: [appPath]
        });

global.before(function () {
    chai.should();
    chai.use(chaiAsPromised);
});

describe('Test Example', function () {
  this.timeout(60000);
  
  beforeEach(function () {
      return app.start();
  });

  afterEach(function () {
      return app.stop();
  });

  it('opens a window', function () {
    return app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(2);
  });

  it('tests the title', function () {
    return app.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('Hello World!');
  });
});