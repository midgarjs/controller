/**
 * @typedef {Object} Route
 * @property {string|RegExp|Array} path   Express route path
 * @property {string}              method Http method
 * @property {function}            action Route callback
 */

/**
 * Controller Class
 * @class
 * @abstract
 */
class Controller {
  /**
   * @param {Midgar} mid Midgar instance
   */
  constructor (mid) {
    if (this.constructor === Controller) throw new TypeError('@midgar/controller: Abstract class "Controller" cannot be instantiated directly.')

    /**
     * Midgar instance
     * @type {Midgar}
     */
    this.mid = mid

    /**
     * Routes prefix
     * @type {String|null}
     */
    this.prefix = null

    /**
     * Routes array
     * @type {Array}
     */
    this.routes = []

    this._methods = ['get', 'post', 'all']
  }

  /**
   * Init hook
   */
  async init () {}

  getRoutes () {
    return this.routes
  }

  addRoutes (routes) {
    if (!Array.isArray(routes)) throw new TypeError('@midgar/controller: Invalid routes type !')
    for (const route of routes) {
      try {
        this._checkRoute(route)
        this.routes.push(route)
      } catch (error) {
        this.mid.error(error)
        this.mid.debug(route)
      }
    }
  }

  addRoute (route) {
    this._checkRoute(route)
    this.routes.push(route)
  }

  /**
   * Check route object
   *
   * @param {Route} route Route object
   * @private
   */
  _checkRoute (route) {
    if (typeof route !== 'object') throw new TypeError('@midgar/controller: Invalid route type !')
    // Check path
    if (route.path === undefined) throw new Error('@midgar/controller: Invalid route, path is not defined !')
    if (typeof route.path !== 'string' && !(route.path instanceof RegExp) &&
      !Array.isArray(route.path)) throw new Error('@midgar/controller: Invalid route path type !')

    if (!route.path) throw new Error('@midgar/controller: Invalid route path !')

    // Check method
    if (route.method !== undefined && !this._methods.includes(route.method)) throw new Error('@midgar/controller: Invalid route method !')

    // check action
    if (route.action === undefined) throw new Error('@midgar/controller: Invalid route, action is not defined !')
    if (typeof route.action !== 'function') throw new Error('@midgar/controller: Invalid route action type !')
  }

  /**
   * Return if the routes in controller are allowed
   * Used for check route permission
   * @return {boolean}
   */
  async isAllow () {
    return true
  }

  /**
   * Before call route hook
   * @param {*} route
   * @param {Request}  req Express request object
   * @param {Response} res Express responde object
   */
  async beforeCallRoute (route, req, res) {}
}

export default Controller
