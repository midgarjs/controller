import { Controller } from '../../../../../src/index'
class TestObjectController extends Controller {
  constructor (mid, testService) {
    super(mid)
    this.testService = testService
  }

  async init () {
    this.addRoute({
      path: '/test-service-route',
      action: (...args) => this.test(...args)
    })
  }

  test (req, res) {
    res.send({ result: this.testService.getResult() })
  }

  testrouteRoute (req, res) {
    res.send({ result: 'testroute-result' })
  }

  createTestPostRoute (req, res) {
    res.send({ result: 'createTest-result' })
  }

  testPostRoutePostRoute (req, res) {
    res.send({ result: 'testPostRoute-result' })
  }

  testrewriteRoute (req, res) {
    res.send({ result: 'testrewrite-result' })
  }
}

export default {
  dependencies: [
    'test:test'
  ],
  controller: TestObjectController
}

export { TestObjectController }
