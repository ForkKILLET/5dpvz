var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __reflectGet = Reflect.get;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __superGet = (cls, obj, key) => __reflectGet(__getProtoOf(cls), key, obj);
var _a, _b;
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const createIdGenerator = () => {
  let id = 0;
  return () => id++;
};
const isInRect = (point, rect) => point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height;
const by = (cmpGetter) => (a, b) => {
  const cmpA = cmpGetter(a);
  const cmpB = cmpGetter(b);
  return cmpA < cmpB ? -1 : cmpA > cmpB ? 1 : 0;
};
const matrix = (width, height, cb) => {
  const mat = [];
  for (let x = 0; x < width; x++) {
    const row = [];
    for (let y = 0; y < height; y++) {
      row.push(cb(x, y));
    }
    mat.push(row);
  }
  return mat;
};
const remove = (array, pred) => {
  const index = array.findIndex(pred);
  if (index >= 0) array.splice(index, 1);
};
const random = (a, b) => {
  const offset = 0;
  const length = a;
  return offset + Math.floor(Math.random() * length);
};
const eq = (a) => (b) => a === b;
const placeholder = null;
const injectKey = (description) => Symbol(description);
class Comp {
  constructor(entity) {
    this.entity = entity;
  }
  update() {
  }
}
__publicField(Comp, "dependencies", []);
const _Entity = class _Entity {
  constructor(config, state) {
    __publicField(this, "id", _Entity.generateEntityId());
    __publicField(this, "started", false);
    __publicField(this, "active", true);
    __publicField(this, "game", placeholder);
    __publicField(this, "starters", []);
    __publicField(this, "autoRender", true);
    __publicField(this, "superEntity", null);
    __publicField(this, "attachedEntities", []);
    __publicField(this, "providedValues", {});
    __publicField(this, "disposers", []);
    __publicField(this, "disposed", false);
    __publicField(this, "comps", []);
    __publicField(this, "frozen", false);
    __publicField(this, "emitter", new Emitter());
    this.config = config;
    this.state = state;
  }
  get deepActive() {
    var _a2;
    return this.active && (((_a2 = this.superEntity) == null ? void 0 : _a2.deepActive) ?? true);
  }
  activate() {
    this.active = true;
    this.afterStart(() => this.game.emitter.emit("entityActivate", this));
    return this;
  }
  deactivate() {
    this.active = false;
    this.afterStart(() => this.game.emitter.emit("entityDeactivate", this));
    return this;
  }
  async start(game) {
    this.game = game;
    game.allEntities.push(this);
    await Promise.all(this.starters.map((fn) => fn()));
  }
  runStart(game) {
    this.start(game).then(() => {
      this.started = true;
      this.emit("start");
      this.game.emitter.emit("entityStart", this);
    });
    return this;
  }
  beforeStart(fn) {
    if (this.started) fn();
    else this.starters.push(fn);
    return this;
  }
  afterStart(fn) {
    if (this.started) fn(this);
    else this.on("start", () => fn(this));
    return this;
  }
  toStart() {
    return new Promise((res) => this.afterStart(res));
  }
  setAutoRender(autoRender) {
    this.autoRender = autoRender;
    return this;
  }
  attach(...entities) {
    entities.forEach((entity) => this.beforeStart(() => new Promise((res) => {
      entity.runStart(this.game).afterStart(() => {
        entity.superEntity = this;
        this.attachedEntities.push(entity);
        entity.emit("attached", this).on("dispose", () => {
          this.unattach(entity);
        });
        this.game.emitter.emit("entityAttach", entity);
        res();
      });
    })));
    return this;
  }
  attachTo(superEntity) {
    superEntity.attach(this);
    return this;
  }
  unattach(...entities) {
    entities.forEach((entity) => entity.emit("unattached"));
    this.attachedEntities = this.attachedEntities.filter((entity) => !entities.includes(entity));
    return this;
  }
  select(EntityCtor) {
    return this.attachedEntities.find((entity) => entity instanceof EntityCtor);
  }
  selectAll(EntityCtor) {
    return this.attachedEntities.filter((entity) => entity instanceof EntityCtor);
  }
  provide(injectKey2, value) {
    this.providedValues[injectKey2] = value;
    return this;
  }
  get injectableKeys() {
    var _a2;
    return [
      ...Object.getOwnPropertySymbols(this.providedValues),
      ...((_a2 = this.superEntity) == null ? void 0 : _a2.injectableKeys) ?? []
    ];
  }
  inject(injectKey2) {
    if (!this.superEntity) return null;
    if (injectKey2 in this.superEntity.providedValues) return this.superEntity.providedValues[injectKey2];
    return this.superEntity.inject(injectKey2);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.emit("dispose");
    this.game.emitter.emit("entityStart", this);
    this.disposers.forEach((dispose) => dispose());
    this.attachedEntities.forEach((entity) => entity.dispose());
    if (!this.game) return;
    remove(this.game.allEntities, (entity) => entity === this);
  }
  hasComp(...Comps) {
    return Comps.every((Comp2) => this.comps.some((comp) => comp instanceof Comp2));
  }
  addComp(Comp2, ...args) {
    this.afterStart(() => {
      const { dependencies } = Comp2;
      if (!this.hasComp(...dependencies))
        throw new Error(`Missing dependencies: ${dependencies.map((Dep) => Dep.name).join(", ")}.`);
      this.comps.push(new Comp2(this, ...args));
    });
    return this;
  }
  removeComp(comp) {
    remove(this.comps, (c) => c === comp);
    return this;
  }
  getComp(Comp2) {
    return this.comps.find((comp) => comp instanceof Comp2);
  }
  withComp(Comp2, fn) {
    return this.afterStart(() => {
      const comp = this.getComp(Comp2);
      if (comp) fn(comp);
    });
  }
  withComps(Comps, fn) {
    return this.afterStart(() => {
      const comps = Comps.map(this.getComp.bind(this));
      if (comps.every((comp) => comp)) fn(...comps);
    });
  }
  getComps(Comp2) {
    return this.comps.filter((comp) => comp instanceof Comp2);
  }
  runRender() {
    this.preRender();
    this.addRenderJob(() => {
      this.render();
    });
  }
  addRenderJob(renderer, zIndexDelta = 0) {
    this.game.addRenderJob({
      zIndex: this.state.zIndex + zIndexDelta,
      renderer: () => {
        this.bubble("before-render");
        renderer();
        this.bubble("after-render");
      }
    });
  }
  preRender() {
    this.attachedEntities.filter((entity) => entity.active && entity.autoRender).forEach((entity) => entity.runRender());
  }
  render() {
  }
  freeze() {
    this.frozen = true;
    return this;
  }
  unfreeze() {
    this.frozen = false;
    return this;
  }
  runUpdate() {
    if (!this.active || this.disposed) return;
    this.preUpdate();
  }
  preUpdate() {
    this.state = this.update();
    this.attachedEntities.forEach((entity) => entity.runUpdate());
    this.comps.forEach((comp) => comp.update());
  }
  update() {
    return this.state;
  }
  emit(event, ...args) {
    this.emitter.emit(event, ...args);
    return this;
  }
  bubble(event, ...args) {
    var _a2;
    this.emit(event, ...args);
    (_a2 = this.superEntity) == null ? void 0 : _a2.bubble(event, ...args);
    return this;
  }
  on(event, listener) {
    const off = this.emitter.on(event, listener);
    this.disposers.push(off);
    return this;
  }
  forwardEvents(source, events) {
    this.emitter.forward(source, events);
    return this;
  }
  useTimer(timerName, timerInterval, onTimer) {
    let timer = this.state[timerName] + this.game.mspf;
    if (timer > timerInterval) {
      timer -= timerInterval;
      onTimer();
    }
    this.state[timerName] = timer;
  }
};
__publicField(_Entity, "generateEntityId", createIdGenerator());
let Entity = _Entity;
class Scene extends Entity {
  constructor(entities) {
    super({}, { position: { x: 0, y: 0 }, zIndex: 0 });
    this.attach(...entities);
  }
}
class ShapeComp extends Comp {
  constructor(entity, contains) {
    super(entity);
    this.contains = contains;
  }
}
class HoverableComp extends Comp {
  constructor() {
    super(...arguments);
    __publicField(this, "hovering", false);
    __publicField(this, "emitter", new Emitter());
  }
}
__publicField(HoverableComp, "dependencies", [ShapeComp]);
class CursorComp extends Comp {
  constructor(entity, cursor) {
    super(entity);
    this.cursor = cursor;
  }
}
__publicField(CursorComp, "dependencies", [HoverableComp]);
const loadDebugWindow = (game) => {
  const $debugWindow = document.querySelector("#debug-window");
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
        <tab-header data-tab="loop">Loop</tab-header>
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
        <tab-content data-tab="loop">
            <debug-button id="pause-start">Pause</debug-button>
            <debug-button id="step" class="disabled">Step</debug-button>
            <br /><br />
            <b>mspf</b>: <debug-input><input id="mspf-input" type="number" value="${game.mspf}" /></debug-input>
            <debug-button id="mspf-submit">OK</debug-button>
        </tab-content>
    `;
  const $ = (selector) => $debugWindow.querySelector(selector);
  const $$ = (selector) => $debugWindow.querySelectorAll(selector);
  let currentTab = void 0;
  const $currentTab = () => currentTab ? $(`tab-content[data-tab="${currentTab}"]`) : null;
  const $currentTabHeader = () => currentTab ? $(`tab-header[data-tab="${currentTab}"]`) : null;
  const switchTab = (tab) => {
    if (currentTab) {
      $currentTabHeader().className = "";
      $currentTab().style.display = "none";
    }
    currentTab = tab;
    $currentTabHeader().className = "active";
    $currentTab().style.display = "block";
  };
  $$("tab-header").forEach(($tabHeader) => {
    $tabHeader.addEventListener("click", () => switchTab($tabHeader.dataset["tab"]));
  });
  switchTab("entity-tree");
  const foldState = /* @__PURE__ */ new Map();
  const showEntityAttrs = (attrs) => attrs.filter((attr) => attr).map((attr) => `<entity-attr>${attr}</entity-attr>`).join(" ");
  const getEntityAttrs = (entity) => {
    return [
      game.hoveringEntity === entity ? "hovering" : null,
      entity.frozen && "frozen",
      !entity.started && "unstarted"
    ].filter((c) => c);
  };
  const showEntityTree = (entity) => {
    const className = [
      entity.active ? null : "inactive"
    ].filter((c) => c !== null).join(" ");
    const isFolden = foldState.get(entity.id);
    const hasAttached = entity.attachedEntities.length > 0;
    return `<li class="${className}" data-id="${entity.id}">
            ${hasAttached ? `<debug-button class="fold-entity">${isFolden ? "+" : "-"}</debug-button>` : ""}
            ${showEntityLink(entity)}
            ${hasAttached && !isFolden ? `<ul>
                    ${entity.attachedEntities.map((entity2) => `
${showEntityTree(entity2)}`).join("")}
                </ul>` : ""}
        </li>`;
  };
  const showEntityRoot = (entities) => {
    return `<ul>${entities.map(showEntityTree).join("\n")}</ul>`;
  };
  let watchingEntity = void 0;
  let autoRefreshEntityTree = true;
  const refreshEntityTree = () => {
    if (currentTab === "entity-detail")
      $("#entity-detail-tree-content").innerHTML = showEntityRoot(watchingEntity.attachedEntities);
    else
      $entityTreeContent.innerHTML = showEntityRoot(game.scenes);
  };
  const $entityTreeContent = $("#entity-tree-content");
  $("#refresh-entity-tree").addEventListener("click", refreshEntityTree);
  const $autoRefresh = $("#auto-refresh-entity-tree");
  $autoRefresh.addEventListener("click", () => {
    $autoRefresh.innerHTML = autoRefreshEntityTree ? "Auto" : "Manual";
    autoRefreshEntityTree = !autoRefreshEntityTree;
  });
  const showJson = (obj) => typeof obj === "number" ? `<json-number>${obj}</json-number>` : typeof obj === "string" ? `<json-string>${obj}</json-string>` : typeof obj === "boolean" ? `<json-boolean>${obj}</json-boolean>` : typeof obj === "symbol" ? `<json-symbol>${obj.description}</json-symbol>` : obj === null ? "<json-null></json-null>" : Array.isArray(obj) ? `<json-array>${obj.map((child) => `<json-item>${showJson(child)}</json-item>`).join("")}</json-array>` : obj instanceof Entity ? showEntityLink(obj) : `<json-object>${Object.entries(obj).map(([key, value]) => `
                <json-item><json-key>${key}</json-key><json-value>${showJson(value)}</json-value></json-item>
            `).join("")}</json-object>`;
  const refreshEntityDetail = () => {
    const e = watchingEntity;
    if (!e) return $entityDetailContent.innerHTML = "No entity selected";
    const attrs = [
      e.deepActive ? "active" : "inactive",
      ...getEntityAttrs(e)
    ];
    $entityDetailContent.innerHTML = `
            ${e.constructor.name} <debug-button class="show-entity-detail">#${e.id}</debug-button>
            ${showEntityAttrs(attrs)}<br />
            <b>state</b> ${showJson(e.state)}<br />
            <b>config</b> ${showJson(e.config)}<br />
            <b>providedKeys</b> ${showJson(Object.getOwnPropertySymbols(e.providedValues))}<br />
            <b>injectableKeys</b> ${showJson(e.injectableKeys)}<br />
            <b>comps</b> ${showJson(e.comps.map((comp) => comp.constructor.name))}<br />
            <b>superEntity</b> ${showJson(e.superEntity)}<br />
            <b>attachedEntities</b> <div id="entity-detail-tree-content"></div>
        `;
    refreshEntityTree();
  };
  const $entityDetailContent = $("#entity-detail-content");
  $("#refresh-entity-detail").addEventListener("click", refreshEntityDetail);
  const showEntityLink = (entity) => {
    const attrs = getEntityAttrs(entity);
    return `
            ${entity.constructor.name}
            ${showEntityAttrs(attrs)}
            <debug-button class="show-entity-detail">#${entity.id}</debug-button>
        `;
  };
  refreshEntityDetail();
  game.addScene(new class DebugTrigger extends Scene {
    constructor() {
      super([]);
      this.afterStart(() => {
        this.game.emitter.onSome([
          "entityStart",
          "entityDispose",
          "entityAttach",
          "entityActivate",
          "entityDeactivate",
          "hoverTargetChange"
        ], refreshEntityTree);
      });
    }
  }());
  $debugWindow.addEventListener("click", ({ target: $el }) => {
    if (!($el instanceof HTMLElement) || $el.tagName !== "DEBUG-BUTTON") return;
    if ($el.classList.contains("fold-entity")) {
      const id = +$el.parentElement.dataset.id;
      foldState.set(id, !foldState.get(id));
      refreshEntityTree();
    } else if ($el.classList.contains("show-entity-detail")) {
      const id = +$el.innerText.slice(1);
      const entity = game.getEntityById(id);
      if (entity) {
        watchingEntity = entity;
        switchTab("entity-detail");
        refreshEntityDetail();
      }
    }
  }, { capture: true });
  let stepCount = 0;
  const $pauseStartButton = $("#pause-start");
  $pauseStartButton.addEventListener("click", () => {
    game[game.running ? "pause" : "start"]();
    if (game.running) {
      $stepButton.innerHTML = "Step";
      stepCount = 0;
    }
    $pauseStartButton.innerHTML = game.running ? "Pause" : "Start";
    $stepButton.className = game.running ? "disabled" : "";
  });
  const $stepButton = $("#step");
  $stepButton.addEventListener("click", () => {
    if (game.running) return;
    $stepButton.innerHTML = `Step: ${++stepCount}`;
    game.loop();
  });
  const $mspfInput = $("#mspf-input");
  $("#mspf-submit").addEventListener("click", () => {
    const { running } = game;
    if (running) game.pause();
    game.mspf = +$mspfInput.value;
    $mspfInput.value = game.mspf.toString();
    if (running) game.start();
  });
};
class Emitter {
  constructor() {
    __publicField(this, "listeners", {});
  }
  emit(event, ...args) {
    var _a2;
    (_a2 = this.listeners[event]) == null ? void 0 : _a2.forEach((listener) => listener(...args));
  }
  on(event, listener) {
    var _a2;
    const currentListeners = (_a2 = this.listeners)[event] ?? (_a2[event] = []);
    currentListeners.push(listener);
    return () => {
      this.listeners[event] = currentListeners.filter((c) => c !== listener);
    };
  }
  onSome(events, listener) {
    const disposers = events.map((event) => this.on(event, (...args) => listener(event, ...args)));
    return () => disposers.forEach((fn) => fn());
  }
  forward(source, events) {
    events.forEach((event) => {
      let locked = false;
      const lock = (fn) => {
        if (locked) return;
        locked = true;
        fn();
        locked = false;
      };
      source.on(event, (...args) => lock(() => this.emit(event, ...args)));
      this.on(event, (...args) => lock(() => source.emit(event, ...args)));
    });
  }
}
const useKeyboard = () => {
  const keys = /* @__PURE__ */ new Set();
  const emitter = new Emitter();
  document.addEventListener("keydown", (ev) => {
    emitter.emit("keydown", ev);
    keys.add(ev.key);
  });
  document.addEventListener("keyup", (ev) => {
    emitter.emit("keyup", ev);
    keys.delete(ev.key);
  });
  window.addEventListener("blur", () => {
    keys.clear();
  });
  document.addEventListener("keypress", (ev) => {
    emitter.emit("keypress", ev);
  });
  return { keys, emitter };
};
class Game {
  constructor({ ctx, fps }) {
    __publicField(this, "ctx");
    __publicField(this, "imageManager");
    __publicField(this, "mouse");
    __publicField(this, "keyboard");
    __publicField(this, "mspf");
    __publicField(this, "allEntities", []);
    __publicField(this, "scenes", []);
    __publicField(this, "emitter", new Emitter());
    __publicField(this, "renderJobs", []);
    __publicField(this, "hoveringEntity", null);
    __publicField(this, "loopTimerId", null);
    this.ctx = ctx;
    this.imageManager = useImageManager();
    this.mouse = useMouse(ctx);
    this.keyboard = useKeyboard();
    this.mspf = 1e3 / fps;
    const floor = new class Floor extends Scene {
      constructor() {
        super([]);
        this.addComp(ShapeComp, () => true).addComp(HoverableComp);
      }
    }();
    this.addScene(floor);
    this.mouse.emitter.onSome(["click", "rightclick"], (event, ev) => {
      if (!this.running) return;
      const target = this.hoveringEntity;
      if (!target) return;
      let stopped = false;
      target.getComp(HoverableComp).emitter.emit(event, {
        stop: () => {
          stopped = true;
        }
      });
      if (!stopped) this.emitter.emit(event, target, ev);
    });
    this.emitter.forward(this.keyboard.emitter, ["keydown", "keyup", "keypress"]);
    if (new URLSearchParams(location.search).has("debug")) {
      loadDebugWindow(this);
    }
  }
  addRenderJob(job) {
    this.renderJobs.push(job);
  }
  get running() {
    return this.loopTimerId !== null;
  }
  loop() {
    const activeScenes = this.scenes.filter((scene) => scene.active);
    activeScenes.forEach((scene) => scene.runUpdate());
    const oldHoveringEntity = this.hoveringEntity;
    this.hoveringEntity = null;
    const hoverableEntities = this.allEntities.filter((entity) => entity.started && entity.deepActive && entity.hasComp(HoverableComp)).sort(by((entity) => -entity.state.zIndex));
    let isCursorSet = false;
    for (const entity of hoverableEntities) {
      const shapeComp = entity.getComp(ShapeComp);
      const hoverableComp = entity.getComp(HoverableComp);
      const hovering = !this.hoveringEntity && shapeComp.contains(this.mouse.position);
      if (hovering) {
        this.hoveringEntity = entity;
        entity.withComp(CursorComp, (cursorComp) => {
          this.ctx.canvas.style.cursor = cursorComp.cursor;
          isCursorSet = true;
        });
      }
      if (hoverableComp.hovering !== hovering) {
        hoverableComp.emitter.emit(hovering ? "mouseenter" : "mouseleave");
        hoverableComp.hovering = hovering;
      }
    }
    if (!isCursorSet) this.ctx.canvas.style.cursor = "";
    if (oldHoveringEntity !== this.hoveringEntity)
      this.emitter.emit("hoverTargetChange", this.hoveringEntity);
    this.renderJobs = [];
    activeScenes.forEach((scene) => scene.runRender());
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.renderJobs.sort(by((job) => job.zIndex)).forEach((job) => {
      this.ctx.save();
      job.renderer();
      this.ctx.restore();
    });
  }
  start() {
    this.loopTimerId = setInterval(() => this.loop(), this.mspf);
  }
  pause() {
    if (this.loopTimerId !== null) clearInterval(this.loopTimerId);
  }
  async addScene(scene) {
    scene.runStart(this).afterStart(() => {
      this.scenes.push(scene);
    });
  }
  removeScene(scene) {
    remove(this.scenes, (s) => s === scene);
    scene.dispose();
  }
  selectScene(Scene2) {
    return this.scenes.find((scene) => scene instanceof Scene2);
  }
  selectAllScenes(Scene2) {
    return this.scenes.filter((entity) => entity instanceof Scene2);
  }
  getEntityById(id) {
    return this.allEntities.find((entity) => entity.id === id);
  }
}
const useMouse = (ctx) => {
  const position = { x: 0, y: 0 };
  document.addEventListener("mousemove", (ev) => {
    const rect = ctx.canvas.getBoundingClientRect();
    position.x = ev.clientX - rect.left;
    position.y = ev.clientY - rect.top;
  });
  ctx.canvas.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    emitter.emit("rightclick", ev);
  });
  ctx.canvas.addEventListener("click", (event) => {
    emitter.emit("click", event);
  });
  const emitter = new Emitter();
  return { position, emitter };
};
const useImageManager = () => {
  const imgs = {};
  return {
    imgs,
    loadImage: async (src) => {
      if (imgs[src]) return imgs[src];
      const img = new Image();
      img.src = src;
      imgs[src] = img;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = (event) => {
          rej(new Error(`Failed to load image: ${src}`));
          console.error(`Failed to load image: ${src}
%o`, event);
        };
      });
      return img;
    }
  };
};
const getImagePixels = (img) => {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height).data;
};
class ImageEntity extends Entity {
  constructor() {
    super(...arguments);
    __publicField(this, "img", placeholder);
  }
  async start(game) {
    await super.start(game);
    this.img = await game.imageManager.loadImage(this.config.src);
  }
  render() {
    const { x, y } = this.state.position;
    this.game.ctx.drawImage(this.img, x, y);
  }
}
class ButtonEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "contains", placeholder);
    this.attach(config.entity).afterStart(
      () => this.addComp(ShapeComp, this.contains).addComp(HoverableComp).withComp(HoverableComp, ({ emitter }) => {
        this.forwardEvents(emitter, ["click", "rightclick"]);
      })
    );
  }
  static from(entity, config = { containingMode: "strict" }) {
    return new this(
      { entity, ...config },
      this.initState({
        position: entity.state.position,
        zIndex: entity.state.zIndex
      })
    );
  }
  async start(game) {
    await super.start(game);
    const { entity } = this.config;
    await entity.toStart();
    const isImage = entity instanceof ImageEntity;
    const images = isImage ? [entity.img] : entity.frames;
    const pixelsList = images.map(getImagePixels);
    const [{ width, height }] = images;
    const getCurrentPixels = () => isImage ? pixelsList[0] : pixelsList[entity.state.af];
    this.contains = (point) => {
      const { x, y } = this.state.position;
      if (!isInRect(point, { x, y, width, height })) return false;
      if (this.config.containingMode === "rect") return true;
      const rx = point.x - x;
      const ry = point.y - y;
      const i = ry * width * 4 + rx * 4;
      const [r, g, b, a] = getCurrentPixels().slice(i, i + 4);
      return !(r === 0 && g === 0 && b === 0 && a === 0);
    };
  }
  update() {
    this.state.hovering = this.getComp(HoverableComp).hovering;
    return this.state;
  }
}
__publicField(ButtonEntity, "initState", (state) => ({
  ...state,
  hovering: false
}));
const useAnimation = (category, metadata) => {
  const animation = {
    getImageSrc: (id) => `./assets/${category}/${id}/common/01.png`,
    getImageConfig: (id) => ({ src: animation.getImageSrc(id) }),
    getAnimationConfig: (id, name = "common") => {
      const { frameNum, fpaf } = metadata[id].animations[name];
      const srcs = Array.from(
        { length: frameNum },
        (_, i) => `./assets/plants/${id}/${name}/${String(i + 1).padStart(2, "0")}.png`
      );
      return { srcs, fpaf };
    }
  };
  return animation;
};
class AnimationEntity extends Entity {
  constructor() {
    super(...arguments);
    __publicField(this, "frames", placeholder);
  }
  async start(game) {
    await super.start(game);
    this.frames = await Promise.all(
      this.config.srcs.map((src) => game.imageManager.loadImage(src))
    );
  }
  render() {
    const { position: { x, y }, af } = this.state;
    this.game.ctx.drawImage(this.frames[af], x, y);
  }
  update() {
    let { f, af, isPlaying, direction } = this.state;
    if (!isPlaying) return this.state;
    if (++f === this.config.fpaf) {
      this.emit("animation-finish");
      f = 0;
      if ((af += direction) === this.frames.length) af = 0;
    }
    return { ...this.state, f, af };
  }
}
__publicField(AnimationEntity, "initState", (state) => ({
  ...state,
  f: 0,
  af: 0,
  isPlaying: true,
  direction: 1
}));
__publicField(AnimationEntity, "getStdSrcs", (path, num) => {
  const digits = Math.max(String(num).length, 2);
  return Array.from({ length: num }).map((_, i) => `${path}/${String(i + 1).padStart(digits, "0")}.png`);
});
class HighlightableComp extends Comp {
  constructor(entity, filter = "brightness(1.5)") {
    super(entity);
    __publicField(this, "highlighting", false);
    this.filter = filter;
    entity.on("before-render", () => {
      if (this.highlighting) entity.game.ctx.filter = this.filter;
    });
  }
}
class PlantEntity extends ButtonEntity {
  constructor(config, state) {
    super(config, state);
    this.afterStart(
      () => this.addComp(HighlightableComp, "brightness(1.2)").withComps([HoverableComp, HighlightableComp], ({ emitter }, highlightableComp) => {
        emitter.on("mouseenter", () => {
          var _a2;
          if (((_a2 = this.inject(kLevelState).holdingObject) == null ? void 0 : _a2.type) === "shovel")
            highlightableComp.highlighting = true;
        });
        emitter.on("mouseleave", () => {
          highlightableComp.highlighting = false;
        });
      }).on("before-render", () => {
        if (this.getComp(HighlightableComp).highlighting) this.game.ctx.filter = "brightness(1.5)";
      })
    );
  }
  static create(plantId, config, state) {
    return PLANT_METADATA[plantId].from(
      new AnimationEntity(
        plantAnimation.getAnimationConfig(plantId),
        AnimationEntity.initState(state)
      ),
      {
        containingMode: "rect",
        ...config
      }
    );
  }
}
const definePlant = (PlantCtor) => PlantCtor;
const PeaShooterEntity = definePlant((_a = class extends PlantEntity {
}, __publicField(_a, "id", "pea_shooter"), __publicField(_a, "name", "Pea Shooter"), __publicField(_a, "cost", 100), __publicField(_a, "cd", 7500), __publicField(_a, "hp", 300), __publicField(_a, "isPlantableAtStart", true), __publicField(_a, "animations", {
  common: { fpaf: 8, frameNum: 12 }
}), _a));
const SunflowerEntity = definePlant((_b = class extends PlantEntity {
  constructor(config, state) {
    super(config, state);
  }
  update() {
    this.useTimer("sunProduceTimer", 15e3, () => {
      const levelState = this.inject(kLevelState);
      levelState.sun += 25;
    });
    return this.state;
  }
}, __publicField(_b, "id", "sunflower"), __publicField(_b, "name", "Sunflower"), __publicField(_b, "cost", 50), __publicField(_b, "cd", 7500), __publicField(_b, "hp", 300), __publicField(_b, "isPlantableAtStart", true), __publicField(_b, "animations", {
  common: { fpaf: 8, frameNum: 12 }
}), __publicField(_b, "initState", (state) => ({
  ...__superGet(_b, _b, "initState").call(this, state),
  sunProduceTimer: 0
})), _b));
const PLANT_METADATA = {
  pea_shooter: PeaShooterEntity,
  sunflower: SunflowerEntity
};
const plantAnimation = useAnimation("plants", PLANT_METADATA);
class LawnBlockEntity extends ButtonEntity {
  static create(config, state) {
    return LawnBlockEntity.from(
      new ImageEntity(
        {
          src: `./assets/lawn/${config.type}.png`
        },
        state
      ),
      {
        containingMode: "rect",
        ...config
      }
    );
  }
}
class LawnEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "lawnBlocks");
    const { position: { x, y }, zIndex } = this.state;
    this.lawnBlocks = matrix(
      this.config.width,
      this.config.height,
      (i, j) => LawnBlockEntity.create(
        {
          i,
          j,
          type: (i + j) % 2 === 0 ? "light" : "dark"
        },
        {
          position: { x: x + i * 80, y: y + j * 80 },
          zIndex: zIndex + 1
        }
      )
    );
    this.attach(...this.lawnBlocks.flat());
  }
}
class SlotEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "width", 80 + 2);
    __publicField(this, "height", 80 + 20 + 2);
    const { position: { x, y } } = this.state;
    this.addComp(ShapeComp, (point) => isInRect(point, { x, y, width: this.width, height: this.height })).addComp(HoverableComp);
  }
  preRender() {
    super.preRender();
    const { ctx } = this.game;
    const { position: { x, y } } = this.state;
    this.addRenderJob(() => {
      ctx.strokeStyle = "brown";
      ctx.strokeRect(x, y, this.width, this.height);
    }, 0);
  }
}
class PlantSlotEntity extends SlotEntity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "plantMetadata");
    const { position: { x, y }, zIndex } = this.state;
    this.plantMetadata = PLANT_METADATA[this.config.plantId];
    this.addComp(CursorComp, "pointer").attach(new ImageEntity(
      plantAnimation.getImageConfig(this.config.plantId),
      {
        position: { x: x + 1, y: y + 1 },
        zIndex: zIndex + 2
      }
    ));
  }
  preRender() {
    super.preRender();
    const { plantSlotsData: plantSlots } = this.inject(kLevelState);
    const slot = plantSlots[this.config.slotId];
    const { ctx } = this.game;
    const { position: { x, y } } = this.state;
    this.addRenderJob(() => {
      ctx.fillStyle = slot.isSunEnough ? "black" : "red";
      ctx.font = "20px Sans";
      const costString = String(this.plantMetadata.cost);
      const { width } = ctx.measureText(costString);
      ctx.fillText(costString, x + 1 + (80 - width) / 2, y + 1 + 80 + 20 - 2);
    }, 0);
    if (!slot.isPlantable) {
      this.addRenderJob(() => {
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(x, y, this.width, this.height);
        if (!slot.isCooledDown) {
          const cdPercent = slot.cd / this.plantMetadata.cd;
          ctx.fillRect(x, y, this.width, (1 - cdPercent) * this.height);
        }
      }, 2);
    }
  }
}
class SunSlotEntity extends SlotEntity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "sumImage");
    const { position: { x, y }, zIndex } = this.state;
    this.sumImage = new ImageEntity(
      {
        src: "./assets/sun.png"
      },
      {
        position: { x: x + 1, y: y + 1 },
        zIndex: zIndex + 1
      }
    );
    this.attach(this.sumImage);
  }
  get isHovering() {
    const { x, y } = this.state.position;
    const { mouse } = this.game;
    return isInRect(mouse.position, { x, y, width: 80 + 2, height: 80 + 20 + 2 });
  }
  render() {
    const { sun } = this.inject(kLevelState);
    const { ctx } = this.game;
    const { position: { x, y } } = this.state;
    ctx.fillStyle = "black";
    ctx.font = "20px Sans";
    const sunString = String(sun);
    const { width } = ctx.measureText(sunString);
    ctx.fillText(sunString, x + 1 + (80 - width) / 2, y + 1 + 80 + 20 - 2);
  }
}
const SHOVEL_METADATA = {
  iron_shovel: {
    name: "Iron Shovel",
    recycle: false,
    animations: {
      common: { fpaf: 8, frameNum: 1 }
    }
  }
};
const shovelAnimation = useAnimation("shovels", SHOVEL_METADATA);
class ShovelSlotEntity extends SlotEntity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "shovelMetadata");
    __publicField(this, "shovelImage");
    const { position: { x, y }, zIndex } = this.state;
    this.shovelMetadata = SHOVEL_METADATA[this.config.shovelId];
    this.attach(this.shovelImage = new ImageEntity(
      shovelAnimation.getImageConfig(this.config.shovelId),
      {
        position: { x: x + 1, y: y + 1 },
        zIndex: zIndex + 2
      }
    )).addComp(CursorComp, "pointer");
  }
  preRender() {
    super.preRender();
    const { holdingObject } = this.inject(kLevelState);
    if ((holdingObject == null ? void 0 : holdingObject.type) === "shovel") {
      this.addRenderJob(() => {
        const attachedImageEntity = this.shovelImage;
        if (attachedImageEntity) {
          attachedImageEntity.deactivate();
        }
      }, 2);
    }
  }
}
class UIEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "sunSlot");
    __publicField(this, "plantSlots");
    __publicField(this, "shovelSlot");
    const { position: { x, y }, zIndex } = this.state;
    this.sunSlot = new SunSlotEntity(
      {},
      {
        position: { x, y },
        zIndex: zIndex + 1
      }
    );
    this.plantSlots = this.config.plantIds.map((plantName, i) => new PlantSlotEntity(
      {
        plantId: plantName,
        slotId: i
      },
      {
        position: { x: x + (i + 1) * (80 + 2 + 5), y },
        zIndex: zIndex + 1
      }
    ).withComp(HoverableComp, ({ emitter }) => {
      emitter.on("click", ({ stop }) => {
        stop();
        this.emit("choose-plant", i);
      });
    }));
    this.shovelSlot = new ShovelSlotEntity(
      {
        shovelId: "iron_shovel"
      },
      {
        position: { x: x + (this.config.slotNum + 1) * (80 + 2 + 5), y },
        zIndex: zIndex + 1
      }
    ).withComp(HoverableComp, (hoverable) => hoverable.emitter.on("click", ({ stop }) => {
      stop();
      this.emit("choose-shovel", this.shovelSlot.config.shovelId);
    }));
    this.attach(this.sunSlot, ...this.plantSlots, this.shovelSlot);
  }
}
class LifeComp extends Comp {
  constructor(entity, life) {
    super(entity);
    __publicField(this, "emitter", new Emitter());
    this.life = life;
  }
  update() {
    this.life -= this.entity.game.mspf;
    if (this.life <= 0) {
      this.entity.dispose();
      this.emitter.emit("expire");
    }
  }
}
class SunEntity extends ButtonEntity {
  constructor(config, state) {
    super(config, state);
    this.addComp(LifeComp, config.life).addComp(CursorComp, "pointer");
  }
  static create(config, state) {
    return SunEntity.from(
      new ImageEntity(
        { src: "./assets/sun.png", containingMode: "strict" },
        state
      ),
      {
        containingMode: "rect",
        ...config
      }
    );
  }
}
const kLevelState = injectKey("kLevelState");
class LevelEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "ui");
    __publicField(this, "lawn");
    __publicField(this, "phantomImage", null);
    __publicField(this, "holdingImage", null);
    __publicField(this, "width");
    __publicField(this, "height");
    __publicField(this, "plantMetadatas", []);
    this.state.plantSlotsData = this.config.plantSlots.plantIds.map((plantName, i) => {
      const metadata = this.plantMetadatas[i] = PLANT_METADATA[plantName];
      return {
        cd: 0,
        isSunEnough: metadata.cost <= this.state.sun,
        isCooledDown: true,
        isPlantable: metadata.isPlantableAtStart
      };
    });
    this.state.plantsOnBlocks = matrix(config.lawn.width, config.lawn.height, () => null);
    this.state.sun = config.sun.sunAtStart;
    this.state.sunDropTimer = config.sun.sunDroppingInterval - config.sun.firstSunDroppingTime;
    this.width = 10 + config.lawn.width * 80;
    this.height = 150 + config.lawn.height * 80;
    this.provide(kLevelState, this.state);
    this.ui = new UIEntity(
      config.plantSlots,
      {
        position: { x: 5, y: 5 },
        zIndex: 1
      }
    ).on("choose-plant", (slotId) => {
      var _a2;
      const slot = this.state.plantSlotsData[slotId];
      if (!slot.isPlantable) return;
      const plantId = this.getPlantIdBySlotId(slotId);
      this.state.holdingObject = { type: "plant", slotId };
      (_a2 = this.holdingImage) == null ? void 0 : _a2.dispose();
      this.holdingImage = new ImageEntity(
        plantAnimation.getImageConfig(plantId),
        {
          position: { x: 5, y: 5 },
          zIndex: this.lawn.state.zIndex + 3
        }
      ).attachTo(this);
      this.phantomImage = new ImageEntity(
        plantAnimation.getImageConfig(plantId),
        {
          position: { x: 0, y: 0 },
          zIndex: this.lawn.state.zIndex + 2
        }
      ).on("before-render", () => {
        this.game.ctx.globalAlpha = 0.5;
      }).deactivate().attachTo(this);
    }).on("choose-shovel", (shovelId) => {
      var _a2, _b2;
      if (((_a2 = this.state.holdingObject) == null ? void 0 : _a2.type) === "shovel") {
        this.cancelHolding();
        return;
      }
      this.state.holdingObject = { type: "shovel", shovelId };
      (_b2 = this.holdingImage) == null ? void 0 : _b2.dispose();
      this.holdingImage = new ImageEntity(
        shovelAnimation.getImageConfig(shovelId),
        {
          position: { x: 5, y: 5 },
          zIndex: this.lawn.state.zIndex + 3
        }
      ).attachTo(this);
    });
    this.lawn = new LawnEntity(
      config.lawn,
      {
        position: { x: 5, y: 150 },
        zIndex: this.state.zIndex + 1
      }
    );
    this.attach(this.ui, this.lawn);
    this.afterStart(() => {
      this.game.emitter.on("hoverTargetChange", (target) => {
        if (this.state.holdingObject === null) return;
        const { holdingObject } = this.state;
        if ((holdingObject == null ? void 0 : holdingObject.type) === "plant") {
          if (target instanceof LawnBlockEntity) {
            const { i, j } = target.config;
            if (this.isOccupied(i, j)) {
              this.phantomImage.deactivate();
              return;
            }
            const { x, y } = target.state.position;
            this.phantomImage.activate().state.position = { x, y };
          } else this.phantomImage.deactivate();
        }
      });
      this.game.emitter.on("click", (target) => {
        if (this.state.holdingObject === null) return;
        const { holdingObject } = this.state;
        if (target instanceof LawnBlockEntity) {
          if ((holdingObject == null ? void 0 : holdingObject.type) === "plant") {
            const { i, j } = target.config;
            this.plant(holdingObject.slotId, i, j);
          }
        } else if (target instanceof PlantEntity) {
          if ((holdingObject == null ? void 0 : holdingObject.type) === "shovel") {
            this.kill(target.config.i, target.config.j);
            this.cancelHolding();
          }
        } else this.cancelHolding();
      });
      this.game.emitter.on("rightclick", () => {
        if (this.state.holdingObject !== null) this.cancelHolding();
      });
      this.game.emitter.on("keydown", (ev) => {
        if (ev.key === "Escape") {
          if (this.frozen) this.unfreeze();
          else this.freeze();
        }
      });
      const pauseButton = ButtonEntity.from(new ImageEntity(
        {
          src: "./assets/ui/pause_button.png",
          containingMode: "rect"
        },
        {
          position: { x: this.width - 32, y: 5 },
          zIndex: this.state.zIndex + 5
        }
      )).addComp(CursorComp, "pointer").attachTo(this).on("click", () => {
        this.freeze();
        pauseButton.deactivate();
        resumeButton.activate();
      });
      const resumeButton = ButtonEntity.from(new ImageEntity(
        {
          src: "./assets/ui/resume_button.png",
          containingMode: "rect"
        },
        {
          position: { x: this.width - 32, y: 5 },
          zIndex: this.state.zIndex + 5
        }
      )).addComp(CursorComp, "pointer").deactivate().attachTo(this).on("click", () => {
        this.unfreeze();
        resumeButton.deactivate();
        pauseButton.activate();
      });
    });
  }
  getPlantIdBySlotId(slotId) {
    return this.config.plantSlots.plantIds[slotId];
  }
  plant(slotId, i, j) {
    const slot = this.state.plantSlotsData[slotId];
    if (!slot.isPlantable || this.isOccupied(i, j)) return;
    const plantId = this.getPlantIdBySlotId(slotId);
    const metadata = PLANT_METADATA[plantId];
    const cost = metadata.cost;
    slot.cd = 0;
    slot.isCooledDown = false;
    this.state.sun -= cost;
    this.updatePlantSlot(false);
    const newPlant = PlantEntity.create(
      plantId,
      { i, j },
      {
        position: this.getLawnBlockPosition(i, j),
        zIndex: this.lawn.state.zIndex + 2
      }
    );
    const newPlantData = {
      id: plantId,
      hp: metadata.hp,
      position: { i, j },
      entity: newPlant
    };
    this.attach(newPlant);
    this.state.plantsData.push(newPlantData);
    this.state.plantsOnBlocks[i][j] = newPlantData;
    this.cancelHolding();
  }
  kill(i, j) {
    const plantData = this.state.plantsOnBlocks[i][j];
    if (!plantData) return;
    this.state.plantsOnBlocks[i][j] = null;
    const { entity } = plantData;
    entity.dispose();
    remove(this.state.plantsData, eq(plantData));
  }
  isOccupied(i, j) {
    return this.state.plantsOnBlocks[i][j] !== null;
  }
  getLawnBlockPosition(i, j) {
    return this.lawn.lawnBlocks[i][j].state.position;
  }
  cancelHolding() {
    var _a2, _b2, _c, _d;
    if (((_a2 = this.state.holdingObject) == null ? void 0 : _a2.type) === "shovel") {
      (_b2 = this.ui.shovelSlot.shovelImage) == null ? void 0 : _b2.activate();
    }
    this.state.holdingObject = null;
    (_c = this.holdingImage) == null ? void 0 : _c.dispose();
    this.holdingImage = null;
    (_d = this.phantomImage) == null ? void 0 : _d.dispose();
    this.phantomImage = null;
  }
  dropSun() {
    const { x: x0, y: y0 } = this.lawn.state.position;
    const x = x0 + random((this.config.lawn.width - 1) * 80);
    const y = y0 + random(1 * 80);
    const deltaY = random((this.config.lawn.height - 2) * 80);
    const targetY = y + deltaY;
    const life = deltaY / this.config.sun.sunDroppingVelocity + 4e3;
    const sun = SunEntity.create(
      {
        life,
        targetY
      },
      {
        position: { x, y },
        zIndex: this.lawn.state.zIndex + 3
      }
    ).attachTo(this).on("click", () => {
      this.state.sun += 25;
      sun.dispose();
    }).on("before-render", () => {
      const lifeComp = sun.getComp(LifeComp);
      if (lifeComp.life < 3e3) this.game.ctx.globalAlpha = 0.5;
    }).on("dispose", () => {
      remove(this.state.sunsData, (sunData) => sunData.entity === sun);
    });
    this.state.sunsData.push({
      lifeLimit: life,
      targetY,
      entity: sun
    });
  }
  preUpdate() {
    if (this.frozen) {
      this.state = this.update();
      return;
    }
    super.preUpdate();
  }
  updatePlantSlot(runCoolDown = true) {
    this.state.plantSlotsData.forEach((slot, i) => {
      let { cd, isCooledDown } = slot;
      if (runCoolDown && !isCooledDown) {
        const { cd: maxCd } = this.plantMetadatas[i];
        cd += this.game.mspf;
        if (cd > maxCd) {
          cd = maxCd;
          slot.isCooledDown = true;
        }
        slot.cd = cd;
      }
      slot.isSunEnough = this.state.sun >= this.plantMetadatas[i].cost;
      slot.isPlantable = slot.isCooledDown && slot.isSunEnough;
    });
  }
  update() {
    if (this.holdingImage) {
      const { x, y } = this.game.mouse.position;
      this.holdingImage.state.position = { x: x - 40, y: y - 40 };
    }
    if (this.frozen) return this.state;
    this.updatePlantSlot();
    this.state.sunsData.forEach(({ entity, targetY }) => {
      if (entity.state.position.y < targetY) entity.state.position.y += this.config.sun.sunDroppingVelocity * this.game.mspf;
    });
    this.useTimer("sunDropTimer", this.config.sun.sunDroppingInterval, () => this.dropSun());
    return this.state;
  }
  preRender() {
    if (this.frozen) this.addRenderJob(() => {
      const { ctx } = this.game;
      ctx.fillStyle = "rgba(0, 32, 255, .3)";
      ctx.fillRect(0, 0, 10 + this.width, this.height);
    }, 4);
    super.preRender();
  }
}
__publicField(LevelEntity, "initState", (state) => ({
  ...state,
  sun: 0,
  sunDropTimer: 0,
  plantSlotsData: [],
  holdingObject: null,
  plantsData: [],
  plantsOnBlocks: placeholder,
  sunsData: []
}));
class PlayScene extends Scene {
  constructor() {
    const level = new LevelEntity(
      {
        plantSlots: {
          slotNum: 2,
          plantIds: ["pea_shooter", "sunflower"]
        },
        lawn: {
          width: 9,
          height: 5
        },
        sun: {
          sunDroppingInterval: 1e4,
          firstSunDroppingTime: 6e3,
          sunDroppingVelocity: 30 / 1e3,
          sunLife: 8e3,
          sunAtStart: 200
        },
        shovelSlot: {
          shovelId: "iron_shovel"
        }
      },
      LevelEntity.initState({
        position: { x: 0, y: 0 },
        zIndex: 0
      })
    );
    super([
      level
    ]);
  }
}
class StartScene extends Scene {
  constructor() {
    const background = new ImageEntity(
      { src: "./assets/start.png" },
      { position: { x: 0, y: 0 }, zIndex: 0 }
    );
    const startButton = ButtonEntity.from(new ImageEntity(
      {
        src: "./assets/start_button_start.png",
        containingMode: "strict"
      },
      {
        position: { x: 450, y: 140 },
        zIndex: 1
      }
    )).addComp(CursorComp, "pointer").on("before-render", () => {
      this.game.ctx.filter = startButton.state.hovering ? "brightness(1.2)" : "";
    }).on("click", () => {
      this.deactivate();
      this.game.selectScene(PlayScene).activate();
    });
    const githubButton = ButtonEntity.from(new ImageEntity(
      {
        src: "./assets/github.png",
        containingMode: "strict"
      },
      {
        position: { x: 10, y: 10 },
        zIndex: 1
      }
    )).addComp(CursorComp, "pointer").on("click", () => {
      window.open("https://github.com/ForkKILLET/5dpvz", "_blank");
    });
    super([
      background,
      startButton,
      githubButton
    ]);
  }
}
void async function() {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const game = new Game({
    ctx,
    fps: 60
  });
  await Promise.all([
    game.addScene(new StartScene()),
    game.addScene(new PlayScene().deactivate())
  ]);
  game.start();
  Object.assign(window, { game });
}();
