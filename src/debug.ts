/* eslint-disable @stylistic/ts/indent */

import { Entity, Game, Scene } from '@/engine'
import { BoundaryComp } from '@/comps/Boundary'
import { by, neq } from '@/utils'

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

            debug-button.show-entity-detail {
                color: green;
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
                color: purple;
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
        <tab-header data-tab="loop">Loop</tab-header>
        <br /><br />
        <tab-content data-tab="entity-tree">
            <debug-button id="select">@</debug-button>
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
        <tab-content data-tab="loop">
            <debug-button id="pause-start">Pause</debug-button>
            <debug-button id="step" class="disabled">Step</debug-button>
            <br /><br />
            <b>mspf</b>: <debug-input><input id="mspf-input" type="number" value="${ game.mspf }" /></debug-input>
            <debug-button id="mspf-submit">OK</debug-button>
        </tab-content>
    `
    const $ = <E extends Node = HTMLElement>(selector: string) =>
        $debugWindow.querySelector(selector) as E | null
    const $$ = <E extends Node = HTMLElement>(selector: string) =>
        $debugWindow.querySelectorAll(selector) as unknown as NodeListOf<E>

    class DebugHandle extends Scene {
        constructor() {
            super([])
            this.state.zIndex = Infinity
            this.afterStart(() => {
                this.game.emitter.onSome([
                    'entityStart',
                    'entityDispose',
                    'entityAttach',
                    'entityActivate',
                    'entityDeactivate',
                    'hoverTargetChange',
                ], refreshEntityTree)

                this.game.mouse.emitter.on('click', () => {
                    if (selecting && selectingEntity) {
                        setWatchingEntity(selectingEntity)
                        selectingEntity = null
                        toggleSelecting()
                        refreshEntityDetail()
                        return false
                    }
                }, { capture: true })
            })
        }

        render() {
            const { ctx } = this.game

            watchingEntity?.withComp(BoundaryComp, boundaryComp => {
                const { rect: { width, height }, entity } = boundaryComp
                if (! entity.deepActive) {
                    unsetWatchingEntity()
                    return
                }
                const { x, y } = entity.state.position
                ctx.strokeStyle = 'blue'
                ctx.strokeRect(x, y, width, height)
                ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'
                ctx.fillRect(x, y, width, height)
            })

            const [ selectingEntityData ] = this.game
                .allEntities
                .filter(entity => ! (entity instanceof DebugHandle)
                    && entity.deepActive
                    && entity.hasComp(BoundaryComp)
                    && (selecting || entity === reverseSelectingEntity)
                )
                .map(entity => {
                    const boundaryComp = entity.getComp(BoundaryComp)
                    if (! boundaryComp) return null

                    const { x, y, width, height } = boundaryComp.rect
                    ctx.strokeStyle = 'red'
                    ctx.strokeRect(x, y, width, height)
                    if (boundaryComp.contains(this.game.mouse.position) || entity === reverseSelectingEntity)
                        return { x, y, width, height, entity }
                    return null
                })
                .filter(neq(null))
                .sort(by(data => - data.entity.state.zIndex))

            if (selectingEntityData) {
                const { x, y, width, height, entity } = selectingEntityData
                ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
                ctx.fillRect(x, y, width, height)

                if (selectingEntity !== entity) {
                    if (selectingEntity) cancelSelecting()
                    $(`li[data-id="${ entity.id }"]`)?.classList.add('selecting')

                    selectingEntity = entity
                }
            }
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

    const entityFoldState = new Map<number, boolean>()

    const showEntityAttrs = (attrs: (string | boolean | null)[]) => attrs
        .filter(attr => attr)
        .map(attr => `<entity-attr>${ attr }</entity-attr>`)
        .join(' ')

    const getEntityAttrs = (entity: Entity) => {
        return [
            game.hoveringEntity === entity ? 'hovering' : null,
            entity.frozen && 'frozen',
            ! entity.started && 'unstarted',
        ].filter(c => c)
    }

    const showEntityTree = (entity: Entity): string => {
        const className = [
            entity.active ? null : 'inactive',
            entity === watchingEntity ? 'watching' : null,
        ].filter(neq(null)).join(' ')
        const isFolden = entityFoldState.get(entity.id)
        const hasAttached = entity.attachedEntities.length > 0
        return `<li class="${ className }" data-id="${ entity.id }">
            ${ hasAttached
                ? `<debug-button class="fold-entity">${ isFolden ? '+' : '-' }</debug-button>`
                : ''
            }
            ${ showEntityLink(entity) }
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
    const unsetWatchingEntity = () => {
        watchingEntity = null
        switchTab('entity-tree')
    }
    const setWatchingEntity = (entity: Entity) => {
        watchingEntity = entity
        $('.watching')?.classList.remove('watching')
        $<HTMLLIElement>(`li[data-id="${ entity.id }"]`)?.classList.add('watching')
        entity.on('dispose', () => {
            if (watchingEntity === entity) unsetWatchingEntity()
        })
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
    $debugWindow.addEventListener('mouseover', ({ target: $el }) => {
        $('.selecting')?.classList.remove('selecting')
        if ($el instanceof HTMLElement && $el.tagName === 'LI') {
            $el.classList.add('selecting')
            const id = + $el.dataset.id!
            reverseSelectingEntity = game.getEntityById(id)
        }
    })

    const showJson = (obj: any) =>
        typeof obj === 'number' ? `<json-number>${ obj }</json-number>` :
        typeof obj === 'string' ? `<json-string>${ obj }</json-string>` :
        typeof obj === 'boolean' ? `<json-boolean>${ obj }</json-boolean>` :
        typeof obj === 'symbol' ? `<json-symbol>${ obj.description }</json-symbol>` :
        typeof obj === 'function' ? `<json-function>${ obj.name }</json-function>` :
        obj === null ? '<json-null></json-null>' :
        Array.isArray(obj) ? `<json-array>${ obj
            .map((child): string => `<json-item>${ showJson(child) }</json-item>`)
            .join('') }</json-array>` :
        obj instanceof Entity ? showEntityLink(obj) :
        `<json-object>${ Object
            .entries(obj)
            .map(([ key, value ]): string => `
                <json-item><json-key>${ key }</json-key><json-value>${ showJson(value) }</json-value></json-item>
            `)
            .join('')
        }</json-object>`

    const refreshEntityDetail = () => {
        const e = watchingEntity
        if (! e) return $entityDetailContent.innerHTML = 'No entity selected'
        const attrs = [
            e.deepActive ? 'active' : 'inactive',
            ...getEntityAttrs(e),
        ]
        $entityDetailContent.innerHTML = `
            ${ e.constructor.name } <debug-button class="show-entity-detail">#${ e.id }</debug-button>
            ${ showEntityAttrs(attrs) }<br />
            <b>state</b> ${ showJson(e.state) }<br />
            <b>config</b> ${ showJson(e.config) }<br />
            <b>providedKeys</b> ${ showJson(Object.getOwnPropertySymbols(e.providedValues)) }<br />
            <b>injectableKeys</b> ${ showJson(e.injectableKeys) }<br />
            <b>comps</b> ${ showJson(e.comps.map(comp => comp.constructor)) }<br />
            <b>superEntity</b> ${ showJson(e.superEntity) }<br />
            <b>attachedEntities</b> <div id="entity-detail-tree-content"></div>
        `
        refreshEntityTree()
    }
    const $entityDetailContent = $('#entity-detail-content')!
    $('#back-to-entity-tree')!.addEventListener('click', unsetWatchingEntity)
    $('#refresh-entity-detail')!.addEventListener('click', refreshEntityDetail)
    const showEntityLink = (entity: Entity) => {
        const attrs = getEntityAttrs(entity)
        return `
            ${ entity.constructor.name }
            ${ showEntityAttrs(attrs) }
            <debug-button class="show-entity-detail">#${ entity.id }</debug-button>
        `
    }
    refreshEntityDetail()

    $debugWindow.addEventListener('click', ({ target: $el }) => {
        if (! ($el instanceof HTMLElement)) return
        if ($el.tagName === 'DEBUG-BUTTON') {
            if ($el.classList.contains('fold-entity')) {
                const id = + $el.parentElement!.dataset.id!
                entityFoldState.set(id, ! entityFoldState.get(id))
                refreshEntityTree()
            }
            else if ($el.classList.contains('show-entity-detail')) {
                const id = + $el.innerText.slice(1)
                const entity = game.getEntityById(id)
                if (entity) {
                    setWatchingEntity(entity)
                    switchTab('entity-detail')
                    refreshEntityDetail()
                }
            }
        }
        else if ($el.tagName === 'LI') {
            const id = + $el.dataset.id!
            const entity = game.getEntityById(id)
            if (entity) {
                setWatchingEntity(entity)
            }
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
