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
    if (this.constructor === Controller) throw new TypeError('@midgar/controller: Abstract class "Controller" cannot be instantiated directly')

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
  async init () {

  }

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

  _checkRoute (route) {
    if (typeof route !== 'object') throw new TypeError('@midgar/controller: Invalid routes type !')
    if (route.path === undefined) throw new Error('@midgar/controller: Invalid route, path is not defined !')
    if (route.method !== undefined && !this._methods.includes(route.method)) throw new Error('@midgar/controller: Invalid route method !')
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
