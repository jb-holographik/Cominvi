import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger)

function createLetterRevealTimeline(element) {
  const split = new SplitType(element, {
    types: 'words,chars',
    tagName: 'span',
  })
  const characters = split.chars || []
  const words = split.words || []

  if (!characters.length) return null

  // Keep words intact on a single line to avoid mid-word wraps
  gsap.set(words, {
    display: 'inline-block',
    whiteSpace: 'nowrap',
  })

  gsap.set(characters, {
    opacity: 0.2,
    display: 'inline-block',
    willChange: 'opacity',
  })

  const scroller = window.__lenisWrapper || undefined
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: element,
      start: 'top 85%',
      end: '+=420',
      scrub: true,
      scroller,
    },
  })

  timeline.to(characters, {
    opacity: 1,
    stagger: { each: 0.02, from: 'start' },
    ease: 'none',
  })

  // Clean up forced no-wrap once animation has progressed enough (optional)
  timeline.add(() => {
    try {
      gsap.set(words, { clearProps: 'whiteSpace' })
    } catch (err) {
      // ignore
    }
  }, '>=+0.1')

  element.__textRevealSplit = split
  element.__textRevealTimeline = timeline

  return timeline
}

export function initTextReveal(root = document) {
  const targets = root.querySelectorAll('[tr="1"]')
  if (!targets.length) return null

  const timelines = []
  targets.forEach((el) => {
    const tl = createLetterRevealTimeline(el)
    if (tl) timelines.push(tl)
  })

  // Ensure ScrollTrigger recalculates after DOM mutations from SplitType
  ScrollTrigger.refresh()

  return timelines
}

export function destroyTextReveal(root = document) {
  const targets = root.querySelectorAll('[tr="1"]')
  targets.forEach((el) => {
    try {
      if (el.__textRevealTimeline) {
        if (el.__textRevealTimeline.scrollTrigger) {
          el.__textRevealTimeline.scrollTrigger.kill()
        }
        el.__textRevealTimeline.kill()
        el.__textRevealTimeline = null
      }
    } catch (err) {
      // ignore
    }
    try {
      if (
        el.__textRevealSplit &&
        typeof el.__textRevealSplit.revert === 'function'
      ) {
        el.__textRevealSplit.revert()
        el.__textRevealSplit = null
      }
    } catch (err) {
      // ignore
    }
  })
  ScrollTrigger.refresh()
}

// No auto-init here; main.js controls timing after Lenis setup
