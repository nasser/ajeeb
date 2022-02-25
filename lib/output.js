export function init(...modules) {
    let o = new Output()

    for (let module of modules) {
        if (typeof module == "function")
            module = new module()
        let name = module.constructor.name
        let identifier = name.charAt(0).toLowerCase() + name.slice(1)
        o.addModule(identifier, module)
    }

    return o
}

/**
 * Output system
 */
export class Output {
    modules = []

    constructor(modules=[]) {
        for (let module of modules) {
            if (typeof module == "function")
                module = new module()
            let name = module.constructor.name
            let identifier = name.charAt(0).toLowerCase() + name.slice(1)
            this.addModule(identifier, module)
        }
    }

    /**
     * Add a module to the output pipeline
     * @param {string} name name to use when exposing this object's API
     * @param {{ commit:(output?) => void}} module output module object to add
     */
    addModule(name, module) {
        this.modules.push(module)
        this[name] = module
    }

    /**
     * Commit all output modules, writing to the world
     */
    commit() {
        for (const module of this.modules) {
            module.commit(this)
        }
    }
}