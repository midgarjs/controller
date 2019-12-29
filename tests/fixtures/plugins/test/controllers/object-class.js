import { Controller } from '../../../../../src/index' 


export default {
  dependencies: [
    'test'
  ],
  controller: class TestObjectController extends Controller {
    constructor (mid, testService) {
      super(mid)
      this.testService = testService
    }

    async getRoutes() {
      return [
        {
          path: '/test-service-route',
          action: 'test'
        }
      ]
    }
  
    test(req, res) {
      res.send({ result: this.testService.getResult() })
    }
  }
}