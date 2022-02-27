import * as coro from '../lib/coroutines'

function actualSize(schedule) {
    let size = 0
    let node = schedule.front
    while(node != null) {
        size++
        node = node.link
    }
    return size
}

function actualBack(schedule) {
    let node = schedule.front
    if(node == null)
        return null 
    while(node.link != null) {
        node = node.link
    }
    return node
}

function validState(sched) {
    expect(sched.size).toBe(actualSize(sched))
    expect(sched.back).toBe(actualBack(sched))
}

test('coroutines can schedule coroutines', () => {
    const sched = new coro.Schedule()
    sched.add(function* () {
        let t = 3
        while(t--) yield
        sched.add(function* () {
            yield
            console.log('other');
        })
    })
    sched.add(function* () {
        let t = 8
        while(t--) yield
    })
    while(sched.size) {
        sched.tick()
        validState(sched)
    }
})


test('Schedule.add does not advance', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () {
        value = 1
        yield
        value = 2
    })
    validState(sched)
    expect(value).toBe(0)
    sched.tick()
    validState(sched)
    expect(value).toBe(1)
    sched.tick()
    validState(sched)
    expect(value).toBe(2)
})

test('Schedule.add does not advance (no yield)', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () {
        value = 1
    })
    validState(sched)
    expect(value).toBe(0)
    sched.tick()
    validState(sched)
    expect(value).toBe(1)
})

test('multiple coroutines in schedule all execute', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () { value += 1 })
    validState(sched)
    sched.add(function* () { value += 2 })
    validState(sched)
    sched.add(function* () { value += 3 })
    validState(sched)
    expect(value).toBe(0)
    sched.tick()
    validState(sched)
    expect(value).toBe(6)
})

test('multiple instances of coroutine in schedule all execute', () => {
    let value = 0
    const sched = new coro.Schedule()
    function* co() {
        while(true) {
            value += 1
            yield
        }
    }
    sched.add(co())
    validState(sched)
    sched.add(co())
    validState(sched)
    sched.add(co())
    validState(sched)
    expect(value).toBe(0)
    sched.tick()
    validState(sched)
    expect(value).toBe(3)
    sched.tick()
    validState(sched)
    expect(value).toBe(6)
})

test('coroutines run in order', () => {
    let value = 0
    const sched = new coro.Schedule()
    function* co1() { value = 1 }
    function* co2() { value = 2 }
    function* co3() { value = 3 }
    sched.add(co1())
    validState(sched)
    sched.add(co3())
    validState(sched)
    sched.add(co2())
    validState(sched)
    sched.tick()
    validState(sched)
    expect(value).toBe(2)
})

test('coroutines are removable', () => {
    let value = 0
    const sched = new coro.Schedule()
    function* co1() { while(true) { value += 1; yield } }
    function* co2() { while(true) { value += 2; yield } }
    const co1Instance = co1()
    const co2Instance = co2()
    sched.add(co1Instance)
    sched.add(co2Instance)
    sched.tick()
    validState(sched)
    expect(value).toBe(3)
    sched.remove(co2Instance)
    validState(sched)
    sched.tick()
    validState(sched)
    expect(value).toBe(4)
    sched.remove(co1Instance)
    validState(sched)
    sched.tick()
    validState(sched)
    expect(value).toBe(4)
})

test('coroutines are removable en masse', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () { while(true) { value += 1; yield } })
    sched.add(function* () { while(true) { value += 2; yield } })
    sched.tick()
    validState(sched)
    expect(value).toBe(3)
    sched.removeAll()
    validState(sched)
    sched.tick()
    validState(sched)
    expect(value).toBe(3)
})

test('Coroutine nested in one-frame coroutine fires', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () {
        sched.add(function* () {
            value = 1
        })
    })
    expect(value).toBe(0)
    sched.tick()
    validState(sched)
    expect(value).toBe(0)
    sched.tick()
    validState(sched)
    expect(value).toBe(1)
})