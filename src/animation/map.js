import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
const easeCurve = 'M0,0 C0.6,0 0,1 1,1 '

export function projectsOverlay(root = document) {
  try {
    const overlayContainer = root.querySelector('.projects_overlays')
    const cardsWrapper = root.querySelector('.cards-wrapper')
    if (!overlayContainer || !cardsWrapper) return

    // Avoid duplicate bindings
    if (overlayContainer.__overlayBound) return
    overlayContainer.__overlayBound = true

    const items = overlayContainer.querySelectorAll('.projects-overlay-item')
    const closeButtons = overlayContainer.querySelectorAll('.close-button')
    const mapRoot = root.querySelector('.is-map') || root
    const markers = mapRoot.querySelectorAll('.marker')

    const showForProject = (projectKey) => {
      try {
        overlayContainer.style.display = 'flex'
      } catch (e) {
        // ignore
      }
      items.forEach((el) => {
        const key = el.getAttribute('data-project') || ''
        el.style.display = key === projectKey ? 'block' : 'none'
      })
    }

    const playIn = () => {
      try {
        overlayContainer.__overlayOpen = true
      } catch (e) {
        /* ignore */
      }
      gsap.to(cardsWrapper, {
        xPercent: 110,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
        overwrite: 'auto',
      })
      gsap.to(overlayContainer, {
        xPercent: -110,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
        overwrite: 'auto',
      })
    }

    const playOut = () => {
      const tl = gsap.timeline({
        defaults: {
          duration: 1.2,
          ease: CustomEase.create('custom', easeCurve),
        },
      })
      tl.to(cardsWrapper, { xPercent: 0 }, 0)
      tl.to(overlayContainer, { xPercent: 0 }, 0)
      tl.add(() => {
        try {
          overlayContainer.style.display = 'none'
          // Clear all highlights when closing
          const regions = mapRoot.querySelectorAll('.region')
          regions.forEach((r) => r.classList.remove('highlight'))
          markers.forEach((m) => m.classList.remove('highlight', 'dimmed'))
        } catch (e) {
          // ignore
        }
        try {
          overlayContainer.__overlayOpen = false
        } catch (e) {
          /* ignore */
        }
      })
    }

    // Bind clicks on project cards
    const projectCards = root.querySelectorAll('.project-item')
    projectCards.forEach((card) => {
      card.addEventListener('click', (ev) => {
        try {
          ev.preventDefault()
        } catch (e) {
          // ignore
        }
        // Freeze hover logic immediately so mouseleave doesn't clear highlights
        try {
          const oc = root.querySelector('.projects_overlays')
          if (oc) oc.__overlayOpen = true
        } catch (e) {
          // ignore
        }
        const projectKey = card.getAttribute('data-project') || ''
        showForProject(projectKey)
        // Persist highlights while overlay is open (emphasize target only)
        try {
          const regionId = `region-${card.dataset.region}`
          const pointId = `marker-${card.dataset.point}`
          const region = mapRoot.querySelector(`#${regionId}`)
          const point = mapRoot.querySelector(`#${pointId}`)
          if (region) {
            // Use helper to ensure proper z-order without hiding others
            const canHighlight =
              region && typeof region.classList !== 'undefined'
            if (canHighlight) {
              // Do not strip classes from others; just highlight selected
              region.classList.add('highlight')
              if (region.parentNode && region.parentNode.appendChild) {
                region.parentNode.appendChild(region)
              }
            }
          }
          if (point && point.classList) {
            // Only highlight the target marker; don't dim the rest on click
            point.classList.add('highlight')
          }
        } catch (e) {
          // ignore
        }
        playIn()
      })
    })

    if (closeButtons && closeButtons.length) {
      closeButtons.forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          try {
            ev.preventDefault()
            ev.stopPropagation()
          } catch (e) {
            // ignore
          }
          playOut()
        })
      })
    }

    // Close when clicking outside the overlay container entirely
    try {
      if (!overlayContainer.__outsideCloseBound) {
        const outsideHandler = (ev) => {
          try {
            if (!overlayContainer.__overlayOpen) return
            const insideOverlay =
              ev.target &&
              typeof ev.target.closest === 'function' &&
              ev.target.closest('.projects_overlays')
            if (!insideOverlay) {
              playOut()
            }
          } catch (e) {
            // ignore
          }
        }
        document.addEventListener('click', outsideHandler, true)
        overlayContainer.__outsideCloseBound = true
      }
    } catch (e) {
      // ignore
    }
  } catch (err) {
    // ignore
  }
}
export function initMap(root = document) {
  try {
    const cards = root.querySelectorAll('.project-card')
    const mapRoot = root.querySelector('.is-map') || root
    const markers = mapRoot.querySelectorAll('.marker')
    const cardsWrapper = root.querySelector('.cards-wrapper')
    try {
      // eslint-disable-next-line no-console
      console.debug('[map] initMap found cards', {
        count: cards.length,
        hasMapRoot: !!(root.querySelector && root.querySelector('.is-map')),
      })
    } catch (e) {
      // ignore
    }
    // Highlight helper: reset all regions, then optionally promote one to the top
    const highlightRegion = (regionEl) => {
      try {
        const all = mapRoot.querySelectorAll('.region')
        all.forEach((r) => r.classList.remove('highlight'))
        if (regionEl) {
          regionEl.classList.add('highlight')
          if (regionEl.parentNode && regionEl.parentNode.appendChild) {
            regionEl.parentNode.appendChild(regionEl)
          }
        }
      } catch (e) {
        // ignore
      }
    }

    cards.forEach((card) => {
      const getByIdCaseInsensitive = (container, id) => {
        if (!container || !id) return null
        const direct = container.querySelector(`#${id}`)
        if (direct) return direct
        const targetLower = String(id).toLowerCase()
        const allWithId = container.querySelectorAll('[id]')
        for (const el of allWithId) {
          try {
            if (String(el.id).toLowerCase() === targetLower) return el
          } catch (e) {
            // ignore
          }
        }
        return null
      }
      try {
        // eslint-disable-next-line no-console
        console.debug('[map] bind card', {
          region: card && card.dataset ? card.dataset.region : undefined,
          point: card && card.dataset ? card.dataset.point : undefined,
        })
      } catch (e) {
        // ignore
      }
      card.addEventListener('mouseenter', () => {
        // If overlay is open, do not change highlights on hover
        if (root.querySelector('.projects_overlays')?.__overlayOpen) return
        const regionId = `region-${card.dataset.region}`
        const pointId = `marker-${card.dataset.point}`
        const region = getByIdCaseInsensitive(mapRoot, regionId)
        const point = getByIdCaseInsensitive(mapRoot, pointId)
        try {
          // eslint-disable-next-line no-console
          console.debug('[map] mouseenter', {
            regionId,
            pointId,
            hasRegion: !!region,
            hasPoint: !!point,
          })
        } catch (e) {
          // ignore
        }
        if (region) highlightRegion(region)
        // Markers behavior on card hover: highlight the target marker, dim others
        try {
          markers.forEach((m) => m.classList.remove('highlight', 'dimmed'))
          const targetMarker = point
          if (targetMarker) targetMarker.classList.add('highlight')
          markers.forEach((m) => {
            if (m !== targetMarker) m.classList.add('dimmed')
          })
        } catch (e) {
          // ignore
        }
      })

      card.addEventListener('mouseleave', (ev) => {
        // If overlay is open, keep highlights until close
        if (root.querySelector('.projects_overlays')?.__overlayOpen) return
        // If we are still inside the cards wrapper, keep highlights
        try {
          if (
            cardsWrapper &&
            ev &&
            ev.relatedTarget &&
            cardsWrapper.contains(ev.relatedTarget)
          ) {
            return
          }
        } catch (e) {
          // ignore
        }
        const regionId = `region-${card.dataset.region}`
        const pointId = `marker-${card.dataset.point}`
        const region = getByIdCaseInsensitive(mapRoot, regionId)
        const point = getByIdCaseInsensitive(mapRoot, pointId)
        try {
          // eslint-disable-next-line no-console
          console.debug('[map] mouseleave', {
            regionId,
            pointId,
            hasRegion: !!region,
            hasPoint: !!point,
          })
        } catch (e) {
          // ignore
        }
        highlightRegion(null)
        try {
          markers.forEach((m) => m.classList.remove('highlight', 'dimmed'))
        } catch (e) {
          // ignore
        }
      })
    })

    // Initialize overlays behavior
    projectsOverlay(root)
  } catch (err) {
    // ignore
  }
}
