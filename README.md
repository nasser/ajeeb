# The Ajeeb Game Engine

Ajeeb is a wondrous open source game engine built on web technologies.

## Status

This is an experiment. I am building an engine primarily for myself in search of a fluency and a sense of flow in game development that I've lacked. I expect there are a lot of bad ideas in here, and things that will never actually get done. I'm sharing it in the hope that some of this will be interesting or useful, but I can't make any guarantees about stability, maintenance, coherence, or soundness. Here be dragons! 🐉

## Design & Implementation

Ajeeb is not monolithic like other engines, but rather a collection of independent JavaScript modules designed to work together. That means you can mix and match features of the engine and only use what you need. Down the line there will likely be a single-click "give me everything" option, but designing the engine like this makes it easier to reason about.

Ajeeb is written in TypeScript but designed to be used from either JavaScript or TypeScript.

## Modules

The engine as it exists is made up of these modules. They are not public for the most part as I continue to extract them from the initial game they were developed for, but they will be linked here when they're ready.

### [Coroutines](http://nas.sr/ajeeb-coroutines/)

The backbone of the engine, Ajeeb's coroutines are based on [ES6 Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) and inspired by [Unity](https://docs.unity3d.com/Manual/Coroutines.html). They get used everywhere from the main loop of the game to transitions and effects. Of all the abstractions and functionality, Ajeeb provides, coroutines are the most widely applicable.

### Input

A simple system to gather and store input from the environment at the start of each frame. Ajeeb's input is designed as a pipeline so you can build up low-level events like key-presses into higher-level game specific events like "player is jumping".

Not yet published.

### Entity Component System

Ajeeb includes a TypeScript port of [EnTT](https://github.com/skypjack/entt).

Not yet published.

### THREE.js, Cannon.js, Blender Integration

For 3D games Ajeeb currently uses [THREE.js](https://threejs.org/) for graphics and [Cannon.js](https://schteppe.github.io/cannon.js/) for physics. It supports a [Blender](https://www.blender.org/)-based workflow that is integrated into the Entity Component System where Blender plays the role of both the modeling package and the level editor.

Not yet published.

## Future

Some next steps that are on my mind.

### IDE

Ajeeb uses [Electron](https://electronjs.org/) as its player (exported desktop games run on top of Electron) and IDE. Electron provides a ton of crucial functionality right out of the box, like a [stepping debugger](https://developers.google.com/web/tools/chrome-devtools/javascript/) and a [profiler](https://developers.google.com/web/tools/chrome-devtools/rendering-tools/). Electron supports [Chrome's DevTools Extensions](https://electronjs.org/docs/tutorial/devtools-extension), which means in principle Ajeeb could include game-specific inspectors e.g. a coroutine or entity component system inspector.

### Constants

The constants module would provide a workflow to replace hard-coded constant values that tend to pepper game source code with references to a central JSON file or equivalent. These constants could then be tweaked in an inspector, much like in Unity, maybe using a toolkit like [control-kit](https://github.com/automat/controlkit.js).

### PIXI.js, Matter.js integration

Because of its modular nature, 2D games in Ajeeb are not forced to use THREE.js, and Cannon.js but could use the more appropriate [Pixi.js](https://pixijs.io/) and [Matter.js](http://brm.io/matter-js/) integrations if they existed.

## Name

*Ajeeb* comes from the Arabic عجيب meaning "wondrous" but with a connotation of "strange" or "miraculous". It was developed for my contribution to the Wonderbundle in [Wonderville](https://www.wonderville.nyc/)'s successful 2019 [Kickstarter campaign](https://www.kickstarter.com/projects/markkleeb/wonderville-arcade/description) and is named after Wonderville.

## Legal

Copyright &copy; 2019 Ramsey Nasser

Provided under the [MIT License](https://opensource.org/licenses/MIT).
