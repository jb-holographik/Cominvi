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
        highlightMarkerWithoutDimming(pointKey)
        const regionKey = pointToRegionName.get(pointKey)
        if (regionKey) highlightRegionByName(regionKey)
        // On mobile: pin corresponding card to the left by horizontal snapping
        if (isMobileOnlyNow()) {
          try {
            const list = scope.querySelector('.projects-list')
            const cards = Array.from(scope.querySelectorAll('.project-item'))
            const target = cards.find((el) => {
              const pk = el?.dataset?.point ? String(el.dataset.point) : null
              return pk && pk === String(pointKey)
            })
            if (list && target) {
              try {
                list.scrollTo({
                  left: Math.max(0, target.offsetLeft - 16),
                  behavior: 'smooth',
                })
              } catch (e) {
                list.scrollLeft = Math.max(0, target.offsetLeft - 16)
              }
            }
          } catch (e) {
            // ignore
          }
        } else {
          // Desktop/tablet: activate corresponding card only
          setActiveCardByPoint(pointKey)
        }
      })
      btn.addEventListener('mouseleave', () => {
        const currentOverlays = (scope || document).querySelector(
          '.projects_overlays'
        )
        if (currentOverlays?.dataset?.open === 'true') return
        resetRegions()
        reapplyActiveMarker()
      })
      btn.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        const pointKey = markerToPoint.get(markerEl)
        if (!pointKey) return
        // On mobile: snap-scroll the horizontal list so target card pins to the left
        try {
          if (isMobileOnlyNow()) {
            const list = scope.querySelector('.projects-list')
            const cards = Array.from(scope.querySelectorAll('.project-item'))
            const target = cards.find((el) => {
              const pk = el?.dataset?.point ? String(el.dataset.point) : null
              return pk && pk === String(pointKey)
            })
            if (list && target) {
              try {
                list.scrollTo({
                  left: Math.max(0, target.offsetLeft - 16),
                  behavior: 'smooth',
                })
              } catch (e) {
                list.scrollLeft = Math.max(0, target.offsetLeft - 16)
              }
            }
          }
        } catch (e) {
          // ignore
        }
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
  const setActiveCardByPoint = (pointKey) => {
    try {
      let target = null
      projectItems.forEach((cardEl) => {
        const pk = cardEl?.dataset?.point ? String(cardEl.dataset.point) : null
        if (!target && pk && String(pk) === String(pointKey)) target = cardEl
      })
      projectItems.forEach((cardEl) => {
        if (cardEl === target) cardEl.classList.add('is-active')
        else cardEl.classList.remove('is-active')
      })
    } catch (e) {
      // ignore
    }
  }

  const highlightMarkerWithoutDimming = (pointKey) => {
    try {
      const markerEl = pointToMarker.get(pointKey)
      markers.forEach((m) => {
        if (m === markerEl) m.classList.add('highlight')
        else m.classList.remove('highlight')
        m.classList.remove('dimmed')
      })
    } catch (e) {
      // ignore
    }
  }
  // Helper: treat phones (portrait and landscape) as <=767px
  const isMobileOnlyNow = () => {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) return false
      return window.matchMedia('(max-width: 767px)').matches
    } catch (e) {
      return false
    }
  }
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

  // Removed resetAll: behavior now persists the active marker instead of resetting everything

  // Initial state: first card active and its marker highlighted (others in base state)
  let initialActiveCard = projectItems.length ? projectItems[0] : null
  let initialPointKey = initialActiveCard?.dataset?.point
    ? String(initialActiveCard.dataset.point)
    : null
  let selectedPointKey = initialPointKey || null
  try {
    // Ensure only the first card is active on load
    projectItems.forEach((c) => c.classList.remove('is-active'))
    if (initialActiveCard) initialActiveCard.classList.add('is-active')
    if (initialPointKey) highlightMarkerWithoutDimming(initialPointKey)
  } catch (e) {
    // ignore
  }
  // Apply mobile rule: on phones, all project-items should be active
  const applyActiveClassesByViewport = () => {
    try {
      if (isMobileOnlyNow()) {
        projectItems.forEach((c) => c.classList.add('is-active'))
      } else {
        // Keep only the selected (or first) active on non-mobile
        let pk = selectedPointKey
        if (!pk) {
          const cards = Array.from(scope.querySelectorAll('.project-item'))
          const active = cards.find(
            (el) => el.classList && el.classList.contains('is-active')
          )
          pk = active?.dataset?.point ? String(active.dataset.point) : null
        }
        if (!pk && initialPointKey) pk = initialPointKey
        projectItems.forEach((cardEl) => {
          const p = cardEl?.dataset?.point ? String(cardEl.dataset.point) : null
          if (pk && p && p === pk) cardEl.classList.add('is-active')
          else cardEl.classList.remove('is-active')
        })
      }
    } catch (e) {
      // ignore
    }
  }
  applyActiveClassesByViewport()
  try {
    window.addEventListener('resize', applyActiveClassesByViewport)
    window.addEventListener('orientationchange', applyActiveClassesByViewport)
  } catch (e) {
    // ignore
  }

  const reapplyActiveMarker = () => {
    try {
      let pk = selectedPointKey
      if (!pk) {
        const active = Array.from(scope.querySelectorAll('.project-item')).find(
          (el) => el.classList && el.classList.contains('is-active')
        )
        pk = active?.dataset?.point ? String(active.dataset.point) : null
        if (pk) selectedPointKey = pk
      }
      if (pk) highlightMarkerWithoutDimming(pk)
      else resetMarkers()
    } catch (e) {
      // ignore
    }
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

  // Removed dimCardsExceptPoint: no longer used (we keep cards visible and just toggle is-active)

  // Removed scrollMapSectionToCard: we no longer auto-center/scroll to cards on hover

  // Interactions now handled by marker-hitbox buttons

  // Enable drag-to-scroll on the projects list for tablet/mobile without breaking taps
  try {
    const projectsList = scope.querySelector('.projects-list')
    const cardsWrapper = scope.querySelector('.cards-wrapper')
    if (projectsList && cardsWrapper && !cardsWrapper.dataset.dragScrollBound) {
      cardsWrapper.dataset.dragScrollBound = 'true'
      try {
        // Do NOT create a vertical scroll container here; let page handle vertical
        cardsWrapper.style.overflowY = ''
        cardsWrapper.style.height = cardsWrapper.style.height || '100%'
        cardsWrapper.style.overscrollBehavior = ''
        cardsWrapper.style.webkitOverflowScrolling = ''
        cardsWrapper.style.touchAction = ''
        // Ensure Lenis does NOT block wheel/touch on this wrapper
        cardsWrapper.removeAttribute('data-lenis-prevent')
        cardsWrapper.removeAttribute('data-lenis-prevent-touch')
        cardsWrapper.removeAttribute('data-lenis-prevent-wheel')
      } catch (e) {
        // ignore
      }
      // Ensure horizontal scrollability on the projects list itself
      try {
        projectsList.style.overflowX = 'auto'
        projectsList.style.overflowY = 'hidden'
        projectsList.style.webkitOverflowScrolling = 'touch'
        // Allow vertical gestures to bubble to the page
        projectsList.style.touchAction = 'auto'
        // Make sure Lenis does NOT block wheel/touch on the list (let vertical pass through)
        projectsList.removeAttribute('data-lenis-prevent')
        projectsList.removeAttribute('data-lenis-prevent-touch')
        projectsList.removeAttribute('data-lenis-prevent-wheel')
      } catch (e) {
        // ignore
      }

      let isPointerDown = false
      let startY = 0
      let startX = 0
      let startScrollLeft = 0
      let hasDragged = false
      const DRAG_THRESHOLD = 2

      const isTabletOrBelow = () => {
        try {
          if (typeof window === 'undefined' || !window.matchMedia) return false
          const isCoarse = window.matchMedia('(pointer: coarse)').matches
          const isNarrow = window.matchMedia('(max-width: 1200px)').matches
          return isCoarse || isNarrow
        } catch (e) {
          return false
        }
      }

      const onPointerDown = (e) => {
        if (!isTabletOrBelow()) return
        // Mark dragging state to disable CSS snap while dragging
        try {
          projectsList.classList.add('is-dragging')
        } catch (e) {
          // ignore
        }
        isPointerDown = true
        hasDragged = false
        startY = (e && e.touches ? e.touches[0].clientY : e.clientY) || 0
        startX = (e && e.touches ? e.touches[0].clientX : e.clientX) || 0
        projectsList.style.userSelect = 'none'
        // Constrain to horizontal movement to prevent page vertical scroll during drag
        projectsList.style.touchAction = 'none'
        cardsWrapper.style.userSelect = 'none'
        // Constrain container as well
        cardsWrapper.style.touchAction = 'none'
        // Disable any smooth behavior while dragging
        try {
          projectsList.style.scrollBehavior = 'auto'
          projectsList.style.webkitOverflowScrolling = 'auto'
        } catch (e) {
          // ignore
        }
        // Stop Lenis page scroll while dragging
        try {
          if (window.lenis && typeof window.lenis.stop === 'function') {
            window.lenis.stop()
          }
        } catch (e) {
          // ignore
        }
        try {
          // Always track current horizontal scroll of the list
          startScrollLeft =
            typeof projectsList.scrollLeft === 'number'
              ? projectsList.scrollLeft
              : 0
        } catch (err) {
          startScrollLeft = 0
        }
        try {
          if (
            e &&
            e.target &&
            e.target.setPointerCapture &&
            e.pointerId != null
          ) {
            e.target.setPointerCapture(e.pointerId)
          }
        } catch (err) {
          // ignore
        }
      }

      const onPointerMove = (e) => {
        if (!isPointerDown || !isTabletOrBelow()) return
        const y = (e && e.touches ? e.touches[0].clientY : e.clientY) || 0
        const x = (e && e.touches ? e.touches[0].clientX : e.clientX) || 0
        const dy = y - startY
        const dx = x - startX
        const isHorizontal = Math.abs(dx) >= Math.abs(dy)
        if (Math.abs(dx) > DRAG_THRESHOLD) hasDragged = true
        try {
          if (isHorizontal) {
            // Only handle horizontal drag; leave vertical to the page
            const targetLeft = startScrollLeft - dx
            projectsList.scrollLeft = targetLeft
          }
        } catch (err) {
          // ignore
        }
        if (e && typeof e.preventDefault === 'function') e.preventDefault()
      }

      const onPointerUp = () => {
        if (!isPointerDown) return
        isPointerDown = false
        projectsList.style.userSelect = ''
        projectsList.style.touchAction = ''
        cardsWrapper.style.userSelect = ''
        cardsWrapper.style.touchAction = ''
        try {
          projectsList.classList.remove('is-dragging')
        } catch (e) {
          // ignore
        }
        // Re-enable Lenis page scroll
        try {
          if (window.lenis && typeof window.lenis.start === 'function') {
            window.lenis.start()
          }
        } catch (e) {
          // ignore
        }
        if (hasDragged) {
          const until = String(Date.now() + 250)
          projectsList.dataset.suppressClickUntilTs = until
          cardsWrapper.dataset.suppressClickUntilTs = until
          // Snap to nearest item manually for robustness
          try {
            const cards = Array.from(scope.querySelectorAll('.project-item'))
            const listRect = projectsList.getBoundingClientRect()
            const paddingLeft = (() => {
              try {
                const cs = window.getComputedStyle(projectsList)
                return parseFloat(cs.paddingLeft || '0') || 0
              } catch (e) {
                return 0
              }
            })()
            let best = { dx: Infinity, left: 0 }
            cards.forEach((el) => {
              const rect = el.getBoundingClientRect()
              const dx = Math.abs(rect.left - listRect.left)
              if (dx < best.dx) best = { dx, left: el.offsetLeft }
            })
            const targetLeft = Math.max(0, best.left - paddingLeft)
            try {
              projectsList.scrollTo({ left: targetLeft, behavior: 'smooth' })
            } catch (e) {
              projectsList.scrollLeft = targetLeft
            }
          } catch (e) {
            // ignore
          }
        }
        // Restore styles
        try {
          projectsList.style.scrollBehavior = ''
          projectsList.style.webkitOverflowScrolling = ''
        } catch (e) {
          // ignore
        }
        try {
          if (
            window &&
            window.document &&
            typeof window.getSelection === 'function'
          ) {
            const sel = window.getSelection()
            if (sel && sel.empty) sel.empty()
          }
        } catch (err) {
          // ignore
        }
      }

      const suppressClick = (ev) => {
        try {
          const tsStr =
            cardsWrapper.dataset.suppressClickUntilTs ||
            projectsList.dataset.suppressClickUntilTs
          const ts = tsStr ? Number(tsStr) : 0
          if (ts && Date.now() < ts) {
            ev.stopPropagation()
            ev.preventDefault()
          }
        } catch (e) {
          // ignore
        }
      }

      projectsList.addEventListener('pointerdown', onPointerDown, true)
      cardsWrapper.addEventListener('pointerdown', onPointerDown, true)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
      projectsList.addEventListener('touchstart', onPointerDown, true)
      cardsWrapper.addEventListener('touchstart', onPointerDown, true)
      window.addEventListener('touchmove', onPointerMove, { passive: false })
      window.addEventListener('touchend', onPointerUp, { passive: true })
      window.addEventListener('touchcancel', onPointerUp, { passive: true })
      projectsList.addEventListener('click', suppressClick, true)
      cardsWrapper.addEventListener('click', suppressClick, true)
    }
  } catch (e) {
    // ignore
  }

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

  // Helper: treat mobile/tablet as touch or <=991px
  const isTouchOrSmallNow = () => {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) return false
      return (
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(max-width: 991px)').matches
      )
    } catch (e) {
      return false
    }
  }

  // On mobile/tablet, disable hover effects on project cards
  try {
    if (isTouchOrSmallNow()) {
      const projectButtons = Array.from(scope.querySelectorAll('.project-card'))
      projectButtons.forEach((btn) => {
        try {
          btn.style.transition = 'none'
        } catch (e) {
          // ignore
        }
      })
    }
  } catch (e) {
    // ignore
  }

  projectItems.forEach((cardEl) => {
    cardEl.addEventListener('mouseenter', () => {
      if (isTouchOrSmallNow()) return
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
      // Do not change is-active here; hover shouldn't change persistent selection
    })
    cardEl.addEventListener('mouseleave', () => {
      if (isTouchOrSmallNow()) return
      const currentOverlays = (scope || document).querySelector(
        '.projects_overlays'
      )
      if (currentOverlays?.dataset?.open === 'true') return
      reapplyActiveMarker()
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
        // Persist selection to this card's point
        selectedPointKey = String(pointKey)
        // Mobile/mobile-landscape: only activate marker, no animations/overlays
        if (isMobileOnlyNow()) {
          highlightMarkerWithoutDimming(selectedPointKey)
          // Pin this card to the left in the horizontal list
          try {
            const list = scope.querySelector('.projects-list')
            if (list && cardEl && cardEl.offsetLeft != null) {
              try {
                list.scrollTo({
                  left: Math.max(0, cardEl.offsetLeft - 16),
                  behavior: 'smooth',
                })
              } catch (e) {
                list.scrollLeft = Math.max(0, cardEl.offsetLeft - 16)
              }
            }
          } catch (e) {
            // ignore
          }
          return
        }
        // Tablet/desktop: activate this card only
        setActiveCardByPoint(pointKey)
        // On tablet/mobile: scroll page so that .map-section top aligns to viewport top, then open
        if (isTouchOrSmallNow()) {
          try {
            const mapSection = scope.querySelector('.map-section')
            if (mapSection) {
              const wrapper = (() => {
                try {
                  return window.__lenisWrapper || null
                } catch (e) {
                  return null
                }
              })()
              const wrapperTop = wrapper
                ? wrapper.getBoundingClientRect().top
                : 0
              const currentTop = wrapper
                ? wrapper.scrollTop
                : window.pageYOffset || document.documentElement.scrollTop || 0
              const targetTopRel =
                mapSection.getBoundingClientRect().top - wrapperTop
              const desiredTop = currentTop + targetTopRel
              // Prefer GSAP tween for reliable onComplete
              if (wrapper) {
                gsap.to(wrapper, {
                  scrollTop: desiredTop,
                  duration: 0.6,
                  ease: CustomEase.create('custom', easeCurve),
                  onComplete: () => mapOpen(pointKey, scope),
                })
                return
              }
              // Try Lenis if available
              try {
                if (
                  window.lenis &&
                  typeof window.lenis.scrollTo === 'function'
                ) {
                  window.lenis.scrollTo(desiredTop, {
                    duration: 0.6,
                    immediate: false,
                  })
                  setTimeout(() => mapOpen(pointKey, scope), 650)
                  return
                }
              } catch (e) {
                // ignore
              }
              // Fallback: native smooth scroll then open
              window.scrollTo({ top: desiredTop, behavior: 'smooth' })
              setTimeout(() => mapOpen(pointKey, scope), 650)
              return
            }
          } catch (e) {
            // ignore and fallback to open
          }
        }
        // Desktop or fallback: open immediately
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
    const isTouchOrSmall = () => {
      try {
        if (typeof window === 'undefined' || !window.matchMedia) return false
        return (
          window.matchMedia('(pointer: coarse)').matches ||
          window.matchMedia('(max-width: 991px)').matches
        )
      } catch (e) {
        return false
      }
    }
    if (isTouchOrSmall()) {
      // Mobile/tablet: slide cards down
      gsap.set(cardsWrapper, { x: 0, xPercent: 0, overwrite: 'auto' })
      gsap.to(cardsWrapper, {
        y: 0,
        yPercent: 100,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
      })
    } else {
      // Desktop: slide cards right (existing behavior)
      gsap.set(cardsWrapper, { y: 0, yPercent: 0, overwrite: 'auto' })
      gsap.to(cardsWrapper, {
        xPercent: 110,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
      })
    }
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
    const isTouchOrSmall = () => {
      try {
        if (typeof window === 'undefined' || !window.matchMedia) return false
        return (
          window.matchMedia('(pointer: coarse)').matches ||
          window.matchMedia('(max-width: 991px)').matches
        )
      } catch (e) {
        return false
      }
    }
    if (isTouchOrSmall()) {
      // Mobile/tablet: reset vertical slide
      gsap.set(cardsWrapper, { x: 0, xPercent: 0, overwrite: 'auto' })
      gsap.to(cardsWrapper, {
        y: 0,
        yPercent: 0,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
      })
    } else {
      // Desktop: reset horizontal slide (existing behavior)
      gsap.set(cardsWrapper, { y: 0, yPercent: 0, overwrite: 'auto' })
      gsap.to(cardsWrapper, {
        xPercent: 0,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
      })
    }
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
