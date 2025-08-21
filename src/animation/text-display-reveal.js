import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initTextDisplayReveal(root = document) {
  const sections = Array.from(root.querySelectorAll('.title-big'))
  if (!sections.length) return

  sections.forEach((section) => {
    const container = section.closest('.display-text') || section
    const gradients = Array.from(
      section.querySelectorAll('.overlay-gradients .overlay-gradient')
    )
    if (!gradients.length) return

    // Start collapsed
    gsap.set(gradients, { width: '0%' })

    // Animate width while .display crosses from 60% to 40% of viewport
    gsap.to(gradients, {
      width: '100%',
      ease: 'power2.inOut',
      stagger: 0.025,
      scrollTrigger: {
        trigger: section.querySelector('.display') || section,
        start: 'top 80%',
        end: 'top 50%',
        scrub: true,
      },
    })

    // Eyebrow split and reveal per word
    const eyebrow =
      container && container.querySelector
        ? container.querySelector('.eyebrow-wrapper-a > .eyebrow-m')
        : null
    if (eyebrow && !eyebrow.dataset.splitted) {
      splitIntoWordSpans(eyebrow)
      eyebrow.dataset.splitted = 'true'
      const words = Array.from(eyebrow.querySelectorAll('.eyebrow-word'))
      if (words.length) {
        gsap.set(words, {
          display: 'inline-block',
          yPercent: 100,
          rotation: 70,
          transformOrigin: 'left bottom',
        })
        gsap.to(words, {
          yPercent: 0,
          rotation: 0,
          ease: 'power2.inOut',
          stagger: 0.02,
          scrollTrigger: {
            trigger: section.querySelector('.display') || section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true,
          },
        })
      }
    }
  })
}

export function splitIntoWordSpans(rootEl) {
  const text = rootEl.textContent || ''
  const parts = text.split(/(\s+)/)
  rootEl.textContent = ''
  parts.forEach((part) => {
    if (part.trim().length === 0) {
      rootEl.appendChild(document.createTextNode(part))
    } else {
      const span = document.createElement('span')
      span.className = 'eyebrow-word'
      span.textContent = part
      rootEl.appendChild(span)
    }
  })
}
