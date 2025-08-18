import barba from '@barba/core'

import { reinitializeWebflowAnimations } from '../utils/base.js'
import { initMinerals } from './minerals.js'
import { initializeNav2 } from './nav.js'
import { initParallax } from './parallax.js'
import { initLenis, destroyLenis } from './scroll.js'
import { initServiceCards } from './service-cards.js'
import { initTextReveal } from './text-reveal.js'
import { slideScaleLeave, slideScaleEnter } from './transition-slide-scale.js'

// Minimal Barba setup that focuses only on nav-related transitions
export function initializePageTransitionNav() {
  barba.init({
    preventRunning: true,
    schema: { namespace: 'data-barba-namespace' },
    transitions: [
      {
        name: 'slide-scale',
        sync: true,
        leave: slideScaleLeave,
        enter: ({ next }) => slideScaleEnter({ next }),
        after: ({ next }) => {
          // Mark that the transition after hook handled re-inits to avoid duplicate work in global hook
          try {
            window.__barbaAfterHandled = true
          } catch (err) {
            // ignore
          }

          destroyLenis()
          initLenis(next && next.container)
          initializeNav2()
          reinitializeWebflowAnimations()
          initParallax(next && next.container)
          initServiceCards(next && next.container)
          initTextReveal()
          initMinerals()
        },
      },
    ],
  })

  // Global fallback for nav that bypasses custom transitions
  barba.hooks.after(({ next }) => {
    // If the transition-specific after already ran, skip duplicate init
    if (window.__barbaAfterHandled) {
      window.__barbaAfterHandled = false
      return
    }

    destroyLenis()
    initLenis(next && next.container)
    initializeNav2()
    reinitializeWebflowAnimations()
    initParallax(next && next.container)
    initServiceCards(next && next.container)
    initTextReveal()
    initMinerals()
  })
}
