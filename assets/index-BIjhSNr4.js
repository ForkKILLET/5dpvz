var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a, _b, _c, _d, _e, _f, _g, _h;
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
const by = (cmpGetter) => (a, b) => {
  const cmpA = cmpGetter(a);
  const cmpB = cmpGetter(b);
  return cmpA < cmpB ? -1 : cmpA > cmpB ? 1 : 0;
};
const matrix = (width, height, gen) => {
  const mat = [];
  for (let i = 0; i < width; i++) {
    const row = [];
    for (let j = 0; j < height; j++) row.push(gen(i, j));
    mat.push(row);
  }
  return mat;
};
const elem = (...array) => (item) => array.includes(item);
const remove = (array, pred) => {
  const index = array.findIndex(pred);
  if (index >= 0) array.splice(index, 1);
};
const sum = (array) => array.reduce((acc, curr) => acc + curr, 0);
const replicateBy = (count, gen) => Array.from({ length: count }).map((_, i) => gen(i));
const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) result[key] = obj[key];
  return result;
};
const mapk = (k, f) => (x) => f(x[k]);
const random = (a, b) => {
  const offset = 0;
  const length = a;
  return offset + Math.floor(Math.random() * length);
};
const eq = (x) => (y) => x === y;
const neq = (x) => (y) => x !== y;
const not = (f) => (x) => !f(x);
const isPrimitive = (x) => elem("string", "number", "boolean", "undefined", "symbol", "bigint")(typeof x) || x === null;
const placeholder = null;
const fixed = (value, precision = 2) => {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const positionSubtract = (p1, p2) => ({
  x: p1.x - p2.x,
  y: p1.y - p2.y
});
const positionAdd = (p1, p2) => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y
});
const useMotion = (game) => {
  const withFrame = (motion, totalFrame) => {
    totalFrame = Math.ceil(totalFrame);
    return (state) => {
      if (state.frame === totalFrame) return null;
      const delta = motion(state);
      state.frame++;
      return delta;
    };
  };
  const concat = (motions) => (state) => {
    for (const motion of motions) {
      const delta = motion(state);
      if (delta !== null) return delta;
    }
    return null;
  };
  const linearOnce = (speed, angle) => () => ({
    x: speed * fixed(Math.cos(angle)),
    y: speed * fixed(Math.sin(angle))
  });
  const linear = (speed, angle, distance) => withFrame(linearOnce(speed, angle), distance / speed);
  const linearTo = (config, from, to) => {
    const delta = positionSubtract(to, from);
    const angle = Math.atan2(delta.y, delta.x);
    const distance = Math.hypot(delta.x, delta.y);
    const speed = game.mspf0 * ("speed" in config ? config.speed : distance / config.time);
    return linear(speed, angle, distance);
  };
  const parabola = (a, g, x1, x2) => {
    const y1 = a * x1 ** 2;
    const y2 = a * x2 ** 2;
    const t1 = Math.sqrt(2 * y1 / g);
    const t2 = Math.sqrt(2 * y2 / g);
    const t = t1 + t2;
    const f = Math.ceil(t / game.mspf0);
    const dx = (x2 - x1) / f;
    return {
      totalFrame: f,
      motion: (state) => {
        if (state.frame === f) return null;
        const x = x1 + state.frame * dx;
        const y = a * x ** 2;
        const yLast = a * (x - dx) ** 2;
        state.frame++;
        return {
          x: dx,
          y: y - yLast
        };
      }
    };
  };
  return {
    withFrame,
    concat,
    linearOnce,
    linear,
    linearTo,
    parabola
  };
};
class State {
  constructor(state) {
    __publicField(this, "game", Game.defaultGame);
    this.state = state;
  }
  updateTimer(timerName, { interval, once = false }, onTimer) {
    let timer = this.state[timerName];
    if (timer === interval && once) return 0;
    timer += this.game.mspf0;
    if (timer > interval) {
      if (!once) timer -= interval;
      else timer = interval;
      onTimer();
    }
    this.state[timerName] = timer;
    return interval - timer;
  }
  cloneState(entityMap) {
    const _cloneState = (state) => {
      if (isPrimitive(state)) return state;
      if (state instanceof Array) return state.map(_cloneState);
      if (state instanceof Set) return new Set(Array.from(state).map(_cloneState));
      if (state instanceof Entity) return entityMap.get(state.id);
      return Object.fromEntries(
        Object.entries(state).map(([k, v]) => [k, _cloneState(v)])
      );
    };
    return _cloneState(this.state);
  }
}
const _Comp = class _Comp extends State {
  constructor(entity, config, state) {
    super(state);
    __publicField(this, "emitter", new Emitter());
    this.entity = entity;
    this.config = config;
  }
  static create(entity, config, state) {
    return new this(entity, config, state);
  }
  dispose() {
    this.emitter.emit("dispose");
    this.entity.removeComp([_Comp, eq(this)]);
  }
  update() {
  }
  cloneComp(entityMap, targetEntity) {
    const Ctor = this.constructor;
    return new Ctor(targetEntity, this.config, this.cloneState(entityMap));
  }
};
__publicField(_Comp, "dependencies", []);
__publicField(_Comp, "selector", (Comp2, filter) => [Comp2, filter]);
__publicField(_Comp, "runSelector", (Comp2) => {
  return (comp) => {
    if (typeof Comp2 === "function") return comp instanceof Comp2;
    return comp instanceof Comp2[0] && Comp2[1](comp);
  };
});
__publicField(_Comp, "getCtorFromSelector", (Comp2) => {
  return typeof Comp2 === "function" ? Comp2 : Comp2[0];
});
let Comp = _Comp;
class ShapeComp extends Comp {
  constructor(entity, config, state) {
    super(entity, config, state);
    __publicField(this, "ctx");
    this.ctx = this.game.ctx;
  }
  static create(entity, config) {
    return new this(entity, { tag: "boundary", ...config }, {});
  }
  get tag() {
    return this.config.tag;
  }
  setTag(tag) {
    this.config.tag = tag;
    return this;
  }
  static withTag(tagPred) {
    return [this, mapk("tag", tagPred)];
  }
  get position() {
    return this.entity.state.position;
  }
  get scale() {
    return this.entity.state.scale ?? 1;
  }
  contains(point) {
    return false;
  }
  intersects(other) {
    return false;
  }
  stroke() {
  }
  fill() {
  }
}
class AnyShape extends ShapeComp {
  static create(entity, config) {
    return super.create(
      entity,
      {
        intersects: () => false,
        stroke: () => {
        },
        fill: () => {
        },
        ...config
      }
    );
  }
  contains(point) {
    return this.config.contains.call(this.entity, point);
  }
  intersects(other) {
    return this.config.intersects.call(this.entity, other);
  }
  stroke() {
    this.config.stroke.call(this.entity, this.ctx);
  }
  fill() {
    this.config.fill.call(this.entity, this.ctx);
  }
}
const _RectShape = class _RectShape extends ShapeComp {
  static create(entity, config) {
    return new this(entity, { tag: "boundary", origin: "top-left", ...config }, {});
  }
  get rect() {
    let { x, y } = this.position;
    let { origin, width, height } = this.config;
    width *= this.scale;
    height *= this.scale;
    if (origin === "center") {
      x -= width / 2;
      y -= height / 2;
    }
    return { x, y, width, height };
  }
  contains(point) {
    return _RectShape.contains(this.rect)(point);
  }
  intersects(other) {
    if (other instanceof _RectShape) {
      const r1 = _RectShape.toRectP(this.rect);
      const r2 = _RectShape.toRectP(other.rect);
      return r1.x1 < r2.x2 && r1.x2 > r2.x1 && r1.y1 < r2.y2 && r1.y2 > r2.y1;
    } else if (other instanceof CircleShape) {
      return other.intersects(this);
    }
    return false;
  }
  stroke() {
    const { x, y, width, height } = this.rect;
    this.ctx.strokeRect(x, y, width, height);
  }
  fill() {
    const { x, y, width, height } = this.rect;
    this.ctx.fillRect(x, y, width, height);
  }
};
__publicField(_RectShape, "contains", (rect) => (point) => point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height);
__publicField(_RectShape, "toRectP", (rect) => ({
  x1: rect.x,
  y1: rect.y,
  x2: rect.x + rect.width,
  y2: rect.y + rect.height
}));
let RectShape = _RectShape;
class FullscreenShape extends RectShape {
  static create(entity) {
    const { width, height } = entity.game.ctx.canvas;
    return super.create(entity, { width, height });
  }
}
const _CircleShape = class _CircleShape extends ShapeComp {
  static create(entity, config) {
    return new this(entity, { tag: "boundary", ...config }, {});
  }
  get circle() {
    const { x, y } = this.position;
    const { radius } = this.config;
    return { x, y, radius: radius * this.scale };
  }
  contains(point) {
    return _CircleShape.contains(this.circle)(point);
  }
  intersects(other) {
    if (other instanceof _CircleShape) {
      const c1 = this.circle;
      const c2 = other.circle;
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      return dx ** 2 + dy ** 2 <= (c1.radius + c2.radius) ** 2;
    } else if (other instanceof RectShape) {
      const r = RectShape.toRectP(other.rect);
      const c = this.circle;
      const nx = clamp(c.x, r.x1, r.x2);
      const ny = clamp(c.y, r.y1, r.y2);
      const dx = c.x - nx;
      const dy = c.y - ny;
      return dx ** 2 + dy ** 2 <= c.radius ** 2;
    }
    return false;
  }
  path() {
    const { x, y, radius } = this.circle;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  stroke() {
    this.path();
    this.ctx.stroke();
  }
  fill() {
    this.path();
    this.ctx.fill();
  }
};
__publicField(_CircleShape, "contains", (circle) => (point) => {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx ** 2 + dy ** 2 <= circle.radius ** 2;
});
let CircleShape = _CircleShape;
const kDebugFold = Symbol("kDebugFold");
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

            #loop-duration-chart {
                display: flex;
                align-items: end;
                height: 160px;
                padding: 3px;
                border: 1px solid blue;
            }
            #loop-duration-chart > div {
                background-color: blue;
                margin: 1px;
                width: 1px;
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
            <b>mspf</b>: <debug-input><input id="mspf-input" type="number" value="${game.mspf}" /></debug-input>
            <debug-button id="mspf-submit">OK</debug-button>
            <b>loop duration</b>: <json-number id="loop-duration">0</json-number>ms
            <div id="loop-duration-chart"></div>
        </tab-content>
    `;
  const $ = (selector) => $debugWindow.querySelector(selector);
  const $$ = (selector) => $debugWindow.querySelectorAll(selector);
  const $loopDuration = $("#loop-duration");
  const $loopDurationChart = $("#loop-duration-chart");
  class DebugHandle extends Scene {
    constructor() {
      super();
      this.state.zIndex = Infinity;
      this.game.emitter.onSome([
        "entityStart",
        "entityDispose",
        "entityAttach",
        "entityActivate",
        "entityDeactivate",
        "hoverTargetChange"
      ], () => refreshEntityTree());
      this.game.mouse.emitter.on("click", () => {
        var _a2;
        if (selecting && selectingEntity) {
          setWatchingEntity(selectingEntity);
          (_a2 = $(`li[data-id="${selectingEntity.id}"]`)) == null ? void 0 : _a2.scrollIntoView();
          selectingEntity = null;
          toggleSelecting();
          refreshEntityDetail();
          return false;
        }
      }, { capture: true });
    }
    render() {
      var _a2;
      const { ctx } = this.game;
      watchingEntity == null ? void 0 : watchingEntity.withComp(ShapeComp.withTag(eq("boundary")), (shape) => {
        const { entity } = shape;
        if (entity.disposed) {
          unsetWatchingEntity();
          return;
        }
        ctx.strokeStyle = "blue";
        shape.stroke();
        ctx.fillStyle = "rgba(0, 0, 255, 0.1)";
        ctx.fill();
      });
      const [selectingEntityData] = this.game.allEntities.filter(
        (entity) => !(entity instanceof DebugHandle) && entity.deepActive && entity.hasComp(ShapeComp.withTag(eq("boundary"))) && (selecting || showBoundary || entity === reverseSelectingEntity)
      ).map((entity) => {
        const shape = entity.getComp(ShapeComp.withTag(eq("boundary")));
        ctx.strokeStyle = "red";
        shape.stroke();
        if (selecting && shape.contains(this.game.mouse.position) || entity === reverseSelectingEntity)
          return { entity, shape };
        return null;
      }).filter(neq(null)).sort(by((data) => -data.entity.state.zIndex));
      if (selectingEntityData) {
        const { entity, shape } = selectingEntityData;
        ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
        shape.fill();
        if (selectingEntity !== entity) {
          if (selectingEntity) cancelSelecting();
          (_a2 = $(`li[data-id="${entity.id}"]`)) == null ? void 0 : _a2.classList.add("selecting");
          selectingEntity = entity;
        }
      }
    }
    update() {
      const { loopDuration } = this.game;
      $loopDuration.innerText = loopDuration.toString();
      if ($loopDurationChart.childElementCount > 100)
        $loopDurationChart.removeChild($loopDurationChart.firstElementChild);
      const $bar = document.createElement("div");
      $bar.style.height = `${loopDuration * 5}px`;
      $loopDurationChart.appendChild($bar);
    }
  }
  game.addScene(new DebugHandle());
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
  let selecting = false;
  let showBoundary = false;
  let selectingEntity = null;
  let reverseSelectingEntity = null;
  const $selectButton = $("#select");
  const toggleSelecting = () => {
    selecting = !selecting;
    $selectButton.className = selecting ? "active" : "";
  };
  const cancelSelecting = () => {
    var _a2;
    if (!selectingEntity) return;
    (_a2 = $(`li[data-id="${selectingEntity.id}"]`)) == null ? void 0 : _a2.classList.remove("selecting");
    selectingEntity = null;
  };
  $selectButton.addEventListener("click", toggleSelecting);
  const $showBoundaryButton = $("#show-boundary");
  $showBoundaryButton.addEventListener("click", () => {
    showBoundary = !showBoundary;
    $showBoundaryButton.className = showBoundary ? "active" : "";
  });
  const entityFoldState = /* @__PURE__ */ new Map();
  const showEntityAttrs = (attrs) => attrs.filter((attr) => attr).map((attr) => `<entity-attr>${attr}</entity-attr>`).join(" ");
  const getEntityAttrs = (entity) => {
    return [
      game.hoveringEntity === entity ? "hovering" : null,
      !entity.started && "unstarted"
    ].filter((c) => c);
  };
  const showEntityTree = (entity) => {
    const className = [
      entity.active ? null : "inactive",
      entity === watchingEntity ? "watching" : null
    ].filter(neq(null)).join(" ");
    const isFolden = entityFoldState.get(entity.id) ?? entity[kDebugFold];
    const hasAttached = entity.attachedEntities.length > 0;
    return `<li class="${className}" data-id="${entity.id}">
            ${hasAttached ? `<debug-button class="fold-entity">${isFolden ? "+" : "-"}</debug-button>` : ""}
            ${showEntityHeader(entity)}
            ${hasAttached && !isFolden ? `<ul>
                    ${entity.attachedEntities.map((entity2) => `
${showEntityTree(entity2)}`).join("")}
                </ul>` : ""}
        </li>`;
  };
  const showEntityRoot = (entities) => {
    return `<ul>${entities.map(showEntityTree).join("\n")}</ul>`;
  };
  let watchingEntity = null;
  let watchingComp = null;
  const unsetWatchingEntity = () => {
    watchingEntity = null;
    watchingComp = null;
    switchTab("entity-tree");
  };
  const setWatchingEntity = (entity) => {
    var _a2, _b2;
    watchingEntity = entity;
    Object.assign(window, { e: entity });
    (_a2 = $(".watching")) == null ? void 0 : _a2.classList.remove("watching");
    (_b2 = $(`li[data-id="${entity.id}"]`)) == null ? void 0 : _b2.classList.add("watching");
    entity.on("dispose", () => {
      if (watchingEntity === entity) unsetWatchingEntity();
    });
  };
  const unsetWatchingComp = () => {
    watchingComp = null;
    switchTab("entity-detail");
  };
  const setWatchingComp = (comp) => {
    watchingComp = comp;
    Object.assign(window, { c: comp });
  };
  let autoRefreshEntityTree = true;
  const refreshEntityTree = () => {
    if (currentTab === "entity-detail") {
      if (!watchingEntity) return;
      $("#entity-detail-tree-content").innerHTML = showEntityRoot(watchingEntity.attachedEntities);
    } else
      $entityTreeContent.innerHTML = showEntityRoot(game.scenes);
  };
  const $entityTreeContent = $("#entity-tree-content");
  $("#refresh-entity-tree").addEventListener("click", refreshEntityTree);
  const $autoRefresh = $("#auto-refresh-entity-tree");
  $autoRefresh.addEventListener("click", () => {
    $autoRefresh.innerHTML = autoRefreshEntityTree ? "Auto" : "Manual";
    autoRefreshEntityTree = !autoRefreshEntityTree;
  });
  window.addEventListener("mouseover", ({ target: $el }) => {
    var _a2;
    reverseSelectingEntity = null;
    (_a2 = $(".selecting")) == null ? void 0 : _a2.classList.remove("selecting");
    if ($el instanceof HTMLElement && $el.tagName === "LI") {
      $el.classList.add("selecting");
      const id = +$el.dataset.id;
      reverseSelectingEntity = game.getEntityById(id);
    }
  });
  window.addEventListener("keypress", ({ key }) => {
    if (key === "@") toggleSelecting();
  });
  const showFunction = (fn) => {
    var _a2;
    return ((_a2 = fn.name) == null ? void 0 : _a2.replace(/(^_)|(\d+$)/, "")) || "function";
  };
  const showJson = (obj) => typeof obj === "number" ? `<json-number>${obj}</json-number>` : typeof obj === "string" ? `<json-string>${obj}</json-string>` : typeof obj === "boolean" ? `<json-boolean>${obj}</json-boolean>` : typeof obj === "symbol" ? `<json-symbol>${obj.description}</json-symbol>` : typeof obj === "function" ? `<json-function>${showFunction(obj)}</json-function>` : obj === null ? "<json-null></json-null>" : obj instanceof Entity ? showEntityHeader(obj) : obj instanceof Comp ? showCompLink(obj) : Array.isArray(obj) ? `
            <json-array>${obj.map((child) => `<json-item>${showJson(child)}</json-item>`).join("")}</json-array>
        `.trim() : `
            <json-object>${Object.entries(obj).map(([key, value]) => `
                    <json-item><json-key>${key}</json-key><json-value>${showJson(value)}</json-value></json-item>
                `).join("")}</json-object>
        `.trim();
  const refreshEntityDetail = () => {
    const e = watchingEntity;
    if (!e) return $entityDetailContent.innerHTML = "No entity selected";
    const attrs = [
      e.deepActive ? "active" : "inactive",
      ...getEntityAttrs(e)
    ];
    const protoChain = [];
    for (let proto = e.constructor; proto !== Function.prototype; proto = Object.getPrototypeOf(proto)) {
      protoChain.push(proto);
    }
    $entityDetailContent.innerHTML = `
            ${showEntityHeader(e, false)}
            ${showEntityAttrs(attrs)}<br />
            <b>buildName</b> ${showJson(e.buildName)}<br />
            <b>state</b> ${showJson(e.state)}<br />
            <b>config</b> ${showJson(e.config)}<br />
            <b>providedKeys</b> ${showJson(Object.getOwnPropertySymbols(e.providedValues))}<br />
            <b>injectableKeys</b> ${showJson(e.injectableKeys)}<br />
            <b>comps</b> ${showJson(e.comps)}<br />
            <b>superEntity</b> ${showJson(e.superEntity)}<br />
            <b>protoChain</b> ${showJson(protoChain)}<br />
            <b>attachedEntities</b> <div id="entity-detail-tree-content"></div>
        `;
    refreshEntityTree();
  };
  const refreshCompDetail = () => {
    const c = watchingComp;
    if (!c) return $compDetailContent.innerHTML = "No comp selected";
    $compDetailContent.innerHTML = `
            ${showCompLink(c, false)}<br />
            <b>state</b> ${showJson(c.state)}<br />
            <b>config</b> ${showJson(c.config)}<br />
            <b>entity</b> ${showJson(c.entity)}<br />
        `;
  };
  const $entityDetailContent = $("#entity-detail-content");
  const $compDetailContent = $("#comp-detail-content");
  $("#back-to-entity-tree").addEventListener("click", unsetWatchingEntity);
  $("#back-to-entity-detail").addEventListener("click", unsetWatchingComp);
  $("#refresh-entity-detail").addEventListener("click", refreshEntityDetail);
  $("#refresh-comp-detail").addEventListener("click", refreshCompDetail);
  const showEntityHeader = (entity, hasLink = true) => {
    const attrs = getEntityAttrs(entity);
    const { id } = entity;
    return `
            ${showFunction(entity.constructor)}<entity-id>#${id}</entity-id>
            ${showEntityAttrs(attrs)}
            ${hasLink ? `<debug-button data-id="${id}" class="show-entity-detail">&gt;</debug-button>` : ""}
        `;
  };
  const showCompLink = (comp, hasLink = true) => {
    const index = comp.entity.comps.indexOf(comp);
    return `
            ${showFunction(comp.constructor)}
            ${hasLink ? `<debug-button data-index="${index}" class="show-comp-detail">&gt;</debug-button>` : ""}
        `;
  };
  refreshEntityDetail();
  refreshCompDetail();
  $debugWindow.addEventListener("click", ({ target: $el }) => {
    if (!($el instanceof HTMLElement)) return;
    if ($el.tagName === "DEBUG-BUTTON") {
      if ($el.classList.contains("fold-entity")) {
        const id = +$el.parentElement.dataset.id;
        entityFoldState.set(id, !entityFoldState.get(id));
        refreshEntityTree();
      } else if ($el.classList.contains("show-entity-detail")) {
        const id = +$el.dataset.id;
        const entity = game.getEntityById(id);
        if (entity) {
          setWatchingEntity(entity);
          switchTab("entity-detail");
          refreshEntityDetail();
        }
      } else if ($el.classList.contains("show-comp-detail")) {
        const index = +$el.dataset.index;
        const comp = watchingEntity == null ? void 0 : watchingEntity.comps[index];
        if (comp) {
          setWatchingComp(comp);
          switchTab("comp-detail");
          refreshCompDetail();
        }
      }
    } else if ($el.tagName === "LI") {
      const id = +$el.dataset.id;
      const entity = game.getEntityById(id);
      if (entity) setWatchingEntity(entity);
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
const injectKey = (description) => Symbol(description);
const _Entity = class _Entity extends (_b = State, _a = kDebugFold, _b) {
  constructor(config, state) {
    super(state);
    __publicField(this, _a, false);
    __publicField(this, "id", _Entity.generateEntityId());
    __publicField(this, "active", true);
    __publicField(this, "buildName", null);
    __publicField(this, "startedToRunStart", false);
    __publicField(this, "startedToBeforeStart", false);
    __publicField(this, "started", false);
    __publicField(this, "starters", []);
    __publicField(this, "autoRender", true);
    __publicField(this, "superEntity", null);
    __publicField(this, "attachedEntities", []);
    __publicField(this, "providedValues", {});
    __publicField(this, "disposers", []);
    __publicField(this, "disposed", false);
    __publicField(this, "comps", []);
    __publicField(this, "emitter", new Emitter());
    this.config = config;
    if (state.cloning) this.on("clone-finish", () => this.build());
    else this.afterStart(() => this.build());
  }
  get deepActive() {
    var _a2;
    return this.active && (((_a2 = this.superEntity) == null ? void 0 : _a2.deepActive) ?? true);
  }
  activate() {
    this.active = true;
    this.emitter.activate();
    this.game.emitter.emit("entityActivate", this);
    return this;
  }
  deactivate() {
    this.active = false;
    this.afterStart(() => {
      this.emitter.deactivate();
      this.game.emitter.emit("entityDeactivate", this);
    });
    return this;
  }
  build() {
  }
  useBuilder(buildName, builder) {
    const buildClone = this.attachedEntities.find(mapk("buildName", eq(buildName)));
    if (buildClone) return buildClone;
    const build = builder().attachTo(this);
    build.buildName = buildName;
    return build;
  }
  async start() {
    this.game.allEntities.push(this);
  }
  runStart() {
    this.startedToRunStart = true;
    void (async () => {
      await this.start();
      this.startedToBeforeStart = true;
      await Promise.all(this.starters.map((fn) => fn()));
      this.started = true;
      this.emit("start");
      this.game.emitter.emit("entityStart", this);
    })();
    return this;
  }
  beforeStart(fn) {
    if (this.startedToBeforeStart) fn();
    else this.starters.push(fn);
    return this;
  }
  afterStart(fn, capture = false) {
    if (this.started) fn(this);
    else this.on("start", () => fn(this), { capture });
    return this;
  }
  toStart() {
    return new Promise((res) => this.afterStart(res));
  }
  with(fn) {
    fn(this);
    return this;
  }
  as() {
    return this;
  }
  setAutoRender(autoRender) {
    this.autoRender = autoRender;
    return this;
  }
  attach(...entities) {
    if (this.state.cloning) return this;
    entities.forEach((entity) => this.beforeStart(async () => {
      await entity.runStart().toStart();
      entity.superEntity = this;
      this.attachedEntities.push(entity);
      entity.emit("attach", this).on("dispose", () => this.unattach(entity));
      this.game.emitter.emit("entityAttach", entity);
    }));
    return this;
  }
  attachTo(superEntity) {
    superEntity.attach(this);
    return this;
  }
  unattach(...entities) {
    entities.forEach((entity) => entity.emit("unattach"));
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
  log(message) {
    console.log(`Entity #${this.id}: ${message}
%o`, this);
  }
  error(message) {
    message = `Entity #${this.id}: ${message}`;
    console.error(`${message}
%o`, this);
    throw new Error(message);
  }
  hasComp(...sels) {
    return sels.every((sel) => this.comps.some(Comp.runSelector(sel)));
  }
  addRawComp(comp) {
    if (this.state.cloning) return this;
    const _addComp = () => {
      const { dependencies } = comp.constructor;
      if (!this.hasComp(...dependencies))
        this.error(`Component missing dependencies: ${dependencies.map((dep) => Comp.getCtorFromSelector(dep).name).join(", ")}.`);
      this.comps.push(comp);
      comp.emitter.emit("attach", this);
    };
    if (this.started) _addComp();
    else this.afterStart(_addComp, this.startedToRunStart);
    return this;
  }
  addLazyComp(compBuilder) {
    return this.addRawComp(compBuilder(this));
  }
  addLoseComp(Comp2, ...args) {
    return this.addRawComp(Comp2.create(this, ...args));
  }
  addComp(Comp2, ...args) {
    if (this.hasComp(Comp2)) return this;
    return this.addLoseComp(Comp2, ...args);
  }
  removeComp(sel) {
    return this.afterStart(() => {
      this.comps = this.comps.filter(not(Comp.runSelector(sel)));
    });
  }
  getComp(sel) {
    return this.comps.find(Comp.runSelector(sel));
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
  runUpdate() {
    if (!this.active || this.disposed) return;
    this.update();
    this.postUpdate();
  }
  postUpdate() {
    this.attachedEntities.forEach((entity) => entity.runUpdate());
    this.comps.forEach((comp) => comp.update());
  }
  update() {
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
  on(event, listener, options = {}) {
    const off = this.emitter.on(event, listener, options);
    this.disposers.push(off);
    return this;
  }
  forwardEvents(source, events) {
    this.emitter.forward(source, events);
    return this;
  }
  updatePosition(delta) {
    this.emit("position-update", delta);
    this.state.position = positionAdd(this.state.position, delta);
    this.attachedEntities.forEach((entity) => entity.updatePosition(delta));
    return this;
  }
  updatePositionTo({ x, y }) {
    return this.updatePosition({
      x: x - this.state.position.x,
      y: y - this.state.position.y
    });
  }
  cloneEntity(entityMap = /* @__PURE__ */ new Map()) {
    const Ctor = this.constructor;
    const newAttachedEntities = this.attachedEntities.map((entity) => entity.cloneEntity(entityMap));
    const newEntity = new Ctor({ ...this.config }, { ...this.cloneState(entityMap), cloning: true });
    entityMap.set(this.id, newEntity);
    newEntity.beforeStart(() => {
      newEntity.state.cloning = false;
      newEntity.buildName = this.buildName;
      Promise.all(newAttachedEntities.map((entity) => new Promise(
        (res) => entity.attachTo(newEntity).on("attach", res)
      ))).then(() => newEntity.emit("clone-finish"));
      this.comps.forEach((comp) => newEntity.addRawComp(comp.cloneComp(entityMap, newEntity)));
    });
    return newEntity;
  }
};
__publicField(_Entity, "generateEntityId", createIdGenerator());
let Entity = _Entity;
class HoverableComp extends Comp {
  constructor() {
    super(...arguments);
    __publicField(this, "emitter", new Emitter());
  }
  static create(entity) {
    return new this(entity, {}, { hovering: false });
  }
}
__publicField(HoverableComp, "dependencies", [ShapeComp.withTag(eq("boundary"))]);
class CursorComp extends Comp {
  static create(entity, cursor) {
    return new this(entity, { cursor }, {});
  }
}
__publicField(CursorComp, "dependencies", [HoverableComp]);
class Emitter {
  constructor() {
    __publicField(this, "active", true);
    __publicField(this, "listeners", {});
  }
  activate() {
    this.active = true;
  }
  deactivate() {
    this.active = false;
  }
  emit(event, ...args) {
    if (!this.active) return;
    const listeners = this.listeners[event];
    if (!listeners) return;
    for (const listener of listeners.capture)
      if (listener(...args) === false) return;
    for (const listener of listeners.normal)
      listener(...args);
  }
  on(event, listener, { capture = false } = {}) {
    var _a2;
    const currentListeners = (_a2 = this.listeners)[event] ?? (_a2[event] = {
      normal: [],
      capture: []
    });
    const concreteListeners = currentListeners[capture ? "capture" : "normal"];
    concreteListeners.push(listener);
    return () => remove(concreteListeners, eq(listener));
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
const _Game = class _Game {
  constructor(config) {
    __publicField(this, "ctx");
    __publicField(this, "imageManager");
    __publicField(this, "audioManager");
    __publicField(this, "mouse");
    __publicField(this, "keyboard");
    __publicField(this, "motion");
    __publicField(this, "mspf");
    __publicField(this, "mspf0");
    __publicField(this, "unit", {
      ms2f: (ms) => ms / this.mspf0,
      f2ms: (f) => f * this.mspf0
    });
    __publicField(this, "allEntities", []);
    __publicField(this, "scenes", []);
    __publicField(this, "emitter", new Emitter());
    __publicField(this, "renderJobs", []);
    __publicField(this, "hoveringEntity", null);
    __publicField(this, "loopTimerId", null);
    __publicField(this, "loopDuration", 0);
    this.config = config;
    if (config.isDefault) _Game.defaultGame = this;
    this.ctx = config.ctx;
    this.imageManager = useImageManager();
    this.audioManager = useAudioManager(this);
    this.mouse = useMouse(this);
    this.keyboard = useKeyboard();
    this.motion = useMotion(this);
    this.mspf0 = this.mspf = 1e3 / config.fps;
    const floor = new class Floor extends Scene {
      constructor() {
        super();
        this.addComp(AnyShape, { contains: () => true }).addComp(HoverableComp);
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
    if (config.isDebug) loadDebugWindow(this);
  }
  addRenderJob(job) {
    this.renderJobs.push(job);
  }
  get running() {
    return this.loopTimerId !== null;
  }
  loop() {
    var _a2;
    const activeScenes = this.scenes.filter((scene) => scene.active);
    activeScenes.forEach((scene) => scene.runUpdate());
    const oldHoveringEntity = this.hoveringEntity;
    this.hoveringEntity = null;
    const hoverableEntities = this.allEntities.filter((entity) => entity.started && entity.deepActive && entity.hasComp(HoverableComp)).sort(by((entity) => -entity.state.zIndex));
    let isCursorSet = false;
    for (const entity of hoverableEntities) {
      const shapeComp = entity.getComp(ShapeComp.withTag(eq("boundary")));
      const hoverableComp = entity.getComp(HoverableComp);
      const hovering = !this.hoveringEntity && shapeComp.contains(this.mouse.position);
      if (hovering) {
        this.hoveringEntity = entity;
        entity.withComp(CursorComp, (cursor) => {
          this.ctx.canvas.style.cursor = cursor.config.cursor;
          isCursorSet = true;
        });
      }
      if (hoverableComp.state.hovering !== hovering) {
        hoverableComp.emitter.emit(hovering ? "mouseenter" : "mouseleave");
        hoverableComp.state.hovering = hovering;
      }
    }
    if (!isCursorSet) this.ctx.canvas.style.cursor = "";
    if (oldHoveringEntity !== this.hoveringEntity) {
      oldHoveringEntity == null ? void 0 : oldHoveringEntity.getComp(HoverableComp).emitter.emit("mouseleave");
      (_a2 = this.hoveringEntity) == null ? void 0 : _a2.getComp(HoverableComp).emitter.emit("mouseenter");
      this.emitter.emit("hoverTargetChange", this.hoveringEntity);
    }
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
    this.loopTimerId = setInterval(() => {
      const startTime = performance.now();
      this.loop();
      const endTime = performance.now();
      this.loopDuration = endTime - startTime;
    }, this.mspf);
  }
  pause() {
    if (this.loopTimerId !== null) {
      clearInterval(this.loopTimerId);
      this.loopTimerId = null;
    }
  }
  addScene(scene) {
    scene.runStart().afterStart(() => {
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
    return this.allEntities.find((entity) => entity.id === id) ?? null;
  }
};
__publicField(_Game, "defaultGame", placeholder);
let Game = _Game;
class Scene extends Entity {
  constructor(...entities) {
    super({}, { position: { x: 0, y: 0 }, zIndex: 0 });
    this.attach(...entities).addComp(FullscreenShape);
  }
}
const useMouse = (game) => {
  const { ctx } = game;
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
  const loadingImgs = {};
  return {
    imgs,
    loadingImgs,
    loadImage: async (src) => {
      if (src in imgs) return imgs[src];
      if (src in loadingImgs) return loadingImgs[src];
      const img = new Image();
      img.src = src;
      return loadingImgs[src] = new Promise((res, rej) => {
        img.onload = () => res(img);
        img.onerror = (event) => {
          rej(new Error(`Failed to load image: ${src}`));
          console.error(`Failed to load image: ${src}
%o`, event);
        };
      });
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
const getImageOutline = ({ width, height }, pixels) => {
  const outline = [];
  const inner = [];
  const dots = matrix(width, height, (x, y) => pixels[(y * width + x) * 4 + 3] > 0);
  matrix(width, height, (x, y) => {
    if (!dots[x][y]) return;
    if (x === 0 || !dots[x - 1][y] || x === width - 1 || !dots[x + 1][y] || y === 0 || !dots[x][y - 1] || y === height - 1 || !dots[x][y + 1]) outline.push({ x, y });
    else inner.push({ x, y });
  });
  return { outline, inner };
};
const useAudioManager = (game) => {
  const audioContext = new AudioContext();
  const audios = {};
  const loadingAudios = {};
  if (!game.config.noAudio) document.addEventListener("click", () => {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  }, { once: true });
  const _loadAudio = async (src) => {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audios[src] = audioBuffer;
  };
  const loadAudio = async (src) => {
    if (src in audios) return audios[src];
    if (src in loadingAudios) return loadingAudios[src];
    return loadingAudios[src] = _loadAudio(src);
  };
  const playAudio = (src, options = {}) => {
    const audioBuffer = audios[src];
    if (!audioBuffer)
      throw new Error(`Audio not loaded: ${src}`);
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.loop = options.loop ?? false;
    sourceNode.playbackRate.value = options.playbackRate ?? 1;
    const dryGainNode = audioContext.createGain();
    const wetGainNode = audioContext.createGain();
    dryGainNode.gain.value = 1;
    wetGainNode.gain.value = 0;
    const effectNode = audioContext.createBiquadFilter();
    effectNode.type = "lowpass";
    effectNode.frequency.value = 2e3;
    const volumeGainNode = audioContext.createGain();
    volumeGainNode.gain.value = options.volume ?? 1;
    sourceNode.connect(dryGainNode);
    sourceNode.connect(effectNode);
    effectNode.connect(wetGainNode);
    dryGainNode.connect(audioContext.destination);
    wetGainNode.connect(audioContext.destination);
    volumeGainNode.connect(audioContext.destination);
    sourceNode.start(0);
    let isEffectApplied = false;
    const toggleEffect = () => {
      if (isEffectApplied) {
        dryGainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.1);
        wetGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
        sourceNode.playbackRate.setTargetAtTime(1, audioContext.currentTime, 0.1);
        isEffectApplied = false;
      } else {
        dryGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
        wetGainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.1);
        sourceNode.playbackRate.setTargetAtTime(0.8, audioContext.currentTime, 0.1);
        isEffectApplied = true;
      }
    };
    const stop = () => {
      sourceNode.stop();
      sourceNode.disconnect();
      dryGainNode.disconnect();
      wetGainNode.disconnect();
      effectNode.disconnect();
      volumeGainNode.disconnect();
    };
    const setVolume = (volume) => {
      volumeGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    };
    return {
      toggleEffect,
      stop,
      isEffectApplied,
      setVolume
    };
  };
  return {
    audioContext,
    audios,
    loadingAudios,
    loadAudio,
    playAudio
  };
};
const easeInSine = (t) => 1 - Math.cos(t * Math.PI / 2);
const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
class MotionComp extends Comp {
  static create(entity, config, state) {
    return new this(
      entity,
      { once: true, ...config },
      { ...state, finished: false }
    );
  }
  update() {
    if (this.state.finished) return;
    const delta = this.config.motion(this.state);
    if (!delta) {
      this.state.finished = true;
      this.emitter.emit("motion-finish", this.entity);
      if (this.config.once) this.dispose();
    } else this.entity.updatePosition(delta);
  }
}
class RngComp extends Comp {
  static create(entity, initSeed) {
    return new this(entity, {}, { seed: initSeed });
  }
  next() {
    this.state.seed = (this.state.seed * 1145147 + 1919810255) % 2 ** 32;
    return this.state.seed / 2 ** 32;
  }
  random(min, max) {
    const rand = this.next();
    if (max === void 0) {
      max = min;
      min = 0;
    }
    return Math.floor(rand * (max - min) + min);
  }
}
class FilterComp extends Comp {
  constructor(entity, config, state) {
    super(entity, config, state);
    entity.on("before-render", () => {
      this.game.ctx.filter = Object.values(this.state.filters).filter(neq(null)).join(" ") || "none";
    });
  }
  static create(entity, filters = {}) {
    return new this(entity, {}, { filters });
  }
}
class HealthComp extends Comp {
  static create(entity, maxHp) {
    return new this(entity, { maxHp }, { hp: maxHp });
  }
  takeDamage(damage) {
    this.state.hp -= damage;
    this.emitter.emit("takeDamage", damage);
    if (this.state.hp <= 0) {
      this.emitter.emit("die");
      this.entity.dispose();
    }
  }
}
class DamageEffectComp extends Comp {
  constructor(entity, config, state) {
    super(entity, config, state);
    entity.withComps([HealthComp, FilterComp], (health, filter) => {
      health.emitter.on("takeDamage", () => {
        this.state.damageEffectTimer = 0;
        filter.state.filters.damageEffect = "brightness(1.2)";
      });
    });
  }
  static create(entity, duration = 100) {
    return new this(entity, { duration }, {});
  }
  update() {
    this.updateTimer(
      "damageEffectTimer",
      { interval: this.config.duration, once: true },
      () => this.entity.withComp(FilterComp, ({ state: { filters } }) => {
        filters.damageEffect = null;
      })
    );
  }
}
__publicField(DamageEffectComp, "dependencies", [HealthComp, FilterComp]);
__publicField(DamageEffectComp, "damageEffectDuration", 200);
class ContinuousDamagingComp extends Comp {
  static create(entity, damagePF) {
    return new this(entity, { damagePF }, { targets: /* @__PURE__ */ new Set() });
  }
  update() {
    this.state.targets.forEach((target) => {
      target.withComp(HealthComp, (health) => health.takeDamage(this.config.damagePF));
    });
  }
}
class ButtonComp extends Comp {
  constructor(entity, config, state) {
    super(entity, config, state);
    entity.withComp(HoverableComp, ({ emitter }) => {
      entity.forwardEvents(emitter, ["click", "rightclick", "mouseenter", "mouseleave"]);
    });
  }
  static create(entity) {
    return new this(entity, {}, {});
  }
}
__publicField(ButtonComp, "dependencies", [HoverableComp]);
class TextureEntity extends Entity {
  constructor(config, state) {
    var _a2;
    super(config, state);
    __publicField(this, "frames", {});
    __publicField(this, "pixels", {});
    __publicField(this, "outlines", {});
    (_a2 = this.state).textureName ?? (_a2.textureName = config.defaultTextureName);
  }
  static createTexture(config, state) {
    return new this(
      {
        origin: "top-left",
        defaultTextureName: "common",
        ...config
      },
      {
        textureName: "common",
        innerState: placeholder,
        ...state
      }
    );
  }
  static createTextureFromImage(src, config, state) {
    return this.createTexture(
      {
        textures: {
          common: {
            type: "image",
            src
          }
        },
        ...config
      },
      state
    );
  }
  static createButtonFromImage(src, config, state) {
    const button = this.createTextureFromImage(src, config, state).addComp(HoverableComp).addComp(ButtonComp).as().on("mouseenter", () => button.state.hovering = true).on("mouseleave", () => button.state.hovering = false);
    return button;
  }
  async start() {
    await super.start();
    const { textures, strictShape } = this.config;
    for (const [name, texture] of Object.entries(textures)) {
      switch (texture.type) {
        case "image": {
          const img = await this.game.imageManager.loadImage(texture.src);
          this.frames[name] = [img];
          if (strictShape) {
            const pixels = getImagePixels(img);
            this.pixels[name] = [pixels];
            this.outlines[name] = [getImageOutline(img, pixels)];
          }
          break;
        }
        case "anime": {
          const frames = await Promise.all(
            texture.srcs.map((src) => this.game.imageManager.loadImage(src))
          );
          this.frames[name] = frames;
          if (strictShape) {
            this.pixels[name] = frames.map(getImagePixels);
            this.outlines[name] = frames.map((frame, i) => getImageOutline(frame, this.pixels[name][i]));
          }
          break;
        }
      }
    }
    if (this.state.innerState === placeholder) this.switchTexture(this.state.textureName);
  }
  initInnerState(textureName) {
    const texture = this.config.textures[textureName];
    switch (texture.type) {
      case "anime":
        return {
          type: "anime",
          f: 0,
          af: 0,
          isPlaying: true,
          direction: 1
        };
      case "image":
        return {
          type: "image"
        };
    }
  }
  get textureName() {
    return this.state.textureName;
  }
  get texture() {
    return this.config.textures[this.textureName];
  }
  get f() {
    switch (this.texture.type) {
      case "image":
        return 0;
      case "anime":
        return this.getInnerState().af;
    }
  }
  get frame() {
    return this.frames[this.textureName][this.f];
  }
  get size() {
    return pick(this.frame, ["width", "height"]);
  }
  switchTexture(name) {
    if (!(name in this.config.textures))
      this.error(`Texture '${name}' does not exist.`);
    this.afterStart(
      () => {
        const shapeConfig = {
          ...this.size,
          ...pick(this.config, ["origin"])
        };
        this.removeComp(ShapeComp.withTag(elem("texture", "boundary"))).addLoseComp(RectShape, {
          tag: "texture",
          ...shapeConfig
        });
        if (this.config.strictShape)
          this.addRawComp(AnyShape.create(this, {
            tag: "boundary",
            contains(point) {
              const rectShape = this.getComp(RectShape);
              if (!rectShape.contains(point)) return false;
              const { x, y, width } = rectShape.rect;
              const pixels = this.pixels[this.textureName][this.f];
              const rx = point.x - x;
              const ry = point.y - y;
              const alpha = pixels[ry * width * 4 + rx * 4 + 3];
              return alpha > 0;
            },
            intersects() {
              return false;
            },
            stroke() {
              const outline = this.outlines[this.textureName][this.f];
              const { x, y } = this.getComp(RectShape).rect;
              outline.outline.forEach((dot) => this.game.ctx.strokeRect(dot.x + x, dot.y + y, 1, 1));
            },
            fill() {
              const outline = this.outlines[this.textureName][this.f];
              const { x, y } = this.getComp(RectShape).rect;
              outline.inner.forEach((dot) => this.game.ctx.fillRect(dot.x + x, dot.y + y, 1, 1));
            }
          }));
        else
          this.addLoseComp(RectShape, shapeConfig);
      },
      true
    );
    this.state.textureName = name;
    this.state.innerState = this.initInnerState(name);
  }
  getInnerState() {
    return this.state.innerState;
  }
  render() {
    const rectShape = this.getComp(RectShape);
    const { x, y, width, height } = rectShape.rect;
    this.game.ctx.drawImage(this.frame, x, y, width, height);
  }
  update() {
    const { texture } = this;
    switch (texture.type) {
      case "image":
        break;
      case "anime": {
        const animeState = this.getInnerState();
        const { isPlaying, direction } = animeState;
        if (!isPlaying) return;
        if (++animeState.f === texture.fpaf) {
          this.emit("anime-finish");
          animeState.f = 0;
          const frameCount = this.frames[this.textureName].length;
          const af = animeState.af += direction;
          if (af === frameCount || af === -1)
            animeState.af -= frameCount * direction;
        }
        break;
      }
    }
  }
}
class PlantEntity extends TextureEntity {
  constructor(config, state) {
    super(config, state);
    const { shapeFactory } = this.config.metadata;
    if (shapeFactory) this.addRawComp(shapeFactory(this).setTag("hitbox"));
    this.addComp(CollidableComp, {
      groups: ["plant"],
      target: { ty: "has", group: "zombie" }
    }).addComp(HoverableComp).addComp(FilterComp).addComp(HealthComp, this.config.metadata.hp).addComp(DamageEffectComp).withComps([HoverableComp, FilterComp], ({ emitter }, { state: { filters } }) => {
      emitter.on("mouseenter", () => {
        var _a2;
        if (((_a2 = this.inject(kProcess).state.holdingObject) == null ? void 0 : _a2.type) === "shovel")
          filters.onShovel = "brightness(1.2)";
      });
      emitter.on("mouseleave", () => {
        filters.onShovel = null;
      });
    });
  }
  static isPlant(entity) {
    return entity instanceof PlantEntity;
  }
  static createPlant(plantId, config, state) {
    const Plant = PLANTS[plantId];
    return Plant.createTexture(
      {
        metadata: Plant,
        textures: plantTextures.getAnimeTextureSet(plantId),
        strictShape: true,
        ...config
      },
      state
    );
  }
}
const definePlant = (Ctor) => Ctor;
class BulletEntity extends TextureEntity {
  constructor(config, state) {
    super(config, state);
    const { shapeFactory } = this.config.metadata;
    if (shapeFactory) this.addRawComp(shapeFactory(this).setTag("hitbox"));
    this.addComp(CollidableComp, {
      groups: ["bullet"],
      target: { ty: "has", group: "zombie" }
    }).addComp(FilterComp).withComp(CollidableComp, (colliable) => {
      colliable.emitter.on("collide", (target) => {
        if (target instanceof ZombieEntity) this.hit(target);
      });
    });
  }
  static createBullet(bulletId, config, state) {
    const Bullet = BULLETS[bulletId];
    return Bullet.createTexture(
      {
        metadata: Bullet,
        textures: bulletTextures.getAnimeTextureSet(bulletId),
        origin: "center",
        ...config
      },
      {
        ...state
      }
    );
  }
  hit(zombie) {
    zombie.getComp(HealthComp).takeDamage(this.config.metadata.damage);
    if (!this.config.metadata.penetrating) this.dispose();
  }
  nextMove() {
    return {
      x: this.config.metadata.speed * this.game.mspf0,
      y: 0
    };
  }
  update() {
    super.update();
    this.updatePosition(this.nextMove());
    if (!this.inject(kProcess).isInsideLawn(this.state.position)) this.dispose();
  }
}
const defineBullet = (Ctor) => Ctor;
const PeaEntity = defineBullet((_c = class extends BulletEntity {
}, __publicField(_c, "id", "pea"), __publicField(_c, "damage", 20), __publicField(_c, "penetrating", false), __publicField(_c, "speed", 80 / 1e3), __publicField(_c, "animes", {
  common: { fpaf: 8, frameNum: 1 }
}), __publicField(_c, "shapeFactory", (entity) => CircleShape.create(entity, { radius: 9 })), _c));
const useTextures = (category, metadata) => {
  const textureManager = {
    getImageSrc: (id, variant = "common", idx = "01") => `./assets/${category}/${id}/${variant}/${idx}.png`,
    getImage: (id, variant = "common", idx = "01") => ({
      src: textureManager.getImageSrc(id, variant, idx)
    }),
    getImageTextureSet: (id, variant = "common", idx = "01") => ({
      [variant]: {
        type: "image",
        ...textureManager.getImage(id, variant, idx)
      }
    }),
    getAnime: (id, variant = "common") => {
      const { animes } = metadata[id];
      const { frameNum, fpaf } = animes[variant];
      const srcs = Array.from(
        { length: frameNum },
        (_, i) => `./assets/${category}/${id}/${variant}/${String(i + 1).padStart(2, "0")}.png`
      );
      return { srcs, frameNum, fpaf };
    },
    getAnimeTextureSet: (id) => {
      const { animes } = metadata[id];
      const variants = Object.keys(animes);
      const textures = {};
      variants.forEach((variant) => {
        textures[variant] = {
          type: "anime",
          ...textureManager.getAnime(id, variant)
        };
      });
      return textures;
    },
    getAllSrcs: () => Object.keys(metadata).flatMap((id) => textureManager.getAnime(id).srcs)
  };
  return textureManager;
};
const BULLETS = {
  pea: PeaEntity
};
const bulletTextures = useTextures("bullets", BULLETS);
class PlantAttackComp extends Comp {
  static create(entity, config) {
    return new this(entity, config, { cd: config.initCd ?? config.maxCd });
  }
  update() {
    this.updateTimer("cd", { interval: this.config.maxCd }, () => {
      if (this.config.canAttack.call(this.entity)) {
        this.state.cd = 0;
        this.config.attack.call(this.entity);
      }
    });
  }
}
class BulletShootingComp extends Comp {
  static create(entity) {
    return new this(entity, {}, {});
  }
  shootBullet(bullet) {
    const process = this.entity.inject(kProcess);
    const { bulletsData } = process.state;
    bullet.on("dispose", () => {
      remove(bulletsData, ({ entity }) => bullet.id === entity.id);
    }).attachTo(process);
    bulletsData.push({ id: bullet.config.metadata.id, entity: bullet });
  }
}
class ZombieSeekingComp extends Comp {
  static create(entity) {
    return new this(entity, {}, {});
  }
  seekZombies(rows, direction) {
    const { zombiesData } = this.entity.inject(kProcess).state;
    const { x } = this.entity.state.position;
    return zombiesData.filter(({ entity: { state } }) => rows.includes(state.j) && state.position.x >= x === (direction === "front")).length > 0;
  }
}
const PeaShooterEntity = definePlant((_d = class extends PlantEntity {
  constructor(config, state) {
    super(config, state);
    this.addComp(ZombieSeekingComp).addComp(BulletShootingComp).addComp(PlantAttackComp, {
      maxCd: _d.attackCd,
      canAttack() {
        return this.getComp(ZombieSeekingComp).seekZombies([this.state.j], "front");
      },
      attack() {
        const { position: { x, y }, zIndex } = this.state;
        this.getComp(BulletShootingComp).shootBullet(BulletEntity.createBullet(
          "pea",
          {},
          { position: { x: x + 60, y: y + 25 }, zIndex: zIndex + 1 }
        ));
      }
    });
  }
}, __publicField(_d, "id", "pea_shooter"), __publicField(_d, "desc", "Pea Shooter"), __publicField(_d, "cost", 100), __publicField(_d, "cd", 7500), __publicField(_d, "attackCd", 2e3), __publicField(_d, "hp", 300), __publicField(_d, "isPlantableAtStart", true), __publicField(_d, "animes", {
  common: { fpaf: 8, frameNum: 12 }
}), _d));
class LifeComp extends Comp {
  constructor() {
    super(...arguments);
    __publicField(this, "emitter", new Emitter());
  }
  static create(entity, maxLife) {
    return new this(entity, { maxLife }, { life: maxLife });
  }
  update() {
    this.state.life -= this.entity.game.mspf0;
    if (this.state.life <= 0) {
      this.entity.dispose();
      this.emitter.emit("expire");
    }
  }
}
class TransitionComp extends Comp {
  static create(entity, config) {
    return new this(entity, config, {
      frame: 0,
      totalFrame: config.defaultTotalFrame,
      direction: 1,
      play: null
    });
  }
  update() {
    const { play } = this.state;
    if (!play) return;
    this.config.transition(this.entity, this.state.frame / this.state.totalFrame);
    this.state.frame += this.state.direction;
    if (this.state.frame === this.state.totalFrame || this.state.frame === -1) {
      switch (play.mode) {
        case "once": {
          this.stop();
          break;
        }
        case "loop": {
          this.state.frame += this.state.totalFrame;
          break;
        }
        case "pingpong": {
          this.state.direction *= -1;
          this.state.frame += this.state.direction;
          if (play.returning) return this.stop();
          play.returning = true;
          break;
        }
      }
    }
  }
  stop() {
    this.state.play = null;
    this.emitter.emit("transition-finish", this.entity);
  }
  start(mode, {
    totalFrame = this.config.defaultTotalFrame,
    resetDirection = false
  } = {}) {
    this.state.totalFrame = totalFrame;
    if (resetDirection) this.state.direction = 1;
    switch (mode) {
      case "once": {
        this.state.play = { mode };
        break;
      }
      case "loop": {
        this.state.play = { mode };
        break;
      }
      case "pingpong": {
        this.state.play = { mode, returning: false };
        break;
      }
    }
  }
}
const _SunEntity = class _SunEntity extends TextureEntity {
  constructor(config, state) {
    super(config, state);
    this.addComp(HoverableComp).addComp(CursorComp, "pointer").addComp(FilterComp).on(
      "attach",
      () => this.on("click", () => this.collect()).on("mouseenter", () => {
        if (this.state.collected) return;
        this.withComp(FilterComp, ({ state: { filters } }) => {
          filters.hover = "brightness(1.2)";
        });
      }).on("mouseleave", () => {
        if (this.state.collected) return;
        this.withComp(FilterComp, ({ state: { filters } }) => {
          filters.hover = null;
        });
      }).on("before-render", () => {
        const life = this.getComp(LifeComp);
        this.game.ctx.globalAlpha = life && life.state.life < _SunEntity.sunDangerousLife ? 0.5 + 0.25 * Math.cos(2 * Math.PI * life.state.life / 1e3) : 0.75;
      })
    );
  }
  static createSun(config, state) {
    return _SunEntity.createButtonFromImage(
      "./assets/sun.png",
      {
        origin: "center",
        ...config
      },
      {
        ...state,
        collected: false
      }
    );
  }
  collect() {
    if (this.state.collected) return;
    this.state.collected = true;
    const process = this.inject(kProcess);
    process.state.sun += this.config.sun;
    process.updatePlantSlot(false);
    const sunSlotPosition = positionAdd(
      this.inject(kProcess).state.position,
      { x: 6 + 40, y: 6 + 40 }
    );
    const motion = this.game.motion.linearTo(
      { time: 500 },
      this.state.position,
      sunSlotPosition
    );
    this.removeComp(LifeComp).removeComp(MotionComp).addRawComp(MotionComp.create(this, { motion }, { frame: 0 })).withComp(
      MotionComp,
      ({ emitter }) => emitter.on("motion-finish", (entity) => {
        entity.dispose();
        process.ui.sunSlot.sunImage.withComp(TransitionComp, (transition) => {
          transition.start("pingpong", { resetDirection: true });
        });
      })
    );
  }
  settle() {
    this.addComp(LifeComp, _SunEntity.sunLife);
  }
};
__publicField(_SunEntity, "sunLife", 8e3);
__publicField(_SunEntity, "sunDangerousLife", 3e3);
let SunEntity = _SunEntity;
class UpdaterComp extends Comp {
  static create(entity, updater) {
    return new this(entity, { updater }, {});
  }
  update() {
    this.config.updater(this.entity);
  }
}
const SunflowerEntity = definePlant((_e = class extends PlantEntity {
  constructor(config, state) {
    super(config, {
      sunProduceTimer: 0,
      ...state
    });
  }
  produceSun() {
    const process = this.inject(kProcess);
    const rng = process.getComp(RngComp);
    const { x: x0, y: y0 } = this.state.position;
    const startOffsetX = rng.random(-5, 5);
    const startX = x0 + 40 + startOffsetX;
    const startY = y0 + 40 + rng.random(-5, 5);
    const signX = startOffsetX >= 0 ? 1 : -1;
    const x1 = -signX * rng.random(10, 20);
    const x2 = signX * (5 + rng.random(10, 20));
    const { motion, totalFrame } = this.game.motion.parabola(0.1, 1e-3, x1, x2);
    SunEntity.createSun(
      { sun: 25 },
      {
        position: { x: startX, y: startY },
        zIndex: process.state.zIndex + 4
      }
    ).addLazyComp((sun) => MotionComp.create(sun, { motion }, { frame: 0 })).addComp(UpdaterComp, (sun) => {
      sun.withComp(MotionComp, ({ state }) => {
        sun.state.scale = easeOutExpo(state.frame / totalFrame);
      });
    }).withComp(MotionComp, ({ emitter }) => {
      emitter.on("motion-finish", (sun) => sun.as().settle());
    }).attachTo(process);
  }
  update() {
    super.update();
    const sunProduceEta = this.updateTimer(
      "sunProduceTimer",
      { interval: _e.sunProduceInterval },
      () => this.produceSun()
    );
    this.withComp(FilterComp, ({ state: { filters } }) => {
      filters.nearProduce = sunProduceEta < 1e3 ? `brightness(${1.5 - 0.5 * sunProduceEta / 1e3})` : null;
    });
  }
}, __publicField(_e, "id", "sunflower"), __publicField(_e, "desc", "Sunflower"), __publicField(_e, "cost", 50), __publicField(_e, "cd", 7500), __publicField(_e, "hp", 300), __publicField(_e, "isPlantableAtStart", true), __publicField(_e, "animes", {
  common: { fpaf: 8, frameNum: 12 }
}), __publicField(_e, "sunProduceInterval", 15e3), _e));
const PLANTS = {
  pea_shooter: PeaShooterEntity,
  sunflower: SunflowerEntity
};
const plantTextures = useTextures("plants", PLANTS);
const SHOVELS = {
  iron_shovel: {
    name: "Iron Shovel",
    recycle: false,
    animes: {
      common: { fpaf: 8, frameNum: 1 }
    }
  }
};
const shovelTextures = useTextures("shovels", SHOVELS);
class LawnBlockEntity extends TextureEntity {
  static createLawnBlock(config, state) {
    return LawnBlockEntity.createTextureFromImage(
      `./assets/lawn/${config.variant}.png`,
      config,
      state
    ).addComp(HoverableComp);
  }
}
class LawnEntity extends (_g = Entity, _f = kDebugFold, _g) {
  constructor() {
    super(...arguments);
    __publicField(this, _f, true);
    __publicField(this, "lawnBlocks", placeholder);
  }
  build() {
    const { position: { x, y }, zIndex } = this.state;
    this.lawnBlocks = matrix(
      this.config.width,
      this.config.height,
      (i, j) => this.useBuilder(`LawnBlock_${i}_${j}`, () => LawnBlockEntity.createLawnBlock(
        {
          i,
          j,
          variant: (i + j) % 2 === 0 ? "light" : "dark"
        },
        {
          position: { x: x + i * 80, y: y + j * 80 },
          zIndex: zIndex + 1
        }
      ))
    );
    this.addComp(RectShape, {
      width: this.config.width * 80,
      height: this.config.height * 80
    });
  }
}
class ProcessLabelEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "width", 64 + 5);
    __publicField(this, "height", 20);
    this.addComp(RectShape, pick(this, ["width", "height"])).addComp(HoverableComp).addComp(CursorComp, "pointer").addComp(ButtonComp);
  }
  get processId() {
    return this.inject(kProcess).config.processId;
  }
  get color() {
    const { processId } = this;
    if (processId > 0) return "#008000";
    else if (processId < 0) return "#000000";
    else return "#696a6a";
  }
  render() {
    const { ctx } = this.game;
    const { x, y } = this.state.position;
    const { color, processId } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + this.width, y);
    ctx.lineTo(x + this.width - this.height / 2, y + this.height / 2);
    ctx.lineTo(x + this.width, y + this.height);
    ctx.lineTo(x, y + this.height);
    ctx.lineTo(x + this.height / 2, y + this.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = "20px Sans";
    ctx.fillText(processId.toString(), x + this.width / 2, y + 20 - 3);
  }
}
class SlotEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "width", 80 + 2);
    __publicField(this, "height", 80 + 20 + 2);
    this.addComp(RectShape, { width: this.width, height: this.height, origin: "top-left" }).addComp(HoverableComp);
  }
  preRender() {
    super.preRender();
    const { ctx } = this.game;
    this.addRenderJob(() => {
      ctx.strokeStyle = "brown";
      const { x, y, width, height } = this.getComp(RectShape).rect;
      ctx.strokeRect(x, y, width, height);
    }, 0);
  }
}
class PlantSlotEntity extends SlotEntity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "plantMetadata");
    const { position: { x, y }, zIndex } = this.state;
    this.plantMetadata = PLANTS[this.config.plantId];
    this.attach(TextureEntity.createTextureFromImage(
      plantTextures.getImageSrc(this.config.plantId),
      {},
      {
        position: { x: x + 1, y: y + 1 },
        zIndex: zIndex + 2
      }
    )).addComp(CursorComp, "pointer");
  }
  preRender() {
    super.preRender();
    const { plantSlotsData } = this.inject(kProcess).state;
    const slot = plantSlotsData[this.config.slotId];
    const { ctx } = this.game;
    const { position: { x, y } } = this.state;
    this.addRenderJob(() => {
      ctx.fillStyle = slot.isSunEnough ? "black" : "red";
      ctx.textAlign = "center";
      ctx.font = "20px Sans";
      const costString = String(this.plantMetadata.cost);
      ctx.fillText(costString, x + 1 + 80 / 2, y + 1 + 80 + 20 - 2);
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
class ShovelSlotEntity extends SlotEntity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "shovelMetadata");
    __publicField(this, "shovelImage");
    const { position: { x, y }, zIndex } = this.state;
    this.shovelMetadata = SHOVELS[this.config.shovelId];
    this.shovelImage = TextureEntity.createTextureFromImage(
      shovelTextures.getImageSrc(this.config.shovelId),
      {},
      {
        position: { x: x + 1, y: y + 1 },
        zIndex: zIndex + 2
      }
    );
    this.attach(this.shovelImage).addComp(CursorComp, "pointer");
  }
  preRender() {
    super.preRender();
    const { holdingObject } = this.inject(kProcess).state;
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
class SunSlotEntity extends SlotEntity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "sunImage", placeholder);
  }
  build() {
    const { position: { x, y }, zIndex } = this.state;
    this.sunImage = this.useBuilder("SunImage", () => TextureEntity.createTextureFromImage(
      "./assets/sun.png",
      {
        origin: "center"
      },
      {
        position: { x: x + 1 + 40, y: y + 1 + 40 },
        zIndex: zIndex + 1,
        scale: 1
      }
    )).addComp(TransitionComp, {
      transition: (image, t) => {
        image.state.scale = 1 + 0.3 * easeInSine(t);
      },
      defaultTotalFrame: this.game.unit.ms2f(200)
    });
  }
  render() {
    const { sun } = this.inject(kProcess).state;
    const { ctx } = this.game;
    const { position: { x, y } } = this.state;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "20px Sans";
    const sunString = String(sun);
    ctx.fillText(sunString, x + 1 + 80 / 2, y + 1 + 80 + 20 - 2);
  }
}
class UIEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "sunSlot", placeholder);
    __publicField(this, "plantSlots", placeholder);
    __publicField(this, "shovelSlot", placeholder);
    __publicField(this, "width");
    __publicField(this, "height");
    this.width = (this.config.slotNum + 2) * (80 + 2 + 5) - 5;
    this.height = 80 + 20 + 2;
    this.addComp(RectShape, { width: this.width, height: this.height, origin: "top-left" });
  }
  build() {
    const { position: { x, y }, zIndex } = this.state;
    this.sunSlot = this.useBuilder("SunSlot", () => new SunSlotEntity(
      {},
      {
        position: { x, y },
        zIndex: zIndex + 1
      }
    ));
    this.plantSlots = this.config.plantIds.map(
      (plantName, i) => this.useBuilder(`PlantSlot_${i}`, () => new PlantSlotEntity(
        {
          plantId: plantName,
          slotId: i
        },
        {
          position: { x: x + (i + 1) * (80 + 2 + 5), y },
          zIndex: zIndex + 1
        }
      )).withComp(HoverableComp, ({ emitter }) => {
        emitter.on("click", ({ stop }) => {
          stop();
          this.emit("choose-plant", i);
        });
      })
    );
    this.shovelSlot = this.useBuilder("ShovelSlot", () => new ShovelSlotEntity(
      {
        shovelId: "iron_shovel"
      },
      {
        position: { x: x + (this.config.slotNum + 1) * (80 + 2 + 5), y },
        zIndex: zIndex + 1
      }
    )).withComp(HoverableComp, (hoverable) => hoverable.emitter.on("click", ({ stop }) => {
      stop();
      this.emit("choose-shovel", this.shovelSlot.config.shovelId);
    }));
  }
}
const kProcess = injectKey("kProcess");
const getProcessId = (entity) => entity.inject(kProcess).config.processId;
const _ProcessEntity = class _ProcessEntity extends Entity {
  constructor(config, state) {
    var _a2, _b2;
    super(config, state);
    __publicField(this, "ui", placeholder);
    __publicField(this, "lawn", placeholder);
    __publicField(this, "label", placeholder);
    __publicField(this, "phantomImage", null);
    __publicField(this, "holdingImage", null);
    (_a2 = this.state).plantSlotsData ?? (_a2.plantSlotsData = config.plantSlots.plantIds.map((plantId) => {
      const Plant = PLANTS[plantId];
      return {
        id: plantId,
        cd: 0,
        isSunEnough: Plant.cost <= this.state.sun,
        isCooledDown: true,
        isPlantable: Plant.isPlantableAtStart
      };
    }));
    (_b2 = this.state).plantsOnBlocks ?? (_b2.plantsOnBlocks = matrix(config.lawn.width, config.lawn.height, () => null));
    this.addComp(RectShape, pick(_ProcessEntity, ["width", "height"]));
    this.addComp(RngComp, random(2 ** 32));
    this.provide(kProcess, this);
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
      if (!this.active) return;
      if (this.state.holdingObject === null) return;
      const { holdingObject } = this.state;
      if (target instanceof LawnBlockEntity) {
        if ((holdingObject == null ? void 0 : holdingObject.type) === "plant") {
          const { i, j } = target.config;
          this.plant(holdingObject.slotId, i, j);
        }
      } else if (target instanceof PlantEntity) {
        if ((holdingObject == null ? void 0 : holdingObject.type) === "shovel") {
          this.kill(target.state.i, target.state.j);
          this.cancelHolding();
        }
      } else this.cancelHolding();
    });
    this.game.emitter.on("rightclick", () => {
      if (this.state.holdingObject !== null) this.cancelHolding();
    });
  }
  static createProcess(config, state) {
    return new this(config, {
      sun: config.sun.sunAtStart,
      sunDropTimer: config.sun.sunDroppingInterval - config.sun.firstSunDroppingTime,
      plantSlotsData: placeholder,
      holdingObject: null,
      plantsData: [],
      plantsOnBlocks: placeholder,
      sunsData: [],
      zombiesData: [],
      bulletsData: [],
      waveTimer: 3e4,
      wave: 0,
      waveZombieInitHp: 0,
      waveZombieList: [],
      zombieSpawnTimer: 0,
      paused: false,
      finished: false,
      ...state
    });
  }
  getPlantIdBySlotId(slotId) {
    return this.config.plantSlots.plantIds[slotId];
  }
  build() {
    this.ui = this.useBuilder("UI", () => new UIEntity(
      this.config.plantSlots,
      {
        position: { x: 5, y: 5 },
        zIndex: 1
      }
    )).on("choose-plant", (slotId) => {
      var _a2;
      const slot = this.state.plantSlotsData[slotId];
      if (!slot.isPlantable) return;
      const plantId = this.getPlantIdBySlotId(slotId);
      this.state.holdingObject = { type: "plant", slotId };
      (_a2 = this.holdingImage) == null ? void 0 : _a2.dispose();
      this.holdingImage = TextureEntity.createTextureFromImage(
        plantTextures.getImageSrc(plantId),
        {},
        {
          position: { x: 5, y: 5 },
          zIndex: this.lawn.state.zIndex + 3
        }
      ).attachTo(this);
      this.phantomImage = TextureEntity.createTextureFromImage(
        plantTextures.getImageSrc(plantId),
        {},
        {
          position: { x: 0, y: 0 },
          zIndex: this.state.zIndex + 3
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
      this.holdingImage = TextureEntity.createTextureFromImage(
        shovelTextures.getImageSrc(shovelId),
        {},
        {
          position: { x: 5, y: 5 },
          zIndex: this.state.zIndex + 4
        }
      ).attachTo(this);
    });
    this.lawn = this.useBuilder("Lawn", () => new LawnEntity(
      this.config.lawn,
      {
        position: { x: 5, y: 150 },
        zIndex: this.state.zIndex + 1
      }
    ));
    this.label = this.useBuilder("ProcessLabel", () => new ProcessLabelEntity(
      {},
      {
        position: { x: _ProcessEntity.width - 64 - 5, y: 5 + 32 + 5 },
        zIndex: this.state.zIndex + 11
      }
    )).on("click", () => this.emit("switch-process", this.config.processId));
  }
  plant(slotId, i, j) {
    const slot = this.state.plantSlotsData[slotId];
    if (!slot.isPlantable || this.isOccupied(i, j)) return;
    const plantId = this.getPlantIdBySlotId(slotId);
    const Plant = PLANTS[plantId];
    const cost = Plant.cost;
    slot.cd = 0;
    slot.isCooledDown = false;
    this.state.sun -= cost;
    this.updatePlantSlot(false);
    const newPlant = PlantEntity.createPlant(
      plantId,
      {},
      {
        i,
        j,
        position: this.getLawnBlockPosition(i, j),
        zIndex: this.state.zIndex + 3
      }
    ).attachTo(this);
    const newPlantData = {
      id: plantId,
      position: { i, j },
      entity: newPlant
    };
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
    return { ...this.lawn.lawnBlocks[i][j].state.position };
  }
  cancelHolding() {
    var _a2, _b2, _c2, _d2;
    if (((_a2 = this.state.holdingObject) == null ? void 0 : _a2.type) === "shovel") {
      (_b2 = this.ui.shovelSlot.shovelImage) == null ? void 0 : _b2.activate();
    }
    this.state.holdingObject = null;
    (_c2 = this.holdingImage) == null ? void 0 : _c2.dispose();
    this.holdingImage = null;
    (_d2 = this.phantomImage) == null ? void 0 : _d2.dispose();
    this.phantomImage = null;
  }
  dropSun() {
    const { x: x0, y: y0 } = this.lawn.state.position;
    const rng = this.getComp(RngComp);
    const x = x0 + rng.random((this.config.lawn.width - 1) * 80);
    const y = y0 + rng.random(1 * 80);
    const deltaY = rng.random(1 * 80, (this.config.lawn.height - 2) * 80);
    SunEntity.createSun(
      {
        sun: 25
      },
      {
        position: { x, y },
        zIndex: this.state.zIndex + 4
      }
    ).addLazyComp((sun) => MotionComp.create(
      sun,
      {
        motion: this.game.motion.linearTo(
          { speed: this.config.sun.sunDroppingSpeed },
          { x, y },
          { x, y: y + deltaY }
        )
      },
      { frame: 0 }
    )).withComp(
      MotionComp,
      ({ emitter }) => emitter.on("motion-finish", (entity) => entity.as().settle())
    ).attachTo(this);
  }
  get currentZombiesHP() {
    return sum(this.state.zombiesData.map((data) => data.entity.config.metadata.hp));
  }
  get wavesData() {
    return this.config.stage.wavesData;
  }
  getZombieSpawningRow(zombieId) {
    return this.getComp(RngComp).random(this.lawn.config.height);
  }
  spawnZombieGroup() {
    const groupSize = 1;
    const group = this.state.waveZombieList.splice(0, groupSize);
    group.forEach((zombieId) => this.spawnZombie(zombieId));
    if (!this.state.waveZombieList.length) this.state.zombieSpawnTimer = 0;
  }
  spawnZombie(zombieId) {
    const row = this.getZombieSpawningRow(zombieId);
    const { x, y } = this.getLawnBlockPosition(this.lawn.config.width - 1, row);
    const zombie = ZombieEntity.createZombie(
      zombieId,
      {},
      {
        j: row,
        position: { x: x + 80, y: y - 40 },
        zIndex: this.lawn.state.zIndex + 2 + row * 0.1,
        speedRatio: this.getComp(RngComp).random(95, 105) / 100
      }
    ).attachTo(this).on("dispose", () => {
      remove(this.state.zombiesData, ({ entity }) => entity.id === zombie.id);
    });
    this.state.zombiesData.push({
      id: zombieId,
      entity: zombie
    });
  }
  nextWave() {
    if (this.state.wave === this.wavesData.waveCount) return;
    const currentWave = this.wavesData.waves[this.state.wave++];
    const zombieList = replicateBy(currentWave.zombieCount, () => {
      const probs = currentWave.zombieProbs;
      const total = sum(Object.values(probs));
      const rand = this.getComp(RngComp).random(total);
      let acc = 0;
      for (const [zombieId, prob] of Object.entries(probs)) {
        acc += prob;
        if (rand < acc) return zombieId;
      }
      return zombieList[0];
    });
    this.state.waveZombieList = zombieList;
    if (this.wavesData.bigWaveIndex.includes(this.state.wave)) {
      this.bigWave();
      this.state.zombieSpawnTimer = -5e3;
    } else {
      this.state.zombieSpawnTimer = 0;
    }
  }
  bigWave() {
    console.log("big wave");
  }
  updatePlantSlot(runCoolDown = true) {
    this.state.plantSlotsData.forEach((slot) => {
      let { cd, isCooledDown } = slot;
      const Plant = PLANTS[slot.id];
      if (runCoolDown && !isCooledDown) {
        const { cd: maxCd } = Plant;
        cd += this.game.mspf0;
        if (cd > maxCd) {
          cd = maxCd;
          slot.isCooledDown = true;
        }
        slot.cd = cd;
      }
      slot.isSunEnough = this.state.sun >= Plant.cost;
      slot.isPlantable = slot.isCooledDown && slot.isSunEnough;
    });
  }
  win() {
    alert("win");
  }
  lose() {
    alert("lose");
  }
  updateWhenPaused() {
    if (this.holdingImage) {
      const { x, y } = this.game.mouse.position;
      this.holdingImage.updatePositionTo({ x: x - 40, y: y - 40 });
    }
  }
  update() {
    this.updateWhenPaused();
    if (this.state.paused) return;
    if (!this.state.finished) {
      if (this.config.stage.hasWon(this)) {
        this.state.finished = true;
        this.win();
      } else if (this.config.stage.hasLost(this)) {
        this.state.finished = true;
        this.lose();
      }
    }
    this.updatePlantSlot();
    this.updateTimer("waveTimer", { interval: 25e3 }, () => {
      this.nextWave();
    });
    if (this.state.waveZombieList.length) {
      this.updateTimer("zombieSpawnTimer", { interval: 1e3 }, () => {
        this.spawnZombieGroup();
      });
    }
    this.updateTimer(
      "sunDropTimer",
      { interval: this.config.sun.sunDroppingInterval },
      () => this.dropSun()
    );
    return this.state;
  }
  isInsideLawn(position) {
    return this.getComp(RectShape).contains(position);
  }
  postUpdate() {
    if (this.state.paused) return;
    super.postUpdate();
  }
  preRender() {
    if (this.state.paused) this.addRenderJob(() => {
      const { ctx } = this.game;
      const { x, y } = this.state.position;
      ctx.fillStyle = "rgba(0, 32, 255, .3)";
      ctx.fillRect(x, y, _ProcessEntity.width, _ProcessEntity.height);
    }, 10);
    super.preRender();
  }
};
__publicField(_ProcessEntity, "width", 770);
__publicField(_ProcessEntity, "height", 550);
let ProcessEntity = _ProcessEntity;
const _CollidableComp = class _CollidableComp extends Comp {
  constructor(entity, config) {
    super(entity, config, {});
    __publicField(this, "shape", placeholder);
    this.emitter.on("attach", () => {
      this.shape = entity.getComp(ShapeComp.withTag(elem("hitbox", "texture")));
      _CollidableComp.collidableComps.push(this);
      entity.on("dispose", () => {
        remove(_CollidableComp.collidableComps, eq(this));
      });
    });
  }
  static create(entity, config) {
    return new this(entity, config, {});
  }
  update() {
    for (const otherComp of _CollidableComp.collidableComps) {
      if (!this.shouldCollideWith(otherComp)) continue;
      if (this.shape.intersects(otherComp.shape)) {
        this.emitter.emit("collide", otherComp.entity);
        otherComp.emitter.emit("collide", this.entity);
      }
    }
  }
  shouldCollideWith(target) {
    if (target === this) return false;
    if (!this.config.crossProcess && getProcessId(target.entity) !== getProcessId(this.entity)) return false;
    const taregtGroups = target.config.groups;
    const _filter = (filter) => {
      switch (filter.ty) {
        case "and":
          return filter.filters.every(_filter);
        case "or":
          return filter.filters.some(_filter);
        case "not":
          return !_filter(filter.filter);
        case "has":
          return taregtGroups.includes(filter.group);
        case "has-some":
          return filter.groups.some((group) => taregtGroups.includes(group));
        case "has-all":
          return filter.groups.every((group) => taregtGroups.includes(group));
      }
    };
    return _filter(this.config.target);
  }
};
__publicField(_CollidableComp, "dependencies", [ShapeComp.withTag(elem("hitbox", "texture"))]);
__publicField(_CollidableComp, "collidableComps", []);
let CollidableComp = _CollidableComp;
Object.assign(window, { CollidableComp });
class HpBarEntity extends Entity {
  render() {
    var _a2;
    (_a2 = this.superEntity) == null ? void 0 : _a2.withComps(
      [HealthComp, RectShape.withTag(eq("texture"))],
      (health, rectShape) => {
        const { ctx } = this.game;
        const { rect } = rectShape;
        const w = 80;
        const h = 5;
        const x = rect.x + rect.width / 2 - w / 2;
        const y = rect.y - 10;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(x, y, w * health.state.hp / health.config.maxHp, h);
      }
    );
  }
}
class ZombieEntity extends TextureEntity {
  constructor(config, state) {
    super(config, state);
    const { shapeFactory } = this.config.metadata;
    if (shapeFactory) this.addRawComp(shapeFactory(this).setTag("hitbox"));
    this.addComp(FilterComp).addComp(HealthComp, this.config.metadata.hp).addComp(DamageEffectComp).addComp(ContinuousDamagingComp, 1).addComp(CollidableComp, {
      groups: ["zombie"],
      target: { ty: "has-some", groups: ["plant", "bullet"] }
    }).withComp(CollidableComp, (collidable) => {
      collidable.emitter.on("collide", (target) => {
        if (!PlantEntity.isPlant(target)) return;
        if (!this.state.eatingPlant) {
          this.withComp(ContinuousDamagingComp, ({ state: { targets } }) => {
            targets.add(target);
            this.state.eatingPlant = target;
            target.on("dispose", () => {
              targets.delete(target);
              this.state.eatingPlant = null;
            });
          });
        }
      });
    });
    if (this.game.config.isDebug)
      this.useBuilder("HpBar", () => new HpBarEntity(
        {},
        { position: { ...this.state.position }, zIndex: this.state.zIndex }
      ));
  }
  static createZombie(zombieId, config, state) {
    const Zombie = ZOMBIES[zombieId];
    return Zombie.createTexture(
      {
        textures: zombieTextures.getAnimeTextureSet(zombieId),
        metadata: Zombie,
        ...config
      },
      {
        movingState: "moving",
        place: "front",
        damageFilterTimer: 0,
        eatingPlant: null,
        enteredHouse: false,
        ...state
      }
    );
  }
  nextMove() {
    const x = this.state.eatingPlant ? 0 : -this.config.metadata.speed * this.state.speedRatio * this.game.mspf0;
    return { x, y: 0 };
  }
  update() {
    super.update();
    if (!this.state.enteredHouse && this.state.position.x < 0) {
      this.state.enteredHouse = true;
    }
    if (this.state.position.x > -this.getComp(RectShape).rect.width) {
      this.updatePosition(this.nextMove());
    }
  }
}
const defineZombie = (Ctor) => Ctor;
const NormalZombieEntity = defineZombie((_h = class extends ZombieEntity {
}, __publicField(_h, "id", "normal_zombie"), __publicField(_h, "desc", "Normal Zombie"), __publicField(_h, "hp", 100), __publicField(_h, "atk", 10), __publicField(_h, "speed", 10 / 1e3), __publicField(_h, "damage", 10), __publicField(_h, "animes", {
  common: { fpaf: 8, frameNum: 1 }
}), _h));
const ZOMBIES = {
  normal_zombie: NormalZombieEntity
};
const zombieTextures = useTextures("zombies", ZOMBIES);
class LoadingEntity extends Entity {
  constructor(config, state) {
    super(config, state);
    __publicField(this, "taskCount", placeholder);
    __publicField(this, "fulfilledTaskCount", 0);
    const tasks = [
      ...Object.values(this.game.imageManager.loadingImgs),
      ...Object.values(this.game.audioManager.loadingAudios)
    ];
    this.taskCount = tasks.length;
    tasks.forEach((task) => task.then(() => {
      if (++this.fulfilledTaskCount === this.taskCount) {
        setTimeout(() => {
          this.emit("load").dispose();
        }, 500);
      }
    }));
  }
  render() {
    const { ctx } = this.game;
    const { width, height } = ctx.canvas;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "36px serif";
    ctx.fillText("5D PvZ Loading...", width / 2, height * 0.4);
    ctx.font = "28px serif";
    ctx.fillText(`${this.fulfilledTaskCount} / ${this.taskCount}`, width / 2, height * 0.6);
  }
}
const hasWonByWave = ({ state, config }) => state.zombiesData.length === 0 && state.wave === config.stage.wavesData.waveCount;
const hasLostByZombie = ({ state }) => state.zombiesData.some((zombie) => zombie.entity.state.enteredHouse);
const Stage1_1 = {
  id: "1-1",
  chapter: 1,
  track: 1,
  bgm: "day",
  wavesData: {
    zombieType: ["normal_zombie"],
    waveCount: 3,
    bigWaveIndex: [3],
    waves: [
      {
        zombieCount: 1,
        zombieProbs: {
          normal_zombie: 1
        }
      },
      {
        zombieCount: 2,
        zombieProbs: {
          normal_zombie: 1
        }
      },
      {
        zombieCount: 3,
        zombieProbs: {
          normal_zombie: 1
        }
      }
    ]
  },
  hasWon: hasWonByWave,
  hasLost: hasLostByZombie
};
class PlayScene extends Scene {
  constructor() {
    const getProcessById = (processId) => processes.find((process) => process.config.processId === processId);
    const switchProcess = (currentProcessId) => {
      const nextProcess = getProcessById(currentProcessId + 1) ?? (currentProcessId === 0 ? void 0 : process0);
      if (!nextProcess) return;
      getProcessById(currentProcessId).deactivate();
      currentProcess = nextProcess.activate();
    };
    const process0 = ProcessEntity.createProcess(
      {
        processId: 0,
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
          sunDroppingSpeed: 30 / 1e3,
          sunLife: 8e3,
          sunAtStart: 200
        },
        shovelSlot: {
          shovelId: "iron_shovel"
        },
        stage: Stage1_1
      },
      {
        position: { x: 0, y: 0 },
        zIndex: 0
      }
    ).on("switch-process", switchProcess);
    super(process0);
    __publicField(this, "bgmPlayBack", placeholder);
    const processes = [process0];
    let currentProcess = process0;
    if (!this.game.config.noAudio) this.afterStart(() => {
      this.bgmPlayBack = this.game.audioManager.playAudio(`./assets/audio/${Stage1_1.bgm}.mp3`);
    });
    const pause = () => {
      var _a2;
      processes.forEach((process) => process.state.paused = true);
      (_a2 = this.bgmPlayBack) == null ? void 0 : _a2.toggleEffect();
      pauseButton.deactivate();
      resumeButton.activate();
    };
    const resume = () => {
      var _a2;
      processes.forEach((process) => process.state.paused = false);
      (_a2 = this.bgmPlayBack) == null ? void 0 : _a2.toggleEffect();
      resumeButton.deactivate();
      pauseButton.activate();
    };
    this.game.emitter.on("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (currentProcess.state.paused) resume();
        else pause();
      }
    });
    const pauseButton = TextureEntity.createButtonFromImage(
      "./assets/ui/pause_button.png",
      {},
      {
        position: { x: ProcessEntity.width - 32, y: 5 },
        zIndex: this.state.zIndex + 11
      }
    ).addComp(CursorComp, "pointer").attachTo(this).on("click", pause);
    const resumeButton = TextureEntity.createButtonFromImage(
      "./assets/ui/resume_button.png",
      {},
      {
        position: { x: ProcessEntity.width - 32, y: 5 },
        zIndex: this.state.zIndex + 11
      }
    ).addComp(CursorComp, "pointer").deactivate().attachTo(this).on("click", resume);
    TextureEntity.createButtonFromImage(
      "./assets/ui/fork_button.png",
      {},
      {
        position: { x: ProcessEntity.width - 64 - 5, y: 5 },
        zIndex: this.state.zIndex + 11
      }
    ).addComp(CursorComp, "pointer").attachTo(this).on("click", () => {
      const processIds = processes.map((process) => process.config.processId).filter((id) => id >= 0);
      const newProcessId = Math.max(...processIds) + 1;
      currentProcess.deactivate();
      currentProcess = currentProcess.cloneEntity().on("switch-process", switchProcess);
      currentProcess.config.processId = newProcessId;
      processes.push(currentProcess.attachTo(this));
    });
  }
  async start() {
    await super.start();
    if (!this.game.config.noAudio)
      await this.game.audioManager.loadAudio(`./assets/audio/${Stage1_1.bgm}.mp3`);
  }
}
class StartScene extends Scene {
  constructor() {
    const background = TextureEntity.createTextureFromImage(
      "./assets/start.png",
      {},
      { position: { x: 0, y: 0 }, zIndex: 0 }
    );
    const startButton = TextureEntity.createButtonFromImage(
      "./assets/start_button_start.png",
      {
        strictShape: true
      },
      {
        position: { x: 450, y: 140 },
        zIndex: 1
      }
    ).addComp(CursorComp, "pointer").on("before-render", () => {
      this.game.ctx.filter = startButton.state.hovering ? "brightness(1.2)" : "";
    }).on("click", () => {
      this.deactivate();
      this.game.addScene(new PlayScene());
    });
    const githubButton = TextureEntity.createButtonFromImage(
      "./assets/github.png",
      {
        strictShape: true
      },
      {
        position: { x: 10, y: 10 },
        zIndex: 1
      }
    ).addComp(CursorComp, "pointer").on("click", () => {
      window.open("https://github.com/ForkKILLET/5dpvz", "_blank");
    });
    super(
      background,
      startButton,
      githubButton
    );
  }
}
class LoadingScene extends Scene {
  constructor() {
    const loading = new LoadingEntity(
      {},
      { position: { x: 0, y: 0 }, zIndex: 5 }
    );
    super(loading);
    loading.on("load", () => {
      this.game.addScene(new StartScene());
    });
  }
}
void async function() {
  const $about = document.querySelector("#about");
  const buildTime = "2024-11-29 05:49:10";
  const buildEnv = "Linux fv-az1198-211 6.5.0-1025-azure x86_64";
  const [commitHash, commitMsg] = ("25777e2 fix(entities/sun): a sun could be collected multiple times" == null ? void 0 : "25777e2 fix(entities/sun): a sun could be collected multiple times".split(new RegExp("(?<! .*) "))) ?? [];
  const repoUrl = "https://github.com/ForkKILLET/5dPvZ";
  $about.innerHTML = `
        <b>5DPvZ</b> built at <b>${buildTime}</b> on <b>${buildEnv}</b>
        by <a href="https://github.com/ForkKILLET/" target="_blank">ForkKILLET</a>
        &amp; <a href="https://github.com/Luna5akura" target="_blank">Luna5akura</a> with &lt;3 <br />
        ${commitHash ? `<a href="${repoUrl}/commit/${commitHash}" target="_blank">${commitHash}</a>: ${commitMsg}` : ""}
    `;
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const searchParams = new URLSearchParams(location.search);
  const isDebug = searchParams.has("debug");
  const noAudio = searchParams.has("noaudio");
  const game = new Game({
    ctx,
    fps: 60,
    isDefault: true,
    isDebug,
    noAudio
  });
  const preloadImgSrcs = [
    "./assets/start.png",
    "./assets/start_button_start.png",
    "./assets/github.png",
    "./assets/ui/pause_button.png",
    "./assets/ui/resume_button.png",
    "./assets/ui/fork_button.png",
    "./assets/sun.png",
    "./assets/lawn/light.png",
    "./assets/lawn/dark.png",
    ...zombieTextures.getAllSrcs(),
    ...plantTextures.getAllSrcs(),
    ...bulletTextures.getAllSrcs(),
    ...shovelTextures.getAllSrcs()
  ];
  const preloadAudioSrcs = noAudio ? [] : [
    "./assets/audio/day.mp3"
  ];
  preloadImgSrcs.forEach(game.imageManager.loadImage);
  preloadAudioSrcs.forEach(game.audioManager.loadAudio);
  game.addScene(new LoadingScene());
  game.start();
  Object.assign(window, { game });
}();
