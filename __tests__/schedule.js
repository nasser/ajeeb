import * as coro from '../coroutines'

test('Schedule.add does not advance', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () {
        value = 1
        yield
        value = 2
    })
    expect(value).toBe(0)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(2)
})

test('Schedule.add does not advance (no yield)', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () {
        value = 1
    })
    expect(value).toBe(0)
    sched.tick()
    expect(value).toBe(1)
})

test('multiple coroutines in schedule all execute', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () { value += 1 })
    sched.add(function* () { value += 2 })
    sched.add(function* () { value += 3 })
    expect(value).toBe(0)
    sched.tick()
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
    sched.add(co())
    sched.add(co())
    expect(value).toBe(0)
    sched.tick()
    expect(value).toBe(3)
    sched.tick()
    expect(value).toBe(6)
})

test('coroutines run in order', () => {
    let value = 0
    const sched = new coro.Schedule()
    function* co1() { value = 1 }
    function* co2() { value = 2 }
    function* co3() { value = 3 }
    sched.add(co1())
    sched.add(co3())
    sched.add(co2())
    sched.tick()
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
    expect(value).toBe(3)
    sched.remove(co2Instance)
    sched.tick()
    expect(value).toBe(4)
    sched.remove(co1Instance)
    sched.tick()
    expect(value).toBe(4)
})

test('coroutines are removable en masse', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () { while(true) { value += 1; yield } })
    sched.add(function* () { while(true) { value += 2; yield } })
    sched.tick()
    expect(value).toBe(3)
    sched.removeAll()
    sched.tick()
    expect(value).toBe(3)
})