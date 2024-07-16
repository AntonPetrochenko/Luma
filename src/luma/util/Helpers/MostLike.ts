export function mostLike<T>(arr: T[], cb: (current: T, candidate: T) => boolean) {
    let outVal: T | null;
    arr.forEach( (e) => {
        if (!outVal) {
            outVal = e
            return;
        }

        outVal = cb(outVal, e) ? e : outVal
    })
}