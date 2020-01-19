import mocha from 'mocha'
import chai from 'chai'
import chaiHttp from 'chai-http'
import dirtyChai from 'dirty-chai'
import path from 'path'
import { htmlEncode } from 'htmlencode'
import ControllerPlugin from '../src/index'

/**
 * @type {Midgar}
 */
import Midgar from '@midgar/midgar'

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
   * Test if the plugin id load
   */
  it('plugin is load', async () => {
    const plugin = mid.pm.getPlugin('@midgar/controller')
    expect(plugin).to.be.an.instanceof(ControllerPlugin, 'Plugin is not an instance of ControllerPlugin !')
  })

  it('controllers', async () => {
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
