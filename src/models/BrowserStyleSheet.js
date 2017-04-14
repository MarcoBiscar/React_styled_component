// @flow
/*
 * Browser Style Sheet with Rehydration
 *
 * <style data-styled-components="x y z"
 *        data-styled-components-is-local="true">
 *   /· sc-component-id: a ·/
 *   .sc-a { ... }
 *   .x { ... }
 *   /· sc-component-id: b ·/
 *   .sc-b { ... }
 *   .y { ... }
 *   .z { ... }
 * </style>
 *
 * Note: replace · with * in the above snippet.
 * */
import extractCompsFromCSS from '../utils/extractCompsFromCSS'
import type { Tag } from './StyleSheet'
import StyleSheet, { SC_ATTR, LOCAL_ATTR } from './StyleSheet'

export const COMPONENTS_PER_TAG = 40

class BrowserTag implements Tag {
  isLocal: boolean
  components: Map<string, Object>
  el: HTMLElement
  ready: boolean

  constructor(el: HTMLElement, isLocal: boolean, existingSource: string = '') {
    this.el = el
    this.isLocal = isLocal
    this.components = new Map(extractCompsFromCSS(existingSource).map(obj =>
      [obj.componentId, obj],
    ))
    this.ready = false
  }

  isFull() {
    return this.components.size >= COMPONENTS_PER_TAG
  }

  addComponent(componentId: string) {
    if (!this.ready) this.replaceElement()
    const comp = { componentId, textNode: document.createTextNode('') }
    this.el.appendChild(comp.textNode)
    this.components.set(componentId, comp)
  }

  inject(componentId: string, css: string, name: ?string) {
    const comp = this.components.get(componentId)
    if (!comp) throw new Error('Must add a new component before you can inject css into it')
    if (comp.textNode.data === '') comp.textNode.appendData(`\n/* sc-component-id: ${componentId} */\n`)

    comp.textNode.appendData(css)
    if (name) {
      const existingNames = this.el.getAttribute(SC_ATTR)
      this.el.setAttribute(SC_ATTR, existingNames ? `${existingNames} ${name}` : name)
    }
  }

  toHTML() {
    return this.el.outerHTML
  }

  clone() {
    throw new Error('BrowserTag cannot be cloned!')
  }

  /* Because we care about source order, before we can inject anything we need to
   * create a text node for each component and replace the existing CSS. */
  replaceElement() {
    this.ready = true
    // We have nothing to inject. Use the current el.
    if (this.components.size === 0) return

    // Build up our replacement style tag
    const newEl = this.el.cloneNode()
    newEl.appendChild(document.createTextNode('\n'))

    this.components.forEach(comp => {
      // eslint-disable-next-line no-param-reassign
      comp.textNode = document.createTextNode(comp.cssFromDOM)
      newEl.appendChild(comp.textNode)
    })

    if (!this.el.parentNode) throw new Error("Trying to replace an element that wasn't mounted!")

    // The ol' switcheroo
    this.el.parentNode.replaceChild(newEl, this.el)
    this.el = newEl
  }
}

/* Factory function to separate DOM operations from logical ones*/
export default {
  create() {
    const tags = []
    const names = new Set()

    /* Construct existing state from DOM */
    Array.from(document.querySelectorAll(`[${SC_ATTR}]`)).forEach(el => {
      tags.push(new BrowserTag(el, el.getAttribute(LOCAL_ATTR) === 'true', el.innerHTML))
      ;
      (el.getAttribute(SC_ATTR) || '').trim().split(/\s+/).forEach(name => {
        names.add(name)
      })
    })

    /* Factory for making more tags */
    const tagConstructor = (isLocal: boolean): Tag => {
      const el = document.createElement('style')
      el.type = 'text/css'
      el.setAttribute(SC_ATTR, '')
      el.setAttribute(LOCAL_ATTR, isLocal ? 'true' : 'false')
      if (!document.head) throw new Error('Missing document <head>')
      document.head.appendChild(el)
      return new BrowserTag(el, isLocal)
    }

    return new StyleSheet(tagConstructor, tags, names)
  },
}
