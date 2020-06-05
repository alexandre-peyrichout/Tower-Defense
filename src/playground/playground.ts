// Bonjour ! Si vous ne connaissez pas la syntaxe "yield* xxx", imaginez que se
// sont des "await". Dans notre cas pratique cela fonctionne de la même manière.
// test 4 working

import {
  /**
   * Function pour récupérer une ligne d'input.
   * Comme c'est un générateur, on l'appelle de la manière suivante:
   *
   * const line = yield* readLine();
   * console.log(line); // affiche le texte
   */
  readLine,

  /**
   * Function qui permet de passer son tour.
   * Cela veut dire que pour ce tour on décide de ne tirer sur personne.
   *
   * C'est également un générateur, on l'utilise de cette manière:
   *
   * yield* wait();
   */
  wait,

  /**
   * Function qui permet de tirer sur une cible.
   * Pour se faire, on lui envoie l'id de l'ennemi en paramètre.
   *
   * Exemple:
   *
   * yield* shotTarget('terminator');
   */
  shotTarget
} from "./utils";

/**
 * Fonction qui est lancé à chaque lancement de partie.
 */
export default function* playground() {

  // Lecture des données de base du jeu :
  const baseData: string = yield* readLine(); // "<base latitude> <base longitude> <base attack range> <base energy>"

  // INIT - Création de l'objet BASE :
  const base = {
    y: +baseData.split(" ")[0],       // latitude (y)
    x: +baseData.split(" ")[1],       // longitude (x)
    range: +baseData.split(" ")[2], 
    energy: +baseData.split(" ")[3],
  }

  const nbActors = yield* readLine(); // "<nb actors>"
  // INIT - Création d'une liste vide pour y stocker nos objets Actors :
  let actorsList = []


  // @ts-ignore TODO possible de corriger l'erreur sur la ligne suivante ?
  for (let i = 0; i < Number(nbActors); ++i) {
    const actor = yield* readLine(); // "<actor id> <actor type (robot|rabbit)> <actor speed (km/h)>"

    // Création de l'objet ACTOR de cette itération et on le place dans notre liste (actorList) :
    actorsList.push(
      {
        id: actor.split(" ")[0],
        type: actor.split(" ")[1],
        speed: +actor.split(" ")[2],
        x: null,
        y: null,
        alive: true
      }
    )
  }

  // Création d'un compteur de tour :
  let turn = 0

  // *************** Fin de L'INITIALISATION *****************

  // Code exécuté à chaque tour
  while (true) {

    // On incrémente le tour de 1
    turn++

    // On initialise la cible à null ou l'on supprime la cible précédente si il y a :
    let nextTarget = null

    // A chaque tour, on récupère les mises à jour de chaque entités (statut
    // vivant ou mort, nouvelle position, ...)
    // @ts-ignore TODO possible de corriger l'erreur sur la ligne suivante ?
    for (let i = 0; i < Number(nbActors); ++i) {
      const actor = yield* readLine(); // "<actor id> <actor status (alive|dead)> <actor latitude> <actor longitude>"

      // on récupère l'id de l'actor pour savoir qui on met à jour :
      const actorId = actor.split(" ")[0]

      // on boucle sur notre liste (actorList) pour trouver l'actor et on le met à jour :
      actorsList.forEach((a, index) => {
        if (a.id === actorId) {
          actorsList[index] = {
            ...a, 
            alive: actor.split(" ")[1] === "alive" ? true : false,
            y: +actor.split(" ")[2],
            x: +actor.split(" ")[3]
          }
        }
      })
    }

    // Après avoir reçu les mises à jour, on doit effectuer une (ET UNE SEULE) action:
    // - `yield* wait()` : On ne fait rien (on passe notre tour)
    // - `yield* shotTarget('nemo');` : On décide de tirer sur l'entité qui a l'id "nemo"
    // yield* wait();
    console.log("::::::::::::::")
    console.log(turn)
    console.log("::::::::::::::")
    console.log(actorsList)


    // Création de la logique pour définir la cible idéale lors de ce tour :
    actorsList.forEach(a=>{
      if (a.type === "robot" && a.alive === true)
      return nextTarget = a.id
    })

    // Si une cible est sélectionnée, on l'éxecute, Sinon, on passe au prochain tour :
    nextTarget ? yield* shotTarget(nextTarget): yield* wait()

  }
}
