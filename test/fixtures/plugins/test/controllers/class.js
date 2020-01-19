import { Controller } from '../../../../../src/index' 

export default class TestClassController extends Controller {
  async init () {
    this.prefix = '/test/'
    this.addRoutes([
      {
        path: '/',
        action: (...args) => this.test(...args)
      },
      {
        path: '/test-route/',
        action: (...args) => this.testRoute(...args)
      }
    ])
  }

  test (req, res) {
    res.send({ result: 'test-result' })
  }

  testRoute (req, res) {
    res.send({ result: 'test-route-result' })
  }
}
