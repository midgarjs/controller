
import { htmlEncode } from 'htmlencode'
import { Plugin } from '@midgar/midgar'
import { asyncMap } from '@midgar/utils'
export { default as Controller } from './controller'

export const MODULE_TYPE_KEY = 'midgar-controller'

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
 * Controller plugin class
 */
class ControllerPlugin extends Plugin {
  constructor (...args) {
    super(...args)

    /**
     * Controllers module type key
     * @type {string}
     */
    this.moduleTypeKey = MODULE_TYPE_KEY

    /**
     * Express app
     * @type {Express|null}
     */
    this.app = null
  }

  /**
   * Init plugins
   * Define controllers directory and bind event
   */
  async init () {
    // Add controller module type to plugin manager
    this.pm.addModuleType(this.moduleTypeKey, 'controllers')

    // Bind @midgar/express:afterInit event for add route to express
    this.mid.on('@midgar/express:afterInit', (expressService) => {
      this.app = expressService.app

      this._bindGetParm()
      return this._loadControllers()
    })
  }

  /**
   * Add a midlleware to set getParam method to request object
   * @private
   */
  _bindGetParm () {
    /**
     * Add a function on request to get post and get parameters with html encode
     */
    this.app.use((req, res, next) => {
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
   * @param {any} value
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
   * Import controller modules and add routes to express
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
    const files = await this.mid.pm.importModules(this.moduleTypeKey)

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
   * Load controller module file and add routes to express
   *
   * @param {object} controllerFile Object of a file imported with pm.inportDir
   * @private
   */
  async _loadController (controllerFile) {
    // Router class
    const controllerModule = controllerFile.export

    // If constroller is a class
    if (isClass(controllerModule)) {
      await this._loadClass(controllerModule, [this.mid])
      // If constroller is an Object
    } else if (typeof controllerModule === 'object') {
      await this._loadObject(controllerFile)
    } else {
      throw new TypeError(`@midgar/controller: Invalid controller module type in module:  ${controllerFile.path} !`)
    }
  }

  /**
   * Load controller controller module Object
   *
   * @param {object} controllerFile Object of a file imported with pm.inportDir
   * @private
   */
  async _loadObject (controllerFile) {
    // Router class
    const controllerModule = controllerFile.export
    // Check controller def
    if (controllerModule.controller === undefined) throw new Error(`@midgar/controller: missing controller entry in module:  ${controllerFile.path} !`)
    if (!isClass(controllerModule.controller)) throw new TypeError(`@midgar/controller: invalid controller entry type in module: ${controllerFile.path} !`)

    if (controllerModule.dependencies !== undefined) {
      const args = [this.mid]

      if (!Array.isArray(controllerModule.dependencies)) {
        this.mid.warn(`@midgar/controller: invalid dependencies entry type in module: ${controllerFile.path} !`)
      } else if (controllerModule.dependencies.length) {
        for (const dependency of controllerModule.dependencies) {
          args.push(this.mid.getService(dependency))
        }
      }
      await this._loadClass(controllerModule.controller, args)
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
    if (controller.prefix && controller.prefix === '/') throw new Error(`@midgar/controller: Invalid controller prefix value in module: ${controller.path} !`)

    // List routes
    await asyncMap(routes, async route => {
      if (!route.method) { route.method = 'get' }

      // Check route définition
      if (!route.action) throw new Error(`@midgar/controller: Route have no action in module: ${controller.path} !`)
      if (!route.path) throw new Error(`@midgar/controller: Route have no path in module: ${controller.path} !`)

      await this._addRoute(route, controller)
    })
  }

  /**
   * Add route to express
   *
   * @param {object}     route      Route definition
   * @param {Controller} controller Controller instance
   * @private
   */
  async _addRoute (route, controller) {
    // Force / at first char
    let routePath = route.path.charAt(0) !== '/' ? '/' + route.path : route.path
    // remove last / or empty if routePath === '/'
    if (routePath.charAt(routePath.length - 1) === '/') routePath = routePath.slice(0, -1)
    // If controller have prefix had it to the path
    if (controller.prefix) {
      let prefix = controller.prefix

      // Force / at first char
      if (prefix.charAt(0) !== '/') prefix = '/' + prefix

      // remove last /
      if (prefix.charAt(prefix.length - 1) === '/') prefix = prefix.slice(0, -1)
      routePath = prefix + routePath
    }

    this.mid.debug('@midgar/controller: add route ' + routePath + '.')
    // Decalare the route to express
    // Route.type = get | post ...
    this.app[route.method](routePath, async (req, res, next) => {
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
          await route.action(req, res, next)
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
