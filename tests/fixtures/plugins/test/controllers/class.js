import { Controller } from '../../../../../src/index' 

export default class TestClassController extends Controller {
  async getRoutes() {
    return [
      {
        path: '/test-route',
        action: 'test'
      }
    ]
  }

  test(req, res) {
    res.send({result:'test-route-response'})
  }
}