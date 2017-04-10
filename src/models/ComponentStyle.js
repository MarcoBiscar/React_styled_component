// @flow
import hashStr from '../vendor/glamor/hash'

import type { RuleSet, NameGenerator, Flattener, Stringifier } from '../types'
import StyleSheet from './BrowserStyleSheet'

/*
 ComponentStyle is all the CSS-specific stuff, not
 the React-specific stuff.
 */
export default (nameGenerator: NameGenerator, flatten: Flattener, stringifyRules: Stringifier) => {
  class ComponentStyle {
    rules: RuleSet
    componentId: string
    insertedRule: ?Object

    constructor(rules: RuleSet, componentId: string) {
      this.rules = rules
      this.componentId = componentId

      /* Todo: potentially restore this guard. */
      // if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      this.insertedRule = StyleSheet.instance.inject(componentId, `.${componentId} {}`)
    }

    /*
     * Flattens a rule set into valid CSS
     * Hashes it, wraps the whole chunk in a .hash1234 {}
     * Returns the hash to be injected on render()
     * */
    generateAndInjectStyles(executionContext: Object) {
      const flatCSS = flatten(this.rules, executionContext)
      /* Todo: perf test this. We might want to return to separating hashes and names */
      const hash = nameGenerator(hashStr(this.componentId + flatCSS.join('')))

      if (StyleSheet.instance.hasHash(hash)) {
        const css = stringifyRules(flatCSS, `.${hash}`)
        StyleSheet.instance.inject(this.componentId, `.${this.componentId} {}${css}`, hash)
      }

      return hash
    }

    static generateName(str: string) {
      return nameGenerator(hashStr(str))
    }
  }

  return ComponentStyle
}
