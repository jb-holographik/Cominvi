import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { animateNavbarSpreadForGrid } from './nav'
import { initWorkshopsStickyImages } from './workshops'

gsap.registerPlugin(ScrollTrigger, CustomEase)
// Smooth, slightly springy step ease
if (!gsap.parseEase('machinesStep')) {
  CustomEase.create('machinesStep', 'M0,0 C0.6,0 0,1 1,1')
}

export function initTechnology(root = document) {
  // Support being called with the Barba container element itself
  try {
    const container = root && root.nodeType === 1 ? root : document
    const isSelfTechnology =
      container &&
      container.getAttribute &&
      container.getAttribute('data-barba-namespace') === 'technology'
    const page = isSelfTechnology
      ? container
      : container.querySelector('[data-barba-namespace="technology"]')
    if (!page) return
    // From here on, treat `root` as the page container for scoped queries
    root = page
  } catch (err) {
    // If anything goes wrong with detection, bail out to avoid double-binding
    return
  }

  const machinesWrapper = root.querySelector('.machines-wrapper')
  const machinesGridWrapper = root.querySelector('.machines-grid-wrapper')
  const gridToggle = root.querySelector('.toggle.is-white')
  const machines = root.querySelector('.machines')
  if (!machinesWrapper || !machines) return

  // Tablet detection for responsive animation values
  const getViewportWidth = () => {
    try {
      if (typeof window === 'undefined') return 0
      if (typeof window.innerWidth === 'number') return window.innerWidth
      let docEl = null
      if (typeof document !== 'undefined') {
        if (document.documentElement) {
          docEl = document.documentElement
        }
      }
      if (docEl && typeof docEl.clientWidth === 'number') {
        return docEl.clientWidth
      }
      return 0
    } catch (err) {
      return 0
    }
  }
  const isTablet = () => {
    const w = getViewportWidth()
    return w >= 768 && w <= 991
  }

  // Workshops images pin (2em from top)
  try {
    initWorkshopsStickyImages(root)
  } catch (err) {
    // ignore
  }

  // Logos slider control
  try {
    const control = root.querySelector('.logos-slider_control')
    const inner = root.querySelector('.logos-slider_inner')
    const toggle = control ? control.querySelector('.toggle.is-light') : null
    const options = toggle ? toggle.querySelectorAll('.toggle-option') : []
    const ids = toggle ? toggle.querySelectorAll('.toggle-id') : []
    const indicator = toggle ? toggle.querySelector('.toggle-indicator') : null
    const buttons = control ? control.querySelectorAll('button.body-m') : []
    const prevBtn = buttons && buttons.length ? buttons[0] : null
    const nextBtn = buttons && buttons.length > 1 ? buttons[1] : null

    if (
      control &&
      inner &&
      toggle &&
      options &&
      options.length >= 2 &&
      ids &&
      ids.length >= 2 &&
      indicator &&
      prevBtn &&
      nextBtn
    ) {
      try {
        inner.style.willChange = 'transform'
      } catch (e) {
        // ignore
      }
      // Collect logo sets (page 1 = default logos, page 2 = .is-2)
      const allLogos = Array.from(root.querySelectorAll('.logos-slider_logo'))
      const logosSet1 = allLogos.filter((el) => !el.classList.contains('is-2'))
      const logosSet2 = allLogos.filter((el) => el.classList.contains('is-2'))
      const moveIndicator = (idx) => {
        try {
          const baseLeft = options[0] ? options[0].offsetLeft : 0
          const targetLeft = options[idx] ? options[idx].offsetLeft : 0
          indicator.style.transform = `translate3d(${Math.max(
            0,
            targetLeft - baseLeft
          )}px, 0, 0)`
        } catch (e) {
          // ignore
        }
      }
      const setButtonsFor = (idx) => {
        // idx 0: Prev dim (is-o-30), Next active (is-white)
        // idx 1: Prev active (is-white), Next dim (is-o-30)
        const prevActive = idx === 1
        const nextActive = idx === 0
        prevBtn.classList.toggle('is-white', prevActive)
        prevBtn.classList.toggle('is-o-30', !prevActive)
        nextBtn.classList.toggle('is-white', nextActive)
        nextBtn.classList.toggle('is-o-30', !nextActive)
      }
      const setIdsFor = (idx) => {
        ids.forEach((el, i) => {
          if (i === idx) el.classList.add('is-active')
          else el.classList.remove('is-active')
        })
      }
      let logosTl = null
      const showLogosSet = (idx) => {
        const i = Math.max(0, Math.min(1, idx))
        try {
          if (!gsap.parseEase('wsEase'))
            CustomEase.create('wsEase', 'M0,0 C0.6,0 0,1 1,1')
        } catch (e) {
          // ignore
        }
        const duration = 0.5
        const ease = gsap.parseEase('wsEase') || ((t) => t)
        const show = i === 0 ? logosSet1 : logosSet2
        const hide = i === 0 ? logosSet2 : logosSet1
        try {
          // Cancel any in-flight sequence
          if (logosTl) {
            logosTl.kill()
            logosTl = null
          }
          gsap.killTweensOf([show, hide])
          const tl = gsap.timeline({ defaults: { ease, duration } })
          logosTl = tl
          tl.eventCallback('onComplete', () => {
            logosTl = null
          })
          if (hide && hide.length) {
            tl.to(hide, { opacity: 0 }).add(() => {
              try {
                hide.forEach((el) => {
                  el.style.display = 'none'
                })
              } catch (e) {
                // ignore
              }
            })
          }
          if (show && show.length) {
            tl.add(() => {
              try {
                show.forEach((el) => {
                  el.style.display = 'block'
                })
                gsap.set(show, { opacity: 0 })
              } catch (e) {
                // ignore
              }
            })
            tl.to(show, { opacity: 1 })
          }
        } catch (e) {
          // ignore
        }
      }
      const setPage = (idx) => {
        const i = Math.max(0, Math.min(1, idx))
        showLogosSet(i)
        setIdsFor(i)
        moveIndicator(i)
        setButtonsFor(i)
      }

      // Wire events
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault()
        setPage(1)
      })
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault()
        setPage(0)
      })
      options[0].addEventListener('click', (e) => {
        e.preventDefault()
        setPage(0)
      })
      options[1].addEventListener('click', (e) => {
        e.preventDefault()
        setPage(1)
      })
      // Initial state
      try {
        // Ensure logos initial visibility: show default, hide .is-2
        const allLogosInit = Array.from(
          root.querySelectorAll('.logos-slider_logo')
        )
        const logos1Init = allLogosInit.filter(
          (el) => !el.classList.contains('is-2')
        )
        const logos2Init = allLogosInit.filter((el) =>
          el.classList.contains('is-2')
        )
        if (logos1Init.length) {
          gsap.set(logos1Init, { opacity: 1, display: 'block' })
        }
        if (logos2Init.length) {
          gsap.set(logos2Init, { opacity: 0, display: 'none' })
        }
      } catch (e) {
        try {
          // ignore
        } catch (err) {
          // ignore
        }
      }
      setIdsFor(0)
      moveIndicator(0)
      setButtonsFor(0)
    }
  } catch (err) {
    // ignore
  }

  // Post-init safety: after the destination page is fully laid out, refresh ScrollTrigger once more
  try {
    requestAnimationFrame(() => {
      try {
        if (
          window.ScrollTrigger &&
          typeof window.ScrollTrigger.refresh === 'function'
        ) {
          window.ScrollTrigger.refresh()
        }
      } catch (e) {
        // ignore
      }
    })
  } catch (e) {
    // ignore
  }

  // Ensure we translate only scrolling content, not the sticky container itself
  // Keep `.machines_images` and `.machines_button-wrap` OUTSIDE of `.machines-inner`
  let content = machines.querySelector('.machines-inner')
  if (!content) {
    content = document.createElement('div')
    content.className = 'machines-inner'
    const children = Array.from(machines.childNodes)
    const imagesEl = machines.querySelector('.machines_images')
    const buttonEl = machines.querySelector('.machines_button-wrap')
    children.forEach((node) => {
      if (node === imagesEl || node === buttonEl) return
      content.appendChild(node)
    })
    machines.appendChild(content)
    if (imagesEl && imagesEl.parentNode !== machines) {
      machines.insertBefore(imagesEl, content)
    }
    if (buttonEl && buttonEl.parentNode !== machines) {
      machines.insertBefore(buttonEl, content)
    }
  } else {
    // If `.machines_images` accidentally ended up inside `.machines-inner`, move it out
    const imagesInInner = content.querySelector('.machines_images')
    if (imagesInInner) {
      content.removeChild(imagesInInner)
      machines.insertBefore(imagesInInner, content)
    }
    const buttonInInner = content.querySelector('.machines_button-wrap')
    if (buttonInInner) {
      content.removeChild(buttonInInner)
      machines.insertBefore(buttonInInner, content)
    }
  }

  // Images list movement (11.25em per item)
  const imagesRoot = machines.querySelector('.machines_images') || machines
  const imagesList =
    machines.querySelector('.machines_images-list') ||
    imagesRoot.querySelector('.machines_images-list') ||
    null
  const getImagesBasePx = () => {
    try {
      const baseEl = imagesList || imagesRoot || machines
      const fs = window.getComputedStyle(baseEl).fontSize
      const px = parseFloat(fs || '16') || 16
      return px * 11.2
    } catch (err) {
      return 16 * 11.2
    }
  }
  let imagesStepPx = getImagesBasePx()
  let imagesYBeforeOpen = 0
  let closedItemEmHeight = 0

  const getStepProgress = (distance) => {
    if (!offsets.length || distance <= 0) return 0
    const lastIdx = offsets.length - 1
    if (distance >= offsets[lastIdx]) return lastIdx
    let lo = 0
    let hi = lastIdx
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (offsets[mid] <= distance) lo = mid + 1
      else hi = mid
    }
    const upper = lo
    const lower = upper - 1
    const span = Math.max(1, (offsets[upper] || 0) - (offsets[lower] || 0))
    const frac = Math.max(
      0,
      Math.min(1, (distance - (offsets[lower] || 0)) / span)
    )
    return lower + frac
  }
  const setImagesByDistance = (distance) => {
    if (!imagesList) return
    const progress = getStepProgress(distance)
    const y = -Math.round(progress * imagesStepPx)
    try {
      gsap.set(imagesList, { y })
    } catch (err) {
      // ignore
    }
  }

  // Set .machines-list-item height based on measured .machine_name (converted to em)
  const setItemHeightFromName = () => {
    try {
      const firstName = root.querySelector('.machine_name')
      const sampleItem = firstName && firstName.closest('.machines-list-item')
      if (!firstName || !sampleItem) return
      // Include padding: use clientHeight (content + padding), fallback to offset/bounding rect
      const nameRect = firstName.getBoundingClientRect()
      const hCandidates = [
        typeof firstName.scrollHeight === 'number' ? firstName.scrollHeight : 0,
        typeof firstName.clientHeight === 'number' ? firstName.clientHeight : 0,
        typeof firstName.offsetHeight === 'number' ? firstName.offsetHeight : 0,
        nameRect && nameRect.height ? nameRect.height : 0,
      ]
      const nameHeightPx = Math.max.apply(null, hCandidates)
      const fs =
        parseFloat(window.getComputedStyle(sampleItem).fontSize || '16') || 16
      const emHeight = nameHeightPx > 0 ? nameHeightPx / fs : 0
      if (emHeight > 0) {
        // Clear any explicit height set previously on machine_item
        root.querySelectorAll('.machine_item').forEach((el) => {
          el.style.height = ''
        })
        // Apply height to .machines-list-item (bleu)
        root.querySelectorAll('.machines-list-item').forEach((el) => {
          el.style.height = `${emHeight}em`
        })
        closedItemEmHeight = emHeight
        // Recompute steps and wrapper because heights changed
        measureSteps()
        imagesStepPx = getImagesBasePx()
        updateWrapperHeight()
        try {
          st.refresh()
        } catch (err) {
          // ignore
        }
      }
    } catch (err) {
      // ignore
    }
  }

  // Reveal machines_images when machines reaches 53% from top
  try {
    if (imagesRoot && imagesRoot !== machines) {
      gsap.set(imagesRoot, { width: 0, height: 0 })
      ScrollTrigger.create({
        trigger: machines,
        start: 'top 53%',
        once: true,
        onEnter: () => {
          gsap.to(imagesRoot, {
            width: isTablet() ? '11.8em' : '13.5em',
            height: '11.2em',
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || ((t) => t),
          })
        },
        scroller: window.__lenisWrapper || undefined,
      })
    }
  } catch (err) {
    // ignore
  }

  // ---------- Open / Close controls ----------
  // ---------- Grid/List Toggle ----------
  try {
    if (gridToggle && machinesGridWrapper && machinesWrapper) {
      const indicator = gridToggle.querySelector('.toggle-indicator')
      const optGrid = gridToggle.querySelector('[data-toggle="grid"]')
      const optList = gridToggle.querySelector('[data-toggle="list"]')
      let currentMode = null
      let modeTl = null
      const setMode = (mode) => {
        const isGrid = mode === 'grid'
        // Update toggle indicator and ids immediately
        try {
          const active = gridToggle.querySelector(
            `.toggle-option[data-toggle="${mode}"]`
          )
          if (indicator) {
            if (isGrid) indicator.classList.remove('is-grid')
            else indicator.classList.add('is-grid')
          }
          gridToggle
            .querySelectorAll('.toggle-id')
            .forEach((el) => el.classList.remove('is-active'))
          const id = active ? active.querySelector('.toggle-id') : null
          if (id) id.classList.add('is-active')
        } catch (err) {
          // ignore
        }
        // Initial setup (no animation on first call)
        if (currentMode == null) {
          machinesWrapper.style.display = isGrid ? 'none' : 'block'
          machinesGridWrapper.style.display = isGrid ? 'block' : 'none'
          try {
            gsap.set([machinesWrapper, machinesGridWrapper], {
              clearProps: 'opacity,transform',
            })
          } catch (e) {
            // ignore
          }
          currentMode = mode
          return
        }
        if (currentMode === mode) return
        const fromEl =
          currentMode === 'grid' ? machinesGridWrapper : machinesWrapper
        const toEl = isGrid ? machinesGridWrapper : machinesWrapper
        try {
          if (modeTl) {
            modeTl.kill()
            modeTl = null
          }
          gsap.killTweensOf([fromEl, toEl])
          const ease = gsap.parseEase('machinesStep') || ((t) => t)
          const total = 1.2
          const outDur = 0.3
          const inDur = Math.max(0, total - outDur)
          // Prepare incoming lazily after fade-out to avoid layout jump/covering
          const tl = gsap.timeline()
          modeTl = tl
          tl.to(fromEl, { opacity: 0, duration: outDur, ease }, 0)
            .add(() => {
              try {
                fromEl.style.display = 'none'
                gsap.set(fromEl, { clearProps: 'opacity,transform' })
              } catch (e) {
                // ignore
              }
            })
            .add(() => {
              try {
                gsap.set(toEl, { display: 'block', opacity: 0, y: '8em' })
              } catch (e) {
                // ignore
              }
            })
            .to(toEl, { opacity: 1, y: '0em', duration: inDur, ease })
            .add(() => {
              try {
                gsap.set(toEl, { clearProps: 'opacity,transform' })
              } catch (e) {
                // ignore
              }
            })
          tl.eventCallback('onComplete', () => {
            modeTl = null
          })
          currentMode = mode
        } catch (e) {
          // Fallback without animation
          machinesWrapper.style.display = isGrid ? 'none' : 'block'
          machinesGridWrapper.style.display = isGrid ? 'block' : 'none'
          currentMode = mode
        }
      }
      if (optGrid)
        optGrid.addEventListener('click', (e) => {
          e.preventDefault()
          setMode('grid')
        })
      if (optList)
        optList.addEventListener('click', (e) => {
          e.preventDefault()
          setMode('list')
        })
      // initial state: list visible, grid hidden and indicator aligned to list
      machinesGridWrapper.style.display = 'none'
      setMode('list')
    }
  } catch (err) {
    // ignore
  }
  const lockScroll = () => {
    if (isScrollLocked) return
    try {
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop()
      }
    } catch (err) {
      // ignore
    }
    try {
      const targetEl =
        scroller && scroller !== window ? scroller : document.documentElement
      if (targetEl) {
        targetEl.style.overflow = 'hidden'
        targetEl.style.touchAction = 'none'
      }
      if (targetEl !== document.documentElement) {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        document.body.style.touchAction = 'none'
      }
    } catch (err) {
      // ignore
    }
    isScrollLocked = true
  }
  const unlockScroll = () => {
    if (!isScrollLocked) return
    try {
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start()
      }
    } catch (err) {
      // ignore
    }
    try {
      const targetEl =
        scroller && scroller !== window ? scroller : document.documentElement
      if (targetEl) {
        targetEl.style.overflow = ''
        targetEl.style.touchAction = ''
      }
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    } catch (err) {
      // ignore
    }
    isScrollLocked = false
  }

  // ---------- Grid view: expand item fullscreen and push others ----------
  try {
    let gridList = null
    let gridItems = []
    let gridButtons = []
    if (machinesGridWrapper) {
      gridList = machinesGridWrapper.querySelector('.machines-grid_list')
      gridItems = Array.from(
        machinesGridWrapper.querySelectorAll('.machines-grid_item')
      )
      gridButtons = Array.from(
        machinesGridWrapper.querySelectorAll('.machines-grid_button')
      )
    }

    if (
      machinesGridWrapper &&
      gridList &&
      gridItems.length &&
      gridButtons.length
    ) {
      let openItem = null
      let openClone = null
      let resizeHandler = null
      // Keep a persistent description overlay and its mask while open
      let descOverlay = null
      let descMaskSvgEl = null
      let descMaskHoleEl = null
      let descMaskUpdate = null
      // Close on user interactions while open
      let removeInteractionHandlers = null
      // Track opening timeline to handle mid-open closes safely
      let openingTimeline = null

      const clearItemInlineStyles = (el) => {
        try {
          el.style.position = ''
          el.style.left = ''
          el.style.top = ''
          el.style.width = ''
          el.style.height = ''
          el.style.padding = ''
          el.style.zIndex = ''
          el.style.margin = ''
        } catch (e) {
          // ignore
        }
      }

      const pushOthersOut = (selected, tl) => {
        const selRect = selected.getBoundingClientRect()
        const cx = selRect.left + selRect.width / 2
        const cy = selRect.top + selRect.height / 2
        gridItems.forEach((item) => {
          if (item === selected) return
          const r = item.getBoundingClientRect()
          const ox = r.left + r.width / 2
          const oy = r.top + r.height / 2
          const dx = ox - cx
          const dy = oy - cy
          const sameRowThreshold = selRect.height * 0.6
          const sameRow = Math.abs(dy) <= sameRowThreshold
          let toVars = { x: 0, y: 0 }
          if (sameRow) {
            // Always push horizontally for items in the same row
            toVars.x =
              dx < 0
                ? -(r.left + r.width + 50)
                : window.innerWidth - r.left + 50
          } else {
            // Push vertically for items in other rows
            toVars.y =
              dy < 0
                ? -(r.top + r.height + 50)
                : window.innerHeight - r.top + 50
          }
          const anim = {
            x: toVars.x,
            y: toVars.y,
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || 'power2.inOut',
            overwrite: 'auto',
          }
          if (tl) tl.to(item, anim, 0)
          else gsap.to(item, anim)
        })
      }

      const resetOthers = (tl) => {
        gridItems.forEach((item) => {
          if (item === openItem) return
          const anim = {
            x: 0,
            y: 0,
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || 'power2.inOut',
            clearProps: 'transform',
            overwrite: 'auto',
          }
          if (tl) tl.to(item, anim, 0)
          else gsap.to(item, anim)
        })
      }

      // Split a paragraph into visual lines and return inner wrappers for animation
      const splitLines = (textEl) => {
        try {
          if (!textEl || textEl.__gridLines) return textEl && textEl.__gridLines
          const original = textEl.textContent || ''
          const words = original.split(' ')
          // Prime with word spans to measure natural wrapping
          textEl.textContent = ''
          const tempWordSpans = []
          words.forEach((w, idx) => {
            const span = document.createElement('span')
            span.textContent = w
            span.style.display = 'inline-block'
            textEl.appendChild(span)
            if (idx < words.length - 1)
              textEl.appendChild(document.createTextNode(' '))
            tempWordSpans.push(span)
          })
          // Group by offsetTop (tolerate 1-2px)
          const lines = []
          let currentTop = null
          let current = []
          tempWordSpans.forEach((span) => {
            const top = span.offsetTop
            if (currentTop == null || Math.abs(top - currentTop) < 2) {
              current.push(span.textContent || '')
              currentTop = top
            } else {
              lines.push(current)
              current = [span.textContent || '']
              currentTop = top
            }
          })
          if (current.length) lines.push(current)
          // Rebuild with line wrappers
          textEl.textContent = ''
          const innerList = []
          lines.forEach((lineWords) => {
            const wrap = document.createElement('span')
            wrap.style.display = 'block'
            wrap.style.overflow = 'hidden'
            const inner = document.createElement('span')
            inner.style.display = 'inline-block'
            // compose words back with spaces
            lineWords.forEach((w, idx) => {
              const ws = document.createElement('span')
              ws.textContent = w
              ws.style.display = 'inline'
              inner.appendChild(ws)
              if (idx < lineWords.length - 1)
                inner.appendChild(document.createTextNode(' '))
            })
            wrap.appendChild(inner)
            textEl.appendChild(wrap)
            innerList.push(inner)
          })
          textEl.__gridLines = innerList
          return innerList
        } catch (e) {
          return []
        }
      }

      // (removed maintainFullscreenSize; handled via resizeHandler)

      const openGridItem = (item) => {
        if (openItem === item) return
        openItem = item
        // Capture current scroll to prevent any auto-scroll on click/focus
        let savedTop = 0
        let savedLeft = 0
        let wrapper = null
        try {
          wrapper = window.__lenisWrapper || null
          if (wrapper) {
            savedTop = wrapper.scrollTop
            savedLeft = wrapper.scrollLeft || 0
          } else {
            savedTop =
              window.pageYOffset || document.documentElement.scrollTop || 0
            savedLeft =
              window.pageXOffset || document.documentElement.scrollLeft || 0
          }
        } catch (e) {
          // ignore
        }
        lockScroll()
        // Restore scroll immediately after locking to neutralize any jump
        try {
          if (wrapper) {
            wrapper.scrollTop = savedTop
            if (typeof wrapper.scrollLeft === 'number')
              wrapper.scrollLeft = savedLeft
          } else {
            window.scrollTo(savedLeft, savedTop)
          }
        } catch (e) {
          // ignore
        }
        const r = item.getBoundingClientRect()
        // Create a visual duplicate to animate, keep original in flow (opacity 0)
        try {
          openClone = item.cloneNode(true)
          // Remove the name wrap from the clone; keep it only in the original
          try {
            const clonedName = openClone.querySelector(
              '.machines-grid_name-wrap'
            )
            if (clonedName && clonedName.parentNode)
              clonedName.parentNode.removeChild(clonedName)
          } catch (e0) {
            // ignore
          }
          // Remove the inner name and close button from the clone; they'll be rendered via the overlay only
          try {
            const cloneNameInnerEl = openClone.querySelector(
              '.machines-grid_name-inner'
            )
            if (cloneNameInnerEl && cloneNameInnerEl.parentNode)
              cloneNameInnerEl.parentNode.removeChild(cloneNameInnerEl)
          } catch (e0a) {
            // ignore
          }
          try {
            const cloneCloseBtnEl = openClone.querySelector(
              '.machines-grid_close-button'
            )
            if (cloneCloseBtnEl && cloneCloseBtnEl.parentNode)
              cloneCloseBtnEl.parentNode.removeChild(cloneCloseBtnEl)
          } catch (e0b) {
            // ignore
          }
          // Base rect is the image wrapper if present, else the item rect
          const imgWrap = item.querySelector('.machines-grid_img-wrap')
          const br = imgWrap ? imgWrap.getBoundingClientRect() : r
          openClone.classList.add('machines-grid_item-clone')
          // Prevent first-frame flash: hide until initial layout is applied
          try {
            openClone.style.visibility = 'hidden'
          } catch (evis) {
            /* ignore */
          }
          document.body.appendChild(openClone)
          gsap.set(openClone, {
            position: 'fixed',
            left: br.left,
            top: br.top,
            width: br.width,
            height: br.height,
            padding: 0,
            margin: 0,
            zIndex: 6,
            overflow: 'hidden',
            pointerEvents: 'none',
          })
          // Hide the original image while opening so the clone visually takes over
          try {
            if (imgWrap) gsap.set(imgWrap, { opacity: 0 })
          } catch (eimg) {
            // ignore
          }
          // Keep original visible; the clone will cover it progressively
        } catch (e) {
          // Fallback: animate the original if cloning fails
          openClone = null
          gsap.set(item, {
            position: 'fixed',
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            padding: 0,
            margin: 0,
            zIndex: 5,
          })
        }
        const targetEl = openClone || item
        const tl = gsap.timeline({ defaults: { overwrite: 'auto' } })
        // Keep a reference to the opening animation timeline
        openingTimeline = tl
        tl.to(
          targetEl,
          {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            padding: '1em',
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || 'power2.out',
          },
          0
        )
        // Drop reference when the opening animation completes or is interrupted
        try {
          tl.eventCallback('onComplete', () => {
            openingTimeline = null
          })
          tl.eventCallback('onInterrupt', () => {
            openingTimeline = null
          })
        } catch (e) {
          // ignore
        }

        // Ensure only the clone's close button appears (display:flex immediately, then fade to 1)
        try {
          if (openClone) {
            const cloneCloseBtn = openClone.querySelector(
              '.machines-grid_close-button'
            )
            if (cloneCloseBtn) {
              tl.set(cloneCloseBtn, { display: 'flex', opacity: 0 }, 0)
              tl.to(
                cloneCloseBtn,
                {
                  opacity: 1,
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.out',
                },
                0
              )
            }
          }
        } catch (eCloseBtn) {
          // ignore
        }

        // Move clone name inner into view (translateY(0)) and ensure only it is visible
        try {
          if (openClone) {
            const cloneNameInner = openClone.querySelector(
              '.machines-grid_name-inner'
            )
            if (cloneNameInner) {
              tl.set(cloneNameInner, { opacity: 1 }, 0)
              tl.to(
                cloneNameInner,
                {
                  y: 0,
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.out',
                },
                0
              )
            }
          }
        } catch (eName) {
          // ignore
        }

        // Animate the clone's image from a fixed base (left:50%, top:50%, width:24em)
        try {
          if (openClone) {
            const clonedImg = openClone.querySelector('.machines-grid_img')
            if (clonedImg) {
              const startLeft = '50%'
              const startTop = '50%'
              const startWidth = '24em'
              // Persist for reverse
              clonedImg.dataset.gridStartLeft = startLeft
              clonedImg.dataset.gridStartTop = startTop
              clonedImg.dataset.gridStartWidth = startWidth
              // Place image absolutely inside clone at its current position
              gsap.set(clonedImg, {
                position: 'absolute',
                left: startLeft,
                top: startTop,
                width: startWidth,
                height: 'auto',
                margin: 0,
                zIndex: 2,
                pointerEvents: 'none',
                objectFit: 'contain',
              })
              tl.to(
                clonedImg,
                {
                  left: '80%',
                  top: '70%',
                  width: '60em',
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.out',
                },
                0
              )
            }
          }
        } catch (eImgAnim) {
          // ignore
        }
        // Reveal the clone only after initial positions are set
        try {
          tl.set(openClone, { visibility: 'visible' }, 0)
        } catch (evis2) {
          /* ignore */
        }
        // Spread navbar horizontally like on scroll down
        try {
          animateNavbarSpreadForGrid(true, root)
        } catch (e) {
          // ignore
        }
        // Animate the clone description lines from y 100% to 0%
        try {
          if (openClone) {
            const cloneDescText = openClone.querySelector('.is-grid-desc')
            const lineInners = splitLines(cloneDescText)
            if (lineInners && lineInners.length) {
              gsap.set(lineInners, { yPercent: 100 })
              tl.to(
                lineInners,
                {
                  yPercent: 0,
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.out',
                },
                0
              )
            }
          }
        } catch (eDesc) {
          // ignore
        }
        // Fade in description overlay (fixed) masked to the clone bounds
        try {
          const origDesc = item.querySelector('.machines-grid_desc')
          if (origDesc) {
            const dr = origDesc.getBoundingClientRect()
            const NS = 'http://www.w3.org/2000/svg'
            const svg = document.createElementNS(NS, 'svg')
            const defs = document.createElementNS(NS, 'defs')
            const mask = document.createElementNS(NS, 'mask')
            const bg = document.createElementNS(NS, 'rect')
            const hole = document.createElementNS(NS, 'rect')
            const vw = window.innerWidth
            const vh = window.innerHeight
            const maskId = `gridDescMask_${Date.now()}`
            svg.setAttribute('width', '0')
            svg.setAttribute('height', '0')
            svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`)
            svg.setAttribute('preserveAspectRatio', 'none')
            mask.setAttribute('id', maskId)
            mask.setAttribute('maskUnits', 'userSpaceOnUse')
            mask.setAttribute('maskContentUnits', 'userSpaceOnUse')
            mask.setAttribute('style', 'mask-type:luminance;')
            bg.setAttribute('x', '0')
            bg.setAttribute('y', '0')
            bg.setAttribute('width', String(vw))
            bg.setAttribute('height', String(vh))
            bg.setAttribute('fill', 'black')
            const br2 = openClone ? openClone.getBoundingClientRect() : r
            hole.setAttribute('x', String(br2.left))
            hole.setAttribute('y', String(br2.top))
            hole.setAttribute('width', String(br2.width))
            hole.setAttribute('height', String(br2.height))
            hole.setAttribute('fill', 'white')
            mask.appendChild(bg)
            mask.appendChild(hole)
            defs.appendChild(mask)
            svg.appendChild(defs)
            document.body.appendChild(svg)
            // Build a full-viewport overlay container and place desc inside at its fixed viewport coords
            const overlayContainer = document.createElement('div')
            overlayContainer.className = 'grid-desc-overlay'
            document.body.appendChild(overlayContainer)
            gsap.set(overlayContainer, {
              position: 'fixed',
              left: 0,
              top: 0,
              width: window.innerWidth,
              height: window.innerHeight,
              margin: 0,
              zIndex: 7,
              pointerEvents: 'auto',
              opacity: 0,
            })
            // Use webkitMask first for Safari/WebKit compatibility; fallback to standard mask
            overlayContainer.style.webkitMaskImage = `url(#${maskId})`
            overlayContainer.style.maskImage = `url(#${maskId})`
            const overlayDesc = origDesc.cloneNode(true)
            overlayContainer.appendChild(overlayDesc)
            gsap.set(overlayDesc, {
              position: 'absolute',
              left: dr.left,
              top: dr.top,
              width: dr.width,
              height: dr.height,
              margin: 0,
              opacity: 1,
              pointerEvents: 'none',
            })
            // Animate overlay description by lines from y 100% to 0%
            try {
              const overlayGridDesc = overlayDesc.querySelector('.is-grid-desc')
              const lineInnersOverlay = splitLines(overlayGridDesc)
              if (lineInnersOverlay && lineInnersOverlay.length) {
                gsap.set(lineInnersOverlay, { yPercent: 100 })
                tl.to(
                  lineInnersOverlay,
                  {
                    yPercent: 0,
                    duration: 1.2,
                    ease: gsap.parseEase('machinesStep') || 'power2.out',
                  },
                  0
                )
              }
            } catch (eDescOv) {
              // ignore
            }
            // Also move name inner from ORIGINAL item into the same overlay so it isn't clipped by clone overflow
            try {
              if (openClone) {
                const sourceNameInner = item.querySelector(
                  '.machines-grid_name-inner'
                )
                if (sourceNameInner) {
                  const overlayName = sourceNameInner.cloneNode(true)
                  overlayContainer.appendChild(overlayName)
                  gsap.set(overlayName, {
                    position: 'absolute',
                    left: '3em',
                    top: '3em',
                    margin: 0,
                    display: 'block',
                    opacity: 1,
                    y: '-8em',
                    pointerEvents: 'none',
                  })
                  // Split words, then letters inside each word (no mid-word breaks), animate letters from yPercent:-100 to 0
                  try {
                    const textEl =
                      overlayName.querySelector('.body-xl') || overlayName
                    if (textEl && !textEl.__gridSplit) {
                      const original = textEl.textContent || ''
                      const frag = document.createDocumentFragment()
                      const words = original.split(' ')
                      words.forEach((word, wIdx) => {
                        const wordWrap = document.createElement('span')
                        wordWrap.style.display = 'inline-block'
                        wordWrap.style.whiteSpace = 'nowrap'
                        // build letters inside word
                        for (let i = 0; i < word.length; i++) {
                          const ch = word[i]
                          const letter = document.createElement('span')
                          letter.textContent = ch
                          letter.style.display = 'inline-block'
                          wordWrap.appendChild(letter)
                        }
                        frag.appendChild(wordWrap)
                        // re-add normal breaking space between words (except after last word)
                        if (wIdx < words.length - 1) {
                          frag.appendChild(document.createTextNode(' '))
                        }
                      })
                      textEl.textContent = ''
                      textEl.appendChild(frag)
                      textEl.__gridSplit = true
                    }
                    const lettersRoot =
                      overlayName.querySelector('.body-xl') || overlayName
                    const letters = Array.from(
                      lettersRoot.querySelectorAll('span > span')
                    )
                    if (letters.length) {
                      gsap.set(letters, { yPercent: -100 })
                      tl.to(
                        letters,
                        {
                          yPercent: 0,
                          duration: 1.2,
                          ease: gsap.parseEase('machinesStep') || 'power2.out',
                          stagger: 0.02,
                        },
                        0
                      )
                    }
                  } catch (esplit) {
                    // ignore
                  }
                  tl.to(
                    overlayName,
                    {
                      y: 0,
                      duration: 1.2,
                      ease: gsap.parseEase('machinesStep') || 'power2.out',
                    },
                    0
                  )
                }
                // Move clone close button into the overlay as well
                const sourceCloseBtn = item.querySelector(
                  '.machines-grid_close-button'
                )
                if (sourceCloseBtn) {
                  const overlayClose = sourceCloseBtn.cloneNode(true)
                  overlayContainer.appendChild(overlayClose)
                  gsap.set(overlayClose, {
                    position: 'absolute',
                    left: 'auto',
                    right: '3em',
                    top: '3em',
                    margin: 0,
                    display: 'flex',
                    opacity: 0,
                    zIndex: 8,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                  })
                  tl.to(
                    overlayClose,
                    {
                      opacity: 1,
                      duration: 1.2,
                      ease: gsap.parseEase('machinesStep') || 'power2.out',
                    },
                    0
                  )

                  // GSAP-driven hover interactions for the overlay close button
                  try {
                    const ensureLetters = (labelEl) => {
                      if (!labelEl) return []
                      if (labelEl.__split) return labelEl.__split
                      const text = labelEl.textContent || ''
                      const frag = document.createDocumentFragment()
                      const letters = []
                      for (let i = 0; i < text.length; i++) {
                        const ch = text[i]
                        const span = document.createElement('span')
                        span.textContent = ch === ' ' ? '\u00A0' : ch
                        span.style.display = 'inline-block'
                        frag.appendChild(span)
                        letters.push(span)
                      }
                      labelEl.textContent = ''
                      labelEl.appendChild(frag)
                      labelEl.__split = letters
                      return letters
                    }

                    const setupCloseHover = (btn) => {
                      if (!btn) return
                      const inner = btn.querySelector(
                        '.machines-grid_close-button_inner'
                      )
                      const row1Label =
                        btn.querySelector(
                          '.machines-grid_close-button_row:nth-of-type(1) .button_label'
                        ) ||
                        btn.querySelector(
                          '.machine-grid_close-button_row:nth-of-type(1) .button_label'
                        )
                      const row2Label =
                        btn.querySelector(
                          '.machines-grid_close-button_row:nth-of-type(2) .button_label'
                        ) ||
                        btn.querySelector(
                          '.machine-grid_close-button_row:nth-of-type(2) .button_label'
                        )
                      const plus =
                        btn.querySelector(
                          '.machines-grid_close-button_row:nth-of-type(2) .is-plus'
                        ) ||
                        btn.querySelector(
                          '.machine-grid_close-button_row:nth-of-type(2) .is-plus'
                        )

                      const letters1 = ensureLetters(row1Label)
                      const letters2 = ensureLetters(row2Label)

                      // Initial states
                      if (inner) gsap.set(inner, { yPercent: 0 })
                      if (plus)
                        gsap.set(plus, {
                          rotate: 0,
                          transformOrigin: '50% 50%',
                        })
                      if (letters1.length) gsap.set(letters1, { yPercent: 0 })
                      if (letters2.length) gsap.set(letters2, { yPercent: 100 })

                      const tlHover = gsap.timeline({
                        paused: true,
                        defaults: {
                          duration: 0.5,
                          ease: gsap.parseEase('machinesStep') || 'power2.out',
                        },
                      })
                      if (inner) tlHover.to(inner, { yPercent: -50 }, 0)
                      tlHover.to(btn, { backgroundColor: 'var(--accent)' }, 0)
                      if (plus) tlHover.to(plus, { rotate: 90 }, 0)
                      if (letters2.length)
                        tlHover.to(letters2, { yPercent: 0, stagger: 0.02 }, 0)
                      if (letters1.length)
                        tlHover.to(
                          letters1,
                          { yPercent: -100, stagger: 0.02 },
                          0
                        )

                      btn.__hoverTl = tlHover
                      btn.addEventListener('mouseenter', () => {
                        btn.__hoverTl && btn.__hoverTl.play()
                      })
                      btn.addEventListener('mouseleave', () => {
                        btn.__hoverTl && btn.__hoverTl.reverse()
                      })
                    }

                    setupCloseHover(overlayClose)
                  } catch (ehover) {
                    // ignore
                  }
                }
              }
            } catch (eov) {
              // ignore
            }
            // Store for later (stay visible after open)
            descOverlay = overlayContainer
            descMaskSvgEl = svg
            descMaskHoleEl = hole
            tl.to(
              overlayContainer,
              {
                opacity: 1,
                duration: 1.2,
                ease: gsap.parseEase('machinesStep') || 'power2.out',
              },
              0
            )
            // Also clip the clone's name and close button with the same mask
            try {
              if (openClone) {
                const nameInnerEl = openClone.querySelector(
                  '.machines-grid_name-inner'
                )
                const closeBtnEl = openClone.querySelector(
                  '.machines-grid_close-button'
                )
                const applyMask = (el) => {
                  if (!el) return
                  el.style.webkitMaskImage = `url(#${maskId})`
                  el.style.maskImage = `url(#${maskId})`
                  el.style.webkitMaskRepeat = 'no-repeat'
                  el.style.maskRepeat = 'no-repeat'
                  el.style.webkitMaskSize = '100% 100%'
                  el.style.maskSize = '100% 100%'
                  el.style.webkitMaskPosition = '0 0'
                  el.style.maskPosition = '0 0'
                }
                applyMask(nameInnerEl)
                applyMask(closeBtnEl)
              }
            } catch (em) {
              // ignore
            }
            // Animate mask hole to follow the clone expansion (from clone rect to full viewport)
            // Prepare onUpdate to keep mask hole following the clone's live bounds (with corner radius)
            const computeRadiusPx = (el) => {
              try {
                const cs = window.getComputedStyle(el)
                const v = cs.borderTopLeftRadius || '0'
                const num = parseFloat(v) || 0
                return num
              } catch (e) {
                return 0
              }
            }
            descMaskUpdate = () => {
              try {
                const el = openClone || item
                const rr = el.getBoundingClientRect()
                descMaskHoleEl.setAttribute('x', String(rr.left))
                descMaskHoleEl.setAttribute('y', String(rr.top))
                descMaskHoleEl.setAttribute('width', String(rr.width))
                descMaskHoleEl.setAttribute('height', String(rr.height))
                const rad = computeRadiusPx(el)
                if (rad > 0) {
                  descMaskHoleEl.setAttribute('rx', String(rad))
                  descMaskHoleEl.setAttribute('ry', String(rad))
                }
              } catch (e) {
                // ignore
              }
            }
            // Initial sync and hook into timeline updates
            descMaskUpdate()
            tl.eventCallback('onUpdate', descMaskUpdate)
          }
        } catch (ed) {
          // ignore
        }
        // Fade out all grid item names (wrap) and hide all name inners while opening
        try {
          gridItems.forEach((gi) => {
            const name = gi.querySelector('.machines-grid_name-wrap')
            if (name) {
              tl.to(
                name,
                {
                  opacity: 0,
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.out',
                },
                0
              )
            }
            // Hide inner names instantly so only the clone's name appears
            const nameInner = gi.querySelector('.machines-grid_name-inner')
            if (nameInner) {
              tl.set(nameInner, { opacity: 0 }, 0)
            }
          })
        } catch (en) {
          // ignore
        }
        pushOthersOut(item, tl)
        // Keep sizing correct on resize while open
        resizeHandler = () => {
          const el = openClone || item
          try {
            gsap.set(el, {
              left: 0,
              top: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            })
          } catch (e) {
            // ignore
          }
          try {
            if (descMaskUpdate) descMaskUpdate()
          } catch (e) {
            // ignore
          }
        }
        window.addEventListener('resize', resizeHandler)

        // Add interaction handlers (click anywhere, wheel/touchmove attempts) to close
        try {
          if (removeInteractionHandlers) removeInteractionHandlers()
          const onDocClickCapture = (ev) => {
            try {
              // Ignore clicks on the item button itself to avoid immediate close if any event slips
              if (
                ev &&
                ev.target &&
                ev.target.closest &&
                ev.target.closest('.machines-grid_button')
              )
                return
            } catch (e) {
              // ignore
            }
            closeGridItem()
          }
          const onWheel = () => closeGridItem()
          const onTouchMove = () => closeGridItem()
          // Defer adding to next frame so we don't catch the opening click
          requestAnimationFrame(() => {
            document.addEventListener('click', onDocClickCapture, true)
            window.addEventListener('wheel', onWheel, {
              passive: true,
              capture: true,
            })
            window.addEventListener('touchmove', onTouchMove, {
              passive: true,
              capture: true,
            })
          })
          removeInteractionHandlers = () => {
            try {
              document.removeEventListener('click', onDocClickCapture, true)
            } catch (e) {
              // ignore
            }
            try {
              window.removeEventListener('wheel', onWheel, {
                passive: true,
                capture: true,
              })
            } catch (e) {
              // ignore
            }
            try {
              window.removeEventListener('touchmove', onTouchMove, {
                passive: true,
                capture: true,
              })
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const closeGridItem = () => {
        if (!openItem) return
        const item = openItem
        openItem = null
        // If user closes during opening, stop the opening timeline first
        try {
          if (openingTimeline) {
            openingTimeline.kill()
            openingTimeline = null
          }
        } catch (e) {
          // ignore
        }
        window.removeEventListener('resize', resizeHandler)
        resizeHandler = null
        // Remove interaction handlers
        try {
          if (removeInteractionHandlers) removeInteractionHandlers()
        } catch (e) {
          // ignore
        }
        // Animate back to the image wrapper's rect (or item rect if missing)
        const imgWrapClose = item.querySelector('.machines-grid_img-wrap')
        const gridRect = imgWrapClose
          ? imgWrapClose.getBoundingClientRect()
          : item.getBoundingClientRect()
        const el = openClone || item
        if (!openClone) {
          // If we animated the original, ensure it starts from its current visual position
          const currentRect = el.getBoundingClientRect()
          gsap.set(el, {
            position: 'fixed',
            left: currentRect.left,
            top: currentRect.top,
            width: currentRect.width,
            height: currentRect.height,
            padding: '2em',
            zIndex: 5,
          })
        }
        const tl = gsap.timeline({
          onComplete: () => {
            if (openClone) {
              try {
                openClone.remove()
              } catch (e) {
                // ignore
              }
              openClone = null
            } else {
              clearItemInlineStyles(item)
            }
            // Clean up desc overlay and mask
            try {
              if (descOverlay) {
                descOverlay.remove()
              }
              if (descMaskSvgEl) {
                descMaskSvgEl.remove()
              }
            } catch (ecl) {
              // ignore
            }
            descOverlay = null
            descMaskSvgEl = null
            descMaskHoleEl = null
            // Restore names opacity for all items after closing
            try {
              gridItems.forEach((gi) => {
                const name = gi.querySelector('.machines-grid_name-wrap')
                if (name) gsap.set(name, { opacity: 1 })
                const nameInner = gi.querySelector('.machines-grid_name-inner')
                if (nameInner) gsap.set(nameInner, { opacity: 0 })
              })
            } catch (er) {
              // ignore
            }
            // Restore original image opacity after closing
            try {
              const imgWrap = item.querySelector('.machines-grid_img-wrap')
              if (imgWrap) gsap.set(imgWrap, { opacity: 1 })
            } catch (eop) {
              // ignore
            }
            // Final sweep: remove any stray clones that might still be in the DOM
            try {
              const strayClones = document.querySelectorAll(
                '.machines-grid_item-clone'
              )
              strayClones.forEach((node) => {
                try {
                  if (node && node.parentNode) node.parentNode.removeChild(node)
                } catch (e) {
                  // ignore
                }
              })
            } catch (e) {
              // ignore
            }
            unlockScroll()
          },
          onInterrupt: () => {
            // If timeline is interrupted, ensure clone and overlays are removed soon after
            try {
              setTimeout(() => {
                try {
                  if (openClone) {
                    openClone.remove()
                    openClone = null
                  }
                } catch (e) {
                  // ignore
                }
                try {
                  if (descOverlay) descOverlay.remove()
                  if (descMaskSvgEl) descMaskSvgEl.remove()
                  descOverlay = null
                  descMaskSvgEl = null
                  descMaskHoleEl = null
                } catch (e) {
                  // ignore
                }
              }, 0)
            } catch (e) {
              // ignore
            }
          },
        })
        // Bring navbar back to 2em in parallel with the close animation
        try {
          animateNavbarSpreadForGrid(false, root)
        } catch (e) {
          // ignore
        }
        tl.to(
          el,
          {
            left: gridRect.left,
            top: gridRect.top,
            width: gridRect.width,
            height: gridRect.height,
            padding: 0,
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || 'power2.inOut',
          },
          0
        )

        // Reverse clone image back to its starting offsets/size inside clone
        try {
          if (openClone) {
            const clonedImg = openClone.querySelector('.machines-grid_img')
            if (clonedImg) {
              const startLeft = clonedImg.dataset.gridStartLeft || '50%'
              const startTop = clonedImg.dataset.gridStartTop || '50%'
              const startWidth = clonedImg.dataset.gridStartWidth || '24em'
              tl.to(
                clonedImg,
                {
                  left: startLeft,
                  top: startTop,
                  width: startWidth,
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.inOut',
                },
                0
              )
            }
          }
        } catch (eImgRev) {
          // ignore
        }
        // Fade out desc overlay and move mask hole back to image rect while closing
        try {
          if (descOverlay) {
            // Animate overlay description lines out (0% -> 100%) during close
            try {
              const overlayGridDesc = descOverlay.querySelector('.is-grid-desc')
              const lineInnersOverlay = splitLines(overlayGridDesc)
              if (lineInnersOverlay && lineInnersOverlay.length) {
                gsap.set(lineInnersOverlay, { yPercent: 0 })
                tl.to(
                  lineInnersOverlay,
                  {
                    yPercent: 100,
                    duration: 1.2,
                    ease: gsap.parseEase('machinesStep') || 'power2.inOut',
                  },
                  0
                )
              }
            } catch (eOL) {
              // ignore
            }
            // Fade description overlay out during the close animation
            tl.to(
              descOverlay,
              {
                opacity: 0,
                duration: 1.2,
                ease: gsap.parseEase('machinesStep') || 'power2.inOut',
              },
              0
            )
          }
          // Animate clone description lines out as well
          try {
            if (openClone) {
              const cloneGridDesc = openClone.querySelector('.is-grid-desc')
              const lineInnersClone = splitLines(cloneGridDesc)
              if (lineInnersClone && lineInnersClone.length) {
                gsap.set(lineInnersClone, { yPercent: 0 })
                tl.to(
                  lineInnersClone,
                  {
                    yPercent: 100,
                    duration: 1.2,
                    ease: gsap.parseEase('machinesStep') || 'power2.inOut',
                  },
                  0
                )
              }
            }
          } catch (eCL) {
            // ignore
          }
          if (descMaskHoleEl) {
            tl.to(
              descMaskHoleEl,
              {
                attr: {
                  x: gridRect.left,
                  y: gridRect.top,
                  width: gridRect.width,
                  height: gridRect.height,
                },
                duration: 1.2,
                ease: gsap.parseEase('machinesStep') || 'power2.inOut',
              },
              0
            )
          }
          // Move overlay name inner out of view again (translateY(-8em))
          try {
            if (descOverlay) {
              const overlayNameInner = descOverlay.querySelector(
                '.machines-grid_name-inner'
              )
              if (overlayNameInner) {
                tl.to(
                  overlayNameInner,
                  {
                    y: '-8em',
                    duration: 1.2,
                    ease: gsap.parseEase('machinesStep') || 'power2.inOut',
                  },
                  0
                )
              }
            }
          } catch (eNameClose) {
            // ignore
          }
        } catch (eclose) {
          // ignore
        }
        // Fade back in names (wrap) for all grid items while closing
        try {
          gridItems.forEach((gi) => {
            const name = gi.querySelector('.machines-grid_name-wrap')
            if (name) {
              tl.to(
                name,
                {
                  opacity: 1,
                  duration: 1.2,
                  ease: gsap.parseEase('machinesStep') || 'power2.inOut',
                },
                0
              )
            }
          })
        } catch (en) {
          // ignore
        }
        resetOthers(tl)
      }

      // Assign stable unique ids to items/buttons for robust mapping
      try {
        const listItems = Array.from(
          gridList.querySelectorAll('.machines-grid_item')
        )
        listItems.forEach((it, i) => {
          const uid = it.dataset.gridUid || String(i + 1)
          it.dataset.gridUid = uid
          const b = it.querySelector('.machines-grid_button')
          if (b) b.dataset.gridUid = uid
        })
      } catch (e) {
        // ignore
      }

      // Helper: find the visually nearest item to a click point (favor vertical proximity)
      const findNearestItemByPoint = (x, y) => {
        try {
          const items = Array.from(
            gridList.querySelectorAll('.machines-grid_item')
          )
          let best = null
          let bestScore = Infinity
          items.forEach((it) => {
            const r = it.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dy = Math.abs(y - cy)
            const dx = Math.abs(x - cx)
            // Strongly prioritize vertical distance to avoid selecting far below in same column
            const score = dy * 1000 + dx
            if (score < bestScore) {
              bestScore = score
              best = it
            }
          })
          return best
        } catch (e) {
          return null
        }
      }

      // Always keep all name inners hidden by default in grid view
      const hideAllNameInners = () => {
        try {
          const inners = machinesGridWrapper.querySelectorAll(
            '.machines-grid_name-inner'
          )
          inners.forEach((el) => gsap.set(el, { opacity: 0 }))
        } catch (e) {
          // ignore
        }
      }
      hideAllNameInners()

      // Per-item handler to avoid any ambiguity with ordering/duplication
      const attachClickForItem = (item) => {
        try {
          const btn = item.querySelector('.machines-grid_button')
          if (!btn || btn.__gridHandlerAttached) return
          btn.__gridHandlerAttached = true
          btn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (typeof e.stopImmediatePropagation === 'function') {
              e.stopImmediatePropagation()
            }
            try {
              btn.blur()
              if (document.activeElement && document.activeElement.blur)
                document.activeElement.blur()
            } catch (e2) {
              // ignore
            }
            // Resolve the target by click position to avoid any overlay/duplication issues
            const target = findNearestItemByPoint(e.clientX, e.clientY) || item
            if (openItem && openItem === target) closeGridItem()
            else openGridItem(target)
          })
        } catch (e) {
          // ignore
        }
      }

      gridItems.forEach((it) => attachClickForItem(it))

      // Also support close via inner close button when available
      machinesGridWrapper
        .querySelectorAll(
          '.machines-grid_close-button, .machines-grid_button_label'
        )
        .forEach((el) => {
          el.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (openItem) closeGridItem()
          })
        })
    }
  } catch (err) {
    // ignore
  }
  const getCurrentDistance = () => {
    try {
      const y = Number(gsap.getProperty(content, 'y')) || 0
      const maxDist = offsets[offsets.length - 1] || 0
      return Math.max(0, Math.min(maxDist, -y))
    } catch (err) {
      return st.scroll() - st.start
    }
  }
  const getCurrentIndex = () => {
    const dist = getCurrentDistance()
    return getNearestStepForScroll(dist)
  }
  const markActiveImage = (index) => {
    try {
      const rootEl = imagesRoot || machines
      const items = rootEl.querySelectorAll('.machines_images-item')
      if (!items || !items.length) return
      items.forEach((el, i) => {
        if (i === index) el.classList.add('is-active')
        else el.classList.remove('is-active')
      })
    } catch (err) {
      // ignore
    }
  }
  const getPairForIndex = (index) => {
    const stickyItems = machines.querySelectorAll('.machines-list-item')
    const bottom =
      root.querySelector('.machines-bottom') ||
      document.querySelector('.machines-bottom')
    const bottomItems = bottom
      ? bottom.querySelectorAll('.machines-list-item')
      : []
    const pair = []
    if (stickyItems[index]) pair.push(stickyItems[index])
    if (bottomItems[index]) pair.push(bottomItems[index])
    return pair
  }

  const machineOpen = () => {
    const index = getCurrentIndex()
    const pair = getPairForIndex(index)
    if (pair.length === 0) return
    lockScroll()
    try {
      // Measure inner height in em for the selected item
      const item = pair[0]
      const inner = item.querySelector('.machine_item')
      const fs = parseFloat(window.getComputedStyle(item).fontSize || '16')
      const innerHpx = inner ? inner.getBoundingClientRect().height : 0
      // Add list-item's own vertical padding
      const itemCS = window.getComputedStyle(item)
      const pt = parseFloat(itemCS.paddingTop || '0') || 0
      const pb = parseFloat(itemCS.paddingBottom || '0') || 0
      const hpx = innerHpx + pt + pb
      const hem = fs ? hpx / fs : 0
      const openEm = hem > 0 ? hem + 1.5 : 0
      if (openEm > 0) {
        pair.forEach((el) => {
          gsap.to(el, {
            height: `${openEm}em`,
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || ((t) => t),
          })
        })
      }
    } catch (err) {
      // ignore
    }
    try {
      const btnWrap = machines.querySelector('.machines_button-wrap')
      const btns = btnWrap ? btnWrap.querySelectorAll('.machines_button') : null
      if (btns && btns.length)
        gsap.to(btns, {
          yPercent: -100,
          duration: 1.2,
          ease: gsap.parseEase('machinesStep') || ((t) => t),
        })
      // Rotate the plus icon inside the close button
      const closePlus = btnWrap
        ? btnWrap.querySelector('.machines_button.is-close > .is-plus')
        : null
      if (closePlus)
        gsap.to(closePlus, {
          rotate: 135,
          duration: 1.2,
          ease: gsap.parseEase('machinesStep') || ((t) => t),
        })
    } catch (err) {
      // ignore
    }
    try {
      if (imagesRoot && imagesRoot !== machines) {
        // Capture the current list translation so we can counter it while open
        try {
          const dist = getCurrentDistance()
          setImagesByDistance(dist)
          if (imagesList) {
            imagesYBeforeOpen = Number(gsap.getProperty(imagesList, 'y')) || 0
          }
        } catch (err) {
          // ignore
        }
        imagesRoot.classList.add('is-open')
        gsap.to(imagesRoot, {
          width: isTablet() ? '18.1em' : '28em',
          height: isTablet() ? '13.2em' : '23.313em',
          duration: 1.2,
          ease: gsap.parseEase('machinesStep') || ((t) => t),
          onUpdate: () => {
            try {
              const h = imagesRoot.getBoundingClientRect().height || 0
              const items = (imagesRoot || machines).querySelectorAll(
                '.machines_images-item.is-active'
              )
              if (h > 0 && items && items.length) {
                items.forEach((el) => (el.style.height = `${Math.round(h)}px`))
              }
            } catch (err) {
              // ignore
            }
          },
        })
        // Ensure active image is marked and positioned at top:0 (CSS handles positioning)
        try {
          const items = (imagesRoot || machines).querySelectorAll(
            '.machines_images-item'
          )
          const idx = index
          items.forEach((el, i) => {
            if (i === idx) el.classList.add('is-active')
            else el.classList.remove('is-active')
          })
        } catch (err) {
          // ignore
        }
      }
      // Do not touch inner items/list during open; container resize is sufficient
    } catch (err) {
      // ignore
    }
  }

  const machineClose = () => {
    const index = getCurrentIndex()
    const pair = getPairForIndex(index)
    if (pair.length === 0) return
    const heightEm = closedItemEmHeight || 0
    try {
      if (heightEm > 0) {
        pair.forEach((el) => {
          gsap.to(el, {
            height: `${heightEm}em`,
            duration: 1.2,
            ease: gsap.parseEase('machinesStep') || ((t) => t),
          })
        })
      }
    } catch (err) {
      // ignore
    }
    try {
      const btnWrap = machines.querySelector('.machines_button-wrap')
      const btns = btnWrap ? btnWrap.querySelectorAll('.machines_button') : null
      if (btns && btns.length)
        gsap.to(btns, {
          yPercent: 0,
          duration: 1.2,
          ease: gsap.parseEase('machinesStep') || ((t) => t),
        })
    } catch (err) {
      // ignore
    }
    try {
      if (imagesRoot && imagesRoot !== machines) {
        gsap.to(imagesRoot, {
          width: isTablet() ? '11.8em' : '13.5em',
          height: '11.2em',
          duration: 1.2,
          ease: gsap.parseEase('machinesStep') || ((t) => t),
          onComplete: () => {
            // Ensure images list transform is synced before restoring transform
            try {
              if (imagesList) {
                // Restore exact y to avoid any visual jump
                gsap.set(imagesList, { y: imagesYBeforeOpen || 0 })
              } else {
                const dist = getCurrentDistance()
                setImagesByDistance(dist)
              }
              requestAnimationFrame(() => {
                try {
                  imagesRoot.classList.remove('is-open')
                  unlockScroll()
                } catch (err) {
                  // ignore
                }
              })
            } catch (err) {
              // ignore
            }
          },
          onUpdate: () => {
            try {
              const h = imagesRoot.getBoundingClientRect().height || 0
              const items = (imagesRoot || machines).querySelectorAll(
                '.machines_images-item.is-active'
              )
              if (h > 0 && items && items.length) {
                items.forEach((el) => (el.style.height = `${Math.round(h)}px`))
              }
            } catch (err) {
              // ignore
            }
          },
        })
      }
      // Do not touch inner items/list during close; container resize is sufficient
      const btnWrap = machines.querySelector('.machines_button-wrap')
      const closePlus = btnWrap
        ? btnWrap.querySelector('.machines_button.is-close > .is-plus')
        : null
      if (closePlus)
        gsap.to(closePlus, {
          rotate: 0,
          duration: 1.2,
          ease: gsap.parseEase('machinesStep') || ((t) => t),
        })
    } catch (err) {
      // ignore
    }
  }

  // Wire buttons
  try {
    machines.machineOpen = machineOpen
    machines.machineClose = machineClose
    const btnWrap = machines.querySelector('.machines_button-wrap')
    if (btnWrap) {
      const buttons = btnWrap.querySelectorAll('.machines_button')
      if (buttons[0]) buttons[0].addEventListener('click', machineOpen)
      if (buttons[1]) buttons[1].addEventListener('click', machineClose)
    }
    // Also toggle open/close when clicking a list item (no extra behavior)
    try {
      const listItems = machines.querySelectorAll('.machines-list-item')
      listItems.forEach((item) => {
        if (item.__listOpenAttached) return
        item.__listOpenAttached = true
        item.addEventListener('click', (e) => {
          try {
            if (
              e &&
              e.target &&
              e.target.closest &&
              e.target.closest('.machines_button')
            )
              return
            e.preventDefault()
            e.stopPropagation()
          } catch (er) {
            // ignore
          }
          try {
            const isOpen =
              imagesRoot && imagesRoot.classList
                ? imagesRoot.classList.contains('is-open')
                : false
            if (isOpen) machineClose()
            else machineOpen()
          } catch (toggleErr) {
            // fallback open
            machineOpen()
          }
        })
      })
    } catch (e) {
      // ignore
    }
  } catch (err) {
    // ignore
  }
  let stepHeight = 0
  let isActive = false
  let currentStep = -1
  const scroller =
    window.__lenisWrapper || root.querySelector('.page-wrap') || window

  // Measured per-item heights (including margins) and cumulative offsets
  let itemHeights = []
  let offsets = []

  const measureSteps = () => {
    const items = Array.from(machines.querySelectorAll('.machines-list-item'))
    const newHeights = []
    let cumulative = 0
    const newOffsets = []
    for (let i = 0; i < items.length; i += 1) {
      const el = items[i]
      const rect = el.getBoundingClientRect()
      const cs = window.getComputedStyle(el)
      const mt = parseFloat(cs.marginTop || '0') || 0
      const mb = parseFloat(cs.marginBottom || '0') || 0
      const h = Math.max(0, rect.height + mt + mb)
      newHeights.push(h)
      if (i === 0) newOffsets.push(0)
      else {
        cumulative += newHeights[i - 1]
        newOffsets.push(cumulative)
      }
    }
    itemHeights = newHeights
    offsets = newOffsets
    // Fallback step height for thresholds and initial estimates
    if (itemHeights.length > 0) stepHeight = itemHeights[0]
  }

  measureSteps()

  // Stepping is handled programmatically; no continuous mapping needed

  const st = ScrollTrigger.create({
    trigger: machines,
    start: 'top 50%',
    end: () => {
      measureSteps()
      const totalDistance = offsets[offsets.length - 1] || 0
      return `+=${Math.max(1, Math.ceil(totalDistance))}`
    },
    onToggle: (self) => {
      isActive = self.isActive
      if (isActive) {
        // Snap current step to nearest at activation
        const dist = self.scroll() - self.start
        const nearest = getNearestStepForScroll(dist)
        currentStep = Math.max(0, nearest)
        if (offsets.length > 0)
          gsap.set(content, { y: -Math.round(offsets[currentStep] || 0) })
      } else {
        wheelAccumulator = 0
      }
    },
    onUpdate: (self) => {
      // Continuous follow of scroll during movement; snapping happens only on stop
      try {
        const dist = self.scroll() - self.start
        const maxDist = offsets[offsets.length - 1] || 0
        const clamped = Math.max(0, Math.min(maxDist, dist))
        gsap.set(content, { y: -Math.round(clamped) })
        setImagesByDistance(clamped)
        // Update active image in real-time so the image under the line is marked
        const idx = getNearestStepForScroll(clamped)
        markActiveImage(idx)
      } catch (err) {
        // ignore
      }
    },
    scroller: window.__lenisWrapper || undefined,
  })

  // Apply the same easing to page scroll while sticky
  // Adaptive snap duration bounds (seconds)
  const SNAP_MIN = 0.1
  const SNAP_MAX = 0.28
  let isWheelAnimating = false
  let wheelAccumulator = 0
  let listObserver = null
  let detachContentSync = null
  let pendingSteps = 0
  let queuedDir = 0
  let queuedDuration = SNAP_MIN
  let lastScrollMagnitude = 0
  let softSnapTimer = null
  let isScrollLocked = false

  // Soft snap is disabled during scrolling; we only snap on stop now
  const STOP_DEBOUNCE_MS = 140

  // softSnapToNearest removed (no longer used)

  const scheduleStrongSnap = () => {
    try {
      if (softSnapTimer) clearTimeout(softSnapTimer)
    } catch (err) {
      // ignore
    }
    softSnapTimer = setTimeout(() => {
      if (!isActive || isWheelAnimating) return
      // compute nearest AT THE TIME OF STOP using current content transform if available
      let dist = 0
      try {
        const y = Number(gsap.getProperty(content, 'y')) || 0
        const maxDist = offsets[offsets.length - 1] || 0
        dist = Math.max(0, Math.min(maxDist, -y))
      } catch (err) {
        dist = st.scroll() - st.start
      }
      const nearest = getNearestStepForScroll(dist)
      queuedDuration = getSnapDuration(
        lastScrollMagnitude,
        itemHeights[nearest] || stepHeight
      )
      scrollToIndex(nearest, queuedDuration)
    }, STOP_DEBOUNCE_MS)
  }

  const getSnapDuration = (magnitude, heightForNorm) => {
    const unit = Math.max(24, (heightForNorm || stepHeight || 0) * 0.8)
    const norm = Math.max(0, Math.min(1, unit ? magnitude / unit : 0))
    // faster scroll (higher norm) -> shorter duration
    const dur = SNAP_MAX - (SNAP_MAX - SNAP_MIN) * norm
    return Math.max(SNAP_MIN, Math.min(SNAP_MAX, dur))
  }

  const getTotalSteps = () => {
    return Math.max(0, offsets.length - 1)
  }

  const updateWrapperHeight = () => {
    // Ensure wrapper has enough scrollable height for all steps while sticky element stays in view
    if (offsets.length === 0) measureSteps()
    const stickyHeight = machines.getBoundingClientRect().height || 0
    const totalScroll = Math.max(0, offsets[offsets.length - 1] || 0)
    const targetHeight = Math.max(stickyHeight + totalScroll, stickyHeight)
    if (targetHeight > 0) {
      machinesWrapper.style.height = `${Math.ceil(targetHeight)}px`
    }
  }

  // Note: getEarlySnapPx and getIndexBelowLine are no longer used

  const getNearestStepForScroll = (distance) => {
    if (offsets.length === 0) return 0
    if (distance <= 0) return 0
    const lastIdx = offsets.length - 1
    if (distance >= offsets[lastIdx]) return lastIdx
    // Binary search for closest offset
    let lo = 0
    let hi = lastIdx
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const val = offsets[mid]
      if (val === distance) return mid
      if (val < distance) lo = mid + 1
      else hi = mid - 1
    }
    // lo is first index with offset > distance; compare hi and lo
    const lowerIdx = Math.max(0, hi)
    const upperIdx = Math.min(lastIdx, lo)
    const dLower = Math.abs(distance - offsets[lowerIdx])
    const dUpper = Math.abs(distance - offsets[upperIdx])
    return dLower <= dUpper ? lowerIdx : upperIdx
  }

  // removed unused getIndexBelowLine

  const ensureCurrentStep = () => {
    if (currentStep < 0) {
      const approx = Math.round((st.scroll() - st.start) / (stepHeight || 1))
      currentStep = Math.max(0, Math.min(approx, getTotalSteps()))
    }
  }

  const performStep = (dir, durationOverride) => {
    if (offsets.length === 0) measureSteps()
    const easeFn = gsap.parseEase('machinesStep') || ((t) => t)
    const start = st.start
    const totalSteps = getTotalSteps()
    if (currentStep < 0) {
      const dist = st.scroll() - start
      const approx = getNearestStepForScroll(dist)
      currentStep = Math.max(0, Math.min(approx, totalSteps))
    }
    const nextStep = Math.max(0, Math.min(currentStep + dir, totalSteps))
    if (nextStep === currentStep) return
    const fromOffset = offsets[currentStep] || 0
    const toOffset = offsets[nextStep] || 0
    const target = start + toOffset
    const currentScroll = st.scroll()
    const delta = target - currentScroll
    const isTinyDelta = Math.abs(delta) < 1
    // prepare content-scroll sync
    if (typeof detachContentSync === 'function') {
      try {
        ScrollTrigger.removeEventListener('update', detachContentSync)
      } catch (err) {
        // ignore
      }
      detachContentSync = null
    }
    const syncHandler = () => {
      try {
        const s = st.scroll()
        const s0 = start + fromOffset
        const s1 = start + toOffset
        const denom = s1 - s0 || 1
        const t = Math.max(0, Math.min(1, (s - s0) / denom))
        const y = -Math.round(fromOffset + (toOffset - fromOffset) * t)
        gsap.set(content, { y })
        if (Math.abs(s - s1) < 0.5) {
          try {
            ScrollTrigger.removeEventListener('update', syncHandler)
          } catch (err) {
            // ignore
          }
          detachContentSync = null
        }
      } catch (err) {
        // ignore
      }
    }
    detachContentSync = syncHandler
    const afterComplete = () => {
      isWheelAnimating = false
      try {
        if (typeof detachContentSync === 'function') {
          ScrollTrigger.removeEventListener('update', detachContentSync)
        }
      } catch (err) {
        // ignore
      }
      detachContentSync = null
      // trigger queued steps if any
      if (pendingSteps > 0) {
        pendingSteps -= 1
        performStep(queuedDir, queuedDuration)
      }
    }
    try {
      const durationSec =
        durationOverride ||
        getSnapDuration(
          lastScrollMagnitude,
          itemHeights[currentStep] || stepHeight
        )
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        isWheelAnimating = true
        if (isTinyDelta) {
          // Force sync when delta is too small and Lenis might ignore it
          window.scrollTo(0, target)
          ScrollTrigger.update()
        } else {
          window.lenis.scrollTo(target, {
            duration: durationSec,
            easing: easeFn,
            lock: true,
          })
        }
        ScrollTrigger.addEventListener('update', syncHandler)
        // Animate content for visible snap in parallel with scroll
        try {
          gsap.killTweensOf(content)
          gsap.to(content, {
            y: -Math.round(toOffset),
            ease: 'machinesStep',
            duration: durationSec,
          })
        } catch (err) {
          // ignore
        }
        // safety completion
        setTimeout(() => {
          afterComplete()
        }, Math.round(durationSec * 1000 + 120))
        currentStep = nextStep
      } else if (scroller && scroller !== window) {
        isWheelAnimating = true
        ScrollTrigger.addEventListener('update', syncHandler)
        if (isTinyDelta) {
          scroller.scrollTop = target
          ScrollTrigger.update()
          afterComplete()
          try {
            gsap.set(content, { y: -Math.round(toOffset) })
          } catch (err) {
            // ignore
          }
        } else {
          gsap.to(scroller, {
            scrollTop: target,
            duration: durationSec,
            ease: 'machinesStep',
            onComplete: () => {
              afterComplete()
            },
          })
        }
        // Animate content for visible snap
        try {
          gsap.killTweensOf(content)
          gsap.to(content, {
            y: -Math.round(toOffset),
            ease: 'machinesStep',
            duration: durationSec,
          })
        } catch (err) {
          // ignore
        }
        currentStep = nextStep
      } else {
        // Fallback: immediate if no Lenis and no element scroller
        window.scrollTo(0, target)
        ScrollTrigger.update()
        gsap.set(content, { y: -Math.round(toOffset) })
        currentStep = nextStep
      }
    } catch (err) {
      // ignore
    }
  }

  const scrollToIndex = (index, durationOverride) => {
    if (typeof index !== 'number') return
    const total = getTotalSteps()
    const clamped = Math.max(0, Math.min(index, total))
    const dist = st.scroll() - st.start
    const currentIndex = getNearestStepForScroll(dist)
    const dir = clamped > currentIndex ? 1 : clamped < currentIndex ? -1 : 0
    const toOffset = offsets[clamped] || 0
    const durationSec =
      durationOverride ||
      getSnapDuration(lastScrollMagnitude, itemHeights[clamped] || stepHeight)
    if (dir === 0) {
      try {
        const target = st.start + toOffset
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(target, {
            duration: durationSec,
            easing: gsap.parseEase('machinesStep') || ((t) => t),
            lock: true,
          })
        } else if (scroller && scroller !== window) {
          gsap.to(scroller, {
            scrollTop: target,
            duration: durationSec,
            ease: 'machinesStep',
          })
        } else {
          window.scrollTo(0, target)
        }
        gsap.killTweensOf(content)
        gsap.to(content, {
          y: -Math.round(toOffset),
          duration: durationSec,
          ease: 'machinesStep',
        })
        currentStep = clamped
      } catch (err) {
        // ignore
      }
      return
    }
    pendingSteps = Math.abs(clamped - currentIndex) - 1
    queuedDir = dir
    queuedDuration =
      durationOverride ||
      getSnapDuration(
        lastScrollMagnitude,
        itemHeights[currentIndex] || stepHeight
      )
    performStep(dir, queuedDuration)
  }
  const onWheel = (e) => {
    if (!isActive) return
    if (typeof e.deltaY !== 'number') return
    if (offsets.length === 0) measureSteps()

    // Allow native scroll to continue if we're at a boundary in the intended direction
    const dirPeek = Math.sign(e.deltaY)
    if (dirPeek !== 0) {
      ensureCurrentStep()
      const totalSteps = getTotalSteps()
      const next = Math.max(0, Math.min(currentStep + dirPeek, totalSteps))
      if (next === currentStep) return
    }

    // Do not prevent default; allow native scrolling when sticky
    if (isWheelAnimating) return
    // Do not snap during scroll; only schedule snap on stop
    lastScrollMagnitude = Math.abs(e.deltaY)
    // record magnitude and schedule final snap only
    wheelAccumulator += e.deltaY
    lastScrollMagnitude = Math.abs(wheelAccumulator)
    scheduleStrongSnap()
  }

  // Touch support: quantize scrolling on touchend similarly
  let touchStartY = null
  const onTouchStart = (e) => {
    if (!isActive) return
    touchStartY =
      (e.changedTouches &&
        e.changedTouches[0] &&
        e.changedTouches[0].clientY) ||
      null
  }
  const onTouchMove = (e) => {
    if (!isActive) return
    const y =
      (e.changedTouches &&
        e.changedTouches[0] &&
        e.changedTouches[0].clientY) ||
      null
    if (touchStartY == null || y == null) return
    if (offsets.length === 0) measureSteps()

    // If at boundary for the current move direction, don't block native scroll
    const dirPeek = Math.sign(touchStartY - y)
    if (dirPeek !== 0) {
      ensureCurrentStep()
      const totalSteps = getTotalSteps()
      const next = Math.max(0, Math.min(currentStep + dirPeek, totalSteps))
      if (next === currentStep) return
    }
    // Do not prevent default on touch move while sticky
    lastScrollMagnitude = Math.abs(touchStartY - y)
    // do not snap during move; only schedule on end
  }
  const onTouchEnd = (e) => {
    if (!isActive || touchStartY == null) return
    const endY =
      (e.changedTouches &&
        e.changedTouches[0] &&
        e.changedTouches[0].clientY) ||
      touchStartY
    const deltaY = touchStartY - endY
    touchStartY = null
    const dir = Math.sign(deltaY)
    if (offsets.length === 0) measureSteps()
    ensureCurrentStep()
    const totalSteps = getTotalSteps()
    const next = Math.max(0, Math.min(currentStep + dir, totalSteps))
    if (next === currentStep) return
    // No immediate snap here; schedule final snap to nearest (at stop)
    scheduleStrongSnap()
  }

  // Keyboard support while sticky (arrows / page keys)
  const onKeyDown = (e) => {
    if (!isActive) return
    const code = e.code || e.key
    let dir = 0
    if (code === 'ArrowDown' || code === 'PageDown' || code === 'Space') dir = 1
    if (code === 'ArrowUp' || code === 'PageUp') dir = -1
    if (dir !== 0) {
      if (offsets.length === 0) measureSteps()
      ensureCurrentStep()
      const totalSteps = getTotalSteps()
      const next = Math.max(0, Math.min(currentStep + dir, totalSteps))
      if (next === currentStep) return
      try {
        e.preventDefault()
        e.stopPropagation()
      } catch (err) {
        // ignore
      }
      if (!isWheelAnimating) performStep(dir)
    }
  }

  const onResize = () => {
    measureSteps()
    updateWrapperHeight()
    ScrollTrigger.refresh()
  }

  try {
    const targetEl = scroller === window ? window : scroller
    targetEl.addEventListener('wheel', onWheel, {
      passive: false,
      capture: true,
    })
    targetEl.addEventListener('touchstart', onTouchStart, {
      passive: true,
      capture: true,
    })
    targetEl.addEventListener('touchmove', onTouchMove, {
      passive: false,
      capture: true,
    })
    targetEl.addEventListener('touchend', onTouchEnd, {
      passive: false,
      capture: true,
    })
    window.addEventListener('keydown', onKeyDown, true)
  } catch (err) {
    // ignore
  }
  window.addEventListener('resize', onResize)

  // initial sync
  setTimeout(() => {
    setItemHeightFromName()
    measureSteps()
    updateWrapperHeight()
    st.refresh()
  }, 0)

  // Observe dynamic list changes (Webflow CMS) to recompute heights
  try {
    listObserver = new MutationObserver(() => {
      measureSteps()
      updateWrapperHeight()
      st.refresh()
    })
    listObserver.observe(machines, { childList: true, subtree: true })
  } catch (err) {
    // ignore
  }

  // Return a simple cleanup API
  return () => {
    window.removeEventListener('resize', onResize)
    try {
      const targetEl = scroller === window ? window : scroller
      targetEl.removeEventListener('wheel', onWheel, {
        capture: true,
      })
      targetEl.removeEventListener('touchstart', onTouchStart, {
        capture: true,
      })
      targetEl.removeEventListener('touchmove', onTouchMove, {
        capture: true,
      })
      targetEl.removeEventListener('touchend', onTouchEnd, {
        capture: true,
      })
      window.removeEventListener('keydown', onKeyDown, true)
    } catch (err) {
      // ignore
    }
    try {
      content.style.transform = ''
    } catch (err) {
      // ignore
    }
    try {
      machinesWrapper.style.height = ''
    } catch (err) {
      // ignore
    }
    try {
      gsap.killTweensOf(content)
      st.kill()
    } catch (err) {
      // ignore
    }
    try {
      if (listObserver) listObserver.disconnect()
    } catch (err) {
      // ignore
    }
  }
}
