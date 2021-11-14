/**
 * A coroutine schedule.
 * 
 * Coroutines are added to a schedule with [[add]] and all scheduled
 * coroutines are advanced with [[tick]].
 */
export class Schedule {
    constructor() {
        this.coroutines = []
        this.tick = this.tick.bind(this)
    }

    /**
     * Schedules a coroutine for evaluation.
     * 
     * Future calls to [[tick]] will run `coro` up to its next `yield` until it is completed.
     * 
     * As a convenience if `coro` is a generator function and not a generator, it will be evaluated to produce a generator.
     * 
     * ```js
     * function* coroutineFunction() { ... }
     * let schedule = new Schedule()
     * schedule.add(coroutineFunction()) // this works
     * schedule.add(coroutineFunction)   // so does this
     * ```
     * 
     * @param coro coroutine to add
     */
    add(coro) {
        let c = "next" in coro ? coro : coro();
        this.coroutines.push(c)
        return c
    }

    /**
     * Stops a single coroutine
     * 
     * @param coro coroutine to remove
     */
    remove(coro) {
        this.coroutines.splice(this.coroutines.indexOf(coro), 1)
    }

    /**
     * Discards all scheduled coroutines
     */
    removeAll() {
        this.coroutines = []
    }

    /**
     * Advances all scheduled coroutines once.
     * 
     * Each coroutine added with [[add]] will run up to its next `yield` statement. Finished coroutines are removed
     * from the collection.
     */
    tick() {
        for (const coro of [...this.coroutines])
            if (coro.next().done)
                this.remove(coro)
    }
}

let _clock = () => performance.now() / 1000

/**
 * Sets a new clock function.
 * 
 * The clock function returns the elapsed application time in seconds. It is called by some coroutines to measure the
 * passage of time. defaults to `performance.now() / 1000`
 *
 * @param f New clock function
 */
export function setClock(f) {
    _clock = f
}

/**
 * Wait for a number of seconds.
 * 
 * @category Coroutine
 * 
 * @param seconds How many seconds to wait
 * @param clock A function that returns the elapsed application time in seconds, defaults to the function assigned by [[setClock]]
 * @see [[setClock]]
 */
export function* seconds(seconds, clock = _clock) {
    let startTime = clock()
    while (clock() - startTime < seconds) {
        yield;
    }
}

/**
 * Wait for a number of frames.
 * 
 * @category Coroutine
 * 
 * @param n How many frames to wait
 */
export function* frames(n) {
    while (n-- > 0) {
        yield;
    }
}

let initialize = c => typeof c === "function" ? c() : c

/**
 * Returns a coroutine that waits for every coroutine of `coros` to complete.
 * 
 * @category Combinator
 * @param coros The coroutines to wait for
 */
export function* all(...coros) {
    coros = coros.map(initialize).reverse()
    try {
        while(true) {
            let i = coros.length
            while(i--)
                if(coros[i].next().done)
                    coros.splice(i, 1)
            if(coros.length == 0)
                return
            yield
        }
    } finally {
        for (const c of coros)
            c.return()
    }
}

/**
 * Returns a coroutine that waits for the first coroutine of `coros` to complete.
 * 
 * @category Combinator
 * @param coros The coroutines to wait for
 * @returns When complete, returns the value returned by the first completed coroutine in `coros`.
 */
export function* first(...coros) {
    coros = coros.map(initialize)
    try {
        while(true) {
            for (const c of coros) {
                let { done, value } = c.next()
                if(done)
                    return value;
            }
            yield
        }
    } finally {
        for (const c of coros)
            c.return()
    }
}