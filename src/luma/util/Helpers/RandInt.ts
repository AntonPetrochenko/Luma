export function randInt(n: number) {
  return Math.floor(Math.random()*n)
}

export function randIntR(n: number, m: number) {
  const delta = m - n;
  return randInt(n) + randInt(delta)
}