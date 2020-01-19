[![Build Status](https://drone.midgar.io/api/badges/Midgar/controller/status.svg)](https://drone.midgar.io/Midgar/controller)
[![Coverage](https://sonar.midgar.io/api/project_badges/measure?project=midgar-controller&metric=coverage)](https://sonar.midgar.io/dashboard?id=midgar-controller)


## @midgar/controller

Plugin [Midgar](https://github.com/midgarjs/midgar) pour la gestion des controllers

## Installation

```sh
$ npm i @midgar/controller
```

Si tout s'est bien passé, un message de confirmation s'affiche:
```sh
#midgar-cli
@midgar/controller added to plugins.json !
```

## Fonctionnement
Ce plugin ajoute un type de module **midgar-controller** dans le dossier ./controllers/

Il suffit d'ajouter un controller dans le dossier ./controllers de votre plugin pour qu'il soit automatiquement importé au lancement de l'application et injecté dans express.

## Exemple de controller

```js
import { Controller } from '@midgar/controller' 

// Tableau de service a injécter
// @see: https://github.com/midgarjs/service
const dependencies = [
  'midgar:user'
]

class UserController extends Controller {
  // Les dépendances sont injécté dans le contructeur
  constructor (mid, userService) {
    super(mid)
    this.prefix = 'user'
    this.userService = userService
  }

  /**
   * Cette méthod est appelé automatiquement
   * lors de l'instanciation du controller.
   */
  init () {
    this.addRoutes([
      {
        path: 'login',
        action: (...args) => this.login(...args)
      },      
      {
        method: 'post',
        path: 'login',
        action: (...args) => this.loginPost(...args)
      },
      {
        path: 'register',
        action: (...args) => this.register(...args)
      },
      {
        path: '/',
        action: (...args) => this.users(...args)
      }
    ])
  }

  // GET /user/login route
  async login (req, res) {
    if (await this.userService.login(req.getParam('login'), req.getParam('password', false))) {
      res.send({ success: true })
    } else {
      res.send({ success: false })
    }
  }

  // POST /user/login route
  loginPost (req, res) {}
  
  // GET /user/register route
  register (req, res) {}

  // GET /user route
  user (req, res) {}
}

export default {
  dependencies
  controller: UserController
}
```
Les methodes terminant par Route, GetRoute, PostRoute, AllRoute sont automatiquement transformer en routes.