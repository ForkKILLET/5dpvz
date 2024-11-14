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
            }

            tab-header {
                display: inline-block;
                padding: 0 2px;
                border: 1px solid black;
                border-color: transparent transparent black transparent;
            }
            tab-header.active {
                border-color: black;
            }
            tab-header:hover {
                cursor: pointer;
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
            debug-button:not(.static):hover {
                cursor: pointer;
                text-decoration: underline;
            }

            #entity-tree-content {
                font-size: 12px;
            }
            #entity-tree-content li {
                margin-left: -15px;
            }
            #entity-tree-content li.inactive {
                color: #888;
            }

            entity-attr::before {
                content: '['
            }
            entity-attr::after {
                content: ']'
            }
            entity-attr {
                color: blue;
            }
        </style>

        <tab-header data-tab="entity-tree">Entity Tree</tab-header>
        <tab-header data-tab="status">Status</tab-header>

        <tab-content data-tab="entity-tree">
            <debug-button id="refresh-entity-tree">Refresh</debug-button>
            <debug-button id="auto-refresh-entity-tree">Manual</debug-button>
            <div id="entity-tree-content"></div>
        </tab-content>
        <tab-content data-tab="status">
            WIP
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

    const showEntityTree = () => {
        const show = (entity: Entity): string => {
            const className = [
                entity.active ? null : 'inactive',
            ].filter(c => c !== null).join(' ')
            const attrs = [
                game.hoveringEntity === entity ? 'hovering' : null,
            ].filter(c => c !== null)
            const isFolden = foldState.get(entity.id)
            const hasAttached = entity.attachedEntities.length > 0
            return `<li class="${ className }" data-id="${ entity.id }">
                ${ hasAttached
                    ? `<debug-button class="static fold-entity">${ isFolden ? 'v' : '^' }</debug-button>`
                    : ''
                }
                ${ entity.constructor.name } #${ entity.id }
                ${ attrs.map(attr => `<entity-attr>${ attr }</entity-attr>`) }
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

    let autoRefresh = true
    const refreshEntityTree = () => {
        $entityTreeContent.innerHTML = showEntityTree()
    }
    const $entityTreeContent = $('#entity-tree-content')!
    $('#refresh-entity-tree')!.addEventListener('click', refreshEntityTree)
    const $autoRefresh = $('#auto-refresh-entity-tree')!
    $autoRefresh.addEventListener('click', () => {
        $autoRefresh.innerHTML = autoRefresh ? 'Auto' : 'Manual'
        autoRefresh = ! autoRefresh
    })

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
        if ($el instanceof HTMLElement &&
            $el.tagName === 'DEBUG-BUTTON' &&
            $el.classList.contains('fold-entity')
        ) {
            const id = + $el.parentElement!.dataset.id!
            foldState.set(id, ! foldState.get(id))
            refreshEntityTree()
        }
    }, { capture: true })
}
