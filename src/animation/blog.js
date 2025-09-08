export function initBlog(root = document) {
  // Scope to Blog page via Barba namespace
  try {
    const container = root && root.nodeType === 1 ? root : document
    const isSelfBlog =
      container &&
      container.getAttribute &&
      container.getAttribute('data-barba-namespace') === 'Blog'
    const page = isSelfBlog
      ? container
      : container.querySelector('[data-barba-namespace="Blog"]')
    if (!page) return
    root = page
  } catch (err) {
    return
  }

  // Ensure Finsweet Attributes (fs-list) script is present
  try {
    const existing = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"][fs-list]'
    )
    if (!existing) {
      const s = document.createElement('script')
      s.setAttribute('async', '')
      s.setAttribute('type', 'module')
      s.setAttribute(
        'src',
        'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js'
      )
      s.setAttribute('fs-list', '')
      const appendTarget = document.body || document.documentElement
      appendTarget.appendChild(s)
    }
  } catch (e) {
    // ignore
  }
}
