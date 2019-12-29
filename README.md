![](https://ci.midgar.io/app/rest/builds/buildType:(id:Midgar_Controller_Build)/statusIcon) [![Coverage](https://sonar.midgar.io/api/project_badges/measure?project=Midgar_Controller&metric=coverage)](https://sonar.midgar.io/dashboard?id=Midgar_Controller)

## @midgar/controller

Plugin [Midgar](https://www.npmjs.com/package/@midgar/midgar) pour la gestion des controllers

## Installation

```sh
$ npm i @midgar/controller --save
```

Si tout c'est bien passé, un message de confirmation apparet:
```
#midgar-cli
@midgar/controller added to plugins.js !
```

## Fonctionnement
Ce plugin ajoute un dossier de plugin midgar-controllers: ./controllers/
Il suffie d'ajouter un controller dans le dossier ./controller de votre plugin et il est automatiquement chargé au lancement de l'application.

## Structure d'un controller

```js
import { Controller } from '@midgar/controller' 

 // Export 
export default {
  // Tableau de service a injécter
  // @see: https://www.npmjs.com/package/@midgar/service
  dependencies: [
    'midgar:user'
  ],
  // Class du contoller
  controller: class userController extends Controller {
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
}
```
