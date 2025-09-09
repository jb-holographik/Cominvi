import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger)

function createLetterRevealTimeline(element) {
  const split = new SplitType(element, {
    types: 'lines,words,chars',
    tagName: 'span',
  })
  const characters = split.chars || []
  const words = split.words || []
  const lines = split.lines || []

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
  // Create one ScrollTrigger per visual line so each line animates from 85% → 50%
  const tweens = []
  lines.forEach((line) => {
    try {
      const lineChars = characters.filter((ch) => line.contains(ch))
      if (!lineChars.length) return
      const tween = gsap.to(lineChars, {
        opacity: 1,
        stagger: { each: 0.02, from: 'start' },
        ease: 'none',
        scrollTrigger: {
          trigger: line,
          start: 'top 85%',
          end: 'top 50%',
          scrub: true,
          scroller,
        },
      })
      tweens.push(tween)
    } catch (e) {
      // ignore
    }
  })

  element.__textRevealSplit = split
  element.__textRevealLineTweens = tweens

  // Return the array for possible external bookkeeping, though caller doesn't require it
  return tweens
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
        el.__textRevealLineTweens &&
        Array.isArray(el.__textRevealLineTweens)
      ) {
        el.__textRevealLineTweens.forEach((tw) => {
          try {
            if (tw && tw.scrollTrigger) tw.scrollTrigger.kill()
            if (tw && typeof tw.kill === 'function') tw.kill()
          } catch (e) {
            // ignore
          }
        })
        el.__textRevealLineTweens = null
      }
    } catch (e) {
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
