import { TestObjectController } from '../../../test/controllers/object-class'

export default {
  dependencies: [
    'test:test'
  ],
  controller: class TestObjectRwController extends TestObjectController {
    testrewriteRoute (req, res) {
      res.send({ result: 'testrewrite-rw-result' })
    }

    newrewriteRoute (req, res) {
      res.send({ result: 'newrewrite-result' })
    }
  }
}
