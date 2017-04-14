import React from 'react'
import { renderToString } from  'react-dom/server'
import ServerStyleSheet from '../models/ServerStyleSheet'
import { resetStyled, stripWhitespace } from './utils'
import _injectGlobal from '../constructors/injectGlobal'
import stringifyRules from '../utils/stringifyRules'
import css from '../constructors/css'
const injectGlobal = _injectGlobal(stringifyRules, css)

let styled

const format = css => stripWhitespace(css).replace(/(\*\/|[}>])/g, "$1\n").replace(/\n\s+/g, "\n")

describe('ssr', () => {
  beforeEach(() => {
    styled = resetStyled(true)
  })

  it('should extract the CSS in a simple case', () => {
    const Heading = styled.h1`
      color: red;
    `

    const sheet = new ServerStyleSheet()
    const html = renderToString(sheet.collectStyles(<Heading>Hello SSR!</Heading>))
    const css = format(sheet.css)

    expect(html).toEqual('<h1 class="sc-a b" data-reactroot="" data-reactid="1" data-react-checksum="197727696">Hello SSR!</h1>')
    expect(css).toEqual(format(`
      <style type="text/css" data-styled-components="b" data-styled-components-is-local="true">
      /* sc-component-id: sc-a */
      .sc-a {}
      .b { color: red; }
      
      </style>
    `))
  })

  it('should extract both global and local CSS', () => {
    injectGlobal`
      body { background: papayawhip; }
    `
    const Heading = styled.h1`
      color: red;
    `

    const sheet = new ServerStyleSheet()
    const html = renderToString(sheet.collectStyles(<Heading>Hello SSR!</Heading>))
    const css = format(sheet.css)

    expect(html).toEqual('<h1 class="sc-a b" data-reactroot="" data-reactid="1" data-react-checksum="197727696">Hello SSR!</h1>')
    expect(css).toEqual(format(`
      <style type="text/css" data-styled-components="" data-styled-components-is-local="false">
      /* sc-component-id: sc-global-2303210225 */
      body { background: papayawhip; }
      
      </style>
      <style type="text/css" data-styled-components="b" data-styled-components-is-local="true">
      /* sc-component-id: sc-a */
      .sc-a {}
      .b { color: red; }
      
      </style>
    `))
  })

  it('should render CSS in the order the components were defined, not rendered', () => {
    const ONE = styled.h1.withConfig({ componentId: 'ONE' })`
      color: red;
    `
    const TWO = styled.h2.withConfig({ componentId: 'TWO' })`
      color: blue;
    `

    const sheet = new ServerStyleSheet()
    const html = renderToString(sheet.collectStyles(
      <div>
        <TWO/>
        <ONE/>
      </div>
    ))
    const css = format(sheet.css)

    expect(html).toEqual('<div data-reactroot="" data-reactid="1" data-react-checksum="275982144"><h2 class="TWO a" data-reactid="2"></h2><h1 class="ONE b" data-reactid="3"></h1></div>')
    expect(css).toEqual(format(`
      <style type="text/css" data-styled-components="a b" data-styled-components-is-local="true">
      /* sc-component-id: ONE */
      .ONE {}
      .b {color: red;}
      /* sc-component-id: TWO */
      .TWO {}
      .a {color: blue;}
      
      </style>
    `))
  })

  it('should share global styles but keep renders separate', () => {
    injectGlobal`
      body { background: papayawhip; }
    `
    const PageOne = styled.h1.withConfig({ componentId: 'PageOne' })`
      color: red;
    `
    const PageTwo = styled.h2.withConfig({ componentId: 'PageTwo' })`
      color: blue;
    `

    const sheetOne = new ServerStyleSheet()
    const htmlOne = renderToString(sheetOne.collectStyles(<PageOne>Camera One!</PageOne>))
    const cssOne = format(sheetOne.css)

    const sheetTwo = new ServerStyleSheet()
    const htmlTwo = renderToString(sheetTwo.collectStyles(<PageTwo>Camera Two!</PageTwo>))
    const cssTwo = format(sheetTwo.css)

    expect(htmlOne).toEqual('<h1 class="PageOne a" data-reactroot="" data-reactid="1" data-react-checksum="2014320521">Camera One!</h1>')
    expect(cssOne).toEqual(format(`
      <style type="text/css" data-styled-components="" data-styled-components-is-local="false">
      /* sc-component-id: sc-global-2303210225 */
      body { background: papayawhip; }
      </style>
      <style type="text/css" data-styled-components="a" data-styled-components-is-local="true">
      /* sc-component-id: PageOne */
      .PageOne {}
      .a { color: red; }
      </style>
    `))

    expect(htmlTwo).toEqual('<h2 class="PageTwo b" data-reactroot="" data-reactid="1" data-react-checksum="2124224444">Camera Two!</h2>')
    expect(cssTwo).toEqual(format(`
      <style type="text/css" data-styled-components="" data-styled-components-is-local="false">
      /* sc-component-id: sc-global-2303210225 */
      body { background: papayawhip; }
      </style>
      <style type="text/css" data-styled-components="b" data-styled-components-is-local="true">
      /* sc-component-id: PageTwo */
      .PageTwo {}
      .b { color: blue; }
      </style>
    `))
  })
})
