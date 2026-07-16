# SVG espagnols de la section Technology

## Objectif

Produire trois SVG prêts à coller dans la version espagnole de la section
Technology de la home, sans modifier la version anglaise ni déformer le
nouveau dessin « Más de 360 máquinas ».

## Géométrie de référence

- Canevas extérieur : `598 × 206`.
- Cadre : `8` unités sur chaque côté.
- Zone intérieure : `582 × 190`, de `(8, 8)` à `(590, 198)`.
- Le tracé fourni reste inchangé : aucune mise à l'échelle non proportionnelle
  ni reconstruction typographique.

## Fichiers produits

1. `technology-es-visible.svg`
   - lettres seules ;
   - fond transparent ;
   - couleur pilotée par `currentColor` ;
   - aucun cadre.
2. `technology-es-cover.svg`
   - rectangle intérieur gris `#E0E0E0` ;
   - cadre `#EBF0ED` de 8 unités ;
   - sert d'occultation pendant la révélation.
3. `technology-es-mask.svg`
   - fond `#EBF0ED` percé par les lettres ;
   - même cadre de 8 unités ;
   - masque en luminance, avec identifiants propres au fichier.

Les fichiers seront placés dans `docs/svg/technology-es/` afin de ne pas
modifier les sources HTML de la home. Ils pourront être ouverts puis copiés
dans les trois embeds Webflow correspondants.

## Intégration Webflow

Les trois SVG remplacent, dans le même ordre, les trois SVG de la structure
existante : `.svg-t-bottom.is-1`, le premier `.svgtext-mask.is-1`, puis le
second `.svgtext-mask.is-1` situé dans `.is-text-mask.is-1`.

Le conteneur espagnol doit adopter le rapport extérieur `598 / 206`
(`2.9029126`). Il ne faut pas réutiliser simultanément la largeur et la hauteur
fixes de la version anglaise, car son rapport est différent. Le moyen le plus
robuste est d'appliquer `aspect-ratio: 598 / 206`, une largeur adaptée au
layout et `height: auto` aux SVG.

## Validation

- XML valide et identifiants sans collision.
- Les trois fichiers partagent exactement le même canevas extérieur lorsque
  le cadre intervient.
- Le SVG visible est aligné avec les ouvertures du masque.
- Vérification visuelle à taille native et à largeur responsive.
