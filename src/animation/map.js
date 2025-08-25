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

    const normalizeKey = (s) => {
      try {
        return String(s || '')
          .trim()
          .toLowerCase()
      } catch (e) {
        return ''
      }
    }
    const showForProject = (projectKey) => {
      try {
        overlayContainer.style.display = 'flex'
      } catch (e) {
        // ignore
      }
      items.forEach((el) => {
        const key = el.getAttribute('data-project') || ''
        // Keep default CSS display for the active item; hide others
        el.style.display =
          normalizeKey(key) === normalizeKey(projectKey) ? '' : 'none'
      })
    }

    const getScrollContainer = () => {
      try {
        const fallbackScrollRoot =
          document.scrollingElement || document.documentElement || document.body
        return (
          root.querySelector('.page-wrap') ||
          root.querySelector('.content-wrap') ||
          root.querySelector('[data-barba="container"]') ||
          fallbackScrollRoot
        )
      } catch (e) {
        const fallbackScrollRoot =
          document.scrollingElement || document.documentElement || document.body
        return fallbackScrollRoot
      }
    }

    const disableScroll = () => {
      try {
        const sc = getScrollContainer()
        overlayContainer.__scrollContainer = sc
        const isBody = sc === document.body || sc === document.documentElement
        if (isBody) {
          const scrollY = window.scrollY || window.pageYOffset || 0
          sc.__scrollLockY = scrollY
          document.body.style.position = 'fixed'
          document.body.style.top = `-${scrollY}px`
          document.body.style.left = '0'
          document.body.style.right = '0'
          document.body.style.width = '100%'
          document.body.style.overflow = 'hidden'
        } else {
          const currentY = sc.scrollTop || 0
          sc.__scrollLockY = currentY
          sc.style.overflow = 'hidden'
          sc.style.touchAction = 'none'
          const prevent = (ev) => {
            try {
              ev.preventDefault()
              ev.stopPropagation()
            } catch (e) {
              // ignore
            }
            return false
          }
          const preventKeys = (ev) => {
            const keys = [
              ' ',
              'Spacebar',
              'PageUp',
              'PageDown',
              'ArrowUp',
              'ArrowDown',
              'Home',
              'End',
            ]
            if (keys.includes(ev.key)) {
              try {
                ev.preventDefault()
                ev.stopPropagation()
              } catch (e) {
                // ignore
              }
              return false
            }
            return true
          }
          const snapScroll = () => {
            try {
              if (!overlayContainer.__overlayOpen) return
              const y = parseInt(sc.__scrollLockY || 0, 10)
              if (sc.scrollTop !== y) sc.scrollTop = y
            } catch (e) {
              // ignore
            }
          }
          sc.__scrollPreventHandler = prevent
          sc.__scrollKeyPreventHandler = preventKeys
          sc.__scrollSnapHandler = snapScroll
          try {
            sc.addEventListener('wheel', prevent, { passive: false })
            sc.addEventListener('touchmove', prevent, { passive: false })
            sc.addEventListener('scroll', snapScroll, { passive: true })
            // Also capture at the document level to block bubbling from descendants
            document.addEventListener('wheel', prevent, {
              passive: false,
              capture: true,
            })
            document.addEventListener('touchmove', prevent, {
              passive: false,
              capture: true,
            })
            window.addEventListener('keydown', preventKeys, { passive: false })
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const enableScroll = () => {
      try {
        const sc = overlayContainer.__scrollContainer || getScrollContainer()
        const isBody = sc === document.body || sc === document.documentElement
        if (isBody) {
          const y = parseInt(document.body.__scrollLockY || 0, 10)
          document.body.style.position = ''
          document.body.style.top = ''
          document.body.style.left = ''
          document.body.style.right = ''
          document.body.style.width = ''
          document.body.style.overflow = ''
          try {
            window.scrollTo(0, y)
          } catch (e) {
            // ignore
          }
          delete document.body.__scrollLockY
        } else {
          const y = parseInt(sc.__scrollLockY || 0, 10)
          sc.style.overflow = ''
          sc.style.touchAction = ''
          try {
            if (sc.__scrollPreventHandler) {
              sc.removeEventListener('wheel', sc.__scrollPreventHandler)
              sc.removeEventListener('touchmove', sc.__scrollPreventHandler)
            }
            if (sc.__scrollKeyPreventHandler) {
              window.removeEventListener(
                'keydown',
                sc.__scrollKeyPreventHandler
              )
            }
            if (sc.__scrollSnapHandler) {
              sc.removeEventListener('scroll', sc.__scrollSnapHandler)
            }
            // Remove document-level captures
            if (sc.__scrollPreventHandler) {
              document.removeEventListener(
                'wheel',
                sc.__scrollPreventHandler,
                true
              )
              document.removeEventListener(
                'touchmove',
                sc.__scrollPreventHandler,
                true
              )
            }
          } catch (e) {
            // ignore
          }
          try {
            sc.scrollTop = y
          } catch (e) {
            // ignore
          }
          delete sc.__scrollLockY
          delete sc.__scrollPreventHandler
          delete sc.__scrollKeyPreventHandler
          delete sc.__scrollSnapHandler
        }
      } catch (e) {
        // ignore
      }
    }

    const playIn = () => {
      try {
        overlayContainer.__overlayOpen = true
      } catch (e) {
        /* ignore */
      }
      // Reset pixel translation and set closed baseline: overlay at 110%
      try {
        gsap.set(cardsWrapper, { x: 0, xPercent: 0 })
        gsap.set(overlayContainer, { x: 0, xPercent: 110 })
      } catch (e) {
        // ignore
      }
      try {
        overlayContainer.style.display = 'flex'
      } catch (e) {
        // ignore
      }
      // Clear any card dimming when opening overlay
      try {
        const allCards = root.querySelectorAll('.project-card')
        allCards.forEach((c) => c.classList.remove('is-dimmed'))
      } catch (e) {
        // ignore
      }
      disableScroll()
      gsap.to(cardsWrapper, {
        xPercent: 110,
        duration: 1.2,
        ease: CustomEase.create('custom', easeCurve),
        overwrite: 'auto',
      })
      gsap.to(overlayContainer, {
        xPercent: 0,
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
      tl.to(cardsWrapper, { xPercent: 0, x: 0 }, 0)
      tl.to(overlayContainer, { xPercent: 110, x: 0 }, 0)
      tl.add(() => {
        try {
          overlayContainer.style.display = 'none'
          // Clear all highlights when closing
          const regions = mapRoot.querySelectorAll('.region')
          regions.forEach((r) => r.classList.remove('highlight'))
          markers.forEach((m) => m.classList.remove('highlight', 'dimmed'))
          const allCards = root.querySelectorAll('.project-card')
          allCards.forEach((c) => c.classList.remove('is-dimmed'))
        } catch (e) {
          // ignore
        }
        try {
          overlayContainer.__overlayOpen = false
        } catch (e) {
          /* ignore */
        }
        try {
          enableScroll()
        } catch (e) {
          // ignore
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

    // Allow external triggers (e.g., marker click) to open overlay for a project
    try {
      // Expose an imperative opener to avoid duplication
      overlayContainer.__openForProject = (detail) => {
        try {
          let projectKey = detail && detail.projectKey ? detail.projectKey : ''
          const regionKey = detail && detail.regionKey ? detail.regionKey : ''
          const pointKey = detail && detail.pointKey ? detail.pointKey : ''
          // Resolve missing projectKey from point/region if needed
          try {
            if (!projectKey) {
              let derived = null
              if (pointKey) {
                const byPoint = root.querySelector(
                  `.project-item[data-point="${pointKey}"]`
                )
                if (byPoint) derived = byPoint.getAttribute('data-project')
              }
              if (!derived && regionKey) {
                const byRegion = root.querySelector(
                  `.project-item[data-region="${regionKey}"]`
                )
                if (byRegion) derived = byRegion.getAttribute('data-project')
              }
              if (derived) projectKey = derived
            }
          } catch (e) {
            // ignore
          }
          if (projectKey) {
            showForProject(projectKey)
          }
          // Persist highlights similar to card click
          try {
            if (regionKey) {
              const regionId = `region-${regionKey}`
              const region = mapRoot.querySelector(`#${regionId}`)
              if (region) {
                region.classList.add('highlight')
                if (region.parentNode && region.parentNode.appendChild) {
                  region.parentNode.appendChild(region)
                }
              }
            }
            if (pointKey) {
              const pointId = `marker-${pointKey}`
              const point = mapRoot.querySelector(`#${pointId}`)
              if (point && point.classList) point.classList.add('highlight')
            }
          } catch (e) {
            // ignore
          }
          playIn()
        } catch (e) {
          // ignore
        }
      }
      // Expose helpers for external callers
      try {
        overlayContainer.__playOut = playOut
        overlayContainer.__playIn = playIn
        overlayContainer.__showForProject = showForProject
      } catch (e) {
        // ignore
      }
      if (!overlayContainer.__openEventBound) {
        overlayContainer.addEventListener('open-project', (event) => {
          overlayContainer.__openForProject(
            event && event.detail ? event.detail : {}
          )
        })
        overlayContainer.__openEventBound = true
      }
    } catch (e) {
      // ignore
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
              // Close overlay and fully consume the event so nothing beneath navigates
              playOut()
              try {
                if (ev && typeof ev.preventDefault === 'function')
                  ev.preventDefault()
                if (ev && typeof ev.stopPropagation === 'function')
                  ev.stopPropagation()
                if (ev && typeof ev.stopImmediatePropagation === 'function')
                  ev.stopImmediatePropagation()
              } catch (e2) {
                // ignore
              }
              return
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
    const regions = mapRoot.querySelectorAll('.region')
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
        // Cards behavior on card hover: dim other cards
        try {
          cards.forEach((c) => c.classList.remove('is-dimmed'))
          cards.forEach((c) => {
            if (c !== card) c.classList.add('is-dimmed')
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
        // Remove card dimming on leave
        try {
          cards.forEach((c) => c.classList.remove('is-dimmed'))
        } catch (e) {
          // ignore
        }
      })
    })

    // Dimming behavior when hovering markers: dim other project cards
    try {
      markers.forEach((marker) => {
        marker.addEventListener('mouseenter', () => {
          if (root.querySelector('.projects_overlays')?.__overlayOpen) return
          try {
            // Markers: highlight hovered, dim others
            markers.forEach((m) => m.classList.remove('highlight', 'dimmed'))
            marker.classList.add('highlight')
            markers.forEach((m) => {
              if (m !== marker) m.classList.add('dimmed')
            })
            const id = marker && marker.id ? String(marker.id) : ''
            let pointKey = ''
            if (id && id.toLowerCase().startsWith('marker-')) {
              pointKey = id.slice('marker-'.length)
            }
            if (!pointKey && marker.getAttribute) {
              pointKey = marker.getAttribute('data-point') || ''
            }
            const targetCard = Array.from(cards || []).find((c) => {
              const cardPoint = c && c.dataset ? String(c.dataset.point) : ''
              return cardPoint.toLowerCase() === String(pointKey).toLowerCase()
            })
            // Scroll the corresponding card into view (center), except last two -> bottom of section
            try {
              if (targetCard) {
                const getSC = () => {
                  try {
                    return (
                      root.querySelector('.page-wrap') ||
                      root.querySelector('.content-wrap') ||
                      root.querySelector('[data-barba="container"]') ||
                      document.scrollingElement ||
                      document.documentElement ||
                      document.body
                    )
                  } catch (e) {
                    return (
                      document.scrollingElement ||
                      document.documentElement ||
                      document.body
                    )
                  }
                }
                const sc = getSC()
                const isWindow =
                  sc === document.body || sc === document.documentElement
                const containerRect = isWindow
                  ? { top: 0, height: window.innerHeight }
                  : sc.getBoundingClientRect()
                const cardRect = targetCard.getBoundingClientRect()
                const currentScroll = isWindow
                  ? window.scrollY || window.pageYOffset || 0
                  : sc.scrollTop
                const contentY =
                  cardRect.top -
                  (isWindow ? 0 : containerRect.top) +
                  currentScroll
                const containerHeight = isWindow
                  ? window.innerHeight
                  : sc.clientHeight
                const centerTarget = Math.max(
                  0,
                  contentY - containerHeight / 2 + cardRect.height / 2
                )
                const cardsArr = Array.from(cards || [])
                const cardIndex = cardsArr.indexOf(targetCard)
                const isLastTwo =
                  cardIndex >= 0 && cardIndex >= cardsArr.length - 2
                const isFirst = cardIndex === 0
                let targetScroll = centerTarget
                try {
                  const sectionRect = cardsWrapper.getBoundingClientRect()
                  if (isFirst) {
                    const topTarget =
                      sectionRect.top -
                      (isWindow ? 0 : containerRect.top) +
                      currentScroll
                    targetScroll = Math.max(0, topTarget)
                  } else if (isLastTwo) {
                    const bottomTarget =
                      sectionRect.bottom -
                      (isWindow ? 0 : containerRect.top) +
                      currentScroll -
                      containerHeight
                    targetScroll = Math.max(0, bottomTarget)
                  }
                } catch (e) {
                  // ignore
                }
                try {
                  if (isWindow) {
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
                  } else {
                    sc.scrollTo({ top: targetScroll, behavior: 'smooth' })
                  }
                } catch (e) {
                  // ignore
                }
              }
            } catch (e) {
              // ignore
            }
            // Highlight corresponding region when hovering marker
            try {
              const regionKey =
                targetCard && targetCard.dataset
                  ? String(targetCard.dataset.region)
                  : ''
              if (regionKey) {
                const regionId = `region-${regionKey}`
                const getByIdCaseInsensitiveLocal = (container, rid) => {
                  if (!container || !rid) return null
                  const direct = container.querySelector(`#${rid}`)
                  if (direct) return direct
                  const targetLower = String(rid).toLowerCase()
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
                const regionEl = getByIdCaseInsensitiveLocal(mapRoot, regionId)
                if (regionEl) {
                  highlightRegion(regionEl)
                }
              }
            } catch (e) {
              // ignore
            }
            cards.forEach((c) => c.classList.remove('is-dimmed'))
            cards.forEach((c) => {
              if (targetCard && c !== targetCard) c.classList.add('is-dimmed')
            })
          } catch (e) {
            // ignore
          }
        })
        marker.addEventListener('click', (ev) => {
          try {
            ev.preventDefault()
            ev.stopPropagation()
            if (typeof ev.stopImmediatePropagation === 'function') {
              ev.stopImmediatePropagation()
            }
          } catch (e) {
            // ignore
          }
          try {
            const overlay = root.querySelector('.projects_overlays')
            if (!overlay) return
            // If already open: close
            if (overlay.__overlayOpen) {
              try {
                if (typeof overlay.__playOut === 'function') overlay.__playOut()
              } catch (e) {
                // ignore
              }
              return
            }
            // Resolve the corresponding project card by marker point
            const id = marker && marker.id ? String(marker.id) : ''
            let pointKey = ''
            if (id && id.toLowerCase().startsWith('marker-')) {
              pointKey = id.slice('marker-'.length)
            }
            if (!pointKey && marker.getAttribute) {
              pointKey = marker.getAttribute('data-point') || ''
            }
            const cardsArr = Array.from(cards || [])
            const targetCard = cardsArr.find((c) => {
              const cardPoint = c && c.dataset ? String(c.dataset.point) : ''
              return cardPoint.toLowerCase() === String(pointKey).toLowerCase()
            })
            if (!targetCard) return
            // Prefer triggering the exact same handler as a real card click
            // Prefer the .project-item mapping by point -> project
            let projectKey = ''
            try {
              const projItem = root.querySelector(
                `.project-item[data-point="${pointKey}"]`
              )
              if (projItem)
                projectKey = projItem.getAttribute('data-project') || ''
            } catch (e) {
              // ignore
            }
            if (!projectKey)
              projectKey = targetCard.getAttribute('data-project') || ''
            const regionKey = targetCard.dataset
              ? targetCard.dataset.region
              : ''
            let dispatched = false
            try {
              if (projectKey) {
                const clickable = root.querySelector(
                  `.project-item[data-project="${projectKey}"]`
                )
                if (clickable) {
                  const clickEvt = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                  })
                  clickable.dispatchEvent(clickEvt)
                  dispatched = true
                }
              }
            } catch (e) {
              // ignore
            }
            // Fallback to imperative open if no card element was found
            if (!dispatched) {
              try {
                if (typeof overlay.__openForProject === 'function') {
                  overlay.__openForProject({ projectKey, regionKey, pointKey })
                } else {
                  const evt = new CustomEvent('open-project', {
                    bubbles: false,
                    cancelable: true,
                    detail: { projectKey, regionKey, pointKey },
                  })
                  overlay.dispatchEvent(evt)
                }
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            // ignore
          }
        })
        marker.addEventListener('mouseleave', (ev) => {
          if (root.querySelector('.projects_overlays')?.__overlayOpen) return
          try {
            // Reset marker highlight/dim
            markers.forEach((m) => m.classList.remove('highlight', 'dimmed'))
            // If moving into the corresponding region, keep region highlighted
            try {
              const id = marker && marker.id ? String(marker.id) : ''
              let pointKey = ''
              if (id && id.toLowerCase().startsWith('marker-')) {
                pointKey = id.slice('marker-'.length)
              }
              if (!pointKey && marker.getAttribute) {
                pointKey = marker.getAttribute('data-point') || ''
              }
              const targetCard = Array.from(cards || []).find((c) => {
                const cardPoint = c && c.dataset ? String(c.dataset.point) : ''
                return (
                  cardPoint.toLowerCase() === String(pointKey).toLowerCase()
                )
              })
              const regionKey =
                targetCard && targetCard.dataset
                  ? String(targetCard.dataset.region)
                  : ''
              if (regionKey) {
                const regionId = `region-${regionKey}`
                const regionEl = mapRoot.querySelector(`#${regionId}`)
                if (
                  regionEl &&
                  ev &&
                  ev.relatedTarget &&
                  typeof ev.relatedTarget.closest === 'function' &&
                  ev.relatedTarget.closest(`#${regionId}`)
                ) {
                  // Moving into region: keep it highlighted
                  highlightRegion(regionEl)
                } else {
                  highlightRegion(null)
                }
              } else {
                highlightRegion(null)
              }
            } catch (e) {
              // ignore
            }
            cards.forEach((c) => c.classList.remove('is-dimmed'))
          } catch (e) {
            // ignore
          }
        })
      })
    } catch (e) {
      // ignore
    }

    // Region hover: add/remove highlight on the hovered region
    try {
      regions.forEach((region) => {
        region.addEventListener('mouseenter', () => {
          if (root.querySelector('.projects_overlays')?.__overlayOpen) return
          try {
            const canHighlight = region && region.classList
            if (canHighlight) {
              highlightRegion(region)
            }
          } catch (e) {
            // ignore
          }
        })
        region.addEventListener('mouseleave', () => {
          if (root.querySelector('.projects_overlays')?.__overlayOpen) return
          try {
            highlightRegion(null)
          } catch (e) {
            // ignore
          }
        })
      })
    } catch (e) {
      // ignore
    }

    // Fallback: delegated hover so fills/backgrounds inside regions also trigger highlight
    try {
      const onRegionOver = (ev) => {
        if (root.querySelector('.projects_overlays')?.__overlayOpen) return
        try {
          const target = ev && ev.target
          const region =
            target && typeof target.closest === 'function'
              ? target.closest('.region')
              : null
          if (region) highlightRegion(region)
        } catch (e) {
          // ignore
        }
      }
      const onRegionOut = (ev) => {
        if (root.querySelector('.projects_overlays')?.__overlayOpen) return
        try {
          const target = ev && ev.target
          const region =
            target && typeof target.closest === 'function'
              ? target.closest('.region')
              : null
          if (
            region &&
            ev &&
            ev.relatedTarget &&
            region.contains(ev.relatedTarget)
          ) {
            return
          }
          if (region) highlightRegion(null)
        } catch (e) {
          // ignore
        }
      }
      mapRoot.addEventListener('mouseover', onRegionOver)
      mapRoot.addEventListener('mouseout', onRegionOut)
    } catch (e) {
      // ignore
    }

    // Initialize overlays behavior
    projectsOverlay(root)
  } catch (err) {
    // ignore
  }
}
