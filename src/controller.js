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

    // Set routes from class methods name
    this._processPropertiesRoutes()

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
   * @return {Boolean}
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

  /**
   * Set routes from class methods name
   * @private
   */
  _processPropertiesRoutes () {
    for (const propertyName of this._getPropertyNames()) {
      // const match = (/^((?:(?!Post).)*)(Post)?Route$/i).exec(propertyName)

      // Check if property end by Route
      const match = (/^(.*)Route$/i).exec(propertyName)
      if (!match) continue

      let method = 'get'
      if (!match[1]) throw new Error('regex not ok')
      let path = match[1]

      // Check if route path end by Post|Get|All
      const matchMethod = (/^(.*)(Post|Get|All)$/i).exec(path)
      if (matchMethod) {
        path = matchMethod[1]
        method = matchMethod[2].toLocaleLowerCase()
      }

      this.routes.push({
        method,
        path,
        action: (...args) => {
          return this[propertyName](...args)
        }
      })
    }
  }

  /**
   * Return all object properties name
   */
  _getPropertyNames () {
    const methods = new Set()
    let obj = this
    while ((obj = Reflect.getPrototypeOf(obj))) {
      const keys = Reflect.ownKeys(obj)
      keys.forEach((k) => methods.add(k))
    }
    return methods
  }
}

export default Controller
