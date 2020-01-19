export default {
  rewrite: {
    modules: {
      'midgar-controller': {
        test: {
          'object-class.js': './rewrite/controllers/object-class.js'
        }
      }
    }
  }
}
