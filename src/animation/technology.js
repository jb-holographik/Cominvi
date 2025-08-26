import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, CustomEase)
// Smooth, slightly springy step ease
if (!gsap.parseEase('machinesStep')) {
  CustomEase.create('machinesStep', 'M0,0 C0.18,0.02 0.11,1 1,1')
}

export function initTechnology(root = document) {
  const page = root.querySelector('[data-barba-namespace="technology"]')
  if (!page) return

  const machinesWrapper = root.querySelector('.machines-wrapper')
  const machines = root.querySelector('.machines')
  if (!machinesWrapper || !machines) return

  // Ensure we translate only inner content, not the sticky container itself
  let content = machines.querySelector('.machines-inner')
  if (!content) {
    content = document.createElement('div')
    content.className = 'machines-inner'
    while (machines.firstChild) {
      content.appendChild(machines.firstChild)
    }
    machines.appendChild(content)
  }

  let stepHeight = 0
  let isActive = false
  let currentStep = -1
  const scroller =
    window.__lenisWrapper || root.querySelector('.page-wrap') || window

  const getStepHeight = () => {
    const sampleItem = machinesWrapper.querySelector('.machines-list-item')
    if (sampleItem) {
      const h = sampleItem.getBoundingClientRect().height
      if (h > 0) stepHeight = h
    }
  }

  getStepHeight()

  // Stepping is handled programmatically; no continuous mapping needed

  const st = ScrollTrigger.create({
    trigger: machines,
    start: 'top 50%',
    end: () => `bottom 50%`,
    onToggle: (self) => {
      isActive = self.isActive
      if (isActive) {
        // Snap current step to nearest at activation
        const nearest = Math.round(
          (self.scroll() - self.start) / (stepHeight || 1)
        )
        currentStep = Math.max(0, nearest)
        if (stepHeight > 0)
          gsap.set(content, { y: -(currentStep * stepHeight) })
      } else {
        wheelAccumulator = 0
      }
    },
    // omit onUpdate to avoid Prettier formatting conflicts
    scroller: window.__lenisWrapper || undefined,
  })

  // Apply the same easing to page scroll while sticky
  let isWheelAnimating = false
  let wheelAccumulator = 0

  const performStep = (dir) => {
    if (!stepHeight) getStepHeight()
    const easeFn = gsap.parseEase('machinesStep') || ((t) => t)
    const start = st.start
    const end = st.end
    const totalSteps = Math.max(0, Math.floor((end - start) / stepHeight))
    if (currentStep < 0) {
      const approx = Math.round((st.scroll() - start) / (stepHeight || 1))
      currentStep = Math.max(0, Math.min(approx, totalSteps))
    }
    const nextStep = Math.max(0, Math.min(currentStep + dir, totalSteps))
    if (nextStep === currentStep) return
    const target = start + nextStep * stepHeight
    try {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        isWheelAnimating = true
        window.lenis.scrollTo(target, {
          duration: 0.45,
          easing: easeFn,
          lock: true,
        })
        gsap.killTweensOf(content)
        gsap.to(content, {
          y: -(nextStep * stepHeight),
          ease: 'machinesStep',
          duration: 0.45,
          onComplete: () => {
            isWheelAnimating = false
          },
        })
        currentStep = nextStep
      } else if (scroller && scroller !== window) {
        isWheelAnimating = true
        gsap.to(scroller, {
          scrollTop: target,
          duration: 0.45,
          ease: 'machinesStep',
          onComplete: () => {
            isWheelAnimating = false
          },
        })
        gsap.killTweensOf(content)
        gsap.to(content, {
          y: -(nextStep * stepHeight),
          ease: 'machinesStep',
          duration: 0.45,
        })
        currentStep = nextStep
      } else {
        // Fallback: immediate if no Lenis and no element scroller
        window.scrollTo(0, target)
        gsap.set(content, { y: -(nextStep * stepHeight) })
        currentStep = nextStep
      }
    } catch (err) {
      // ignore
    }
  }
  const onWheel = (e) => {
    if (!isActive) return
    if (typeof e.deltaY !== 'number') return
    try {
      if (e.cancelable) e.preventDefault()
      if (typeof e.stopImmediatePropagation === 'function')
        e.stopImmediatePropagation()
      if (typeof e.stopPropagation === 'function') e.stopPropagation()
    } catch (err) {
      // ignore
    }
    if (isWheelAnimating) return
    // accumulate until threshold to ensure clear step intent
    wheelAccumulator += e.deltaY
    const threshold = Math.max(24, (stepHeight || 0) * 0.2)
    if (Math.abs(wheelAccumulator) < threshold) return
    const dir = Math.sign(wheelAccumulator)
    wheelAccumulator = 0
    performStep(dir)
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
    try {
      if (e.cancelable) e.preventDefault()
    } catch (err) {
      // ignore
    }
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
    if (Math.abs(deltaY) < Math.max(24, (stepHeight || 0) * 0.2)) return
    performStep(Math.sign(deltaY))
  }

  // Keyboard support while sticky (arrows / page keys)
  const onKeyDown = (e) => {
    if (!isActive) return
    const code = e.code || e.key
    let dir = 0
    if (code === 'ArrowDown' || code === 'PageDown' || code === 'Space') dir = 1
    if (code === 'ArrowUp' || code === 'PageUp') dir = -1
    if (dir !== 0) {
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
    getStepHeight()
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
    getStepHeight()
    st.refresh()
  }, 0)

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
      gsap.killTweensOf(content)
      st.kill()
    } catch (err) {
      // ignore
    }
  }
}
