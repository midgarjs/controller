/** @module Controller */

/**
 * Controller Class
 * @abstract
 */
export default class Controller {

  /**
   * @param {Midgar} mid Midgar instance
   */
	constructor (mid) {
    if (this.constructor === Controller) throw new TypeError('Abstract class "Controller" cannot be instantiated directly')

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
  }

  /**
   * Init hook
   */
  async init () {}
  
  /**
   * Return route definitions
   * @return {Array}
   */
  async getRoutes () {
    return []
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
}
