import { Controller } from '../../../../../src/index' 

export default class TestOtherClassController extends Controller {
  async init () {
    this.prefix = 'otherTest'
    this.addRoutes([
      {
        path: '/',
        action: (...args) => this.test(...args)
      },
      {
        path: 'test',
        action: (...args) => this.testRoute(...args)
      }
    ])
  }

  test (req, res) {
    res.send({ result: 'other-test-result' })
  }

  testRoute (req, res) {
    res.send({ result: 'other-test-test-result' })
  }
}
