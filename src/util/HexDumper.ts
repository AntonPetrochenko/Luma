export function dumpBufferToString(buf: Buffer, width: number = 8) {
  let lineNumbers: number[] = []
  let hexLines: string[] = []
  let asciiLines: string[] = []
  for (let lineOffset = 0; lineOffset < buf.length; lineOffset=lineOffset+width) {
    lineNumbers.push(lineOffset)
    let currentLineHex: string[] = []
    let currentLineAscii = ''
    for (let lineByte = 0; lineByte < 8; lineByte++) {
      if (lineOffset+lineByte < buf.length) {
        let currentByte = buf[lineOffset+lineByte]
        currentLineHex.push( currentByte.toString(16).padStart(2,'0') )
        currentLineAscii += (currentByte >= 32 && currentByte <= 127) ? String.fromCharCode(currentByte) : '¿'
      } else {
        currentLineHex.push('..')
        currentLineAscii += ' '
      }
    }

    hexLines[lineOffset] = currentLineHex.join(' ')
    asciiLines[lineOffset] = currentLineAscii
  }

  let outStringDump = '\n'
  lineNumbers.forEach((lineNumber) => {
    outStringDump += `${lineNumber.toString().padStart(4, '0')}: ${hexLines[lineNumber]} | ${asciiLines[lineNumber]}\n`
  })

  return outStringDump
}