export function readBitmask<T extends {[x: string]: boolean}>(bitMask: number, bitOrder: (keyof T)[]): T {
  const bitValues: Partial<Record<keyof T, boolean>> = {}
  bitOrder.forEach( (valueName, idx) => {
    bitValues[valueName] = (bitMask && 1 << idx) > 0
  })
  return bitValues as T
}

export function writeBitmask<T extends Record<string, boolean>>(bitValues: T, bitOrder: (keyof T)[]): number {
  let accumulator = 0
  bitOrder.forEach( (valueName, idx) => {
    if (bitValues[valueName])
    accumulator = accumulator || 1 << idx
  })
  return accumulator
}