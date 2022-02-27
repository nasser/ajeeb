/** @module coroutine */

/**
 * A coroutine schedule.
 * 
 * Coroutines are added to a schedule with {@link Schedule#add} and all scheduled
 * coroutines are advanced with {@link Schedule#tick}.
 * 
 * Implemented as a double-ended linked list.
 */
 export class Schedule {
    constructor() {
        this.front = null
        this.back = null
        this.size = 0
        this.tick = this.tick.bind(this)
    }

    /**
     * Schedules a coroutine for evaluation.
     * 
     * Future calls to {@link Schedule#tick} will run `coro` up to its next
     * `yield` until it is completed.
     * 
     * As a convenience if `coro` is a generator function and not a generator,
     * it will be evaluated to produce a generator.
     * 
     * @param {Generator|GeneratorFunction} coro Coroutine to add
     * 
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator|MSDN Generator Documentation}
     * 
     * @example
     * function* coroutineFunction() { ... }
     * const schedule = new Schedule()
     * schedule.add(coroutineFunction()) // this works
     * schedule.add(coroutineFunction)   // so does this
     */
    add(coro) {
        let c = "next" in coro ? coro : coro();
        const node = { link:null, coro:c }
        if(this.size === 0)
            this.front = node
        else
            this.back.link = node
        this.back = node
        this.size += 1
        return c
    }

    /**
     * Remove a single coroutine from the schedule.
     * 
     * Currently this method does not force `coro` to stop. To trigger `finally`
     * clauses you must call `Generator#return` on `coro` yourself.
     * 
     * @param {Generator} coro Coroutine to remove from schedule
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return|Generator#return}
     * 
     * @example
     * function* foo() { ... }
     * const f = foo()
     * const schedule = new Schedule()
     * schedule.add(f)
     * schedule.tick() // runs foo to next yield
     * schedule.remove(f)
     * schedule.tick() // foo is not run
     */
    remove(coro) {
        if(this.front.coro === coro) {
            if(this.back.coro === coro)
                this.back = this.back.link
            this.front = this.front.link
            this.size -= 1
            return
        }

        let node = this.front
        while(node) {
            if(node.link.coro === coro) {
                if(this.back === node.link)
                    this.back = node
                node.link = node.link.link
                this.size -= 1
                return
            }
        }
    }

    /**
     * Discards all scheduled coroutines.
     * 
     * Similar to {@link Schedule#remove} this method does not force coroutines
     * to stop currently.
     */
    removeAll() {
        this.front = null
        this.back = null
        this.size = 0
    }

    /**
     * Advances all scheduled coroutines once.
     * 
     * Each coroutine added with {@link Schedule#add} is advanced with
     * `Generator#next`, causing it to run up to its next `yield` statement.
     * Finished coroutines are removed from the schedule.
     * 
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next|Generator#next}
     */
    tick() {
        let lastRetained = null
        let node = this.front
        let size = this.size
        
        while(size--) {
            if (node.coro.next().done) {
                this.size--
                if(lastRetained) {
                    lastRetained.link = node.link
                    if(this.back === node)
                        this.back = lastRetained
                } else {
                    this.front = node.link
                    if(this.back === node)
                        this.back = node.link
                }
            } else {
                lastRetained = node
            }
            node = node.link
        }
    }
}

let _clock = () => performance.now() / 1000

/**
 * Sets a new clock function.
 * 
 * The clock function returns the elapsed application time in seconds. It is
 * called by {@link seconds} to measure the passage of time. Defaults to
 * `performance.now() / 1000`
 *
 * @param {ClockCallback} f New clock function
 */
export function setClock(f) {
    _clock = f
}

/**
 * Wait for a number of seconds.
 * 
 * @param {number} s How many seconds to wait
 * @param {ClockCallback} [clock=function assigned by {@link setClock}]
 *  A function that returns the elapsed application time in seconds
 * @returns {Generator} `undefined` when `yield*`ed
 * @see {@link setClock}
 * 
 * @example
 * const schedule = new Schedule()
 * schedule.add(function* () {
 *      console.log("Hello")
 *      yield* seconds(4)
 *      console.log("World")
 * })
 * setInterval(schedule.tick, 100)
 * // prints out Hello, waits four seconds, prints out World
 */
export function* seconds(s, clock = _clock) {
    let startTime = clock()
    while (clock() - startTime < s) {
        yield;
    }
}

/**
 * Wait for a number of frames.
 * 
 * A "frame" is a call to {@link Schedule#tick}.
 * 
 * @param {number} n How many frames to wait
 * @returns {Generator} `undefined` when `yield*`ed
 * 
 * @example
 * const schedule = new Schedule()
 * schedule.add(function* () {
 *      console.log("Hello")
 *      yield* frames(4)
 *      console.log("World")
 * })
 * schedule.tick() // prints out Hello
 * schedule.tick()
 * schedule.tick()
 * schedule.tick()
 * schedule.tick() // prints out World
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
 * Incomplete `coros` are advanced in order every frame. Cancelling this
 * coroutine with `Generator#return` forces all remaining coroutines to
 * `Generator#return` as well.
 * 
 * @param {...(Generator|GeneratorFunction)} coros The coroutines to wait for
 * @returns {Generator} `undefined` when `yield*`ed
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return|Generator#return}
 * 
 * @example <caption>Wait for downloads</caption>
 * const downloads = []
 * 
 * function* download(url) {
 *      let done = false
 *      fetch(url)
 *        .then(response => response.json())
 *        .then(data => {
 *              downloads.push(data)
 *              done = true
 *        });
 *      while(!done)
 *          yield
 * }
 * 
 * const schedule = new Schedule()
 * schedule.add(function() {
 *      yield* all(download('http://example.com/foo.json')
 *                 download('http://example.com/bar.json')
 *                 download('http://example.com/baz.json'))
 *      console.log(downloads) // will have all downloaded json data at this point
 * })
 * setInterval(schedule.tick, 100)
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
 * When waited on with `yield*` returns the value returned by the first
 * completed coroutine. All other coroutines are cancelled with
 * `Generator#return`. 
 * 
 * @param {...(Generator|GeneratorFunction)} coros The coroutines to wait for
 * @returns {Generator} Returns value returned by first completed coroutine when `yield*`ed
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return|Generator#return}
 * 
 * @example <caption>Interrupt infinite coroutine</caption>
 * function* printForever(message) {
 *      while(true) {
 *          console.log(message)
 *          yield* seconds(1)
 *      }
 * }
 * 
 * function* waitForClick() {
 *      let pressed = false
 *      const button = document.querySelector("button")
 *      button.onclick = () => pressed = true
 *      while(!pressed) yield
 * }
 * 
 * const schedule = new Schedule()
 * schedule.add(first(printForever("ping"), waitForClick()))
 * setInterval(schedule.tick, 100)
 * 
 * @example <caption>Get first pressed button</caption>
 * function* waitForClick(button) {
 *      let pressed = false
 *      button.onclick = () => pressed = true
 *      while(!pressed) yield
 *      return button.textContent
 * }
 * 
 * const buttons = Array.prototype.slice.call(document.querySelectorAll("button"))
 * const schedule = new Schedule()
 * schedule.add(function* () {
 *      console.log("waiting for button press...")
 *      const pressedText = yield* first(...buttons.map(waitForClick))
 *      console.log("pressed", pressedText)
 * })
 * setInterval(schedule.tick, 100)
 * 
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

/**
 * A function that takes no arguments and returns a generator.
 * 
 * `GeneratorFunctions` are generally accepted wherever `Generators` are. This
 * is enables the common style of using `function*() { ... }` literals in
 * addition to instantiated `Generators`.
 * 
 * @callback GeneratorFunction
 * @returns {Generator} A generator
 * 
 * @example
 * const schedule = new Schedule()
 * function* foo() { ... }
 * schedule.add(foo()) // instantiated Generators work directly
 * schedule.add(foo)   // Generator functions are invoked to produce generators
 * schedule.add(function* () { ... })  // function* literals are also invoked to produce generators
 */

/**
 * A function that takes no arguments and returns the elapsed time in seconds.
 * 
 * @callback ClockCallback
 * @returns {number} Elapsed application time in seconds
 * @see {@link setClock}
 * @see {@link seconds}
 */
