[![Build Status](https://drone.midgar.io/api/badges/Midgar/controller/status.svg)](https://drone.midgar.io/Midgar/controller)
[![Coverage](https://sonar.midgar.io/api/project_badges/measure?project=Midgar%3Acontroller&metric=coverage)](https://sonar.midgar.io/dashboard?id=Midgar%3Acontroller)


## @midgar/controller

Plugin [Midgar](https://github.com/midgarjs/midgar) pour la gestion des controllers

## Installation

```sh
$ npm i @midgar/controller --save
```

Si tout s'est bien passé, un message de confirmation s'affiche:
```sh
#midgar-cli
@midgar/controller added to plugins.js !
```

## Fonctionnement
Ce plugin ajoute un dossier de plugin **midgar-controllers**: ./controllers/

Il suffit d'ajouter un controller dans le dossier ./controller de votre plugin et il est automatiquement chargé au lancement de l'application.

## Exemple de controller

```js
import { Controller } from '@midgar/controller' 

// Tableau de service a injécter
// @see: https://www.npmjs.com/package/@midgar/service
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
   * Cette method rencoi un tableau contenant les routes
   * @protected
   */
  getRoutes() {
    return [
      // Route /user/login
      {
        path: '/login',
        action: 'login'
      },
      
      // Route /user/register
      {
        type: 'post' // si le type n'est pas specifié, get est utilisé
        path: '/register',
        action: 'register'
      }
    ]
  }

  /**
   * Login action 
   */
  login (req, res) {
    /**
     * La fonction getParm est ajout a l'object Request d'express
     * Cette fonction nétoie les paramète post et get d'eventuel code html
     * en appliquant un htmencode
     */
    if (this.userService.login(req.getParam('login'), req.getParam('password', false))) {
      res.send({ success: true })
    } else {
      res.send({ success: false })
    }
  }

  /**
   * Register action 
   */
  register (req, res) {
    res.send({ success: true })
  }
}

export default {
  dependencies
  controller: UserController
}
```
