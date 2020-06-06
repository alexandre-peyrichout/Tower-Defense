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
    range: +baseData.split(" ")[2] / 100000, // Conversion pour s'ajuster aux valeurs de longitude / latitude
    energy: +baseData.split(" ")[3],
  }

  const nbActors = yield* readLine(); // "<nb actors>"
  // INIT - Création d'une liste vide pour y stocker nos objets Actors :
  const actorsList = []


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

  // INIT - Création de la fonction qui permet de définir si le robot est dans la zone de tir :
  const isInRange = (actor_x: number, actor_y: number) => {
    if ((actor_x - base.x) * (actor_x - base.x) +
      (actor_y - base.y) * (actor_y - base.y) <= base.range * base.range) {
      return true
    }
    else {
      return false
    }
  }

  // INIT - Création de la fonction qui calcule la distance entre l'actor et la base :
  const distanceFromBase = (actor_x: number, actor_y: number) => {
    const a = actor_x - actor_y;
    const b = base.x - base.y;
    const distance = Math.sqrt(a * a + b * b);
    return distance
  }

  // INIT - Création de la fonction qui, parmi une liste, retourne l'objet dont la propriété "distance" est la plus faible:
  const getClosestTarget = (possibleTargets: Array<any>) => {

    let minIndex: number = 0;
    let minValue: number;

    possibleTargets.forEach((target, index) => {
      if (index === 0) {
        minIndex = index
        minValue = target.distance
      } else if (target.distance < minValue) {
        minValue = target.distance
        minIndex = index
      }
    }
    )
    return possibleTargets[minIndex]
  }
  // DEBUG - infos :
  console.debug("DEBUT DE PARTIE")
  console.debug(`initialisation de ${actorsList.length} acteurs`)
  actorsList.forEach((actor, index) => {
    console.debug(`n° ${index + 1}: ${actor.id} | ${actor.type === "robot" ? "robot" : "lapin"} | ${actor.speed} km/h`)
  })
  // *************** Fin de L'INITIALISATION *****************

  // RUN - Code exécuté à chaque tour
  while (true) {

    // RUN - On incrémente le tour de 1 :
    turn++
    console.debug("Energie disponible", base.energy)

    // RUN - Création d'une liste temporaire vide pour y stocker nos cibles potentielles (objets) :
    const possibleTargets: Array<any> = []

    // RUN - Initialisation de la cible sélectionnée à vide en début de tour :
    let selectedTarget = null

    // A chaque tour, on récupère les mises à jour de chaque entités (statut
    // vivant ou mort, nouvelle position, ...)
    // @ts-ignore TODO possible de corriger l'erreur sur la ligne suivante ? Conversion de type pour itérer avec "+".
    for (let i = 0; i < +nbActors; ++i) {
      const actor = yield* readLine(); // "<actor id> <actor status (alive|dead)> <actor latitude> <actor longitude>"

      // RUN - on récupère l'id de l'actor pour savoir qui on met à jour :
      const currentId = actor.split(" ")[0]
      // RUN - on stock les autres infos de manière lisible :
      const isStillAlive = actor.split(" ")[1] === "alive" ? true : false
      const currentY = +actor.split(" ")[2]
      const currentX = +actor.split(" ")[3]
      const canBeShot = isInRange(currentX, currentY)

      // RUN - on cherche l'acteur dans notre liste initiale :
      const currentActor = actorsList.find(actor => actor.id === currentId)
      // On vérifie si il remplit les conditions pour être une cible :
      if (currentActor && currentActor.type === "robot" && isStillAlive && canBeShot) {
        // on envoie l'objet mis à jour au complet dans la liste des cibles potentielles
        possibleTargets.push({
          ...currentActor,
          y: currentY,
          x: currentX,
          distance: distanceFromBase(currentX, currentY)
        })
      }
    }

    // Après avoir reçu les mises à jour, on doit effectuer une (ET UNE SEULE) action:
    // - `yield* wait()` : On ne fait rien (on passe notre tour)
    // - `yield* shotTarget('nemo');` : On décide de tirer sur l'entité qui a l'id "nemo"

    // On cherche la cible la plus proche de la base parmi les cibles potentielles et on la sélectionne :
    selectedTarget = getClosestTarget(possibleTargets)

    // DEBUG - infos:
    console.debug(`cibles potentielles du tour n° ${turn}`, possibleTargets)

    // Si une cible est sélectionnée, on l'éxecute, Sinon, on passe au prochain tour :
    if (selectedTarget && turn > 1) {
      console.debug(`victime au tour n° ${turn} >>>>>`, selectedTarget.id, "<<<<<")
      yield* shotTarget(selectedTarget.id)
      base.energy--
    } else {
      yield* wait()
    }
  }
}
