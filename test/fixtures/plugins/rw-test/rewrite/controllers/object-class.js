import { TestObjectController } from '../../../test/controllers/object-class'

export default {
  dependencies: [
    'test:test'
  ],
  controller: class TestObjectRwController extends TestObjectController {
    testRewrite (req, res) {
      res.send({ result: 'test-rewrited-result' })
    }
  }
}
