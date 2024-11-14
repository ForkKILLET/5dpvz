/* eslint-disable @stylistic/js/indent */

import { Entity, Game, Scene } from '@/engine'

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
                color: blue;
            }
            tab-header:hover {
                cursor: pointer;
                text-decoration: underline;
            }

            tab-content {
                display: none;
            }

            debug-button::before {
                content: '['
            }
            debug-button::after {
                content: ']'
            }
            debug-button:hover {
                cursor: pointer;
                text-decoration: underline;
            }

            debug-button.show-entity-detail {
                color: green;
            }

            #entity-tree-content {
                font-size: 12px;
            }

            #debug-window ul {
                margin: 0;
            }
            #debug-window li {
                margin-left: -15px;
            }
            #debug-window li.inactive {
                color: #888;
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
        </style>

        <tab-header data-tab="entity-tree">Entity Tree</tab-header>
        <tab-header data-tab="entity-detail">Entity Detail</tab-header>
        <br /><br />
        <tab-content data-tab="entity-tree">
            <debug-button id="refresh-entity-tree">Refresh</debug-button>
            <debug-button id="auto-refresh-entity-tree">Manual</debug-button>
            <br /><br />
            <div id="entity-tree-content"></div>
        </tab-content>
        <tab-content data-tab="entity-detail">
            <debug-button id="refresh-entity-detail">Refresh</debug-button>
            <br /><br />
            <div id="entity-detail-content"></div>
        </tab-content>
    `
    const $ = <E extends Node = HTMLElement>(selector: string) =>
        $debugWindow.querySelector(selector) as E | null
    const $$ = <E extends Node = HTMLElement>(selector: string) =>
        $debugWindow.querySelectorAll(selector) as unknown as NodeListOf<E>

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

    const foldState = new Map<number, boolean>()

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

    const showEntityTree = () => {
        const show = (entity: Entity): string => {
            const className = [
                entity.active ? null : 'inactive',
            ].filter(c => c !== null).join(' ')
            const isFolden = foldState.get(entity.id)
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
                            .map(entity => `\n${ show(entity) }`)
                            .join('')
                        }
                    </ul>`
                    : ''
                }
            </li>`
        }
        return `<ul>${ game.scenes.map(show).join('\n') }</ul>`
    }

    let watchingEntity: Entity | undefined = undefined

    let autoRefreshEntityTree = true
    const refreshEntityTree = () => {
        if (currentTab === 'entity-detail')
            $('#entity-detail-tree-content')!.innerHTML = showEntityRoot(watchingEntity!.attachedEntities)
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

    const showJson = (obj: any) =>
        typeof obj === 'number' ? `<json-number>${ obj }</json-number>` :
        typeof obj === 'string' ? `<json-string>${ obj }</json-string>` :
        typeof obj === 'boolean' ? `<json-boolean>${ obj }</json-boolean>` :
        typeof obj === 'symbol' ? `<json-symbol>${ obj.description }</json-symbol>` :
        obj === null ? '<json-null />' :
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
            state ${ showJson(e.state) }<br />
            providedKeys ${ showJson(Object.getOwnPropertySymbols(e.providedValues)) }<br />
            injectableKeys ${ showJson(e.injectableKeys) }<br />
        `
    }
    const $entityDetailContent = $('#entity-detail-content')!
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

    game.addScene(new class DebugTrigger extends Scene {
        constructor() {
            super([])
            this.afterStart(() => {
                this.game.emitter.onSome([
                    'entityStart',
                    'entityDispose',
                    'entityAttach',
                    'entityActivate',
                    'entityDeactivate',
                    'hoverTargetChange',
                ], refreshEntityTree)
            })
        }
    })

    $debugWindow.addEventListener('click', ({ target: $el }) => {
        if (! ($el instanceof HTMLElement) || $el.tagName !== 'DEBUG-BUTTON') return
        if ($el.classList.contains('fold-entity')) {
            const id = + $el.parentElement!.dataset.id!
            foldState.set(id, ! foldState.get(id))
            refreshEntityTree()
        }
        else if ($el.classList.contains('show-entity-detail')) {
            const id = + $el.innerText.slice(1)
            const entity = game.getEntityById(id)
            if (entity) {
                watchingEntity = entity
                switchTab('entity-detail')
                refreshEntityDetail()
            }
        }
    }, { capture: true })
}
