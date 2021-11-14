import * as coro from '../lib/coroutines.js'

test('frames', () => {
    let value = 0
    const sched = new coro.Schedule()
    sched.add(function* () { 
        value = 1
        yield* coro.frames(4)
        value = 2
    })
    expect(value).toBe(0)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(2)
})

test('wait until', () => {
    let value = 0
    let flag = false
    const sched = new coro.Schedule()
    sched.add(function* () { 
        value = 1
        while(!flag) yield
        value = 2
    })
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    flag = true
    sched.tick()
    expect(value).toBe(2)
})

test('wait while', () => {
    let value = 0
    let flag = true
    const sched = new coro.Schedule()
    sched.add(function* () { 
        value = 1
        while(flag) yield
        value = 2
    })
    sched.tick()
    expect(value).toBe(1)
    sched.tick()
    expect(value).toBe(1)
    flag = false
    sched.tick()
    expect(value).toBe(2)
})

test('coro.all coroutines runs in order', () => {
    let value = []
    const sched = new coro.Schedule()
    sched.add(coro.all(
        function* () { value.push(1) },
        function* () { value.push(2) },
        function* () { value.push(3) }
    ))
    sched.tick()
    expect(value).toStrictEqual([1, 2, 3])
})

test('coro.all coroutines are removed', () => {
    let value = []
    const sched = new coro.Schedule()
    sched.add(coro.all(
        function* () { while(true) { value.push(1); yield } },
        function* () { value.push(2) },
        function* () { value.push(3) }
    ))
    sched.tick()
    sched.tick()
    sched.tick()
    expect(value).toStrictEqual([1, 2, 3, 1, 1])
})

test('coro.all completes when all coroutines complete', () => {
    let value = []
    const sched = new coro.Schedule()

    sched.add(function* () {
        value.push('a')
        yield* coro.all(
            function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
            function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
            function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },    
        )
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'A2'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'A2', 'b'])
})

test('for-of loop evaluates sequentially', () => {
    let value = []
    const sched = new coro.Schedule()
    const coros = 
    [
        function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
        function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
        function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },
    ]

    sched.add(function* () {
        value.push('a')
        for (const c of coros)
            yield* c()
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0', 'B1'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0', 'B1', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'A1', 'A2', 'B0', 'B1', 'C0', 'b'])
})

test('coro.first completes when first coroutine completes', () => {
    let value = []
    const sched = new coro.Schedule()

    sched.add(function* () {
        value.push('a')
        yield* coro.first(
            function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } },
            function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
            function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } }
        )
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'b'])
})

test('coro.first coroutines evaluate in order', () => {
    let value = []
    const sched = new coro.Schedule()

    sched.add(function* () {
        value.push('a')
        yield* coro.first(
            function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } },
            function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } },
            function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } }
        )
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0', 'b'])
})

test('coro.first coroutines return values', () => {
    let value = []
    const sched = new coro.Schedule()

    sched.add(function* () {
        value.push('a')
        value.push(yield* coro.first(
            function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } return 'AA' },
            function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } return 'BB' },
            function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } return 'CC' },    
        ))
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'A0', 'B0', 'C0', 'A1', 'B1', 'CC', 'b'])
})

test('coro.first coroutines return values, order matters', () => {
    let value = []
    const sched = new coro.Schedule()

    sched.add(function* () {
        value.push('a')
        value.push(yield* coro.first(
            function* () { for(let i=0; i<1; i++) { value.push(`C${i}`); yield } return 'CC' },
            function* () { for(let i=0; i<2; i++) { value.push(`B${i}`); yield } return 'BB' },
            function* () { for(let i=0; i<3; i++) { value.push(`A${i}`); yield } return 'AA' }    
        ))
        value.push('b')
    })

    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0'])
    sched.tick()
    expect(value).toStrictEqual(['a', 'C0', 'B0', 'A0', 'CC', 'b'])
})

test('time passes during wait', done => {
    const sched = new coro.Schedule()
    let interval
    sched.add(function* () {
        let start = process.hrtime.bigint()
        yield* coro.seconds(1)
        let end = process.hrtime.bigint()
        expect(end - start).toBeGreaterThanOrEqual(1000000000)
        clearInterval(interval)
        done()
    })
    interval = setInterval(_ => sched.tick(), 200)
})