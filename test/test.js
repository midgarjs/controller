import mocha from 'mocha'
import chai from 'chai'
import chaiHttp from 'chai-http'
import dirtyChai from 'dirty-chai'
import path from 'path'
import { htmlEncode } from 'htmlencode'
import ControllerPlugin, { Controller } from '..'

/**
 * @type {Midgar}
 */
import Midgar from '@midgar/midgar'
import TestClassController from './fixtures/plugins/test/controllers/class'

// fix for TypeError: describe is not a function with mocha-teamcity-reporter
const { describe, it } = mocha

const expect = chai.expect
chai.use(chaiHttp)
chai.use(dirtyChai)

let mid = null
const initMidgar = async () => {
  mid = new Midgar()
  await mid.start(path.join(__dirname, 'fixtures/config'))
  return mid
}

/**
 * Test the service plugin
 */
describe('Controller', function () {
  beforeEach(async () => {
    mid = await initMidgar()
  })

  afterEach(async () => {
    // mid.pm.getPlugin('@midgar/service').plugins = {}
    await mid.stop()
    mid = null
  })

  /**
   * Test if the plugin is load
   */
  it('plugin', async () => {
    const plugin = mid.pm.getPlugin('@midgar/controller')
    expect(plugin).to.be.an.instanceof(ControllerPlugin, 'Plugin is not an instance of ControllerPlugin !')
  })

  /**
   * Test express routes
   */
  it('Express routes', async () => {
    const app = mid.getService('mid:express').app

    // Do get requests for test
    let res = await chai.request(app).get('/test').send()
    expect(res.body.result).to.be.equal('test-result', 'Invalide /test response !')

    res = await chai.request(app).get('/test/test-route').send()
    expect(res.body.result).to.be.equal('test-route-result', 'Invalide /test/test-route response !')

    // Test rewrite route
    res = await chai.request(app).get('/test-rewrite').send()
    expect(res.body.result).to.be.equal('test-rewrited-result', 'Invalide /test-rewrite response !')

    res = await chai.request(app).get('/otherTest').send()
    expect(res.body.result).to.be.equal('other-test-result', 'Invalide /otherTest response !')

    res = await chai.request(app).get('/otherTest/test').send()
    expect(res.body.result).to.be.equal('other-test-test-result', 'Invalide /otherTest/test response !')
  })

  /**
   * Test controller class
   */
  it('Controller', async () => {
    // Test Instance abstract controller
    expect(function () { new Controller() }).to.throw(TypeError, '@midgar/controller: Abstract class "Controller" cannot be instantiated directly.')

    const controller = new TestClassController(mid)

    // addRoutes()
    expect(function () { controller.addRoutes({}) }).to.throw(TypeError, '@midgar/controller: Invalid routes type !')

    // addRoute()
    expect(function () { controller.addRoute('str') }).to.throw(TypeError, '@midgar/controller: Invalid route type !')
    expect(function () { controller.addRoute({}) }).to.throw(Error, '@midgar/controller: Invalid route, path is not defined !')
    expect(function () { controller.addRoute({ path: null }) }).to.throw(Error, '@midgar/controller: Invalid route path type !')
    expect(function () { controller.addRoute({ path: 22 }) }).to.throw(Error, '@midgar/controller: Invalid route path type !')
    expect(function () { controller.addRoute({ path: '' }) }).to.throw(Error, '@midgar/controller: Invalid route path !')
    expect(function () { controller.addRoute({ path: 'test' }) }).to.throw(Error, 'Invalid route, action is not defined !')
    expect(function () { controller.addRoute({ path: 'test', action: {} }) }).to.throw(Error, '@midgar/controller: Invalid route action type !')

    // init()
    expect(controller.init).to.not.be.undefined('Missing init property !')
    expect(controller.init).to.be.a('function', 'Invalid init property type !')

    // allow()
    expect(controller.isAllow).to.not.be.undefined('Missing allow property !')
    expect(controller.isAllow).to.be.a('function', 'Invalid allow property type !')
    expect(await controller.isAllow()).to.be.true('Invalid allow() result !')

    // beforeCallRoute()
    expect(controller.beforeCallRoute).to.not.be.undefined('Missing beforeCallRoute property !')
    expect(controller.beforeCallRoute).to.be.a('function', 'Invalid beforeCallRoute property type !')
  })

  it('service', async () => {
    const app = mid.getService('mid:express').app
    // Do get request for test
    const res = await chai.request(app).get('/test-service-route')
      .send()

    expect(res.body.result).to.be.equal('test-service-result', 'Invalide test route response !')
  })

  it('getParam', async () => {
    const testStringValue = 'test<script type="text/javascript">alert(\'test\');</script>'
    const testObjectValue = {
      foo: 'testObject<script type="text/javascript">alert(\'test\');</script>'
    }

    const app = mid.getService('mid:express').app
    // Add a post route to test getParam function
    app.post('/posttest', function (req, res) {
      const testString = req.getParam('testString')
      const testStringClear = req.getParam('testString', false)
      const testObject = req.getParam('testObject')
      const testObjectClear = req.getParam('testObject', false)

      res.status(200).json({
        testString,
        testStringClear,
        testObject,
        testObjectClear
      })
    })

    // Do post request for test
    const chaiRes = await chai.request(app).post('/posttest')
      .type('form')
      .send({
        testString: testStringValue,
        testObject: testObjectValue
      })

    // Test response
    expect(chaiRes).have.status(200)
    expect(chaiRes.body.testString).equal(htmlEncode(testStringValue), 'Invalid testString value !')
    expect(chaiRes.body.testStringClear).equal(testStringValue, 'Invalid testStringClear value !')
    expect(chaiRes.body.testObject).to.eql({ foo: htmlEncode(testObjectValue.foo) }, 'Invalid testObject value !')
    expect(chaiRes.body.testObjectClear).to.eql(testObjectValue, 'Invalid testObjectClear value !')
  })
})
