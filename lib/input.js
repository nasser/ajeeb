/**
 * @module input
 */

/**
 * Recursively freeze an object
 * 
 * @ignore
 * @from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 * @param {any} object object to freeze
 * @return Frozen object
 */
function deepFreeze(object) {
    const propNames = Object.getOwnPropertyNames(object);
    for (const name of propNames) {
        const value = object[name];
        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    }
    return Object.freeze(object);
}

/**
 * The input system
 * 
 * Initialized with an *input pipeline*, an array of functions that compute and
 * return input values.
 * 
 * Exposes a `now` and `last` property representing the inputs captured "this
 * frame" and "last frame". Each is an object with properties that match the
 * names of the functions in the input pipeline.
 * 
 * `now` and `last` are updated when `collect` is called (ideally, once a frame
 * before any application logic has run). See `collect` documentation for
 * details. `now` and `last` are frozen and cannot be modified.
 * 
 * @example 
 * let input = new Input([
 *   function time() { ... },
 *   function keyboard() { ... },
 *   function mouse() { ... }
 * ])
 * 
 * input.collect()
 * input.now.time // value returned by time function
 * input.now.keyboard // value returned by keyboard function
 * input.now.mouse // value returned by mouse function
 * 
 * input.collect()
 * input.now.time // value returned by time function
 * input.last.time // value returned by time function in the first collect
 */
export class Input {
    /**
     * @param {function[]} inputPipeline array of functions that generate input values every frame
     */
    constructor(inputPipeline=[]) {
        for (const f of inputPipeline)
            if (f.name == "") throw new Error("All input functions must have names")

        this.inputPipeline = inputPipeline
        this.last = null
        this.now = null
    }

    /**
     * Collect inputs and update `now` and `last`.
     * 
     * Sets `last` to `now` and computes a new value for `now` by calling every
     * function in the input pipeline in turn. The values returned are
     * associated with the functions' names in `now`.
     * 
     * Input functions are called by passing in the new value for `now` as the
     * first argument and the last frame's input as the second argument. These
     * arguments can be ignored if they are not useful.
     * 
     * Expected to be called once a frame before any application logic.
     * 
     * @example
     * // previous value can be used to compute deltas
     * let input = new Input([
     *   function time(_now, previous) { 
     *     let now = performance.now()
     *     let delta = !previous ? 0 : now - previous.time.now;
     *     return { now, delta }
     *   }
     * ])
     * 
     * // now value can be used to process values from earlier in the pipeline
     * let input = new Input([
     *   function rawData() { ... }
     *   function smoothData(now) { 
     *     return smoothFunction(now.rawData)
     *   }
     * ])
     */
    collect() {
        let _now = {}
        for (const f of this.inputPipeline) {
            _now[f.name] = f(_now, this.now)
        }
        this.last = this.now
        this.now = deepFreeze(_now)
    }
}

/**
 * Construct new input system
 * 
 * Convenience variadic factory function
 * 
 * @param  {...function} inputFunctions 
 * input functions. they must all have names.
 */
export function init(...inputFunctions) {
    return new Input(inputFunctions)
}

/**
 * @typedef TimeSnapshot
 * @property {number} now the current time in seconds
 * @property {number} delta the number of seconds since the last frame
 * @property {number} frame the current frame number
 */

/**
 * Time input
 * 
 * @returns {TimeSnapshot} snapshot
 * 
 * @example
 * const input = new Input([time])
 * input.collect()
 * input.now.time // => { now: ..., delta: ..., frame: 0 }
 */
export function time(_thisFrame, prevFrame) {
    let now = performance.now() / 1000
    let delta = !prevFrame ? 0 : now - prevFrame.time.now;
    let frame = !prevFrame ? 0 : prevFrame.time.frame + 1
    return { now, delta, frame }
}