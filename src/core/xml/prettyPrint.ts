import xmlFormat from 'xml-formatter'

export function prettyPrintXml(xml: string): string {
  return xmlFormat(xml, {
    indentation: '  ',
    collapseContent: true,
    lineSeparator: '\n',
  })
}
