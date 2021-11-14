import * as coro from '../coroutines.js'

test('coro.first try-finally cleans up after success', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        yield
        return 'first'
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesFirst, finishesSecond))
    })

    sched.tick()
    sched.tick()
    sched.tick()
    
    expect(value).toStrictEqual(['clean up from finishesSecond', 'first'])
})

test('coro.first try-finally cleans up after success in order', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        yield
        return 'first'
    }

    function* finishesLast(x) {
        try {
            yield
            yield
            yield
            return 
        } finally {
            value.push(x)
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesLast(3), finishesLast(2), finishesFirst, finishesLast(1), finishesLast(4)))
    })

    sched.tick()
    sched.tick()
    sched.tick()
    
    expect(value).toStrictEqual([3, 2, 1, 4, 'first'])
})

test('coro.first try-finally cleans up after success, nested', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        yield
        return 'first'
    }

    function* intermediate() {
        yield* finishesSecond()
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesFirst, intermediate))
    })

    sched.tick()
    sched.tick()
    sched.tick()
    
    expect(value).toStrictEqual(['clean up from finishesSecond', 'first'])
})

test('coro.first try-finally cleans up after success, nested, multiple try-finally', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        yield
        return 'first'
    }

    function* intermediate() {
        try {
            yield* finishesSecond()
        } finally {
            value.push('clean up from intermediate')
        }
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesFirst, intermediate))
    })

    sched.tick()
    sched.tick()
    sched.tick()
    
    expect(value).toStrictEqual(['clean up from finishesSecond', 'clean up from intermediate', 'first'])
})

test('coro.first try-finally cleans up after error', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        throw "error from finishesFirst"
        return 'first'
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesFirst, finishesSecond))
    })

    try {
        sched.tick()
        sched.tick()
        sched.tick()
    } catch(e) {
        expect(e).toEqual("error from finishesFirst")
    }
    
    expect(value).toStrictEqual(['clean up from finishesSecond'])
})

test('coro.first try-finally cleans up after error, nested', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        throw "error from finishesFirst"
        return 'first'
    }

    function* intermediate() {
        yield* finishesSecond()
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesFirst, intermediate))
    })

    try {
        sched.tick()
        sched.tick()
        sched.tick()
    } catch(e) {
        expect(e).toEqual("error from finishesFirst")
    }
    
    expect(value).toStrictEqual(['clean up from finishesSecond'])
})

test('coro.first try-finally cleans up after error, nested, multiple try-finally', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        throw "error from finishesFirst"
        return 'first'
    }

    function* intermediate() {
        try {
            yield* finishesSecond()
        } finally {
            value.push('clean up from intermediate')
        }
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        value.push(yield* coro.first(finishesFirst, intermediate))
    })

    try {
        sched.tick()
        sched.tick()
        sched.tick()
    } catch(e) {
        expect(e).toEqual("error from finishesFirst")
    }
    
    expect(value).toStrictEqual(['clean up from finishesSecond', 'clean up from intermediate'])
})

test('coro.all try-finally cleans up after error', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        throw "error from finishesFirst"
        return 'first'
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        yield* coro.all(finishesFirst, finishesSecond)
    })

    try {
        sched.tick()
        sched.tick()
        sched.tick()
    } catch(e) {
        expect(e).toEqual("error from finishesFirst")
    }
    
    expect(value).toStrictEqual(['clean up from finishesSecond'])
})

test('coro.all try-finally cleans up after error, nested', () => {
    let value = []
    const sched = new coro.Schedule()

    function* finishesFirst() {
        yield
        throw "error from finishesFirst"
        return 'first'
    }

    function* intermediate() {
        yield* finishesSecond()
    }

    function* finishesSecond() {
        try {
            yield
            yield
            yield
            return 'second'
        } finally {
            value.push('clean up from finishesSecond')
        }
    }
    
    sched.add(function* () {
        yield* coro.all(finishesFirst, intermediate)
    })

    try {
        sched.tick()
        sched.tick()
        sched.tick()
    } catch(e) {
        expect(e).toEqual("error from finishesFirst")
    }
    
    expect(value).toStrictEqual(['clean up from finishesSecond'])
})
