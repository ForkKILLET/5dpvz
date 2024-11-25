/* eslint-disable @stylistic/ts/indent */

import { Comp, Entity, Game, Scene } from '@/engine'
import { by, eq, neq } from '@/utils'
import { ShapeComp } from '@/comps/Shape'

export const kDebugFold = Symbol('kDebugFold')

export const loadDebugWindow = (game: Game) => {
    const $debugWindow = document.querySelector('#debug-window') as HTMLDivElement
    $debugWindow.innerHTML = `
        <style>
            #debug-window {
                position: fixed;
                top: 5px;
                right: 5px;
                width: 300px;
                height: calc(100vh - 5px * 2 - 10px * 2);
                overflow: scroll;
                padding: 10px;
                border: 1px solid black;
                background-color: white;
                font-family: monospace;
            }

            tab-header {
                display: inline-block;
            }
            tab-header::before {
                content: '[';
            }
            tab-header::after {
                content: ']';
            }
            tab-header.active {
                font-weight: bold;
            }
            tab-header.active::before {
                content: '<';
                color: red;
            }
            tab-header.active::after {
                content: '>';
                color: red;
            }
            tab-header:hover {
                cursor: pointer;
                text-decoration: underline;
            }

            tab-content {
                display: none;
            }

            debug-button, tab-header {
                color: blue;
                user-select: none;
            }
            debug-button::before {
                content: '['
            }
            debug-button::after {
                content: ']'
            }
            debug-button.disabled {
                color: #888;
            }
            debug-button.active {
                color: red;
            }
            debug-button:not(.disabled):hover {
                cursor: pointer;
                text-decoration: underline;
            }

            debug-input::before {
                content: '['
            }
            debug-input::after {
                content: ']'
            }
            debug-input:focus-within::before {
                content: '<';
                color: red;
            }
            debug-input:focus-within::after {
                content: '>';
                color: red;
            }
            debug-input > input {
                font-family: monospace;
                border: none;
                outline: none;
            }
            debug-input > input[type="number"] {
                color: blue;
                appearance: textfield;
            }
            debug-input > input:focus {
                text-decoration: underline;
            }

            #debug-window ul {
                margin: 0;
            }
            #debug-window li {
                margin-left: -15px;
                border: 1px solid transparent;
            }
            #debug-window li.inactive {
                color: #888;
            }
            #debug-window li.selecting {
                border-color: red;
                background-color: rgba(255, 0, 0, 0.1);
            }
            #debug-window li.watching {
                border-color: blue;
                background-color: rgba(0, 0, 255, 0.1);
            }

            entity-id {
                color: fuchsia;
            }
            entity-attr {
                color: blue;
            }
            entity-attr::before {
                content: '[';
            }
            entity-attr::after {
                content: ']';
            }

            json-item {
                margin-left: 10px;
                display: block;
            }
            json-item::after {
                content: ',';
                color: #888;
            }
            json-object::before {
                content: '{';
                color: #888;
            }
            json-object::after {
                content: '}';
                color: #888;
            }
            json-array::before {
                content: '[';
                color: #888;
            }
            json-array::after {
                content: ']';
                color: #888;
            }
            json-key::after {
                content: ': ';
                color: #888;
            }
            json-number {
                color: blue;
            }
            json-symbol {
                color: fuchsia;
            }
            json-string::before {
                content: '"';
            }
            json-string::after {
                content: '"';
            }
            json-string {
                color: red;
            }
            json-boolean {
                color: green;
            }
            json-null::after {
                content: 'null';
            }
            json-null {
                color: #888;
            }
            json-function {
                color: chocolate;
            }
        </style>

        <tab-header data-tab="entity-tree">Entity Tree</tab-header>
        <tab-header data-tab="entity-detail">Entity Detail</tab-header>
        <tab-header data-tab="comp-detail">Comp Detail</tab-header>
        <tab-header data-tab="loop">Loop</tab-header>
        <br /><br />
        <tab-content data-tab="entity-tree">
            <debug-button id="select">@</debug-button>
            <debug-button id="show-boundary">Boundary</debug-button>
            <debug-button id="refresh-entity-tree">Refresh</debug-button>
            <debug-button id="auto-refresh-entity-tree">Manual</debug-button>
            <br /><br />
            <div id="entity-tree-content"></div>
        </tab-content>
        <tab-content data-tab="entity-detail">
            <debug-button id="back-to-entity-tree">&lt;</debug-button>
            <debug-button id="refresh-entity-detail">Refresh</debug-button>
            <br /><br />
            <div id="entity-detail-content"></div>
        </tab-content>
        <tab-content data-tab="comp-detail">
            <debug-button id="back-to-entity-detail">&lt;</debug-button>
            <debug-button id="refresh-comp-detail">Refresh</debug-button>
            <br /><br />
            <div id="comp-detail-content"></div>
        </tab-content>
        <tab-content data-tab="loop">
            <debug-button id="pause-start">Pause</debug-button>
            <debug-button id="step" class="disabled">Step</debug-button>
            <br /><br />
            <b>mspf</b>: <debug-input><input id="mspf-input" type="number" value="${ game.mspf }" /></debug-input>
            <debug-button id="mspf-submit">OK</debug-button>
            <b>loop duration</b>: <json-number id="loop-duration">0</json-number>ms
        </tab-content>
    `
    const $ = <E extends Node = HTMLElement>(selector: string) =>
        $debugWindow.querySelector(selector) as E | null
    const $$ = <E extends Node = HTMLElement>(selector: string) =>
        $debugWindow.querySelectorAll(selector) as unknown as NodeListOf<E>

    const $loopDuration = $('#loop-duration')!
    class DebugHandle extends Scene {
        constructor() {
            super()

            this.state.zIndex = Infinity

            this.game.emitter.onSome([
                'entityStart',
                'entityDispose',
                'entityAttach',
                'entityActivate',
                'entityDeactivate',
                'hoverTargetChange',
            ], () => refreshEntityTree())

            this.game.mouse.emitter.on('click', () => {
                if (selecting && selectingEntity) {
                    setWatchingEntity(selectingEntity)
                    $(`li[data-id="${ selectingEntity.id }"]`)?.scrollIntoView()
                    selectingEntity = null
                    toggleSelecting()
                    refreshEntityDetail()
                    return false
                }
            }, { capture: true })
        }

        render() {
            const { ctx } = this.game

            watchingEntity?.withComp(ShapeComp.withTag(eq('boundary')), shape => {
                const { entity } = shape
                if (! entity.deepActive) {
                    unsetWatchingEntity()
                    return
                }
                ctx.strokeStyle = 'blue'
                shape.stroke()
                ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'
                ctx.fill()
            })

            const [ selectingEntityData ] = this.game
                .allEntities
                .filter(entity => ! (entity instanceof DebugHandle)
                    && entity.deepActive
                    && entity.hasComp(ShapeComp.withTag(eq('boundary')))
                    && (selecting || showBoundary || entity === reverseSelectingEntity)
                )
                .map(entity => {
                    const shape = entity.getComp(ShapeComp.withTag(eq('boundary')))!
                    ctx.strokeStyle = 'red'
                    shape.stroke()
                    if (selecting && shape.contains(this.game.mouse.position) || entity === reverseSelectingEntity)
                        return { entity, shape }
                    return null
                })
                .filter(neq(null))
                .sort(by(data => - data.entity.state.zIndex))

            if (selectingEntityData) {
                const { entity, shape } = selectingEntityData
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
                shape.fill()

                if (selectingEntity !== entity) {
                    if (selectingEntity) cancelSelecting()
                    $(`li[data-id="${ entity.id }"]`)?.classList.add('selecting')

                    selectingEntity = entity
                }
            }
        }

        update() {
            $loopDuration.innerText = this.game.loopDuration.toString()
        }
    }
    game.addScene(new DebugHandle())

    let currentTab: string | undefined = undefined
    const $currentTab = () => currentTab ? $(`tab-content[data-tab="${ currentTab }"]`)! : null
    const $currentTabHeader = () => currentTab ? $(`tab-header[data-tab="${ currentTab }"]`)! : null
    const switchTab = (tab: string) => {
        if (currentTab) {
            $currentTabHeader()!.className = ''
            $currentTab()!.style.display = 'none'
        }
        currentTab = tab
        $currentTabHeader()!.className = 'active'
        $currentTab()!.style.display = 'block'
    }
    $$('tab-header').forEach($tabHeader => {
        $tabHeader.addEventListener('click', () => switchTab($tabHeader.dataset['tab']!))
    })
    switchTab('entity-tree')

    let selecting = false
    let showBoundary = false
    let selectingEntity: Entity | null = null
    let reverseSelectingEntity: Entity | null = null

    const $selectButton = $('#select')!
    const toggleSelecting = () => {
        selecting = ! selecting
        $selectButton.className = selecting ? 'active' : ''
    }
    const cancelSelecting = () => {
        if (! selectingEntity) return
        $(`li[data-id="${ selectingEntity.id }"]`)?.classList.remove('selecting')
        selectingEntity = null
    }
    $selectButton.addEventListener('click', toggleSelecting)

    const $showBoundaryButton = $('#show-boundary')!
    $showBoundaryButton.addEventListener('click', () => {
        showBoundary = ! showBoundary
        $showBoundaryButton.className = showBoundary ? 'active' : ''
    })

    const entityFoldState = new Map<number, boolean>()

    const showEntityAttrs = (attrs: (string | boolean | null)[]) => attrs
        .filter(attr => attr)
        .map(attr => `<entity-attr>${ attr }</entity-attr>`)
        .join(' ')

    const getEntityAttrs = (entity: Entity) => {
        return [
            game.hoveringEntity === entity ? 'hovering' : null,
            ! entity.started && 'unstarted',
        ].filter(c => c)
    }

    const showEntityTree = (entity: Entity): string => {
        const className = [
            entity.active ? null : 'inactive',
            entity === watchingEntity ? 'watching' : null,
        ].filter(neq(null)).join(' ')
        const isFolden = entityFoldState.get(entity.id) ?? entity[kDebugFold]
        const hasAttached = entity.attachedEntities.length > 0
        return `<li class="${ className }" data-id="${ entity.id }">
            ${ hasAttached
                ? `<debug-button class="fold-entity">${ isFolden ? '+' : '-' }</debug-button>`
                : ''
            }
            ${ showEntityHeader(entity) }
            ${ hasAttached && ! isFolden
                ? `<ul>
                    ${ entity.attachedEntities
                        .map(entity => `\n${ showEntityTree(entity) }`)
                        .join('')
                    }
                </ul>`
                : ''
            }
        </li>`
    }

    const showEntityRoot = (entities: Entity[]) => {
        return `<ul>${ entities.map(showEntityTree).join('\n') }</ul>`
    }

    let watchingEntity: Entity | null = null
    let watchingComp: Comp | null = null
    const unsetWatchingEntity = () => {
        watchingEntity = null
        watchingComp = null
        switchTab('entity-tree')
    }
    const setWatchingEntity = (entity: Entity) => {
        watchingEntity = entity
        Object.assign(window, { e: entity })

        $('.watching')?.classList.remove('watching')
        $<HTMLLIElement>(`li[data-id="${ entity.id }"]`)?.classList.add('watching')
        entity.on('dispose', () => {
            if (watchingEntity === entity) unsetWatchingEntity()
        })
    }
    const unsetWatchingComp = () => {
        watchingComp = null
        switchTab('entity-detail')
    }
    const setWatchingComp = (comp: Comp) => {
        watchingComp = comp
        Object.assign(window, { c: comp })
    }
    let autoRefreshEntityTree = true
    const refreshEntityTree = () => {
        if (currentTab === 'entity-detail') {
            if (! watchingEntity) return
            $('#entity-detail-tree-content')!.innerHTML = showEntityRoot(watchingEntity.attachedEntities)
        }
        else
            $entityTreeContent.innerHTML = showEntityRoot(game.scenes)
    }
    const $entityTreeContent = $('#entity-tree-content')!
    $('#refresh-entity-tree')!.addEventListener('click', refreshEntityTree)
    const $autoRefresh = $('#auto-refresh-entity-tree')!
    $autoRefresh.addEventListener('click', () => {
        $autoRefresh.innerHTML = autoRefreshEntityTree ? 'Auto' : 'Manual'
        autoRefreshEntityTree = ! autoRefreshEntityTree
    })
    window.addEventListener('mouseover', ({ target: $el }) => {
        reverseSelectingEntity = null
        $('.selecting')?.classList.remove('selecting')
        if ($el instanceof HTMLElement && $el.tagName === 'LI') {
            $el.classList.add('selecting')
            const id = + $el.dataset.id!
            reverseSelectingEntity = game.getEntityById(id)
        }
    })
    window.addEventListener('keypress', ({ key }) => {
        if (key === '@') toggleSelecting()
    })

    const showFunction = (fn: Function) => (fn.name as string)?.replace(/(^_)|(\d+$)/, '') ?? '<fn>'

    const showJson = (obj: any) =>
        typeof obj === 'number' ? `<json-number>${ obj }</json-number>` :
        typeof obj === 'string' ? `<json-string>${ obj }</json-string>` :
        typeof obj === 'boolean' ? `<json-boolean>${ obj }</json-boolean>` :
        typeof obj === 'symbol' ? `<json-symbol>${ obj.description }</json-symbol>` :
        typeof obj === 'function' ? `<json-function>${ showFunction(obj) }</json-function>` :
        obj === null ? '<json-null></json-null>' :
        obj instanceof Entity ? showEntityHeader(obj) :
        obj instanceof Comp ? showCompLink(obj) :
        Array.isArray(obj) ? `
            <json-array>${ obj
                .map((child): string => `<json-item>${ showJson(child) }</json-item>`)
                .join('')
            }</json-array>
        `.trim() : `
            <json-object>${ Object
                .entries(obj)
                .map(([ key, value ]): string => `
                    <json-item><json-key>${ key }</json-key><json-value>${ showJson(value) }</json-value></json-item>
                `)
                .join('')
            }</json-object>
        `.trim()

    const refreshEntityDetail = () => {
        const e = watchingEntity
        if (! e) return $entityDetailContent.innerHTML = 'No entity selected'
        const attrs = [
            e.deepActive ? 'active' : 'inactive',
            ...getEntityAttrs(e),
        ]

        const protoChain = []
        for (let proto = e.constructor; proto !== Function.prototype; proto = Object.getPrototypeOf(proto)) {
            protoChain.push(proto)
        }

        $entityDetailContent.innerHTML = `
            ${ showEntityHeader(e, false) }
            ${ showEntityAttrs(attrs) }<br />
            <b>buildName</b> ${ showJson(e.buildName) }<br />
            <b>state</b> ${ showJson(e.state) }<br />
            <b>config</b> ${ showJson(e.config) }<br />
            <b>providedKeys</b> ${ showJson(Object.getOwnPropertySymbols(e.providedValues)) }<br />
            <b>injectableKeys</b> ${ showJson(e.injectableKeys) }<br />
            <b>comps</b> ${ showJson(e.comps) }<br />
            <b>superEntity</b> ${ showJson(e.superEntity) }<br />
            <b>protoChain</b> ${ showJson(protoChain) }<br />
            <b>attachedEntities</b> <div id="entity-detail-tree-content"></div>
        `
        refreshEntityTree()
    }
    const refreshCompDetail = () => {
        const c = watchingComp
        if (! c) return $compDetailContent.innerHTML = 'No comp selected'
        $compDetailContent.innerHTML = `
            ${ showCompLink(c, false) }
            <b>state</b> ${ showJson(c.state) }<br />
            <b>config</b> ${ showJson(c.config) }<br />
            <b>entity</b> ${ showJson(c.entity) }<br />
        `
    }
    const $entityDetailContent = $('#entity-detail-content')!
    const $compDetailContent = $('#comp-detail-content')!
    $('#back-to-entity-tree')!.addEventListener('click', unsetWatchingEntity)
    $('#back-to-entity-detail')!.addEventListener('click', unsetWatchingComp)
    $('#refresh-entity-detail')!.addEventListener('click', refreshEntityDetail)
    const showEntityHeader = (entity: Entity, hasLink = true) => {
        const attrs = getEntityAttrs(entity)
        const { id } = entity
        return `
            ${ showFunction(entity.constructor) }<entity-id>#${ id }</entity-id>
            ${ showEntityAttrs(attrs) }
            ${ hasLink ?
                `<debug-button data-id="${ id }" class="show-entity-detail">&gt;</debug-button>`
                : ''
            }
        `
    }
    const showCompLink = (comp: Comp, hasLink = true) => {
        const index = comp.entity.comps.indexOf(comp)
        return `
            ${ showFunction(comp.constructor) }
            ${ hasLink
                ? `<debug-button data-index="${ index }" class="show-comp-detail">&gt;</debug-button>`
                : ''
            }
        `
    }

    $debugWindow.addEventListener('click', ({ target: $el }) => {
        if (! ($el instanceof HTMLElement)) return
        if ($el.tagName === 'DEBUG-BUTTON') {
            if ($el.classList.contains('fold-entity')) {
                const id = + $el.parentElement!.dataset.id!
                entityFoldState.set(id, ! entityFoldState.get(id))
                refreshEntityTree()
            }
            else if ($el.classList.contains('show-entity-detail')) {
                const id = + $el.dataset.id!
                const entity = game.getEntityById(id)
                if (entity) {
                    setWatchingEntity(entity)
                    switchTab('entity-detail')
                    refreshEntityDetail()
                }
            }
            else if ($el.classList.contains('show-comp-detail')) {
                const index = + $el.dataset.index!
                const comp = watchingEntity?.comps[index]
                if (comp) {
                    setWatchingComp(comp)
                    switchTab('comp-detail')
                    refreshCompDetail()
                }
            }
        }
        else if ($el.tagName === 'LI') {
            const id = + $el.dataset.id!
            const entity = game.getEntityById(id)
            if (entity) setWatchingEntity(entity)
        }
    }, { capture: true })

    let stepCount = 0
    const $pauseStartButton = $('#pause-start')!
    $pauseStartButton.addEventListener('click', () => {
        game[game.running ? 'pause' : 'start']()
        if (game.running) {
            $stepButton.innerHTML = 'Step'
            stepCount = 0
        }
        $pauseStartButton.innerHTML = game.running ? 'Pause' : 'Start'
        $stepButton.className = game.running ? 'disabled' : ''
    })

    const $stepButton = $('#step')!
    $stepButton.addEventListener('click', () => {
        if (game.running) return
        $stepButton.innerHTML = `Step: ${ ++ stepCount }`
        game.loop()
    })

    const $mspfInput = $<HTMLInputElement>('#mspf-input')!
    $('#mspf-submit')!.addEventListener('click', () => {
        const { running } = game
        if (running) game.pause()
        game.mspf = + $mspfInput.value
        $mspfInput.value = game.mspf.toString()
        if (running) game.start()
    })
}
