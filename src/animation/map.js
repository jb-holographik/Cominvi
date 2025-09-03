import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
gsap.registerPlugin(CustomEase)
const easeCurve = 'M0,0 C0.6,0 0,1 1,1 '

export function initMap(root = document) {
  const scope = root || document

  // Collect elements
  const markers = Array.from(scope.querySelectorAll('.marker[id^="marker-"]'))
  const regions = Array.from(scope.querySelectorAll('.region[id^="region-"]'))
  const projectItems = Array.from(scope.querySelectorAll('.project-item'))
  const overlayItems = Array.from(
    scope.querySelectorAll('.projects-overlay-item')
  )

  if (!markers.length && !regions.length && !projectItems.length) return

  // Build lookups
  const pointToMarker = new Map()
  const markerToPoint = new Map()
  markers.forEach((markerEl) => {
    const id = markerEl.id || ''
    const m = id.match(/^marker-(.+)$/)
    if (m && m[1] != null) {
      const pointKey = String(m[1])
      pointToMarker.set(pointKey, markerEl)
      markerToPoint.set(markerEl, pointKey)
    }
  })

  // Create larger clickable buttons over each marker
  const markerHitboxPaddingPx = 12
  const markerToButton = new Map()
  const syncMarkerButton = (markerEl, btn) => {
    try {
      const rect = markerEl.getBoundingClientRect()
      btn.style.left = `${rect.left - markerHitboxPaddingPx}px`
      btn.style.top = `${rect.top - markerHitboxPaddingPx}px`
      btn.style.width = `${rect.width + markerHitboxPaddingPx * 2}px`
      btn.style.height = `${rect.height + markerHitboxPaddingPx * 2}px`
    } catch (e) {
      // ignore
    }
  }
  const syncAllMarkerButtons = () => {
    markerToButton.forEach((btn, markerEl) => syncMarkerButton(markerEl, btn))
  }
  try {
    markers.forEach((markerEl) => {
      // Avoid duplicating buttons if initMap runs multiple times
      if (markerToButton.has(markerEl)) return
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'marker-hitbox'
      btn.setAttribute('aria-label', 'Open project')
      Object.assign(btn.style, {
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '0px',
        height: '0px',
        padding: '0',
        margin: '0',
        background: 'transparent',
        border: '0',
        outline: 'none',
        cursor: 'pointer',
        zIndex: '4',
      })
      // Button takes over all marker interactions
      btn.addEventListener('mouseenter', () => {
        const pointKey = markerToPoint.get(markerEl)
        if (!pointKey) return
        highlightMarkerForPoint(pointKey)
        const regionKey = pointToRegionName.get(pointKey)
        if (regionKey) highlightRegionByName(regionKey)
        dimCardsExceptPoint(pointKey)
        scrollMapSectionToCard(pointKey)
      })
      btn.addEventListener('mouseleave', () => {
        const currentOverlays = (scope || document).querySelector(
          '.projects_overlays'
        )
        if (currentOverlays?.dataset?.open === 'true') return
        resetAll()
      })
      btn.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        const pointKey = markerToPoint.get(markerEl)
        if (!pointKey) return
        try {
          const overlays = (scope || document).querySelector(
            '.projects_overlays'
          )
          const isOpen = overlays?.dataset?.open === 'true'
          if (isOpen) mapClose(scope)
          else mapOpen(pointKey, scope)
        } catch (e) {
          // ignore
        }
      })
      document.body.appendChild(btn)
      markerToButton.set(markerEl, btn)
      syncMarkerButton(markerEl, btn)
    })
    // Keep positions in sync on resize/scroll
    const onResizeOrScroll = () => syncAllMarkerButtons()
    window.addEventListener('resize', onResizeOrScroll)
    window.addEventListener('scroll', onResizeOrScroll, true)
    // If a smooth-scroll wrapper exists, sync on its scroll as well
    try {
      const wrapper = window.__lenisWrapper || null
      if (wrapper && typeof wrapper.addEventListener === 'function') {
        wrapper.addEventListener('scroll', onResizeOrScroll)
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }

  const normalizeRegionKey = (raw) => {
    if (!raw && raw !== 0) return null
    try {
      let v = String(raw).trim().toLowerCase()
      if (v.startsWith('#')) v = v.slice(1)
      if (v.startsWith('region-')) v = v.slice(7)
      return v || null
    } catch (e) {
      return null
    }
  }

  const regionNameToRegion = new Map()
  regions.forEach((regionEl) => {
    const id = regionEl.id || ''
    const m = id.match(/^region-(.+)$/)
    if (m && m[1] != null) {
      const regionKey = normalizeRegionKey(m[1])
      regionNameToRegion.set(regionKey, regionEl)
    }
  })

  const pointToProjectItems = new Map()
  const regionNameToProjectItems = new Map()
  const pointToRegionName = new Map()
  projectItems.forEach((cardEl) => {
    const pointKey = cardEl?.dataset?.point
      ? String(cardEl.dataset.point)
      : null
    const regionKey = cardEl?.dataset?.region
      ? normalizeRegionKey(cardEl.dataset.region)
      : null

    if (pointKey) {
      const arr = pointToProjectItems.get(pointKey) || []
      arr.push(cardEl)
      pointToProjectItems.set(pointKey, arr)
    }
    if (regionKey) {
      const arr = regionNameToProjectItems.get(regionKey) || []
      arr.push(cardEl)
      regionNameToProjectItems.set(regionKey, arr)
    }
    if (pointKey && regionKey && !pointToRegionName.has(pointKey)) {
      pointToRegionName.set(pointKey, regionKey)
    }
  })

  const pointToOverlayItems = new Map()
  overlayItems.forEach((overlayEl) => {
    const pointKey = overlayEl?.dataset?.point
      ? String(overlayEl.dataset.point)
      : null
    if (pointKey) {
      const arr = pointToOverlayItems.get(pointKey) || []
      arr.push(overlayEl)
      pointToOverlayItems.set(pointKey, arr)
    }
  })

  // Helpers
  const resetMarkers = () => {
    markers.forEach((m) => {
      m.classList.remove('highlight')
      m.classList.remove('dimmed')
    })
  }

  const resetRegions = () => {
    regions.forEach((r) => r.classList.remove('highlight'))
  }

  const resetCardsDimming = () => {
    projectItems.forEach((c) => c.classList.remove('is-dimmed'))
  }

  const resetAll = () => {
    resetMarkers()
    resetRegions()
    resetCardsDimming()
  }

  const highlightRegionByName = (regionKey) => {
    const normalized = normalizeRegionKey(regionKey)
    if (!normalized) {
      resetRegions()
      return
    }
    const regionEl = regionNameToRegion.get(normalized)
    if (!regionEl) {
      // Clear any existing highlights if target missing
      resetRegions()
      return
    }
    regions.forEach((r) => {
      if (r === regionEl) r.classList.add('highlight')
      else r.classList.remove('highlight')
    })
    // Bring highlighted region to front so its contour is fully visible
    try {
      const parent = regionEl.parentNode
      if (parent && typeof parent.appendChild === 'function') {
        parent.appendChild(regionEl)
      }
    } catch (e) {
      // ignore
    }
  }

  const highlightMarkerForPoint = (pointKey) => {
    const markerEl = pointToMarker.get(pointKey)
    if (!markerEl) {
      resetMarkers()
      return
    }
    markers.forEach((m) => {
      if (m === markerEl) {
        m.classList.add('highlight')
        m.classList.remove('dimmed')
      } else {
        m.classList.add('dimmed')
        m.classList.remove('highlight')
      }
    })
  }

  const dimCardsExceptPoint = (pointKey) => {
    const candidates = pointToProjectItems.get(pointKey) || []
    const firstForPoint = candidates.length ? candidates[0] : null
    projectItems.forEach((cardEl) => {
      if (firstForPoint && cardEl === firstForPoint) {
        cardEl.classList.remove('is-dimmed')
      } else {
        cardEl.classList.add('is-dimmed')
      }
    })
  }

  const scrollMapSectionToCard = (pointKey) => {
    try {
      const cards = projectItems
      if (!cards.length) return
      const candidates = pointToProjectItems.get(pointKey) || []
      const target = candidates.length ? candidates[0] : null
      if (!target) return

      const index = cards.indexOf(target)
      const beforeLastIdx = Math.max(0, cards.length - 2)

      const wrapper = (() => {
        try {
          return window.__lenisWrapper || null
        } catch (e) {
          return null
        }
      })()

      const viewportH = wrapper
        ? wrapper.clientHeight
        : window.innerHeight || document.documentElement.clientHeight

      const rect = target.getBoundingClientRect()
      const cardsContainer = scope.querySelector('.cards-wrapper')
      const wrapperTop = wrapper ? wrapper.getBoundingClientRect().top : 0
      const currentTop = wrapper
        ? wrapper.scrollTop
        : window.pageYOffset || document.documentElement.scrollTop || 0

      // Compute offset for top/bottom/center alignment relative to viewport
      let offset = 0
      if (index <= 1) {
        // For the first two cards, always scroll to the same top level: top of cards container
        if (cardsContainer) {
          const containerTopRel =
            cardsContainer.getBoundingClientRect().top - wrapperTop
          const desiredTop = currentTop + containerTopRel
          try {
            if (window.lenis && typeof window.lenis.scrollTo === 'function') {
              window.lenis.scrollTo(desiredTop, {
                duration: 1.2,
                immediate: false,
              })
              return
            }
          } catch (e) {
            // ignore
          }
          // Fallback
          try {
            if (wrapper) {
              gsap.to(wrapper, {
                scrollTop: desiredTop,
                duration: 1.2,
                ease: CustomEase.create('custom', easeCurve),
              })
            } else {
              window.scrollTo({ top: desiredTop, behavior: 'smooth' })
            }
            return
          } catch (e) {
            // ignore
          }
        }
        offset = 0 // default top align
      } else if (index >= beforeLastIdx) {
        // For the last two cards, always scroll to the same bottom level: bottom of cards container
        if (cardsContainer) {
          const containerBottomRel =
            cardsContainer.getBoundingClientRect().bottom - wrapperTop
          const desiredTop = currentTop + containerBottomRel - viewportH
          try {
            if (window.lenis && typeof window.lenis.scrollTo === 'function') {
              window.lenis.scrollTo(desiredTop, {
                duration: 1.2,
                immediate: false,
              })
              return
            }
          } catch (e) {
            // ignore
          }
          // Fallback
          try {
            if (wrapper) {
              gsap.to(wrapper, {
                scrollTop: desiredTop,
                duration: 1.2,
                ease: CustomEase.create('custom', easeCurve),
              })
            } else {
              window.scrollTo({ top: desiredTop, behavior: 'smooth' })
            }
            return
          } catch (e) {
            // ignore
          }
        }
        offset = -(viewportH - rect.height) // default bottom align
      } else {
        offset = -(viewportH / 2 - rect.height / 2) // center
      }

      // Prefer Lenis
      try {
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(target, {
            duration: 1.2,
            immediate: false,
            offset,
          })
          return
        }
      } catch (e) {
        // ignore
      }

      // Fallback: manual scroll of wrapper or window
      try {
        const currentTop = wrapper
          ? wrapper.scrollTop
          : window.pageYOffset || document.documentElement.scrollTop || 0
        const wrapperTop = wrapper ? wrapper.getBoundingClientRect().top : 0
        const targetTopRel = rect.top - wrapperTop
        const desiredTop = currentTop + targetTopRel + offset
        if (wrapper) {
          gsap.to(wrapper, {
            scrollTop: desiredTop,
            duration: 1.2,
            ease: CustomEase.create('custom', easeCurve),
          })
        } else {
          window.scrollTo({ top: desiredTop, behavior: 'smooth' })
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
  }

  // Interactions now handled by marker-hitbox buttons

  regions.forEach((regionEl) => {
    regionEl.addEventListener('mouseenter', () => {
      // Only region highlight per spec
      const id = regionEl.id || ''
      const m = id.match(/^region-(.+)$/)
      const regionKey = m && m[1] ? normalizeRegionKey(m[1]) : null
      if (regionKey) highlightRegionByName(regionKey)
      else resetRegions()
    })
    regionEl.addEventListener('mouseleave', () => {
      const currentOverlays = (scope || document).querySelector(
        '.projects_overlays'
      )
      if (currentOverlays?.dataset?.open === 'true') return
      resetRegions()
    })
  })

  projectItems.forEach((cardEl) => {
    cardEl.addEventListener('mouseenter', () => {
      const pointKey = cardEl?.dataset?.point
        ? String(cardEl.dataset.point)
        : null
      const regionKey = cardEl?.dataset?.region
        ? normalizeRegionKey(cardEl.dataset.region)
        : null
      if (pointKey) highlightMarkerForPoint(pointKey)
      if (regionKey) highlightRegionByName(regionKey)
      // Also dim other points per spec
      if (!pointKey) return
      markers.forEach((m) => {
        const mkPoint = markerToPoint.get(m)
        if (mkPoint && mkPoint !== pointKey) {
          m.classList.add('dimmed')
          m.classList.remove('highlight')
        }
      })
      // Dim other cards while hovering a card
      projectItems.forEach((other) => {
        if (other === cardEl) other.classList.remove('is-dimmed')
        else other.classList.add('is-dimmed')
      })
    })
    cardEl.addEventListener('mouseleave', () => {
      const currentOverlays = (scope || document).querySelector(
        '.projects_overlays'
      )
      if (currentOverlays?.dataset?.open === 'true') return
      resetMarkers()
      resetRegions()
    })
    cardEl.addEventListener('click', (ev) => {
      try {
        const pointKey = cardEl?.dataset?.point
          ? String(cardEl.dataset.point)
          : null
        if (!pointKey) return
        ev.preventDefault()
        ev.stopPropagation()
        mapOpen(pointKey, scope)
      } catch (e) {
        // ignore
      }
    })
  })

  // Keep cards dimmed until leaving the wrapper
  try {
    const cardsWrapper = scope.querySelector('.cards-wrapper')
    if (cardsWrapper && !cardsWrapper.__cardsWrapperHandlersAttached) {
      cardsWrapper.__cardsWrapperHandlersAttached = true
      cardsWrapper.addEventListener('mouseleave', () => {
        resetCardsDimming()
      })
    }
  } catch (e) {
    // ignore
  }

  // Attach close handlers for overlays (once)
  try {
    const overlays = scope.querySelector('.projects_overlays')
    if (overlays && !overlays.__overlayHandlersAttached) {
      overlays.__overlayHandlersAttached = true
      // Close on .close-button inside overlays
      overlays.addEventListener('click', (ev) => {
        const btn =
          ev.target && ev.target.closest
            ? ev.target.closest('.close-button')
            : null
        if (btn) {
          ev.preventDefault()
          ev.stopPropagation()
          try {
            mapClose(scope)
          } catch (e) {
            // ignore
          }
        }
      })
      // Close when clicking outside overlays (but ignore marker clicks)
      if (!window.__mapOverlayDocClick) {
        const handler = (ev) => {
          try {
            // Resolve current overlays dynamically (page transitions replace DOM)
            const currentOverlays = (scope || document).querySelector(
              '.projects_overlays'
            )
            // Only when overlay is currently open
            const isOpen = currentOverlays?.dataset?.open === 'true'
            if (!isOpen) return
            const t = ev.target
            if (!t) return
            if (currentOverlays && currentOverlays.contains(t)) return
            if (
              t.closest &&
              (t.closest('.marker') || t.closest('.projects_overlays'))
            )
              return
            mapClose(scope || document)
          } catch (e) {
            // ignore
          }
        }
        window.__mapOverlayDocClick = handler
        document.addEventListener('click', handler)
      }
    }
  } catch (e) {
    // ignore
  }

  // Return context for potential debugging/extension
  return {
    markers,
    regions,
    projectItems,
    overlayItems,
    lookups: {
      pointToMarker,
      markerToPoint,
      regionNameToRegion,
      pointToProjectItems,
      regionNameToProjectItems,
      pointToRegionName,
      pointToOverlayItems,
    },
  }
}

export function mapOpen(pointKey, root = document) {
  const scope = root || document
  const cardsWrapper = scope.querySelector('.cards-wrapper')
  const overlays = scope.querySelector('.projects_overlays')
  const overlayItems = Array.from(
    scope.querySelectorAll('.projects-overlay-item')
  )

  // Activate only the first overlay item matching the point
  const targetItems = overlayItems.filter((el) => {
    const pk = el?.dataset?.point ? String(el.dataset.point) : null
    return pk && String(pk) === String(pointKey)
  })
  const first = targetItems.length ? targetItems[0] : null
  overlayItems.forEach((el) => el.classList.remove('is-active'))
  if (first) first.classList.add('is-active')

  // Animate panels
  if (cardsWrapper) {
    gsap.to(cardsWrapper, {
      xPercent: 110,
      duration: 1.2,
      ease: CustomEase.create('custom', easeCurve),
    })
  }
  if (overlays) {
    gsap.set(overlays, { display: 'flex' })
    // Start off-screen, clear any px translation, animate to 0 with custom ease
    gsap.set(overlays, { x: 0, xPercent: 110, overwrite: 'auto' })
    gsap.to(overlays, {
      x: 0,
      xPercent: 0,
      duration: 1.2,
      ease: CustomEase.create('custom', easeCurve),
    })
    try {
      overlays.dataset.open = 'true'
    } catch (e) {
      // ignore
    }
    // Persist highlight for the selected point/region while open
    try {
      if (pointKey) {
        const markers = Array.from(
          scope.querySelectorAll('.marker[id^="marker-"]')
        )
        const selectedMarker = scope.getElementById(
          `marker-${String(pointKey)}`
        )
        markers.forEach((m) => {
          if (m === selectedMarker) {
            m.classList.add('highlight')
            m.classList.remove('dimmed')
          } else {
            m.classList.add('dimmed')
            m.classList.remove('highlight')
          }
        })

        // Find corresponding region via first matching project-item's data-region
        const projectItems = Array.from(scope.querySelectorAll('.project-item'))
        let regionKeyRaw = null
        for (const el of projectItems) {
          const pk = el?.dataset?.point ? String(el.dataset.point) : null
          if (pk && pk === String(pointKey)) {
            regionKeyRaw = el?.dataset?.region
            break
          }
        }
        const normalize = (raw) => {
          if (!raw && raw !== 0) return null
          let v = String(raw).trim().toLowerCase()
          if (v.startsWith('#')) v = v.slice(1)
          if (v.startsWith('region-')) v = v.slice(7)
          return v || null
        }
        const regionKey = normalize(regionKeyRaw)
        const regions = Array.from(
          scope.querySelectorAll('.region[id^="region-"]')
        )
        const targetRegion = regionKey
          ? scope.getElementById(`region-${regionKey}`)
          : null
        regions.forEach((r) => {
          if (r === targetRegion) r.classList.add('highlight')
          else r.classList.remove('highlight')
        })
        try {
          if (targetRegion && targetRegion.parentNode) {
            targetRegion.parentNode.appendChild(targetRegion)
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
    // Disable scroll (Lenis wrapper)
    try {
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop()
      }
    } catch (e) {
      // ignore
    }
  }
}

export function mapClose(root = document) {
  const scope = root || document
  const cardsWrapper = scope.querySelector('.cards-wrapper')
  const overlays = scope.querySelector('.projects_overlays')
  const overlayItems = Array.from(
    scope.querySelectorAll('.projects-overlay-item')
  )

  // Ensure cards are not dimmed before content returns into view
  try {
    const cards = Array.from(scope.querySelectorAll('.project-item'))
    cards.forEach((c) => c.classList.remove('is-dimmed'))
  } catch (e) {
    // ignore
  }

  if (cardsWrapper) {
    gsap.to(cardsWrapper, {
      xPercent: 0,
      duration: 1.2,
      ease: CustomEase.create('custom', easeCurve),
    })
  }
  if (overlays) {
    // Reset any px translation so percent-based move is accurate
    gsap.set(overlays, { x: 0, overwrite: 'auto' })
    gsap.to(overlays, {
      x: 0,
      xPercent: 110,
      duration: 1.2,
      ease: CustomEase.create('custom', easeCurve),
      onComplete: () => {
        try {
          // Deactivate overlays after the slide-out finishes
          overlayItems.forEach((el) => el.classList.remove('is-active'))
          overlays.style.display = 'none'
          delete overlays.dataset.open
        } catch (e) {
          // ignore
        }
        // Re-enable scroll (Lenis wrapper)
        try {
          if (window.lenis && typeof window.lenis.start === 'function') {
            window.lenis.start()
          }
        } catch (e) {
          // ignore
        }
        // Clear any persistent highlights
        try {
          const markers = Array.from(
            scope.querySelectorAll('.marker[id^="marker-"]')
          )
          markers.forEach((m) => {
            m.classList.remove('highlight')
            m.classList.remove('dimmed')
          })
          const regions = Array.from(
            scope.querySelectorAll('.region[id^="region-"]')
          )
          regions.forEach((r) => r.classList.remove('highlight'))
        } catch (e) {
          // ignore
        }
      },
    })
  }
}
