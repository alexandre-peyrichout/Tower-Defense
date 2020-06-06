// Bonjour ! Si vous ne connaissez pas la syntaxe "yield* xxx", imaginez que ce
// sont des "await". Dans notre cas pratique cela fonctionne de la même manière.

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
    range: +baseData.split(" ")[2] / 100000, // Conversion pour s'ajuster aux valeurs de longitude / latitude
    energy: +baseData.split(" ")[3],
  }

  const nbActors = yield* readLine(); // "<nb actors>"
  // INIT - Création d'une liste vide pour y stocker nos objets Actors :
  const actorsList: Array<any> = []


  // @ts-ignore TODO possible de corriger l'erreur sur la ligne suivante ? Conversion de type pour itérer avec "+".
  for (let i = 0; i < +nbActors; ++i) {
    const actor = yield* readLine(); // "<actor id> <actor type (robot|rabbit)> <actor speed (km/h)>"

    // INIT - Création de l'objet ACTOR de cette itération et on le place dans notre liste (actorList) :
    actorsList.push({
      id: actor.split(" ")[0],
      type: actor.split(" ")[1],
      speed: +actor.split(" ")[2]
    })
  }

  // INIT - Création d'un compteur de tour :
  let turn = 0

  // INIT - Création de la fonction qui permet de définir si l'actor est dans la zone de tir :
  // based on: https://www.geeksforgeeks.org/find-if-a-point-lies-inside-or-on-circle/
  const isInRange = (actor_x: number, actor_y: number) => {
    if ((actor_x - base.x) * (actor_x - base.x) +
      (actor_y - base.y) * (actor_y - base.y) <= base.range * base.range) {
      return true
    }
    else {
      return false
    }
  }

  // INIT - Création de la fonction qui calcule la distance entre l'actor et la base - théorème de Pythagore :
  const distanceFromBase = (actor_x: number, actor_y: number) => {
    const a = actor_x - actor_y;
    const b = base.x - base.y;
    return Math.sqrt(a * a + b * b);
  }

  // INIT - Création de la fonction qui, parmi une liste, retourne l'objet dont la propriété "ETA" (Estimated Time of Approach) est la plus faible:
  const getPriorityTarget = (possibleTargets: Array<any>) => {

    let minIndex: number = 0;
    let minValue: number;

    possibleTargets.forEach((target, index) => {
      if (index === 0) {
        minIndex = index
        minValue = target.ETA
      } else if (target.distance < minValue) {
        minValue = target.ETA
        minIndex = index
      }
    }
    )
    return possibleTargets[minIndex]
  }
  // INIT - Création de la fonction de dispatch pour gérer l'identification, la mise à jour et le transfert d'un actor dans la liste des cibles potentielles :
  const dispatch = (actor: string, possibleTargets: Array<any>) => {
    // on récupère l'id de l'actor pour savoir qui on met à jour :
    const currentId = actor.split(" ")[0]
    // on stock les autres infos de manière lisible :
    const isStillAlive = actor.split(" ")[1] === "alive" ? true : false
    const currentY = +actor.split(" ")[2]
    const currentX = +actor.split(" ")[3]
    const canBeShot = isInRange(currentX, currentY)

    // on cherche l'acteur dans notre liste initiale :
    const currentActor = actorsList.find(actor => actor.id === currentId)
    // on vérifie si il remplit les conditions pour être une cible :
    if (currentActor && currentActor.type === "robot" && isStillAlive && canBeShot) {
      // on calcule sa distance et son ETA jusqu'à la base:
      const computedDistance = distanceFromBase(currentX,currentY)
      const computedETA = currentActor.speed / computedDistance
      // on envoie l'objet mis à jour au complet dans la liste des cibles potentielles
      possibleTargets.push({
        ...currentActor,
        y: currentY,
        x: currentX,
        distance: computedDistance,
        ETA: computedETA
      })
    }
  }


  // DEBUG - infos :
  console.debug("DEBUT DE PARTIE")
  console.debug(`initialisation de ${actorsList.length} acteurs`)
  actorsList.forEach((actor, index) => {
    console.debug(`actor n°${index + 1} : ${actor.id} | ${actor.type === "robot" ? "robot" : "lapin"} | ${actor.speed} km/h`)
  })

  // RUN - Code exécuté à chaque tour
  while (true) {

    // RUN - Initialisation de la cible sélectionnée à vide en début de tour :
    let selectedTarget = null
    
    // RUN - Création d'une liste temporaire vide pour y stocker nos cibles potentielles (objets) :
    const possibleTargets: Array<any> = []
    
    // DEBUG - infos:
    turn++
    console.debug(`tour [ ${turn} ] : Energie disponible`, base.energy)

    // A chaque tour, on récupère les mises à jour de chaque entités (statut
    // vivant ou mort, nouvelle position, ...)
    // @ts-ignore TODO possible de corriger l'erreur sur la ligne suivante ? Conversion de type pour itérer avec "+".
    for (let i = 0; i < +nbActors; ++i) {
      const actor = yield* readLine(); // "<actor id> <actor status (alive|dead)> <actor latitude> <actor longitude>"

      // RUN - Pour chaque ligne "actor", on envoie le résultat de la lecture dans le dispatch :
      dispatch(actor, possibleTargets)
    }

    // Après avoir reçu les mises à jour, on doit effectuer une (ET UNE SEULE) action:
    // - `yield* wait()` : On ne fait rien (on passe notre tour)
    // - `yield* shotTarget('nemo');` : On décide de tirer sur l'entité qui a l'id "nemo"

    // RUN - On cherche la cible qui est capable de nous tuer le plus rapidement parmi les cibles potentielles et on la sélectionne :
    selectedTarget = getPriorityTarget(possibleTargets)

    // DEBUG - infos:
    possibleTargets.length ?
      console.debug(`tour [ ${turn} ] : `, possibleTargets.length, `cible${possibleTargets.length > 1 ? "s" : ""} potentielle${possibleTargets.length > 1 ? "s" : ""}`, possibleTargets) :
      console.debug(`tour [ ${turn} ] : Standby`)

    // Si une cible est sélectionnée, on l'éxecute, Sinon, on passe au prochain tour :
    if (selectedTarget && turn > 0) {
      yield* shotTarget(selectedTarget.id)
      base.energy--
      console.debug(`tour [ ${turn} ] : ${selectedTarget.id.toUpperCase()} has been killed`)
    } else {
      yield* wait()
    }
  }
}
