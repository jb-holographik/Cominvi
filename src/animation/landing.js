import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

const easeCurve = 'M0,0 C0.6,0 0,1 1,1 '

// Fait slider les .is-h1-span de y:110% à y:0 avec la même durée/ease que le dé-scale
export function heroAnimation(root = document, opts = {}) {
  const scope = root && root.querySelector ? root : document
  const spans = Array.from(scope.querySelectorAll('.is-h1-span'))
  const bodies = Array.from(
    scope.querySelectorAll('.section_hero .body-xl, .eyebrow-l')
  )
  const elements = [...spans, ...bodies]
  if (!elements.length) return
  const duration = typeof opts.duration === 'number' ? opts.duration : 1.2
  const ease = opts.ease || gsap.parseEase(`custom(${easeCurve})`)

  // Timeline par élément pour remonter l'opacité à 1 juste au démarrage, puis slider
  const tl = gsap.timeline()
  const each = 0.03
  elements.forEach((el, index) => {
    const position = index * each
    // Rétablit l'opacité (ou visibilité) à 1 au moment où l'anim de cet élément démarre
    tl.set(el, { autoAlpha: 1 }, position)
    // Puis effectue le slide depuis 110% vers 0 en neutralisant tout décalage en pixels
    const startPercent = el.matches('.eyebrow-l') ? 130 : 110
    tl.fromTo(
      el,
      { yPercent: startPercent, y: 0 },
      { yPercent: 0, y: 0, duration, ease, overwrite: 'auto' },
      position
    )
  })

  // Cartes du hero: première depuis 120%, seconde depuis 100%
  const cards = Array.from(scope.querySelectorAll('.section_hero .card'))
  if (cards.length) {
    const starts = [110, 120]
    cards.forEach((card, i) => {
      const startPercent = starts[i] != null ? starts[i] : 100
      const pos = 0
      tl.set(card, { autoAlpha: 1 }, pos)
      tl.fromTo(
        card,
        { yPercent: startPercent, y: 0 },
        { yPercent: 0, y: 0, duration, ease, overwrite: 'auto' },
        pos
      )
    })
  }
}
