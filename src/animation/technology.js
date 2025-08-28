import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, CustomEase)
// Smooth, slightly springy step ease
if (!gsap.parseEase('machinesStep')) {
  // Gentle ease-out for lighter snap
  CustomEase.create('machinesStep', 'M0,0 C0.25,0.46 0.45,0.94 1,1')
}
// Easing for machineOpen / machineClose interactions
if (!gsap.parseEase('machinesOpenClose')) {
  CustomEase.create('machinesOpenClose', 'M0,0 C0.6,0 0,1 1,1')
}

export function initTechnology(root = document) {
  const DEBUG_MACHINES = true
  const dlog = (...args) => {
    if (!DEBUG_MACHINES) return
    try {
      console.log('[machines]', ...args)
    } catch (err) {
      /* noop */
    }
  }
  const page = root.querySelector('[data-barba-namespace="technology"]')
  if (!page) return

  const machinesWrapper = root.querySelector('.machines-wrapper')
  const machines = root.querySelector('.machines')
  if (!machinesWrapper || !machines) return

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
      return px * 11.25
    } catch (err) {
      return 16 * 11.25
    }
  }
  let imagesStepPx = getImagesBasePx()
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
            width: '13.5em',
            height: '11.25em',
            duration: 0.5,
            ease: gsap.parseEase('machinesStep') || ((t) => t),
          })
        },
        scroller: window.__lenisWrapper || undefined,
      })
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
      dlog('onToggle', {
        isActiveBefore: isActive,
        scroll: self.scroll(),
        start: self.start,
        end: self.end,
      })
      isActive = self.isActive
      if (isActive) {
        // Snap current step to nearest at activation
        const dist = self.scroll() - self.start
        const nearest = getNearestStepForScroll(dist)
        currentStep = Math.max(0, nearest)
        if (offsets.length > 0)
          gsap.set(content, { y: -Math.round(offsets[currentStep] || 0) })
        dlog('onToggle->active mapped', {
          dist,
          nearest,
          contentY: Number(gsap.getProperty(content, 'y')) || 0,
        })
      } else {
        wheelAccumulator = 0
      }
    },
    onUpdate: (self) => {
      // Continuous follow of scroll during movement; snapping happens only on stop
      try {
        if (isOpenAnimating) return
        const dist = self.scroll() - self.start
        const maxDist = offsets[offsets.length - 1] || 0
        const clamped = Math.max(0, Math.min(maxDist, dist))
        gsap.set(content, { y: -Math.round(clamped) })
        setImagesByDistance(clamped)
        if (DEBUG_MACHINES && Math.random() < 0.01)
          dlog('onUpdate follow', {
            dist,
            clamped,
            contentY: Number(gsap.getProperty(content, 'y')) || 0,
          })
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
  // Helpers to resolve item under the line at current position
  const getCurrentDistance = () => {
    try {
      const y = Number(gsap.getProperty(content, 'y')) || 0
      const maxDist = offsets[offsets.length - 1] || 0
      return Math.max(0, Math.min(maxDist, -y))
    } catch (err) {
      return st.scroll() - st.start
    }
  }
  // removed legacy helper

  // Index and pairing helpers (sticky + bottom)
  const getCurrentIndex = () => {
    const dist = getCurrentDistance()
    return getNearestStepForScroll(dist)
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

  // Helpers to read/set native scroll consistently (window/Lenis/element)
  const getNativeScrollPos = () => {
    try {
      if (window.lenis && typeof window.lenis.scroll === 'number')
        return window.lenis.scroll
    } catch (err) {
      // ignore
    }
    try {
      if (scroller && scroller !== window) return scroller.scrollTop || 0
    } catch (err) {
      // ignore
    }
    try {
      return window.scrollY || window.pageYOffset || 0
    } catch (err) {
      return 0
    }
  }
  const setNativeScrollPos = (val) => {
    try {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(val, { duration: 0, lock: true })
        return
      }
    } catch (err) {
      // ignore
    }
    try {
      if (scroller && scroller !== window) scroller.scrollTop = val
      else window.scrollTo(0, val)
    } catch (err) {
      // ignore
    }
  }

  let savedNativeScroll = null
  let savedDistFromStart = 0

  const lockScroll = () => {
    try {
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop()
      } else {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        document.body.style.touchAction = 'none'
      }
    } catch (err) {
      // ignore
    }
  }
  const unlockScroll = () => {
    try {
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start()
      } else {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
        document.body.style.touchAction = ''
      }
    } catch (err) {
      // ignore
    }
  }

  // Open/Close behaviors
  let isOpenAnimating = false
  const machineOpen = () => {
    const index = getCurrentIndex()
    const pair = getPairForIndex(index)
    if (pair.length === 0) return
    const item = pair[0]
    const inner = item.querySelector('.machine_item')
    const btnWrap = machines.querySelector('.machines_button-wrap')
    const btns = btnWrap ? btnWrap.querySelectorAll('.machines_button') : null
    const closePlus = btnWrap
      ? btnWrap.querySelector('.machines_button.is-close > .is-plus')
      : null
    try {
      // Expand list-item to its inner height with page position preserved
      const itemFs = parseFloat(window.getComputedStyle(item).fontSize || '16')
      const innerRect = inner && inner.getBoundingClientRect()
      const innerHpx = innerRect ? innerRect.height : 0
      const innerEm = itemFs ? innerHpx / itemFs : 0
      if (innerEm > 0) {
        // preserve preOffset for completeness (no binding during open)
        // no scroll binding during open
        const tl = gsap.timeline({
          defaults: {
            duration: 0.5,
            ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
          },
          onStart: () => {
            isOpenAnimating = true
            lockScroll()
            // Freeze scroll binding while animating so other items push naturally
            gsap.set(content, { willChange: 'auto' })
            // Save absolute scroll and relative distance to st.start to restore later
            savedNativeScroll = getNativeScrollPos()
            const stStart = st && st.start ? st.start : 0
            savedDistFromStart = Math.max(0, savedNativeScroll - stStart)
            dlog('open:start', {
              index,
              savedNativeScroll,
              stStart,
              savedDistFromStart,
              contentY: Number(gsap.getProperty(content, 'y')) || 0,
            })
          },
          onComplete: () => {
            measureSteps()
            const newOffset = offsets[index] || 0
            gsap.set(content, { y: -Math.round(newOffset) })
            st.refresh()
            isOpenAnimating = false
            dlog('open:complete', {
              index,
              newOffset,
              contentY: Number(gsap.getProperty(content, 'y')) || 0,
            })
          },
        })
        pair.forEach((el) =>
          tl.to(
            el,
            {
              height: `${innerEm}em`,
            },
            0
          )
        )
        // buttons & images
        if (btns && btns.length)
          tl.to(
            btns,
            {
              yPercent: -100,
            },
            0
          )
        if (imagesRoot && imagesRoot !== machines) {
          tl.to(
            imagesRoot,
            {
              width: '28em',
              height: '23.313em',
            },
            0
          )
          const imageItems = imagesRoot.querySelectorAll(
            '.machines_images-item'
          )
          if (imageItems && imageItems.length)
            tl.to(
              imageItems,
              {
                height: '23.313em',
              },
              0
            )
        }
        if (closePlus)
          tl.to(
            closePlus,
            {
              rotate: 135,
            },
            0
          )
      }
    } catch (err) {
      // ignore
    }
    try {
      // Move both buttons up
      if (btns && btns.length)
        gsap.to(btns, {
          yPercent: -100,
          duration: 0.5,
          ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
        })
      // Grow images
      if (imagesRoot && imagesRoot !== machines) {
        gsap.to(imagesRoot, {
          width: '28em',
          height: '23.313em',
          duration: 0.5,
          ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
        })
        try {
          const imageItems = imagesRoot.querySelectorAll(
            '.machines_images-item'
          )
          if (imageItems && imageItems.length) {
            gsap.to(imageItems, {
              height: '23.313em',
              duration: 0.5,
              ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
            })
          }
        } catch (err) {
          // ignore
        }
      }
      // Rotate the plus icon inside the close button
      if (closePlus)
        gsap.to(closePlus, {
          rotate: 135,
          duration: 0.5,
          ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
        })
    } catch (err) {
      // ignore
    }
  }

  const machineClose = () => {
    const index = getCurrentIndex()
    const pair = getPairForIndex(index)
    if (pair.length === 0) return
    const btnWrap = machines.querySelector('.machines_button-wrap')
    const btns = btnWrap ? btnWrap.querySelectorAll('.machines_button') : null
    const closePlus = btnWrap
      ? btnWrap.querySelector('.machines_button.is-close > .is-plus')
      : null
    try {
      if (closedItemEmHeight > 0) {
        // no scroll binding during close; compute dims if needed later
        const tl = gsap.timeline({
          defaults: {
            duration: 0.5,
            ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
          },
          onStart: () => {
            isOpenAnimating = true
            dlog('close:start', {
              index,
              savedNativeScroll,
              savedDistFromStart,
              contentY: Number(gsap.getProperty(content, 'y')) || 0,
            })
          },
          onComplete: () => {
            // Recompute steps and realign content to where we were BEFORE refresh
            measureSteps()
            const maxDist = offsets[offsets.length - 1] || 0
            const distClamped = Math.max(
              0,
              Math.min(maxDist, savedDistFromStart)
            )
            const idxNow = getNearestStepForScroll(distClamped)
            const newOffset = offsets[idxNow] || 0
            // Align content to the logical offset for current scroll
            gsap.set(content, { y: -Math.round(newOffset) })
            // Ensure ScrollTrigger uses the same scroll position
            setNativeScrollPos((st && st.start ? st.start : 0) + distClamped)
            ScrollTrigger.update()
            st.refresh()
            wheelAccumulator = 0
            // Delay re-enabling onUpdate binding by one frame to avoid race
            const finish = () => {
              isOpenAnimating = false
              unlockScroll()
              savedNativeScroll = null
              savedDistFromStart = 0
              dlog('close:complete', {
                index,
                distClamped,
                idxNow,
                newOffset,
                scrollNow: getNativeScrollPos(),
                contentY: Number(gsap.getProperty(content, 'y')) || 0,
              })
            }
            if (typeof requestAnimationFrame === 'function')
              requestAnimationFrame(finish)
            else finish()
          },
        })
        pair.forEach((el) =>
          tl.to(
            el,
            {
              height: `${closedItemEmHeight}em`,
            },
            0
          )
        )
        if (btns && btns.length)
          tl.to(
            btns,
            {
              yPercent: 0,
            },
            0
          )
        if (imagesRoot && imagesRoot !== machines) {
          tl.to(
            imagesRoot,
            {
              width: '13.5em',
              height: '11.25em',
            },
            0
          )
          const imageItems = imagesRoot.querySelectorAll(
            '.machines_images-item'
          )
          if (imageItems && imageItems.length)
            tl.to(
              imageItems,
              {
                height: '11.25em',
              },
              0
            )
        }
        if (closePlus)
          tl.to(
            closePlus,
            {
              rotate: 0,
            },
            0
          )
      }
    } catch (err) {
      // ignore
    }
    try {
      if (btns && btns.length)
        gsap.to(btns, {
          yPercent: 0,
          duration: 0.5,
          ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
        })
      if (imagesRoot && imagesRoot !== machines) {
        gsap.to(imagesRoot, {
          width: '13.5em',
          height: '11.25em',
          duration: 0.5,
          ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
        })
        try {
          const imageItems = imagesRoot.querySelectorAll(
            '.machines_images-item'
          )
          if (imageItems && imageItems.length) {
            gsap.to(imageItems, {
              height: '11.25em',
              duration: 0.5,
              ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
            })
          }
        } catch (err) {
          // ignore
        }
      }
      if (closePlus)
        gsap.to(closePlus, {
          rotate: 0,
          duration: 0.5,
          ease: gsap.parseEase('machinesOpenClose') || ((t) => t),
        })
    } catch (err) {
      // ignore
    }
  }

  // Expose controls and wire buttons
  try {
    machines.machineOpen = machineOpen
    machines.machineClose = machineClose
    const btnWrap = machines.querySelector('.machines_button-wrap')
    if (btnWrap) {
      const buttons = btnWrap.querySelectorAll('.machines_button')
      if (buttons[0]) buttons[0].addEventListener('click', machineOpen)
      if (buttons[1]) buttons[1].addEventListener('click', machineClose)
    }
  } catch (err) {
    // ignore
  }
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
