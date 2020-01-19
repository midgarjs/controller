import { Controller } from '../../../../../src/index'
class TestObjectController extends Controller {
  constructor (mid, testService) {
    super(mid)
    this.testService = testService
  }

  async init () {
    this.addRoutes([{
      path: '/test-service-route',
      action: (...args) => this.test(...args)
    },
    {
      path: '/test-rewrite',
      action: (...args) => this.testRewrite(...args)
    }])
  }

  test (req, res) {
    res.send({ result: this.testService.getResult() })
  }

  testRewrite (req, res) {
    res.send({ result: 'test-rewrite-result' })
  }
}

export default {
  dependencies: [
    'test:test'
  ],
  controller: TestObjectController
}

export { TestObjectController }
