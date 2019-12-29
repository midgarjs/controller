
import { htmlEncode } from 'htmlencode'
import { Plugin } from '@midgar/midgar'
import { asyncMap } from '@midgar/utils'
export { default as Controller } from './controller'

export const DIR_KEY = 'midgar-contoller'

/**
 * Test if func is a class
 * @param {Any} func Arg to test
 * @private
 */
function isClass (func) {
  return typeof func === 'function' &&
    /^class\s/.test(Function.prototype.toString.call(func))
}

/**
 * Midgar Controller plugin
 */
class ControllerPlugin extends Plugin {
  constructor (...args) {
    super(...args)

    /**
     * Routes dir key for plugin manager
     * @type {String}
     */
    this.dirKey = DIR_KEY
  }

  /**
   * Init plugins
   * Define controllers directory and bind event
   */
  async init () {
    // Add controllers plugin dir to plugin manager
    this.pm.addPluginDir(this.dirKey, 'controllers')

    // Bind @midgar/midgar:initHttpServer event for add route to express
    this.mid.on('@midgar/midgar:initHttpServer', () => {
      this._bindGetParm()
      return this._loadControllers()
    })
  }

  _bindGetParm () {
    /**
     * Add a function on request to get post and get parameters with html encode
     */
    this.mid.app.use((req, res, next) => {
      // Set Midgar intance on request object
      req.midgar = this
      // add method to get clean request param
      req.getParam = (key, clean = true) => {
        if (clean && req.clean && req.clean[key]) { return req.clean[key] }

        let value = null
        if (req.query[key] !== undefined) { value = req.query[key] } else if (req.body[key] !== undefined) { value = req.body[key] }

        if (value !== null && clean) {
          value = this._cleanParam(value)
          if (!req.clean) { req.clean = {} }

          req.clean[key] = value
        }

        return value
      }
      next()
    })
  }

  /**
   * Remove html from Onkect and String
   * @param {*} value
   * @private
   */
  _cleanParam (value) {
    if (typeof value === 'object') {
      const obj = {}
      const keys = Object.keys(value)
      for (const i in keys) {
        let key = keys[i]
        key = htmlEncode(key)
        obj[key] = htmlEncode(value[key])
      }
      return obj
    } else {
      return htmlEncode(value)
    }
  }

  /**
   * initHttpServer hook
   * Load plugin controller files
   * @private
   */
  async _loadControllers () {
    /**
     * beforeLoadRoute event.
     * @event @midgar/controller:beforeLoad
     */
    await this.mid.emit('@midgar/controller:beforeLoad')

    this.mid.debug('@midgar/controller: Load controllers...')

    // Import controller files
    const files = await this.mid.pm.importDir(this.dirKey, null, true)

    // List controller files
    await asyncMap(files, async file => {
      try {
        await this._loadController(file)
      } catch (error) {
        this.mid.error(error)
      }
    })

    this.mid.debug('@midgar/controller: Load controllers finish.')

    /**
     * afterLoad event.
     * @event @midgar/controller:afterLoadRoute
     */
    await this.mid.emit('@midgar/controller:afterLoad')
  }

  /**
   * Load controller file and add routes to express
   *
   * @param {Object} controllerFile Object of a file imported with pm.inportDir
   * @private
   */
  async _loadController (controllerFile) {
    // Router class
    const controllerExport = controllerFile.export

    // If constroller is a class
    if (isClass(controllerExport)) {
      await this._loadClass(controllerExport, [this.mid])
      // If constroller is an Object
    } else if (typeof controllerExport === 'object') {
      await this._loadObject(controllerFile)
    } else {
      throw new TypeError('@midgar/controller: Invalid controller Type: ' + controllerFile.path)
    }
  }

  /**
   * Load controller Object
   *
   * @param {Object} controllerFile Object of a file imported with pm.inportDir
   * @private
   */
  async _loadObject (controllerFile) {
    // Router class
    const controllerExport = controllerFile.export
    // Check controller def
    if (controllerExport.controller === undefined) { throw new Error('@midgar/controller: missing controller entry in file: ' + controllerFile.path) }
    if (!isClass(controllerExport.controller)) { throw new TypeError('@midgar/controller: invalid controller entry type in file: ' + controllerFile.path) }

    if (controllerExport.dependencies !== undefined) {
      const args = [this.mid]

      if (!Array.isArray(controllerExport.dependencies)) {
        this.mid.warn('@midgar/controller: invalid dependencies entry type in file: ' + controllerFile.path)
      } else if (controllerExport.dependencies.length) {
        for (const dependency of controllerExport.dependencies) {
          args.push(this.mid.getService(dependency))
        }
      }
      await this._loadClass(controllerExport.controller, args)
    }
  }

  /**
   * Create controller instance init it and load routes
   *
   * @param {constructor} Class Controller constructor
   * @param {Array}       args  Constructor ags
   */
  async _loadClass (Class, args) {
    // Create controller intance
    const controller = new Class(...args)

    // init controller
    await controller.init()

    // Get routes from controller
    const routes = await controller.getRoutes()
    await this._loadRoutes(routes, controller)
  }

  /**
   * Add routes to express
   *
   * @param {Array}     routes      Routes definition
   * @param {Controller} controller Controller instance
   * @private
   */
  async _loadRoutes (routes, controller) {
    // List routes
    await asyncMap(routes, async route => {
      if (!route.method) { route.method = 'get' }

      // Check route définition
      if (!route.action) {
        throw new Error('@midgar/controller: route have no action action in ' + controller.path + ' !')
      }

      if (!route.path) {
        throw new Error('@midgar/controller: route have no action action in ' + controller.path + ' !')
      }

      if (!controller[route.action]) {
        throw new Error('@midgar/controller: route action (' + route.action + ') not exist for route ' + route.path + ' !')
      }

      // Bind router instance on method
      // controller.action = controller[route.action].bind(controller)

      await this._addRoute(route, controller)
    })
  }

  /**
   * Add route to express
   *
   * @param {Object}     route      Route definition
   * @param {Controller} controller Controller instance
   * @private
   */
  async _addRoute (route, controller) {
    let routePath = null
    // If router have prefix had it to the path
    if (controller.prefix) {
      routePath = controller.prefix + route.path
    } else {
      routePath = route.path
    }

    this.mid.debug('@midgar/controller: add route ' + routePath + '.')
    // Decalare the route to express
    // Route.type = get | post ...
    this.mid.app[route.method](routePath, async (req, res, next) => {
      this.mid.debug('@midgar/controller: route ' + routePath + ' middleware')
      route.isAllow = true
      /**
       * beforeCallRoute event.
       * @event @midgar/controller:beforeCallRoute
       */
      await this.mid.emit('@midgar/controller:beforeCallRoute', { route, req, res, controller, next })

      // Before exec route
      await controller.beforeCallRoute(route, req, res)

      try {
        const isAllow = await controller.isAllow(req, res)
        // If can call the route method
        if (isAllow) {
          this.mid.debug('@midgar/controller: Call route ' + routePath)
          // Exec action
          await controller[route.action](req, res, next)
        } else {
          this.mid.debug('@midgar/controller: not allowed route')
          this.mid.debug(route)
        }
      } catch (error) {
        this._error(error, res, route, next)
      }
    })
  }

  /**
   * Default error handler
   * @param {*} error
   * @param {*} res
   * @param {*} route
   * @param {*} next
   * @private
   */
  _error (error, res, route, next) {
    this.mid.error('@midgar/controller: error in route ' + route.path)
    this.mid.error(error)
    next(error)
  }
}

export default ControllerPlugin
