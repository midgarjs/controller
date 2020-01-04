import { Controller } from '../../../../../src/index' 

export default class TestClassController extends Controller {
  async init () {
    this.addRoutes([
      {
        path: '/test-route',
        action: (...args) => this.test(...args)
      }
    ])
  }

  test (req, res) {
    res.send({ result: 'test-route-response' })
  }
}
