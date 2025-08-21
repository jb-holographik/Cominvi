import barba from '@barba/core'

import { reinitializeWebflowAnimations } from '../utils/base.js'
import { initMinerals } from './minerals.js'
import { initializeNav2 } from './nav.js'
import { initParallax } from './parallax.js'
import { initScrollList } from './scroll-list.js'
import { initLenis, destroyLenis } from './scroll.js'
import { initServiceCards } from './service-cards.js'
import {
  createViewportClipOverlay,
  resetOverlayClipBaseState,
} from './svg-clip-overlay.js'
import { initTestimonials } from './testimonials.js'
import { initTextDisplayReveal } from './text-display-reveal.js'
import { initTextReveal } from './text-reveal.js'
import {
  slideScaleLeave as innerLeave,
  slideScaleEnter as innerEnter,
} from './transition-inner.js'
import { slideScaleLeave, slideScaleEnter } from './transition-slide-scale.js'

// Minimal Barba setup that focuses only on nav-related transitions
export function initializePageTransitionNav() {
  // Track UI visibility adjustments for pt-inner clicks
  const isVisible = (el) => {
    if (!el) return false
    const cs = getComputedStyle(el)
    return (
      cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'
    )
  }
  const cache = {
    wasNavVisible: false,
    forcedPageInfoFlex: false,
  }
  document.addEventListener(
    'click',
    (ev) => {
      const target =
        ev.target && ev.target.closest
          ? ev.target.closest('[pt-inner], [data-pt-inner], #pt-inner')
          : null
      if (!target) return
      try {
        const navInner = document.querySelector('.nav-inner')
        const pageInfo = document.querySelector('.page-info')
        cache.wasNavVisible = isVisible(navInner)
        cache.forcedPageInfoFlex = false
        if (cache.wasNavVisible && navInner) {
          navInner.style.display = 'none'
        }
        if (pageInfo && !isVisible(pageInfo)) {
          pageInfo.style.display = 'flex'
          cache.forcedPageInfoFlex = true
        }
        // Ensure mask-overlay exists and becomes active immediately on click
        try {
          let overlay = document.querySelector('.mask-overlay')
          if (!overlay) {
            const created = createViewportClipOverlay({
              repeat: 0,
              yoyo: false,
            })
            overlay = created && created.container
            try {
              window.__maskOverlay = {
                container: overlay,
                tl: created && created.tl,
              }
            } catch (e) {
              // ignore
            }
          }
          if (overlay) {
            try {
              // Ensure start geometry is reset before showing
              resetOverlayClipBaseState()
            } catch (e) {
              // ignore
            }
            try {
              overlay.classList.add('is-active')
            } catch (e) {
              overlay.className += ' is-active'
            }
            overlay.style.left = '0px'
            try {
              const clone = overlay.querySelector('.mask-overlay_page-info')
              if (clone) clone.style.display = 'flex'
            } catch (e) {
              // ignore
            }
            // Debug
            try {
              const cs = getComputedStyle(overlay)
              // eslint-disable-next-line no-console
              console.debug('[mask-overlay] activate@nav click', {
                display: cs.display,
                zIndex: cs.zIndex,
                left: overlay.style.left,
              })
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // ignore
        }
        // expose for transition after hook
        window.__ptInnerFlags = { ...cache }
      } catch (err) {
        // ignore
      }
    },
    true
  )

  barba.init({
    preventRunning: true,
    schema: { namespace: 'data-barba-namespace' },
    transitions: [
      {
        name: 'slide-scale-inner',
        sync: true,
        custom: ({ trigger }) => {
          try {
            if (!trigger) return false
            const match = trigger.closest
              ? trigger.closest('[pt-inner], [data-pt-inner], #pt-inner')
              : null
            return !!match
          } catch (err) {
            return false
          }
        },
        leave: innerLeave,
        enter: ({ next }) => innerEnter({ next }),
        after: ({ next }) => {
          // Mark that the transition after hook handled re-inits to avoid duplicate work in global hook
          try {
            window.__barbaAfterHandled = true
          } catch (err) {
            // ignore
          }

          // Restore UI according to pre-click state for pt-inner
          try {
            const flags = window.__ptInnerFlags || {}
            const navInner = document.querySelector('.nav-inner')
            const pageInfo = document.querySelector('.page-info')
            if (flags.wasNavVisible && navInner) {
              navInner.style.display = 'flex'
              // Keep pageInfo visible until transition ends
            }
            if (flags.forcedPageInfoFlex && pageInfo) {
              // Keep pageInfo visible until transition ends
            }
            window.__ptInnerFlags = undefined
          } catch (err) {
            // ignore
          }

          destroyLenis()
          initLenis(next && next.container)
          // Re-init Webflow first, then (re)bind nav handlers/animations
          reinitializeWebflowAnimations()
          initializeNav2()
          initParallax(next && next.container)
          initServiceCards(next && next.container)
          initTextReveal()
          initMinerals()
          initScrollList()
          initTestimonials()
          initTextDisplayReveal()
        },
      },
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
          // Re-init Webflow first, then (re)bind nav handlers/animations
          reinitializeWebflowAnimations()
          initializeNav2()
          initParallax(next && next.container)
          initServiceCards(next && next.container)
          initTextReveal()
          initMinerals()
          initScrollList()
          initTestimonials()
          initTextDisplayReveal()
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
