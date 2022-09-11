function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function is_promise(value) {
    return value && typeof value === 'object' && typeof value.then === 'function';
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
    if (!src_url_equal_anchor) {
        src_url_equal_anchor = document.createElement('a');
    }
    src_url_equal_anchor.href = url;
    return element_src === src_url_equal_anchor.href;
}
function not_equal(a, b) {
    return a != a ? b == b : a !== b;
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn);
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props)
        if (!keys.has(k) && k[0] !== '$')
            rest[k] = props[k];
    return rest;
}
function compute_slots(slots) {
    const result = {};
    for (const key in slots) {
        result[key] = true;
    }
    return result;
}
function once(fn) {
    let ran = false;
    return function (...args) {
        if (ran)
            return;
        ran = true;
        fn.call(this, ...args);
    };
}
function null_to_empty(value) {
    return value == null ? '' : value;
}
function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
}
const has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;
// used internally for testing
function set_now(fn) {
    now = fn;
}
function set_raf(fn) {
    raf = fn;
}

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * For testing purposes only!
 */
function clear_loops() {
    tasks.clear();
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

// Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
// at the end of hydration without touching the remaining nodes.
let is_hydrating = false;
function start_hydrating() {
    is_hydrating = true;
}
function end_hydrating() {
    is_hydrating = false;
}
function upper_bound(low, high, key, value) {
    // Return first index of value larger than input value in the range [low, high)
    while (low < high) {
        const mid = low + ((high - low) >> 1);
        if (key(mid) <= value) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return low;
}
function init_hydrate(target) {
    if (target.hydrate_init)
        return;
    target.hydrate_init = true;
    // We know that all children have claim_order values since the unclaimed have been detached if target is not <head>
    let children = target.childNodes;
    // If target is <head>, there may be children without claim_order
    if (target.nodeName === 'HEAD') {
        const myChildren = [];
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            if (node.claim_order !== undefined) {
                myChildren.push(node);
            }
        }
        children = myChildren;
    }
    /*
    * Reorder claimed children optimally.
    * We can reorder claimed children optimally by finding the longest subsequence of
    * nodes that are already claimed in order and only moving the rest. The longest
    * subsequence subsequence of nodes that are claimed in order can be found by
    * computing the longest increasing subsequence of .claim_order values.
    *
    * This algorithm is optimal in generating the least amount of reorder operations
    * possible.
    *
    * Proof:
    * We know that, given a set of reordering operations, the nodes that do not move
    * always form an increasing subsequence, since they do not move among each other
    * meaning that they must be already ordered among each other. Thus, the maximal
    * set of nodes that do not move form a longest increasing subsequence.
    */
    // Compute longest increasing subsequence
    // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
    const m = new Int32Array(children.length + 1);
    // Predecessor indices + 1
    const p = new Int32Array(children.length);
    m[0] = -1;
    let longest = 0;
    for (let i = 0; i < children.length; i++) {
        const current = children[i].claim_order;
        // Find the largest subsequence length such that it ends in a value less than our current value
        // upper_bound returns first greater value, so we subtract one
        // with fast path for when we are on the current longest subsequence
        const seqLen = ((longest > 0 && children[m[longest]].claim_order <= current) ? longest + 1 : upper_bound(1, longest, idx => children[m[idx]].claim_order, current)) - 1;
        p[i] = m[seqLen] + 1;
        const newLen = seqLen + 1;
        // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
        m[newLen] = i;
        longest = Math.max(newLen, longest);
    }
    // The longest increasing subsequence of nodes (initially reversed)
    const lis = [];
    // The rest of the nodes, nodes that will be moved
    const toMove = [];
    let last = children.length - 1;
    for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
        lis.push(children[cur - 1]);
        for (; last >= cur; last--) {
            toMove.push(children[last]);
        }
        last--;
    }
    for (; last >= 0; last--) {
        toMove.push(children[last]);
    }
    lis.reverse();
    // We sort the nodes being moved to guarantee that their insertion order matches the claim order
    toMove.sort((a, b) => a.claim_order - b.claim_order);
    // Finally, we move the nodes
    for (let i = 0, j = 0; i < toMove.length; i++) {
        while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
            j++;
        }
        const anchor = j < lis.length ? lis[j] : null;
        target.insertBefore(toMove[i], anchor);
    }
}
function append(target, node) {
    target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
    const append_styles_to = get_root_for_style(target);
    if (!append_styles_to.getElementById(style_sheet_id)) {
        const style = element('style');
        style.id = style_sheet_id;
        style.textContent = styles;
        append_stylesheet(append_styles_to, style);
    }
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
        return root;
    }
    return node.ownerDocument;
}
function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
}
function append_hydration(target, node) {
    if (is_hydrating) {
        init_hydrate(target);
        if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
            target.actual_end_child = target.firstChild;
        }
        // Skip nodes of undefined ordering
        while ((target.actual_end_child !== null) && (target.actual_end_child.claim_order === undefined)) {
            target.actual_end_child = target.actual_end_child.nextSibling;
        }
        if (node !== target.actual_end_child) {
            // We only insert if the ordering of this node should be modified or the parent node is not target
            if (node.claim_order !== undefined || node.parentNode !== target) {
                target.insertBefore(node, target.actual_end_child);
            }
        }
        else {
            target.actual_end_child = node.nextSibling;
        }
    }
    else if (node.parentNode !== target || node.nextSibling !== null) {
        target.appendChild(node);
    }
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function insert_hydration(target, node, anchor) {
    if (is_hydrating && !anchor) {
        append_hydration(target, node);
    }
    else if (node.parentNode !== target || node.nextSibling != anchor) {
        target.insertBefore(node, anchor || null);
    }
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function element_is(name, is) {
    return document.createElement(name, { is });
}
function object_without_properties(obj, exclude) {
    const target = {};
    for (const k in obj) {
        if (has_prop(obj, k)
            // @ts-ignore
            && exclude.indexOf(k) === -1) {
            // @ts-ignore
            target[k] = obj[k];
        }
    }
    return target;
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function self$1(fn) {
    return function (event) {
        // @ts-ignore
        if (event.target === this)
            fn.call(this, event);
    };
}
function trusted(fn) {
    return function (event) {
        // @ts-ignore
        if (event.isTrusted)
            fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key === '__value') {
            node.value = node[key] = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
        attr(node, key, attributes[key]);
    }
}
function set_custom_element_data(node, prop, value) {
    if (prop in node) {
        node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
    }
    else {
        attr(node, prop, value);
    }
}
function xlink_attr(node, attribute, value) {
    node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
}
function get_binding_group_value(group, __value, checked) {
    const value = new Set();
    for (let i = 0; i < group.length; i += 1) {
        if (group[i].checked)
            value.add(group[i].__value);
    }
    if (!checked) {
        value.delete(__value);
    }
    return Array.from(value);
}
function to_number(value) {
    return value === '' ? null : +value;
}
function time_ranges_to_array(ranges) {
    const array = [];
    for (let i = 0; i < ranges.length; i += 1) {
        array.push({ start: ranges.start(i), end: ranges.end(i) });
    }
    return array;
}
function children(element) {
    return Array.from(element.childNodes);
}
function init_claim_info(nodes) {
    if (nodes.claim_info === undefined) {
        nodes.claim_info = { last_index: 0, total_claimed: 0 };
    }
}
function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
    // Try to find nodes in an order such that we lengthen the longest increasing subsequence
    init_claim_info(nodes);
    const resultNode = (() => {
        // We first try to find an element after the previous one
        for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
            const node = nodes[i];
            if (predicate(node)) {
                const replacement = processNode(node);
                if (replacement === undefined) {
                    nodes.splice(i, 1);
                }
                else {
                    nodes[i] = replacement;
                }
                if (!dontUpdateLastIndex) {
                    nodes.claim_info.last_index = i;
                }
                return node;
            }
        }
        // Otherwise, we try to find one before
        // We iterate in reverse so that we don't go too far back
        for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
            const node = nodes[i];
            if (predicate(node)) {
                const replacement = processNode(node);
                if (replacement === undefined) {
                    nodes.splice(i, 1);
                }
                else {
                    nodes[i] = replacement;
                }
                if (!dontUpdateLastIndex) {
                    nodes.claim_info.last_index = i;
                }
                else if (replacement === undefined) {
                    // Since we spliced before the last_index, we decrease it
                    nodes.claim_info.last_index--;
                }
                return node;
            }
        }
        // If we can't find any matching node, we create a new one
        return createNode();
    })();
    resultNode.claim_order = nodes.claim_info.total_claimed;
    nodes.claim_info.total_claimed += 1;
    return resultNode;
}
function claim_element_base(nodes, name, attributes, create_element) {
    return claim_node(nodes, (node) => node.nodeName === name, (node) => {
        const remove = [];
        for (let j = 0; j < node.attributes.length; j++) {
            const attribute = node.attributes[j];
            if (!attributes[attribute.name]) {
                remove.push(attribute.name);
            }
        }
        remove.forEach(v => node.removeAttribute(v));
        return undefined;
    }, () => create_element(name));
}
function claim_element(nodes, name, attributes) {
    return claim_element_base(nodes, name, attributes, element);
}
function claim_svg_element(nodes, name, attributes) {
    return claim_element_base(nodes, name, attributes, svg_element);
}
function claim_text(nodes, data) {
    return claim_node(nodes, (node) => node.nodeType === 3, (node) => {
        const dataStr = '' + data;
        if (node.data.startsWith(dataStr)) {
            if (node.data.length !== dataStr.length) {
                return node.splitText(dataStr.length);
            }
        }
        else {
            node.data = dataStr;
        }
    }, () => text(data), true // Text nodes should not update last index since it is likely not worth it to eliminate an increasing subsequence of actual elements
    );
}
function claim_space(nodes) {
    return claim_text(nodes, ' ');
}
function find_comment(nodes, text, start) {
    for (let i = start; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeType === 8 /* comment node */ && node.textContent.trim() === text) {
            return i;
        }
    }
    return nodes.length;
}
function claim_html_tag(nodes) {
    // find html opening tag
    const start_index = find_comment(nodes, 'HTML_TAG_START', 0);
    const end_index = find_comment(nodes, 'HTML_TAG_END', start_index);
    if (start_index === end_index) {
        return new HtmlTagHydration();
    }
    init_claim_info(nodes);
    const html_tag_nodes = nodes.splice(start_index, end_index + 1);
    detach(html_tag_nodes[0]);
    detach(html_tag_nodes[html_tag_nodes.length - 1]);
    const claimed_nodes = html_tag_nodes.slice(1, html_tag_nodes.length - 1);
    for (const n of claimed_nodes) {
        n.claim_order = nodes.claim_info.total_claimed;
        nodes.claim_info.total_claimed += 1;
    }
    return new HtmlTagHydration(claimed_nodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function set_input_type(input, type) {
    try {
        input.type = type;
    }
    catch (e) {
        // do nothing
    }
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
    select.selectedIndex = -1; // no option should be selected
}
function select_options(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        option.selected = ~value.indexOf(option.__value);
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function select_multiple_value(select) {
    return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
}
// unfortunately this can't be a constant as that wouldn't be tree-shakeable
// so we cache the result instead
let crossorigin;
function is_crossorigin() {
    if (crossorigin === undefined) {
        crossorigin = false;
        try {
            if (typeof window !== 'undefined' && window.parent) {
                void window.parent.document;
            }
        }
        catch (error) {
            crossorigin = true;
        }
    }
    return crossorigin;
}
function add_resize_listener(node, fn) {
    const computed_style = getComputedStyle(node);
    if (computed_style.position === 'static') {
        node.style.position = 'relative';
    }
    const iframe = element('iframe');
    iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
        'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    const crossorigin = is_crossorigin();
    let unsubscribe;
    if (crossorigin) {
        iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
        unsubscribe = listen(window, 'message', (event) => {
            if (event.source === iframe.contentWindow)
                fn();
        });
    }
    else {
        iframe.src = 'about:blank';
        iframe.onload = () => {
            unsubscribe = listen(iframe.contentWindow, 'resize', fn);
        };
    }
    append(node, iframe);
    return () => {
        if (crossorigin) {
            unsubscribe();
        }
        else if (unsubscribe && iframe.contentWindow) {
            unsubscribe();
        }
        detach(iframe);
    };
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail, bubbles = false) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, false, detail);
    return e;
}
function query_selector_all(selector, parent = document.body) {
    return Array.from(parent.querySelectorAll(selector));
}
class HtmlTag {
    constructor() {
        this.e = this.n = null;
    }
    c(html) {
        this.h(html);
    }
    m(html, target, anchor = null) {
        if (!this.e) {
            this.e = element(target.nodeName);
            this.t = target;
            this.c(html);
        }
        this.i(anchor);
    }
    h(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.childNodes);
    }
    i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert(this.t, this.n[i], anchor);
        }
    }
    p(html) {
        this.d();
        this.h(html);
        this.i(this.a);
    }
    d() {
        this.n.forEach(detach);
    }
}
class HtmlTagHydration extends HtmlTag {
    constructor(claimed_nodes) {
        super();
        this.e = this.n = null;
        this.l = claimed_nodes;
    }
    c(html) {
        if (this.l) {
            this.n = this.l;
        }
        else {
            super.c(html);
        }
    }
    i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert_hydration(this.t, this.n[i], anchor);
        }
    }
}
function attribute_to_object(attributes) {
    const result = {};
    for (const attribute of attributes) {
        result[attribute.name] = attribute.value;
    }
    return result;
}
function get_custom_elements_slots(element) {
    const result = {};
    element.childNodes.forEach((node) => {
        result[node.slot || 'default'] = true;
    });
    return result;
}

const active_docs = new Set();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = get_root_for_style(node);
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        active_docs.forEach(doc => {
            const stylesheet = doc.__svelte_stylesheet;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            doc.__svelte_rules = {};
        });
        active_docs.clear();
    });
}

function create_animation(node, from, fn, params) {
    if (!from)
        return noop;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
        return noop;
    const { delay = 0, duration = 300, easing = identity, 
    // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
    start: start_time = now() + delay, 
    // @ts-ignore todo:
    end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
    let running = true;
    let started = false;
    let name;
    function start() {
        if (css) {
            name = create_rule(node, 0, 1, duration, delay, easing, css);
        }
        if (!delay) {
            started = true;
        }
    }
    function stop() {
        if (css)
            delete_rule(node, name);
        running = false;
    }
    loop(now => {
        if (!started && now >= start_time) {
            started = true;
        }
        if (started && now >= end) {
            tick(1, 0);
            stop();
        }
        if (!running) {
            return false;
        }
        if (started) {
            const p = now - start_time;
            const t = 0 + 1 * easing(p / duration);
            tick(t, 1 - t);
        }
        return true;
    });
    start();
    tick(0, 1);
    return stop;
}
function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== 'absolute' && style.position !== 'fixed') {
        const { width, height } = style;
        const a = node.getBoundingClientRect();
        node.style.position = 'absolute';
        node.style.width = width;
        node.style.height = height;
        add_transform(node, a);
    }
}
function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function beforeUpdate(fn) {
    get_current_component().$$.before_update.push(fn);
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}
function getAllContexts() {
    return get_current_component().$$.context;
}
function hasContext(key) {
    return get_current_component().$$.context.has(key);
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        // @ts-ignore
        callbacks.slice().forEach(fn => fn.call(this, event));
    }
}

const dirty_components = [];
const intros = { enabled: false };
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(t, 1 - t);
                }
            }
            return running;
        });
    }
    let started = false;
    return {
        start() {
            if (started)
                return;
            started = true;
            delete_rule(node);
            if (is_function(config)) {
                config = config();
                wait().then(go);
            }
            else {
                go();
            }
        },
        invalidate() {
            started = false;
        },
        end() {
            if (running) {
                cleanup();
                running = false;
            }
        }
    };
}
function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, 'start'));
        loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(0, 1);
                    dispatch(node, false, 'end');
                    if (!--group.r) {
                        // this will result in `end()` being called,
                        // so we don't need to clean up here
                        run_all(group.c);
                    }
                    return false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(1 - t, t);
                }
            }
            return running;
        });
    }
    if (is_function(config)) {
        wait().then(() => {
            // @ts-ignore
            config = config();
            go();
        });
    }
    else {
        go();
    }
    return {
        end(reset) {
            if (reset && config.tick) {
                config.tick(1, 0);
            }
            if (running) {
                if (animation_name)
                    delete_rule(node, animation_name);
                running = false;
            }
        }
    };
}
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = (program.b - t);
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = value;
        let child_ctx = info.ctx;
        if (key !== undefined) {
            child_ctx = child_ctx.slice();
            child_ctx[key] = value;
        }
        const block = type && (info.current = type)(child_ctx);
        let needs_flush = false;
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block, i) => {
                    if (i !== index && block) {
                        group_outros();
                        transition_out(block, 1, 1, () => {
                            if (info.blocks[i] === block) {
                                info.blocks[i] = null;
                            }
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
            block.m(info.mount(), info.anchor);
            needs_flush = true;
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
        if (needs_flush) {
            flush();
        }
    }
    if (is_promise(promise)) {
        const current_component = get_current_component();
        promise.then(value => {
            set_current_component(current_component);
            update(info.then, 1, info.value, value);
            set_current_component(null);
        }, error => {
            set_current_component(current_component);
            update(info.catch, 2, info.error, error);
            set_current_component(null);
            if (!info.hasCatch) {
                throw error;
            }
        });
        // if we previously had a then/catch block, destroy it
        if (info.current !== info.pending) {
            update(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update(info.then, 1, info.value, promise);
            return true;
        }
        info.resolved = promise;
    }
}
function update_await_block_branch(info, ctx, dirty) {
    const child_ctx = ctx.slice();
    const { resolved } = info;
    if (info.current === info.then) {
        child_ctx[info.value] = resolved;
    }
    if (info.current === info.catch) {
        child_ctx[info.error] = resolved;
    }
    info.block.p(child_ctx, dirty);
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);

function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
}
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function fix_and_destroy_block(block, lookup) {
    block.f();
    destroy_block(block, lookup);
}
function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function validate_each_keys(ctx, list, get_context, get_key) {
    const keys = new Set();
    for (let i = 0; i < list.length; i++) {
        const key = get_key(get_context(ctx, list, i));
        if (keys.has(key)) {
            throw new Error('Cannot have duplicate keys in a keyed each');
        }
        keys.add(key);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}

// source: https://html.spec.whatwg.org/multipage/indices.html
const boolean_attributes = new Set([
    'allowfullscreen',
    'allowpaymentrequest',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'hidden',
    'ismap',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected'
]);

const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
// https://infra.spec.whatwg.org/#noncharacter
function spread(args, classes_to_add) {
    const attributes = Object.assign({}, ...args);
    if (classes_to_add) {
        if (attributes.class == null) {
            attributes.class = classes_to_add;
        }
        else {
            attributes.class += ' ' + classes_to_add;
        }
    }
    let str = '';
    Object.keys(attributes).forEach(name => {
        if (invalid_attribute_name_character.test(name))
            return;
        const value = attributes[name];
        if (value === true)
            str += ' ' + name;
        else if (boolean_attributes.has(name.toLowerCase())) {
            if (value)
                str += ' ' + name;
        }
        else if (value != null) {
            str += ` ${name}="${value}"`;
        }
    });
    return str;
}
const escaped = {
    '"': '&quot;',
    "'": '&#39;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};
function escape(html) {
    return String(html).replace(/["'&<>]/g, match => escaped[match]);
}
function escape_attribute_value(value) {
    return typeof value === 'string' ? escape(value) : value;
}
function escape_object(obj) {
    const result = {};
    for (const key in obj) {
        result[key] = escape_attribute_value(obj[key]);
    }
    return result;
}
function each(items, fn) {
    let str = '';
    for (let i = 0; i < items.length; i += 1) {
        str += fn(items[i], i);
    }
    return str;
}
const missing_component = {
    $$render: () => ''
};
function validate_component(component, name) {
    if (!component || !component.$$render) {
        if (name === 'svelte:component')
            name += ' this={...}';
        throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
    }
    return component;
}
function debug(file, line, column, values) {
    console.log(`{@debug} ${file ? file + ' ' : ''}(${line}:${column})`); // eslint-disable-line no-console
    console.log(values); // eslint-disable-line no-console
    return '';
}
let on_destroy;
function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots, context) {
        const parent_component = current_component;
        const $$ = {
            on_destroy,
            context: new Map(context || (parent_component ? parent_component.$$.context : [])),
            // these will be immediately discarded
            on_mount: [],
            before_update: [],
            after_update: [],
            callbacks: blank_object()
        };
        set_current_component({ $$ });
        const html = fn(result, props, bindings, slots);
        set_current_component(parent_component);
        return html;
    }
    return {
        render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
            on_destroy = [];
            const result = { title: '', head: '', css: new Set() };
            const html = $$render(result, props, {}, $$slots, context);
            run_all(on_destroy);
            return {
                html,
                css: {
                    code: Array.from(result.css).map(css => css.code).join('\n'),
                    map: null // TODO
                },
                head: result.title + result.head
            };
        },
        $$render
    };
}
function add_attribute(name, value, boolean) {
    if (value == null || (boolean && !value))
        return '';
    return ` ${name}${value === true ? '' : `=${typeof value === 'string' ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function add_classes(classes) {
    return classes ? ` class="${classes}"` : '';
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function claim_component(block, parent_nodes) {
    block && block.l(parent_nodes);
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            start_hydrating();
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        end_hydrating();
        flush();
    }
    set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement === 'function') {
    SvelteElement = class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
        connectedCallback() {
            const { on_mount } = this.$$;
            this.$$.on_disconnect = on_mount.map(run).filter(is_function);
            // @ts-ignore todo: improve typings
            for (const key in this.$$.slotted) {
                // @ts-ignore todo: improve typings
                this.appendChild(this.$$.slotted[key]);
            }
        }
        attributeChangedCallback(attr, _oldValue, newValue) {
            this[attr] = newValue;
        }
        disconnectedCallback() {
            run_all(this.$$.on_disconnect);
        }
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            // TODO should this delegate to addEventListener?
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    };
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
}
function append_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', { target, node });
    append(target, node);
}
function append_hydration_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', { target, node });
    append_hydration(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', { target, node, anchor });
    insert(target, node, anchor);
}
function insert_hydration_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', { target, node, anchor });
    insert_hydration(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev('SvelteDOMRemove', { node });
    detach(node);
}
function detach_between_dev(before, after) {
    while (before.nextSibling && before.nextSibling !== after) {
        detach_dev(before.nextSibling);
    }
}
function detach_before_dev(after) {
    while (after.previousSibling) {
        detach_dev(after.previousSibling);
    }
}
function detach_after_dev(before) {
    while (before.nextSibling) {
        detach_dev(before.nextSibling);
    }
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
    else
        dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
}
function prop_dev(node, property, value) {
    node[property] = value;
    dispatch_dev('SvelteDOMSetProperty', { node, property, value });
}
function dataset_dev(node, property, value) {
    node.dataset[property] = value;
    dispatch_dev('SvelteDOMSetDataset', { node, property, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.wholeText === data)
        return;
    dispatch_dev('SvelteDOMSetData', { node: text, data });
    text.data = data;
}
function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';
        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
            msg += ' You can use a spread to convert this iterable into an array.';
        }
        throw new Error(msg);
    }
}
function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
    }
}
/**
 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
 */
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error("'target' is a required option");
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn('Component was already destroyed'); // eslint-disable-line no-console
        };
    }
    $capture_state() { }
    $inject_state() { }
}
/**
 * Base class to create strongly typed Svelte components.
 * This only exists for typing purposes and should be used in `.d.ts` files.
 *
 * ### Example:
 *
 * You have component library on npm called `component-library`, from which
 * you export a component called `MyComponent`. For Svelte+TypeScript users,
 * you want to provide typings. Therefore you create a `index.d.ts`:
 * ```ts
 * import { SvelteComponentTyped } from "svelte";
 * export class MyComponent extends SvelteComponentTyped<{foo: string}> {}
 * ```
 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
 * to provide intellisense and to use the component like this in a Svelte file
 * with TypeScript:
 * ```svelte
 * <script lang="ts">
 * 	import { MyComponent } from "component-library";
 * </script>
 * <MyComponent foo={'bar'} />
 * ```
 *
 * #### Why not make this part of `SvelteComponent(Dev)`?
 * Because
 * ```ts
 * class ASubclassOfSvelteComponent extends SvelteComponent<{foo: string}> {}
 * const component: typeof SvelteComponent = ASubclassOfSvelteComponent;
 * ```
 * will throw a type error, so we need to separate the more strictly typed class.
 */
class SvelteComponentTyped extends SvelteComponentDev {
    constructor(options) {
        super(options);
    }
}
function loop_guard(timeout) {
    const start = Date.now();
    return () => {
        if (Date.now() - start > timeout) {
            throw new Error('Infinite loop detected');
        }
    };
}

var svelte = /*#__PURE__*/Object.freeze({
    __proto__: null,
    HtmlTag: HtmlTag,
    HtmlTagHydration: HtmlTagHydration,
    SvelteComponent: SvelteComponent,
    SvelteComponentDev: SvelteComponentDev,
    SvelteComponentTyped: SvelteComponentTyped,
    get SvelteElement () { return SvelteElement; },
    action_destroyer: action_destroyer,
    add_attribute: add_attribute,
    add_classes: add_classes,
    add_flush_callback: add_flush_callback,
    add_location: add_location,
    add_render_callback: add_render_callback,
    add_resize_listener: add_resize_listener,
    add_transform: add_transform,
    afterUpdate: afterUpdate,
    append: append,
    append_dev: append_dev,
    append_empty_stylesheet: append_empty_stylesheet,
    append_hydration: append_hydration,
    append_hydration_dev: append_hydration_dev,
    append_styles: append_styles,
    assign: assign,
    attr: attr,
    attr_dev: attr_dev,
    attribute_to_object: attribute_to_object,
    beforeUpdate: beforeUpdate,
    bind: bind,
    binding_callbacks: binding_callbacks,
    blank_object: blank_object,
    bubble: bubble,
    check_outros: check_outros,
    children: children,
    claim_component: claim_component,
    claim_element: claim_element,
    claim_html_tag: claim_html_tag,
    claim_space: claim_space,
    claim_svg_element: claim_svg_element,
    claim_text: claim_text,
    clear_loops: clear_loops,
    component_subscribe: component_subscribe,
    compute_rest_props: compute_rest_props,
    compute_slots: compute_slots,
    createEventDispatcher: createEventDispatcher,
    create_animation: create_animation,
    create_bidirectional_transition: create_bidirectional_transition,
    create_component: create_component,
    create_in_transition: create_in_transition,
    create_out_transition: create_out_transition,
    create_slot: create_slot,
    create_ssr_component: create_ssr_component,
    get current_component () { return current_component; },
    custom_event: custom_event,
    dataset_dev: dataset_dev,
    debug: debug,
    destroy_block: destroy_block,
    destroy_component: destroy_component,
    destroy_each: destroy_each,
    detach: detach,
    detach_after_dev: detach_after_dev,
    detach_before_dev: detach_before_dev,
    detach_between_dev: detach_between_dev,
    detach_dev: detach_dev,
    dirty_components: dirty_components,
    dispatch_dev: dispatch_dev,
    each: each,
    element: element,
    element_is: element_is,
    empty: empty,
    end_hydrating: end_hydrating,
    escape: escape,
    escape_attribute_value: escape_attribute_value,
    escape_object: escape_object,
    escaped: escaped,
    exclude_internal_props: exclude_internal_props,
    fix_and_destroy_block: fix_and_destroy_block,
    fix_and_outro_and_destroy_block: fix_and_outro_and_destroy_block,
    fix_position: fix_position,
    flush: flush,
    getAllContexts: getAllContexts,
    getContext: getContext,
    get_all_dirty_from_scope: get_all_dirty_from_scope,
    get_binding_group_value: get_binding_group_value,
    get_current_component: get_current_component,
    get_custom_elements_slots: get_custom_elements_slots,
    get_root_for_style: get_root_for_style,
    get_slot_changes: get_slot_changes,
    get_spread_object: get_spread_object,
    get_spread_update: get_spread_update,
    get_store_value: get_store_value,
    globals: globals,
    group_outros: group_outros,
    handle_promise: handle_promise,
    hasContext: hasContext,
    has_prop: has_prop,
    identity: identity,
    init: init,
    insert: insert,
    insert_dev: insert_dev,
    insert_hydration: insert_hydration,
    insert_hydration_dev: insert_hydration_dev,
    intros: intros,
    invalid_attribute_name_character: invalid_attribute_name_character,
    is_client: is_client,
    is_crossorigin: is_crossorigin,
    is_empty: is_empty,
    is_function: is_function,
    is_promise: is_promise,
    listen: listen,
    listen_dev: listen_dev,
    loop: loop,
    loop_guard: loop_guard,
    missing_component: missing_component,
    mount_component: mount_component,
    noop: noop,
    not_equal: not_equal,
    get now () { return now; },
    null_to_empty: null_to_empty,
    object_without_properties: object_without_properties,
    onDestroy: onDestroy,
    onMount: onMount,
    once: once,
    outro_and_destroy_block: outro_and_destroy_block,
    prevent_default: prevent_default,
    prop_dev: prop_dev,
    query_selector_all: query_selector_all,
    get raf () { return raf; },
    run: run,
    run_all: run_all,
    safe_not_equal: safe_not_equal,
    schedule_update: schedule_update,
    select_multiple_value: select_multiple_value,
    select_option: select_option,
    select_options: select_options,
    select_value: select_value,
    self: self$1,
    setContext: setContext,
    set_attributes: set_attributes,
    set_current_component: set_current_component,
    set_custom_element_data: set_custom_element_data,
    set_data: set_data,
    set_data_dev: set_data_dev,
    set_input_type: set_input_type,
    set_input_value: set_input_value,
    set_now: set_now,
    set_raf: set_raf,
    set_store_value: set_store_value,
    set_style: set_style,
    set_svg_attributes: set_svg_attributes,
    space: space,
    spread: spread,
    src_url_equal: src_url_equal,
    start_hydrating: start_hydrating,
    stop_propagation: stop_propagation,
    subscribe: subscribe,
    svg_element: svg_element,
    text: text,
    tick: tick,
    time_ranges_to_array: time_ranges_to_array,
    to_number: to_number,
    toggle_class: toggle_class,
    transition_in: transition_in,
    transition_out: transition_out,
    trusted: trusted,
    update_await_block_branch: update_await_block_branch,
    update_keyed_each: update_keyed_each,
    update_slot: update_slot,
    update_slot_base: update_slot_base,
    validate_component: validate_component,
    validate_each_argument: validate_each_argument,
    validate_each_keys: validate_each_keys,
    validate_slots: validate_slots,
    validate_store: validate_store,
    xlink_attr: xlink_attr
});

const HP = {
    w: 16,
    h: 380,
};
const BAR_HEIGHT = 48;

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

class Modules {
    constructor(modules = [], states = []) {
        this.modules = writable([]);
        this.moduleStates = writable([]);
        this.updateCallbacks = [];
        this.modules.set(modules);
        this.moduleStates.set(states);
    }
    get store() {
        return this.modules;
    }
    get state() {
        return get_store_value(this.modules);
    }
    add(module) {
        const position = this.getEmptySpace(module.size);
        module.position = position;
        if (!module.id) {
            const id = Math.random().toString(36).substr(2, 9);
            module.id = `${module.type}-${id}`;
        }
        this.moduleStates.update(($states) => {
            return $states.concat([{ id: module.id, state: module.state, position }]);
        });
        this.modules.update(($modules) => {
            return $modules.concat([module]);
        });
        return module.id;
    }
    update(id, state) {
        this.moduleStates.update(($states) => {
            return $states.map(($state) => ($state.id === id ? { id, state, position: $state.position } : $state));
        });
    }
    remove(id) {
        this.modules.update(($modules) => {
            return $modules.filter((module) => module.id !== id);
        });
        this.moduleStates.update(($state) => {
            return $state.filter((state) => state.id !== id);
        });
    }
    move(module, x, y) {
        const states = get_store_value(this.moduleStates);
        for (let i = 0; i < states.length; i++) {
            const state = states[i];
            if (state.id === module.id) {
                continue;
            }
            const target = this.state.find((item) => item.id === state.id);
            if (!(y + module.size.h * HP.h <= state.position.y ||
                y >= state.position.y + target.size.h * HP.h ||
                x + module.size.w * HP.w <= state.position.x ||
                x >= state.position.x + target.size.w * HP.w)) {
                return false;
            }
        }
        this.moduleStates.update(($states) => $states.map(($state) => $state.id === module.id
            ? {
                ...$state,
                position: { x, y },
            }
            : $state));
        return true;
    }
    import($modules) {
        this.moduleStates.update(() => {
            const states = $modules.map((module) => ({
                id: module.id,
                state: module.state,
                position: module.position,
            }));
            return states;
        });
        this.modules.set($modules);
    }
    export() {
        const states = get_store_value(this.moduleStates);
        const modules = this.state.map(($module) => {
            const module = { ...$module };
            const { state, position } = states.find(($state) => $state.id === module.id);
            module.state = state;
            module.position = position;
            delete module.libs;
            delete module.size;
            delete module.type;
            return module;
        });
        return modules;
    }
    onAfterUpdate(callback) {
        this.updateCallbacks.push(callback);
    }
    afterUpdate() {
        this.updateCallbacks.forEach((callback) => callback());
    }
    getEmptySpace(size) {
        const moduleList = this.state;
        let x = 0;
        let y = 0;
        let empty = moduleList.length === 0;
        const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        while (!empty) {
            let hit = false;
            for (let i = 0; i < moduleList.length; i++) {
                const targetBox = document.getElementById(moduleList[i].id).getBoundingClientRect();
                if (!(y + HP.h * size.h - 48 <= targetBox.y + scrollY ||
                    y >= targetBox.bottom - 48 + scrollY ||
                    x + HP.w * size.w <= targetBox.x + scrollX ||
                    x >= targetBox.right + scrollX)) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                empty = true;
            }
            else {
                if (x > window.innerWidth) {
                    y += 380;
                    x = 0;
                }
                else {
                    x += 16;
                }
            }
        }
        return { x, y };
    }
    reset() {
        this.modules.set([]);
        this.moduleStates.set([]);
    }
}
const modules = new Modules();

/**
 * Get an SVG quadratic bézier curve path based simulating a catenary curve
 * @param p1 - Line Start point
 * @param p2 - Line End point
 *
 * @category Helpers
 */
const getCatenaryPath = (p1, p2) => {
    const distance = p1.getDistanceTo(p2);
    let length = 100;
    switch (true) {
        case distance < 400:
            length = 420;
            break;
        case distance < 900:
            length = 940;
            break;
        case distance < 1400:
            length = 1440;
            break;
        default:
            length = distance * 1.05;
    }
    const controlX = Math.round((p1.x + p2.x) / 2);
    const controlY = Math.round(Math.max(p1.y, p2.y) + length - distance * 0.5);
    return `M ${p1.x} ${p1.y} Q ${controlX} ${controlY} ${p2.x} ${p2.y}`;
};

/**
 * Define a point in 2D space
 *
 * @example
 * // Create a point
 * const pointA = new Point(0, 0);
 * // Update point positions
 * pointA.update(10, 10)
 * // Get a distance to another point
 * const distance = pointA.getDistanceTo(pointB);
 *
 * @category Helpers
 */
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Update the x and y values
     */
    update(point) {
        this.x = point.x;
        this.y = point.y;
    }
    /**
     * Get the difference for x and y axis to another point
     */
    getDifferenceTo(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }
    /**
     * Calculate distance to another point
     */
    getDistanceTo(point) {
        const diff = this.getDifferenceTo(point);
        return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
    }
}

const frequencyRanges = {
    low: [20, 400],
    mid: [400, 2600],
    high: [2600, 14000],
};
const getEnergyAtHz = (hz, analyzer) => {
    const nyquist = analyzer.context.sampleRate / 2;
    const frequencyBinCount = analyzer.size;
    return Math.max(0, Math.min(frequencyBinCount - 1, Math.floor((hz / nyquist) * frequencyBinCount)));
};
const getEnergy = (analyser, low, high) => {
    const buffer = analyser.getValue();
    const lowHz = frequencyRanges[low][0];
    const highHz = frequencyRanges[high || low][1];
    const lowIndex = getEnergyAtHz(lowHz, analyser);
    const highIndex = getEnergyAtHz(highHz, analyser);
    let total = 0;
    let numFrequencies = 0;
    for (let i = lowIndex; i <= highIndex; i++) {
        total += buffer[i];
        numFrequencies++;
    }
    const toReturn = total / numFrequencies;
    return toReturn;
};

/**
 * Transform a value between two ranges
 * @param value - Current value
 * @param from - [min, max] current value range
 * @param to -  [min, max] target value range
 * @param precision - scaled value decimal places precision
 *
 * @example
 * // scale a value
 * const scaledValue = scale(originalValue, [0, 100], [25, 50], 2);
 *
 * @category Helpers
 */
const scale = (value, from, to, precision = 2) => {
    const scaled = (to[1] - to[0]) / (from[1] - from[0]);
    const capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
    return round(capped * scaled + to[0], precision);
};
/**
 * Round a number with specific decimal places precision
 *
 * @example
 * const freq = round(420.240);
 *
 * @category Helpers
 */
const round = (value, precision = 0) => {
    const p = Math.pow(10, precision);
    const m = value * p * (1 + Number.EPSILON);
    return Math.round(m) / p;
};
/**
 * Check if a keyboard event can be intercepted as a shortcut
 *
 * @example
 * // skip processing a keyboard event if definately not a shortcut
 * const onKeyDown = (e: KeyboardEvent) => {
 *    if(!isShortcut()){
 *        return true;
 *    }
 * }
 *
 * @category Helpers
 */
const isShortcut = (e) => {
    const tagName = e.target.tagName.toLowerCase();
    return ['input', 'textarea'].indexOf(tagName) < 0;
};
/**
 * Retruns a random color hex code from a predefined list
 *
 * @example
 * const color = randomColor()
 *
 * @category Helpers
 */
const randomColor = () => {
    const colors = ['#E6EB74', '#98D2DE', '#8ACB74', '#DC4846'];
    return colors[Math.floor(Math.random() * colors.length)];
};
/**
 * Convert module title name to a safe file name
 *
 * @example
 * const fileName = safeName(input);
 *
 * @category Helpers
 */
const safeName = (name) => {
    return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
};

class Patches {
    constructor() {
        this.patches = writable([]);
    }
    get store() {
        return this.patches;
    }
    get state() {
        return get_store_value(this.patches);
    }
    add(patch) {
        patch.color = randomColor();
        this.patches.update(($patches) => {
            return [...$patches, patch];
        });
    }
    remove(output, input) {
        this.patches.update(($patches) => {
            return $patches.filter(($patch) => {
                var _a, _b;
                if (!input) {
                    return ((_a = $patch.input) === null || _a === void 0 ? void 0 : _a.indexOf(output)) !== 0 && ((_b = $patch.output) === null || _b === void 0 ? void 0 : _b.indexOf(output)) !== 0;
                }
                return !($patch.input === input && $patch.output === output);
            });
        });
    }
    update(output, input, update) {
        this.patches.update(($patches) => {
            return $patches.map(($patch) => $patch.input === input && $patch.output === output
                ? {
                    ...$patch,
                    ...update,
                }
                : $patch);
        });
    }
    import($patches) {
        const state = this.state;
        this.patches.set($patches.map(($patch) => {
            const $exists = state.find((item) => item.input === $patch.input && item.output === $patch.output);
            if ($exists) {
                return $exists;
            }
            if (!$patch.color) {
                $patch.color = randomColor();
            }
            return $patch;
        }));
    }
    export() {
        const patches = this.state.map((patch) => {
            const $patch = { ...patch };
            delete $patch.node;
            delete $patch.selected;
            delete $patch.color;
            return $patch;
        });
        return patches;
    }
    reset() {
        this.patches.set([]);
    }
}
const patches = new Patches();

const stateImport = (state, library) => {
    const $modules = state.modules
        .map((module) => {
        if (!module.type) {
            module.type = module.id.substr(0, module.id.lastIndexOf('-'));
        }
        const $moduleLib = library.find(({ set, name }) => `${set}/${safeName(name)}` === module.type);
        if (!$moduleLib) {
            return undefined;
        }
        else {
            module.size = $moduleLib.size;
            module.libs = $moduleLib.libs;
        }
        return module;
    })
        .filter(Boolean);
    const $patches = state.patches
        .map(($patch) => {
        const exists = $modules.findIndex((item) => {
            return $patch.input.indexOf(`${item.id}://`) === 0 || $patch.output.indexOf(`${item.id}://`) === 0;
        }) > -1;
        return exists ? $patch : undefined;
    })
        .filter(Boolean);
    modules.import($modules);
    patches.import($patches);
};
const stateExport = (title) => {
    const $patches = patches.export();
    const $modules = modules.export();
    return { title, modules: $modules, patches: $patches };
};
const stateReset = () => {
    patches.reset();
    modules.reset();
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var FileSaver_min = {exports: {}};

(function (module, exports) {
(function(a,b){b();})(commonjsGlobal,function(){function b(a,b){return "undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Deprecated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(a,b,c){var d=new XMLHttpRequest;d.open("GET",a),d.responseType="blob",d.onload=function(){g(d.response,b,c);},d.onerror=function(){console.error("could not download file");},d.send();}function d(a){var b=new XMLHttpRequest;b.open("HEAD",a,!1);try{b.send();}catch(a){}return 200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"));}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b);}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof commonjsGlobal&&commonjsGlobal.global===commonjsGlobal?commonjsGlobal:void 0,a=f.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),g=f.saveAs||("object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype&&!a?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href);},4E4),setTimeout(function(){e(j);},0));}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else {var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i);});}}:function(b,d,e,g){if(g=g||open("","_blank"),g&&(g.document.title=g.document.body.innerText="downloading..."),"string"==typeof b)return c(b,d,e);var h="application/octet-stream"===b.type,i=/constructor/i.test(f.HTMLElement)||f.safari,j=/CriOS\/[\d]+/.test(navigator.userAgent);if((j||h&&i||a)&&"undefined"!=typeof FileReader){var k=new FileReader;k.onloadend=function(){var a=k.result;a=j?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),g?g.location.href=a:location=a,g=null;},k.readAsDataURL(b);}else {var l=f.URL||f.webkitURL,m=l.createObjectURL(b);g?g.location=m:location.href=m,g=null,setTimeout(function(){l.revokeObjectURL(m);},4E4);}});f.saveAs=g.saveAs=g,(module.exports=g);});


}(FileSaver_min));

var fileDialog_min = {exports: {}};

(function (module, exports) {
var _typeof='function'==typeof Symbol&&'symbol'==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&'function'==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?'symbol':typeof a};(function(a){var b=function(){for(var d=arguments.length,c=Array(d),f=0;f<d;f++)c[f]=arguments[f];var g=document.createElement('input');return 'object'===_typeof(c[0])&&(!0===c[0].multiple&&g.setAttribute('multiple',''),void 0!==c[0].accept&&g.setAttribute('accept',c[0].accept)),g.setAttribute('type','file'),g.style.display='none',g.setAttribute('id','hidden-file'),document.body.appendChild(g),new Promise(function(h){g.addEventListener('change',function(){h(g.files);var l=c[c.length-1];'function'==typeof l&&l(g.files),document.body.removeChild(g);});var j=document.createEvent('MouseEvents');j.initMouseEvent('click',!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,0,null),g.dispatchEvent(j);})};(module.exports&&(exports=module.exports=b),exports.fileDialog=b);})();
}(fileDialog_min, fileDialog_min.exports));

var fileDialog = fileDialog_min.exports;

/**
 * Element pan event
 *
 * @example
 *
 * <div use:usePan={onPan} />
 *
 * @category Actions
 */
const usePan = (node, onMove) => {
    let x;
    let y;
    if (typeof onMove !== 'function') {
        return;
    }
    const onMousedown = (event) => {
        x = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        y = 'clientY' in event ? event.clientY : event.touches[0].clientY;
        window.addEventListener('mousemove', onMousemove, { passive: true });
        window.addEventListener('touchmove', onMousemove, { passive: true });
        window.addEventListener('mouseup', onMouseup, { passive: true });
        window.addEventListener('touchend', onMouseup, { passive: true });
    };
    const onMousemove = (event) => {
        const newX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        const newY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
        const dx = newX - x;
        const dy = newY - y;
        x = newX;
        y = newY;
        onMove({ x, y, dx, dy });
    };
    const onMouseup = () => {
        window.removeEventListener('mousemove', onMousemove);
        window.removeEventListener('touchmove', onMousemove);
        window.removeEventListener('mouseup', onMouseup);
        window.removeEventListener('touchend', onMouseup);
    };
    const onWheel = (event) => {
        event.preventDefault();
        onMove({ x: event.clientX, y: event.clientY, dx: event.deltaX, dy: event.deltaY });
    };
    node.addEventListener('mousedown', onMousedown, { passive: true });
    node.addEventListener('touchstart', onMousedown, { passive: true });
    node.addEventListener('wheel', onWheel, { passive: false });
    return {
        destroy() {
            node.removeEventListener('mousedown', onMousedown);
            node.removeEventListener('touchstart', onMousedown);
            node.removeEventListener('wheel', onWheel);
        },
    };
};

/**
 * Element drag event
 *
 * @example
 *
 * <div use:onDrag={dragCallback} />
 *
 * @category Actions
 */
const useDrag = (node, onDrag) => {
    if (typeof onDrag !== 'function') {
        return;
    }
    let offset;
    const onMousedown = (event) => {
        if (event.target !== node && event.target.getAttribute('draggable') === null) {
            return;
        }
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        offset = clientX - node.getBoundingClientRect().left;
        window.addEventListener('mousemove', onMousemove, { passive: true });
        window.addEventListener('touchmove', onMousemove, { passive: true });
        window.addEventListener('mouseup', onMouseup, { passive: true });
        window.addEventListener('touchend', onMouseup, { passive: true });
    };
    const onMousemove = (event) => {
        const box = node.getBoundingClientRect();
        const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
        const x = clientX + scrollX - offset;
        const y = clientY + scrollY - BAR_HEIGHT;
        onDrag(x, y, box);
    };
    const onMouseup = () => {
        window.removeEventListener('mousemove', onMousemove);
        window.removeEventListener('touchmove', onMousemove);
        window.removeEventListener('mouseup', onMouseup);
        window.removeEventListener('touchend', onMouseup);
    };
    node.addEventListener('mousedown', onMousedown, { passive: true });
    node.addEventListener('touchstart', onMousedown, { passive: true });
    return {
        destroy() {
            node.removeEventListener('mousedown', onMousedown);
            node.removeEventListener('touchstart', onMousedown);
        },
    };
};

/**
 * Detect a click outside of the target element or it's children
 *
 * @example
 *
 * <div use:useClickOutside={oClickOutside} />
 *
 * @category Actions
 */
const useClickOutside = (node, onClickOutside) => {
    if (typeof onClickOutside !== 'function') {
        return;
    }
    const onMousedown = (event) => {
        let parent = event.target;
        let isChild = false;
        while (parent) {
            if (parent === node) {
                isChild = true;
                break;
            }
            parent = parent.parentNode;
        }
        if (!isChild) {
            onClickOutside(event);
        }
    };
    document.addEventListener('mousedown', onMousedown, { passive: true });
    document.addEventListener('touchstart', onMousedown, { passive: true });
    return {
        destroy() {
            document.removeEventListener('mousedown', onMousedown);
            document.removeEventListener('touchstart', onMousedown);
        },
    };
};

/* src/rack/Dialog.svelte generated by Svelte v3.44.2 */

function add_css$f(target) {
	append_styles(target, "svelte-1e66l3v", ".dialog.svelte-1e66l3v.svelte-1e66l3v{display:none;align-items:center;justify-content:center;position:fixed;top:0px;left:0px;width:100vw;height:100vh;background:rgba(0, 0, 0, 0.65)}.dialog.visible.svelte-1e66l3v.svelte-1e66l3v{display:flex}.dialog.svelte-1e66l3v>div.svelte-1e66l3v{background:var(--color-ui-bg);padding:24px 18px 18px}");
}

function create_fragment$h(ctx) {
	let t;
	let div1;
	let div0;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

	return {
		c() {
			t = space();
			div1 = element("div");
			div0 = element("div");
			if (default_slot) default_slot.c();
			attr(div0, "class", "svelte-1e66l3v");
			attr(div1, "class", "dialog svelte-1e66l3v");
			toggle_class(div1, "visible", /*visible*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
			insert(target, div1, anchor);
			append(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					listen(document.body, "keydown", /*onKey*/ ctx[2]),
					action_destroyer(useClickOutside.call(null, div0, /*hideDialog*/ ctx[1]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (dirty & /*visible*/ 1) {
				toggle_class(div1, "visible", /*visible*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t);
			if (detaching) detach(div1);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { visible } = $$props;

	const hideDialog = event => {
		$$invalidate(0, visible = false);
	};

	const onKey = e => {
		if (isShortcut(e) && visible && e.key === 'Escape') {
			e.preventDefault();
			$$invalidate(0, visible = false);
		}
	};

	$$self.$$set = $$props => {
		if ('visible' in $$props) $$invalidate(0, visible = $$props.visible);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [visible, hideDialog, onKey, $$scope, slots];
}

class Dialog extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$g, create_fragment$h, safe_not_equal, { visible: 0 }, add_css$f);
	}
}

/* src/rack/Menu.svelte generated by Svelte v3.44.2 */

function add_css$e(target) {
	append_styles(target, "svelte-9bcplh", "ul.menu.svelte-9bcplh{display:none;position:absolute;background:var(--color-ui-bg);white-space:nowrap;left:8px;top:56px}ul.menu.center.svelte-9bcplh{left:50%;transform:translate(-50%, 0)}ul.menu.svelte-9bcplh:before{content:'';position:absolute;top:-6px;left:8px;width:0;height:0;border-style:solid;border-width:0 6px 6px 6px;border-color:transparent transparent var(--color-ui-bg) transparent}ul.menu.center.svelte-9bcplh:before{left:50%;transform:translate(-6px, 0)}ul.menu.visible.svelte-9bcplh{display:block}ul.menu button, ul.menu a, ul.menu input, ul.menu label{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;min-width:200px;text-align:left;text-decoration:none}ul.menu form{background:var(--color-ui-bg);padding:8px}ul.menu form button, .dialog button{padding:8px 0;background:var(--color-ui-hover);justify-content:center}ul.menu form button:hover, .dialog button:hover{background:var(--color-ui-bg-secondary)}ul.menu input{padding:8px;background:var(--color-ui-bg);border:1px solid var(--color-ui-bg-secondary);margin-bottom:4px}ul.menu button span, ul.menu a span{display:inline-flex;align-items:center}ul.menu button:hover, ul.menu a:hover{background:var(--color-ui-hover)}ul.menu button:disabled{pointer-events:none;opacity:0.35}ul.menu button strong{opacity:0.75}ul.menu svg{margin-right:4px}ul.menu button.divider{border-bottom:1px solid var(--color-ui-hover)}");
}

function create_fragment$g(ctx) {
	let ul;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			ul = element("ul");
			if (default_slot) default_slot.c();
			attr(ul, "class", "menu svelte-9bcplh");
			toggle_class(ul, "visible", /*visible*/ ctx[0]);
			toggle_class(ul, "center", /*center*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			if (default_slot) {
				default_slot.m(ul, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					listen(ul, "click", /*hideMenu*/ ctx[2]),
					action_destroyer(useClickOutside.call(null, ul, /*hideMenu*/ ctx[2]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
				}
			}

			if (dirty & /*visible*/ 1) {
				toggle_class(ul, "visible", /*visible*/ ctx[0]);
			}

			if (dirty & /*center*/ 2) {
				toggle_class(ul, "center", /*center*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { toggle } = $$props;
	let { center = false } = $$props;
	let { visible = false } = $$props;

	const hideMenu = event => {
		if (event.target !== toggle) {
			$$invalidate(0, visible = false);
		} else {
			$$invalidate(0, visible = !visible);
		}
	};

	$$self.$$set = $$props => {
		if ('toggle' in $$props) $$invalidate(3, toggle = $$props.toggle);
		if ('center' in $$props) $$invalidate(1, center = $$props.center);
		if ('visible' in $$props) $$invalidate(0, visible = $$props.visible);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	return [visible, center, hideMenu, toggle, $$scope, slots];
}

class Menu extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$g, safe_not_equal, { toggle: 3, center: 1, visible: 0 }, add_css$e);
	}
}

/* src/rack/Loading.svelte generated by Svelte v3.44.2 */

function add_css$d(target) {
	append_styles(target, "svelte-1d97co", "div.svelte-1d97co{position:absolute;display:flex;align-items:center;justify-content:center;top:0px;left:0px;width:100%;height:100%;background:rgba(0, 0, 0, 0.2);backdrop-filter:grayscale(100%) brightness(60%) contrast(80%);color:#fff}");
}

function create_fragment$f(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 50 50"><path fill="currentColor" d="M43.935 25.145c0-10.318-8.364-18.683-18.683-18.683-10.318 0-18.683 8.365-18.683 18.683h4.068c0-8.071 6.543-14.615 14.615-14.615s14.615 6.543 14.615 14.615h4.068z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"></animateTransform></path></svg>`;
			attr(div, "class", "svelte-1d97co");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

class Loading extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$f, safe_not_equal, {}, add_css$d);
	}
}

/* src/rack/Share.svelte generated by Svelte v3.44.2 */

function add_css$c(target) {
	append_styles(target, "svelte-1mwph5a", "h1.svelte-1mwph5a{font-size:12px;line-height:48px;cursor:pointer}");
}

// (39:4) {#if loading}
function create_if_block$c(ctx) {
	let loading_1;
	let current;
	loading_1 = new Loading({});

	return {
		c() {
			create_component(loading_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(loading_1, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(loading_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(loading_1, detaching);
		}
	};
}

// (37:0) <Menu center bind:toggle>
function create_default_slot$6(ctx) {
	let form;
	let t0;
	let input;
	let t1;
	let button;
	let current;
	let mounted;
	let dispose;
	let if_block = /*loading*/ ctx[2] && create_if_block$c();

	return {
		c() {
			form = element("form");
			if (if_block) if_block.c();
			t0 = space();
			input = element("input");
			t1 = space();
			button = element("button");
			button.textContent = "Share";
			attr(input, "id", "title");
			attr(input, "type", "text");
			attr(input, "autocomplete", "off");
			attr(input, "placeholder", "Synth title");
			attr(button, "type", "submit");
		},
		m(target, anchor) {
			insert(target, form, anchor);
			if (if_block) if_block.m(form, null);
			append(form, t0);
			append(form, input);
			set_input_value(input, /*title*/ ctx[0]);
			append(form, t1);
			append(form, button);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input, "input", /*input_input_handler*/ ctx[7]),
					listen(form, "submit", /*onShare*/ ctx[4]),
					listen(form, "click", /*onClick*/ ctx[3])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*loading*/ ctx[2]) {
				if (if_block) {
					if (dirty & /*loading*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$c();
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(form, t0);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*title*/ 1 && input.value !== /*title*/ ctx[0]) {
				set_input_value(input, /*title*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(form);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$e(ctx) {
	let h1;
	let t0;
	let t1;
	let t2;
	let menu;
	let updating_toggle;
	let current;

	function menu_toggle_binding(value) {
		/*menu_toggle_binding*/ ctx[8](value);
	}

	let menu_props = {
		center: true,
		$$slots: { default: [create_default_slot$6] },
		$$scope: { ctx }
	};

	if (/*toggle*/ ctx[1] !== void 0) {
		menu_props.toggle = /*toggle*/ ctx[1];
	}

	menu = new Menu({ props: menu_props });
	binding_callbacks.push(() => bind(menu, 'toggle', menu_toggle_binding));

	return {
		c() {
			h1 = element("h1");
			t0 = text(/*title*/ ctx[0]);
			t1 = text(" ▾");
			t2 = space();
			create_component(menu.$$.fragment);
			attr(h1, "class", "svelte-1mwph5a");
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			append(h1, t0);
			append(h1, t1);
			/*h1_binding*/ ctx[6](h1);
			insert(target, t2, anchor);
			mount_component(menu, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*title*/ 1) set_data(t0, /*title*/ ctx[0]);
			const menu_changes = {};

			if (dirty & /*$$scope, title, loading*/ 517) {
				menu_changes.$$scope = { dirty, ctx };
			}

			if (!updating_toggle && dirty & /*toggle*/ 2) {
				updating_toggle = true;
				menu_changes.toggle = /*toggle*/ ctx[1];
				add_flush_callback(() => updating_toggle = false);
			}

			menu.$set(menu_changes);
		},
		i(local) {
			if (current) return;
			transition_in(menu.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(menu.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(h1);
			/*h1_binding*/ ctx[6](null);
			if (detaching) detach(t2);
			destroy_component(menu, detaching);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { api } = $$props;
	let { title } = $$props;
	let toggle;
	let loading = false;

	const onClick = e => {
		e.stopPropagation();
	};

	const onShare = async e => {
		e.preventDefault();
		$$invalidate(2, loading = true);
		const $rack = stateExport(title);

		const response = await fetch(`${api}/share`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify($rack)
		});

		const data = await response.json();
		$$invalidate(2, loading = false);
		window.location.pathname = `/${data.url}`;
	};

	function h1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			toggle = $$value;
			$$invalidate(1, toggle);
		});
	}

	function input_input_handler() {
		title = this.value;
		$$invalidate(0, title);
	}

	function menu_toggle_binding(value) {
		toggle = value;
		$$invalidate(1, toggle);
	}

	$$self.$$set = $$props => {
		if ('api' in $$props) $$invalidate(5, api = $$props.api);
		if ('title' in $$props) $$invalidate(0, title = $$props.title);
	};

	return [
		title,
		toggle,
		loading,
		onClick,
		onShare,
		api,
		h1_binding,
		input_input_handler,
		menu_toggle_binding
	];
}

class Share extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, { api: 5, title: 0 }, add_css$c);
	}
}

/* src/rack/Bar.svelte generated by Svelte v3.44.2 */

function add_css$b(target) {
	append_styles(target, "svelte-16b4lsx", "header.svelte-16b4lsx.svelte-16b4lsx{position:fixed;display:flex;justify-content:center;align-items:center;top:0px;left:0px;width:100vw;height:48px;background:var(--color-ui-bg);color:var(--color-ui-fg);z-index:var(--zindex-bar);text-align:center;font-size:12px}nav.svelte-16b4lsx.svelte-16b4lsx{position:absolute;top:0px;left:0px}nav.svelte-16b4lsx>button.svelte-16b4lsx{display:flex;justify-content:center;align-items:center;height:48px;width:48px}nav.svelte-16b4lsx button svg.svelte-16b4lsx{pointer-events:none}.reset.svelte-16b4lsx h6.svelte-16b4lsx{font-size:13px;font-weight:600;margin-bottom:18px}.reset.svelte-16b4lsx p.svelte-16b4lsx{display:block;margin-bottom:24px;text-align:left}.reset.svelte-16b4lsx div.svelte-16b4lsx{display:flex}.reset.svelte-16b4lsx button.svelte-16b4lsx{flex:1}.reset.svelte-16b4lsx button.svelte-16b4lsx:last-of-type{margin-left:16px;color:var(--color-5)}");
}

// (141:4) <Menu bind:toggle={menuMainToggle}>
function create_default_slot_1$1(ctx) {
	let button0;
	let t2;
	let hr0;
	let t3;
	let button1;
	let t6;
	let hr1;
	let t7;
	let button2;
	let t10;
	let button3;
	let t13;
	let hr2;
	let t14;
	let button4;
	let t16;
	let a;
	let mounted;
	let dispose;

	return {
		c() {
			button0 = element("button");
			button0.innerHTML = `New <strong>CTRL+N</strong>`;
			t2 = space();
			hr0 = element("hr");
			t3 = space();
			button1 = element("button");
			button1.innerHTML = `Add module <strong>SPACE</strong>`;
			t6 = space();
			hr1 = element("hr");
			t7 = space();
			button2 = element("button");
			button2.innerHTML = `Save to file <strong>CTRL+S</strong>`;
			t10 = space();
			button3 = element("button");
			button3.innerHTML = `Load from file <strong>CTRL+O</strong>`;
			t13 = space();
			hr2 = element("hr");
			t14 = space();
			button4 = element("button");
			button4.textContent = "Help";
			t16 = space();
			a = element("a");

			a.innerHTML = `<span><svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 32 32" class="svelte-16b4lsx"><path fill="currentColor" d="M16 2a14 14 0 00-4.43 27.28c.7.13 1-.3 1-.67v-2.38c-3.89.84-4.71-1.88-4.71-1.88a3.71 3.71 0 00-1.62-2.05c-1.27-.86.1-.85.1-.85a2.94 2.94 0 012.14 1.45 3 3 0 004.08 1.16 2.93 2.93 0 01.88-1.87c-3.1-.36-6.37-1.56-6.37-6.92a5.4 5.4 0 011.44-3.76 5 5 0 01.14-3.7s1.17-.38 3.85 1.43a13.3 13.3 0 017 0c2.67-1.81 3.84-1.43 3.84-1.43a5 5 0 01.14 3.7 5.4 5.4 0 011.44 3.76c0 5.38-3.27 6.56-6.39 6.91a3.33 3.33 0 01.95 2.59v3.84c0 .46.25.81 1 .67A14 14 0 0016 2z"></path></svg>
          GitHub</span>`;

			attr(button0, "class", "svelte-16b4lsx");
			attr(button1, "class", "svelte-16b4lsx");
			attr(button2, "class", "svelte-16b4lsx");
			attr(button3, "class", "svelte-16b4lsx");
			attr(button4, "class", "svelte-16b4lsx");
			attr(a, "href", "https://github.com/spectrome/patchcab");
			attr(a, "target", "_blank");
			attr(a, "rel", "noreferrer");
		},
		m(target, anchor) {
			insert(target, button0, anchor);
			insert(target, t2, anchor);
			insert(target, hr0, anchor);
			insert(target, t3, anchor);
			insert(target, button1, anchor);
			insert(target, t6, anchor);
			insert(target, hr1, anchor);
			insert(target, t7, anchor);
			insert(target, button2, anchor);
			insert(target, t10, anchor);
			insert(target, button3, anchor);
			insert(target, t13, anchor);
			insert(target, hr2, anchor);
			insert(target, t14, anchor);
			insert(target, button4, anchor);
			insert(target, t16, anchor);
			insert(target, a, anchor);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*onToggleResetDialog*/ ctx[8]),
					listen(button1, "click", /*onAddModule*/ ctx[4]),
					listen(button2, "click", /*onExport*/ ctx[6]),
					listen(button3, "click", /*onImport*/ ctx[9]),
					listen(button4, "click", /*onShortcuts*/ ctx[5])
				];

				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(button0);
			if (detaching) detach(t2);
			if (detaching) detach(hr0);
			if (detaching) detach(t3);
			if (detaching) detach(button1);
			if (detaching) detach(t6);
			if (detaching) detach(hr1);
			if (detaching) detach(t7);
			if (detaching) detach(button2);
			if (detaching) detach(t10);
			if (detaching) detach(button3);
			if (detaching) detach(t13);
			if (detaching) detach(hr2);
			if (detaching) detach(t14);
			if (detaching) detach(button4);
			if (detaching) detach(t16);
			if (detaching) detach(a);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (164:4) {#if api}
function create_if_block$b(ctx) {
	let share;
	let updating_title;
	let current;

	function share_title_binding(value) {
		/*share_title_binding*/ ctx[15](value);
	}

	let share_props = { api: /*api*/ ctx[1] };

	if (/*title*/ ctx[0] !== void 0) {
		share_props.title = /*title*/ ctx[0];
	}

	share = new Share({ props: share_props });
	binding_callbacks.push(() => bind(share, 'title', share_title_binding));

	return {
		c() {
			create_component(share.$$.fragment);
		},
		m(target, anchor) {
			mount_component(share, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const share_changes = {};
			if (dirty & /*api*/ 2) share_changes.api = /*api*/ ctx[1];

			if (!updating_title && dirty & /*title*/ 1) {
				updating_title = true;
				share_changes.title = /*title*/ ctx[0];
				add_flush_callback(() => updating_title = false);
			}

			share.$set(share_changes);
		},
		i(local) {
			if (current) return;
			transition_in(share.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(share.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(share, detaching);
		}
	};
}

// (169:2) <Dialog bind:visible={showResetDialog}>
function create_default_slot$5(ctx) {
	let div1;
	let h6;
	let t1;
	let p;
	let t3;
	let div0;
	let button0;
	let t5;
	let button1;
	let mounted;
	let dispose;

	return {
		c() {
			div1 = element("div");
			h6 = element("h6");
			h6.textContent = "Do you want to clear the current patch?";
			t1 = space();
			p = element("p");
			p.textContent = "Your changes on current patch will be lost.";
			t3 = space();
			div0 = element("div");
			button0 = element("button");
			button0.textContent = "Cancel";
			t5 = space();
			button1 = element("button");
			button1.textContent = "Clear";
			attr(h6, "class", "svelte-16b4lsx");
			attr(p, "class", "svelte-16b4lsx");
			attr(button0, "type", "button");
			attr(button0, "class", "svelte-16b4lsx");
			attr(button1, "type", "button");
			attr(button1, "class", "svelte-16b4lsx");
			attr(div0, "class", "svelte-16b4lsx");
			attr(div1, "class", "reset svelte-16b4lsx");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, h6);
			append(div1, t1);
			append(div1, p);
			append(div1, t3);
			append(div1, div0);
			append(div0, button0);
			append(div0, t5);
			append(div0, button1);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*onToggleResetDialog*/ ctx[8]),
					listen(button1, "click", /*onReset*/ ctx[7])
				];

				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(div1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$d(ctx) {
	let t0;
	let header;
	let nav;
	let button;
	let t1;
	let menu;
	let updating_toggle;
	let t2;
	let div0;
	let t3;
	let div1;
	let t4;
	let dialog;
	let updating_visible;
	let current;
	let mounted;
	let dispose;

	function menu_toggle_binding(value) {
		/*menu_toggle_binding*/ ctx[14](value);
	}

	let menu_props = {
		$$slots: { default: [create_default_slot_1$1] },
		$$scope: { ctx }
	};

	if (/*menuMainToggle*/ ctx[2] !== void 0) {
		menu_props.toggle = /*menuMainToggle*/ ctx[2];
	}

	menu = new Menu({ props: menu_props });
	binding_callbacks.push(() => bind(menu, 'toggle', menu_toggle_binding));
	let if_block = /*api*/ ctx[1] && create_if_block$b(ctx);

	function dialog_visible_binding(value) {
		/*dialog_visible_binding*/ ctx[16](value);
	}

	let dialog_props = {
		$$slots: { default: [create_default_slot$5] },
		$$scope: { ctx }
	};

	if (/*showResetDialog*/ ctx[3] !== void 0) {
		dialog_props.visible = /*showResetDialog*/ ctx[3];
	}

	dialog = new Dialog({ props: dialog_props });
	binding_callbacks.push(() => bind(dialog, 'visible', dialog_visible_binding));

	return {
		c() {
			t0 = space();
			header = element("header");
			nav = element("nav");
			button = element("button");
			button.innerHTML = `<svg width="16" height="13" fill="none" xmlns="http://www.w3.org/2000/svg" class="svelte-16b4lsx"><path d="M0 0h16v1H0V0zM0 6h16v1H0V6zM16 12H0v1h16v-1z" fill="#C4C4C4"></path></svg>`;
			t1 = space();
			create_component(menu.$$.fragment);
			t2 = space();
			div0 = element("div");
			if (if_block) if_block.c();
			t3 = space();
			div1 = element("div");
			t4 = space();
			create_component(dialog.$$.fragment);
			attr(button, "aria-label", "Toggle menu");
			attr(button, "class", "svelte-16b4lsx");
			attr(nav, "class", "svelte-16b4lsx");
			attr(header, "class", "svelte-16b4lsx");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, header, anchor);
			append(header, nav);
			append(nav, button);
			/*button_binding*/ ctx[13](button);
			append(nav, t1);
			mount_component(menu, nav, null);
			append(header, t2);
			append(header, div0);
			if (if_block) if_block.m(div0, null);
			append(header, t3);
			append(header, div1);
			append(header, t4);
			mount_component(dialog, header, null);
			current = true;

			if (!mounted) {
				dispose = listen(document.body, "keydown", /*onKey*/ ctx[10]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const menu_changes = {};

			if (dirty & /*$$scope*/ 131072) {
				menu_changes.$$scope = { dirty, ctx };
			}

			if (!updating_toggle && dirty & /*menuMainToggle*/ 4) {
				updating_toggle = true;
				menu_changes.toggle = /*menuMainToggle*/ ctx[2];
				add_flush_callback(() => updating_toggle = false);
			}

			menu.$set(menu_changes);

			if (/*api*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*api*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$b(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div0, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			const dialog_changes = {};

			if (dirty & /*$$scope*/ 131072) {
				dialog_changes.$$scope = { dirty, ctx };
			}

			if (!updating_visible && dirty & /*showResetDialog*/ 8) {
				updating_visible = true;
				dialog_changes.visible = /*showResetDialog*/ ctx[3];
				add_flush_callback(() => updating_visible = false);
			}

			dialog.$set(dialog_changes);
		},
		i(local) {
			if (current) return;
			transition_in(menu.$$.fragment, local);
			transition_in(if_block);
			transition_in(dialog.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(menu.$$.fragment, local);
			transition_out(if_block);
			transition_out(dialog.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(header);
			/*button_binding*/ ctx[13](null);
			destroy_component(menu);
			if (if_block) if_block.d();
			destroy_component(dialog);
			mounted = false;
			dispose();
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { view } = $$props;
	let { library } = $$props;
	let { api } = $$props;
	let { title } = $$props;
	let menuMainToggle;
	let showResetDialog = false;

	const onAddModule = () => {
		$$invalidate(11, view = 'shelf');
	};

	const onShortcuts = () => {
		$$invalidate(11, view = 'help');
	};

	const onExport = () => {
		const $rack = stateExport(title);
		const blob = new Blob([JSON.stringify($rack)], { type: 'application/json;charset=utf-8' });
		FileSaver_min.exports.saveAs(blob, 'patch.json');
	};

	const onReset = () => {
		stateReset();
		$$invalidate(3, showResetDialog = false);
	};

	const onToggleResetDialog = () => {
		$$invalidate(3, showResetDialog = !showResetDialog);
	};

	const onImport = () => {
		fileDialog().then(files => {
			try {
				if (!files || files.length < 1) {
					return;
				}

				const reader = new FileReader();

				reader.onload = e => {
					if (typeof e.target.result !== 'string') {
						return;
					}

					const $rack = JSON.parse(e.target.result);
					stateImport($rack, library);
				};

				reader.readAsText(files[0]);
			} catch(err) {
				console.log(err);
			}
		});
	};

	const onKey = e => {
		if (isShortcut(e) && e.ctrlKey) {
			if (e.key === 'n') {
				e.preventDefault();
				$$invalidate(3, showResetDialog = true);
			}

			if (e.key === 's') {
				e.preventDefault();
				onExport();
			}

			if (e.key === 'o') {
				e.preventDefault();
				onImport();
			}
		}
	};

	function button_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			menuMainToggle = $$value;
			$$invalidate(2, menuMainToggle);
		});
	}

	function menu_toggle_binding(value) {
		menuMainToggle = value;
		$$invalidate(2, menuMainToggle);
	}

	function share_title_binding(value) {
		title = value;
		$$invalidate(0, title);
	}

	function dialog_visible_binding(value) {
		showResetDialog = value;
		$$invalidate(3, showResetDialog);
	}

	$$self.$$set = $$props => {
		if ('view' in $$props) $$invalidate(11, view = $$props.view);
		if ('library' in $$props) $$invalidate(12, library = $$props.library);
		if ('api' in $$props) $$invalidate(1, api = $$props.api);
		if ('title' in $$props) $$invalidate(0, title = $$props.title);
	};

	return [
		title,
		api,
		menuMainToggle,
		showResetDialog,
		onAddModule,
		onShortcuts,
		onExport,
		onReset,
		onToggleResetDialog,
		onImport,
		onKey,
		view,
		library,
		button_binding,
		menu_toggle_binding,
		share_title_binding,
		dialog_visible_binding
	];
}

class Bar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { view: 11, library: 12, api: 1, title: 0 }, add_css$b);
	}
}

/* src/rack/Cables.svelte generated by Svelte v3.44.2 */

const { document: document_1$3 } = globals;

function add_css$a(target) {
	append_styles(target, "svelte-1jehzx5", "svg.svelte-1jehzx5.svelte-1jehzx5{position:absolute;top:48px;left:0px;width:4800px;height:3040px;pointer-events:none;opacity:1;z-index:var(--zindex-cables)}svg.svelte-1jehzx5 path.svelte-1jehzx5{stroke-linecap:round;fill:none}");
}

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (91:2) {#each cables as cable}
function create_each_block$3(ctx) {
	let path0;
	let path0_stroke_value;
	let path0_d_value;
	let path1;
	let path1_stroke_value;
	let path1_d_value;

	return {
		c() {
			path0 = svg_element("path");
			path1 = svg_element("path");
			attr(path0, "stroke", path0_stroke_value = /*darken*/ ctx[3](/*cable*/ ctx[6].color, -40));
			attr(path0, "stroke-width", "5");
			attr(path0, "d", path0_d_value = /*cable*/ ctx[6].path);
			attr(path0, "class", "svelte-1jehzx5");
			attr(path1, "stroke", path1_stroke_value = /*cable*/ ctx[6].color);
			attr(path1, "stroke-width", "3");
			attr(path1, "d", path1_d_value = /*cable*/ ctx[6].path);
			attr(path1, "class", "svelte-1jehzx5");
		},
		m(target, anchor) {
			insert(target, path0, anchor);
			insert(target, path1, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*cables*/ 1 && path0_stroke_value !== (path0_stroke_value = /*darken*/ ctx[3](/*cable*/ ctx[6].color, -40))) {
				attr(path0, "stroke", path0_stroke_value);
			}

			if (dirty & /*cables*/ 1 && path0_d_value !== (path0_d_value = /*cable*/ ctx[6].path)) {
				attr(path0, "d", path0_d_value);
			}

			if (dirty & /*cables*/ 1 && path1_stroke_value !== (path1_stroke_value = /*cable*/ ctx[6].color)) {
				attr(path1, "stroke", path1_stroke_value);
			}

			if (dirty & /*cables*/ 1 && path1_d_value !== (path1_d_value = /*cable*/ ctx[6].path)) {
				attr(path1, "d", path1_d_value);
			}
		},
		d(detaching) {
			if (detaching) detach(path0);
			if (detaching) detach(path1);
		}
	};
}

// (95:2) {#if activeCable}
function create_if_block$a(ctx) {
	let path;
	let path_stroke_value;
	let path_d_value;

	return {
		c() {
			path = svg_element("path");
			attr(path, "stroke", path_stroke_value = /*darken*/ ctx[3](/*activeCable*/ ctx[1].color, -40));
			attr(path, "stroke-width", "5");
			attr(path, "fill", "none");
			attr(path, "d", path_d_value = /*activeCable*/ ctx[1].path);
			attr(path, "class", "svelte-1jehzx5");
		},
		m(target, anchor) {
			insert(target, path, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*activeCable*/ 2 && path_stroke_value !== (path_stroke_value = /*darken*/ ctx[3](/*activeCable*/ ctx[1].color, -40))) {
				attr(path, "stroke", path_stroke_value);
			}

			if (dirty & /*activeCable*/ 2 && path_d_value !== (path_d_value = /*activeCable*/ ctx[1].path)) {
				attr(path, "d", path_d_value);
			}
		},
		d(detaching) {
			if (detaching) detach(path);
		}
	};
}

function create_fragment$c(ctx) {
	let t;
	let svg;
	let each_1_anchor;
	let mounted;
	let dispose;
	let each_value = /*cables*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	let if_block = /*activeCable*/ ctx[1] && create_if_block$a(ctx);

	return {
		c() {
			t = space();
			svg = svg_element("svg");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
			if (if_block) if_block.c();
			attr(svg, "class", "svelte-1jehzx5");
		},
		m(target, anchor) {
			insert(target, t, anchor);
			insert(target, svg, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(svg, null);
			}

			append(svg, each_1_anchor);
			if (if_block) if_block.m(svg, null);

			if (!mounted) {
				dispose = [
					listen(document_1$3.body, "mousemove", /*onMove*/ ctx[2]),
					listen(document_1$3.body, "touchmove", /*onMove*/ ctx[2])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*cables, darken*/ 9) {
				each_value = /*cables*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(svg, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (/*activeCable*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$a(ctx);
					if_block.c();
					if_block.m(svg, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
			if (detaching) detach(svg);
			destroy_each(each_blocks, detaching);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let cables = [];
	let activeCable = null;
	let patchList = [];

	const updateCables = $patches => {
		let isActive = false;

		if ($patches) {
			patchList = $patches;
		}

		const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
		const scrollY = document.documentElement.scrollTop || document.body.scrollTop;

		$$invalidate(0, cables = patchList.map(patch => {
			const elX = document.getElementById(patch.input || patch.selected);
			const elY = document.getElementById(patch.output || patch.selected);

			if (!elX || !elY) {
				return null;
			}

			const boxX = elX.getBoundingClientRect();
			const boxY = elY.getBoundingClientRect();
			const p1 = new Point(boxX.left + Math.round(elX.offsetWidth / 2) + scrollX, boxX.top - 50 + Math.round(elX.offsetHeight / 2) + 2 + scrollY);
			const p2 = new Point(boxY.left + Math.round(elY.offsetWidth / 2) + scrollX, boxY.top - 50 + Math.round(elY.offsetHeight / 2) + 2 + scrollY);

			if (patch.selected) {
				$$invalidate(1, activeCable = {
					path: getCatenaryPath(p1, p2),
					color: patch.color,
					point: patch.selected === patch.input ? p2 : p1
				});

				isActive = true;
				return null;
			}

			return {
				path: getCatenaryPath(p1, p2),
				color: patch.color
			};
		}).filter(Boolean));

		if (!isActive) {
			$$invalidate(1, activeCable = undefined);
		}
	};

	patches.store.subscribe($patches => updateCables($patches));
	modules.onAfterUpdate(() => updateCables());

	const onMove = event => {
		if (!activeCable) {
			return;
		}

		const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
		const scrollY = document.documentElement.scrollTop || document.body.scrollTop;

		const clientX = 'clientX' in event
		? event.clientX
		: event.touches[0].clientX;

		const clientY = 'clientY' in event
		? event.clientY
		: event.touches[0].clientY;

		const point = new Point(clientX + scrollX, clientY + scrollY - BAR_HEIGHT);
		const path = getCatenaryPath(activeCable.point, point);
		$$invalidate(1, activeCable = { ...activeCable, path });
	};

	const darken = (color, amount) => {
		return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
	};

	return [cables, activeCable, onMove, darken];
}

class Cables extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, {}, add_css$a);
	}
}

class Libraries {
    constructor() {
        this.libraries = writable([]);
    }
    async add(libList) {
        const $libs = get_store_value(this.libraries);
        return Promise.all(libList.map((lib) => {
            return new Promise((resolve) => {
                const exists = $libs.find(($lib) => $lib.id === lib);
                let $script = exists === null || exists === void 0 ? void 0 : exists.script;
                if (!$script) {
                    $script = document.createElement('script');
                    $script.src = lib;
                    this.libraries.update(($libs) => $libs.concat({ id: lib, loaded: false, script: $script }));
                    document.body.appendChild($script);
                    $script.addEventListener('load', () => {
                        this.libraries.update(($libs) => $libs.map(($lib) => ($lib.id === lib ? { ...$lib, loaded: true } : $lib)));
                    });
                }
                if (exists === null || exists === void 0 ? void 0 : exists.loaded) {
                    resolve(null);
                }
                else {
                    $script.addEventListener('load', resolve);
                }
            });
        }));
    }
}
const libraries = new Libraries();

/* src/rack/Container.svelte generated by Svelte v3.44.2 */

const { document: document_1$2 } = globals;

function add_css$9(target) {
	append_styles(target, "svelte-bm9ne0", "div.svelte-bm9ne0{display:block;position:absolute;will-change:transform;user-select:none;top:0px;left:0px}div *{user-select:none;-webkit-user-select:none}.preview.svelte-bm9ne0{background-size:100% 100%}");
}

// (128:0) {:else}
function create_else_block$3(ctx) {
	let div;
	let loading;
	let div_id_value;
	let current;
	loading = new Loading({});

	return {
		c() {
			div = element("div");
			create_component(loading.$$.fragment);
			attr(div, "id", div_id_value = /*module*/ ctx[0].id);
			attr(div, "class", "preview svelte-bm9ne0");
			set_style(div, "background-image", "url('/patchcab/modules/" + /*module*/ ctx[0].type + ".png')");
			set_style(div, "transform", "translate(" + /*position*/ ctx[2].x + "px, " + (/*position*/ ctx[2].y + BAR_HEIGHT) + "px)");
			set_style(div, "width", /*module*/ ctx[0].size.w * HP.w + "px");
			set_style(div, "height", /*module*/ ctx[0].size.h * HP.h + "px");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(loading, div, null);
			current = true;
		},
		p(ctx, dirty) {
			if (!current || dirty & /*module*/ 1 && div_id_value !== (div_id_value = /*module*/ ctx[0].id)) {
				attr(div, "id", div_id_value);
			}

			if (!current || dirty & /*module*/ 1) {
				set_style(div, "background-image", "url('/patchcab/modules/" + /*module*/ ctx[0].type + ".png')");
			}

			if (!current || dirty & /*position*/ 4) {
				set_style(div, "transform", "translate(" + /*position*/ ctx[2].x + "px, " + (/*position*/ ctx[2].y + BAR_HEIGHT) + "px)");
			}

			if (!current || dirty & /*module*/ 1) {
				set_style(div, "width", /*module*/ ctx[0].size.w * HP.w + "px");
			}

			if (!current || dirty & /*module*/ 1) {
				set_style(div, "height", /*module*/ ctx[0].size.h * HP.h + "px");
			}
		},
		i(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(loading);
		}
	};
}

// (115:0) {#if Component}
function create_if_block$9(ctx) {
	let div;
	let switch_instance;
	let updating_state;
	let div_id_value;
	let current;
	let mounted;
	let dispose;

	function switch_instance_state_binding(value) {
		/*switch_instance_state_binding*/ ctx[14](value);
	}

	var switch_value = /*Component*/ ctx[5];

	function switch_props(ctx) {
		let switch_instance_props = {};

		if (/*state*/ ctx[1] !== void 0) {
			switch_instance_props.state = /*state*/ ctx[1];
		}

		return { props: switch_instance_props };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
		binding_callbacks.push(() => bind(switch_instance, 'state', switch_instance_state_binding));
	}

	return {
		c() {
			div = element("div");
			if (switch_instance) create_component(switch_instance.$$.fragment);
			attr(div, "id", div_id_value = /*module*/ ctx[0].id);
			set_style(div, "transform", "translate(" + /*position*/ ctx[2].x + "px, " + (/*position*/ ctx[2].y + BAR_HEIGHT) + "px)");
			set_style(div, "width", /*module*/ ctx[0].size.w * HP.w + "px");
			set_style(div, "height", /*module*/ ctx[0].size.h * HP.h + "px");
			attr(div, "class", "svelte-bm9ne0");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (switch_instance) {
				mount_component(switch_instance, div, null);
			}

			/*div_binding*/ ctx[15](div);
			current = true;

			if (!mounted) {
				dispose = [
					listen(div, "mousedown", /*onMouseDown*/ ctx[11]),
					listen(div, "contextmenu", /*onMenu*/ ctx[8]),
					action_destroyer(useDrag.call(null, div, /*onMove*/ ctx[13])),
					action_destroyer(useClickOutside.call(null, div, /*onGlobalDown*/ ctx[12]))
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			const switch_instance_changes = {};

			if (!updating_state && dirty & /*state*/ 2) {
				updating_state = true;
				switch_instance_changes.state = /*state*/ ctx[1];
				add_flush_callback(() => updating_state = false);
			}

			if (switch_value !== (switch_value = /*Component*/ ctx[5])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					binding_callbacks.push(() => bind(switch_instance, 'state', switch_instance_state_binding));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, div, null);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}

			if (!current || dirty & /*module*/ 1 && div_id_value !== (div_id_value = /*module*/ ctx[0].id)) {
				attr(div, "id", div_id_value);
			}

			if (!current || dirty & /*position*/ 4) {
				set_style(div, "transform", "translate(" + /*position*/ ctx[2].x + "px, " + (/*position*/ ctx[2].y + BAR_HEIGHT) + "px)");
			}

			if (!current || dirty & /*module*/ 1) {
				set_style(div, "width", /*module*/ ctx[0].size.w * HP.w + "px");
			}

			if (!current || dirty & /*module*/ 1) {
				set_style(div, "height", /*module*/ ctx[0].size.h * HP.h + "px");
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (switch_instance) destroy_component(switch_instance);
			/*div_binding*/ ctx[15](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (141:2) <Menu bind:visible={contextVisible}>
function create_default_slot$4(ctx) {
	let button0;
	let t2;
	let hr;
	let t3;
	let button1;
	let mounted;
	let dispose;

	return {
		c() {
			button0 = element("button");
			button0.innerHTML = `Remove <strong>BACKSPACE</strong>`;
			t2 = space();
			hr = element("hr");
			t3 = space();
			button1 = element("button");
			button1.textContent = "Duplicate";
		},
		m(target, anchor) {
			insert(target, button0, anchor);
			insert(target, t2, anchor);
			insert(target, hr, anchor);
			insert(target, t3, anchor);
			insert(target, button1, anchor);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*onContextRemove*/ ctx[9]),
					listen(button1, "click", /*onContextDuplicate*/ ctx[10])
				];

				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(button0);
			if (detaching) detach(t2);
			if (detaching) detach(hr);
			if (detaching) detach(t3);
			if (detaching) detach(button1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$b(ctx) {
	let t0;
	let current_block_type_index;
	let if_block;
	let t1;
	let div;
	let menu;
	let updating_visible;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$9, create_else_block$3];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*Component*/ ctx[5]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	function menu_visible_binding(value) {
		/*menu_visible_binding*/ ctx[16](value);
	}

	let menu_props = {
		$$slots: { default: [create_default_slot$4] },
		$$scope: { ctx }
	};

	if (/*contextVisible*/ ctx[3] !== void 0) {
		menu_props.visible = /*contextVisible*/ ctx[3];
	}

	menu = new Menu({ props: menu_props });
	binding_callbacks.push(() => bind(menu, 'visible', menu_visible_binding));

	return {
		c() {
			t0 = space();
			if_block.c();
			t1 = space();
			div = element("div");
			create_component(menu.$$.fragment);
			set_style(div, "transform", "translate(" + /*contextPosition*/ ctx[4].x + "px, " + /*contextPosition*/ ctx[4].y + "px)");
			set_style(div, "z-index", "var(--zindex-menu)");
			attr(div, "class", "svelte-bm9ne0");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, t1, anchor);
			insert(target, div, anchor);
			mount_component(menu, div, null);
			current = true;

			if (!mounted) {
				dispose = listen(document_1$2.body, "keydown", /*onKey*/ ctx[7]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(t1.parentNode, t1);
			}

			const menu_changes = {};

			if (dirty & /*$$scope*/ 524288) {
				menu_changes.$$scope = { dirty, ctx };
			}

			if (!updating_visible && dirty & /*contextVisible*/ 8) {
				updating_visible = true;
				menu_changes.visible = /*contextVisible*/ ctx[3];
				add_flush_callback(() => updating_visible = false);
			}

			menu.$set(menu_changes);

			if (!current || dirty & /*contextPosition*/ 16) {
				set_style(div, "transform", "translate(" + /*contextPosition*/ ctx[4].x + "px, " + /*contextPosition*/ ctx[4].y + "px)");
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(menu.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			transition_out(menu.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(t1);
			if (detaching) detach(div);
			destroy_component(menu);
			mounted = false;
			dispose();
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { module } = $$props;
	let state = module.state;
	let position = module.position;
	let contextVisible = false;
	let contextPosition = { x: 0, y: 0 };
	setContext('module', { id: module.id });
	let Component;
	let container;
	let active = false;

	const getModule = async moduleType => {
		try {
			const { default: Comp } = await import(`/patchcab/modules/${moduleType}.js`);
			$$invalidate(5, Component = Comp);
		} catch(err) {
			console.log('Failed loading module', err);
		}
	};

	const onKey = e => {
		if (isShortcut(e) && active && e.key === 'Backspace') {
			modules.remove(module.id);
			patches.remove(module.id);
		}
	};

	const onMenu = e => {
		e.preventDefault();
		const scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
		const scrollY = document.documentElement.scrollTop || document.body.scrollTop;

		$$invalidate(4, contextPosition = {
			x: e.clientX + scrollX - 20,
			y: e.clientY + scrollY - BAR_HEIGHT
		});

		$$invalidate(3, contextVisible = true);
	};

	const onContextRemove = () => {
		modules.remove(module.id);
		patches.remove(module.id);
	};

	const onContextDuplicate = () => {
		modules.add({
			type: module.type,
			size: module.size,
			libs: module.libs,
			state: undefined
		});
	};

	const onMouseDown = e => {
		if (e.buttons > 1) {
			e.stopPropagation();
		}

		active = true;
	};

	const onGlobalDown = () => {
		active = false;
	};

	const onMove = (x, y, box) => {
		x = Math.round(x - x % HP.w);
		y = Math.round(y - y % HP.h);

		if (x < 0 || y < 0) {
			return;
		}

		if (x !== box.x || y !== box.y) {
			const moved = modules.move(module, x, y);

			if (moved) {
				$$invalidate(2, position = { x, y });
			}
		}
	};

	afterUpdate(() => {
		modules.afterUpdate();
	});

	onMount(async () => {
		await libraries.add(module.libs);
		getModule(module.type);
	});

	function switch_instance_state_binding(value) {
		state = value;
		$$invalidate(1, state);
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			container = $$value;
			$$invalidate(6, container);
		});
	}

	function menu_visible_binding(value) {
		contextVisible = value;
		$$invalidate(3, contextVisible);
	}

	$$self.$$set = $$props => {
		if ('module' in $$props) $$invalidate(0, module = $$props.module);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*module, state*/ 3) {
			modules.update(module.id, state);
		}
	};

	return [
		module,
		state,
		position,
		contextVisible,
		contextPosition,
		Component,
		container,
		onKey,
		onMenu,
		onContextRemove,
		onContextDuplicate,
		onMouseDown,
		onGlobalDown,
		onMove,
		switch_instance_state_binding,
		div_binding,
		menu_visible_binding
	];
}

class Container extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$b, create_fragment$b, safe_not_equal, { module: 0 }, add_css$9);
	}
}

/* src/rack/Preview.svelte generated by Svelte v3.44.2 */

function add_css$8(target) {
	append_styles(target, "svelte-j0kwcy", "div.svelte-j0kwcy{display:block;position:relative;float:left;margin:0 8px 8px 0;cursor:pointer;background:var(--color-ui-bg);opacity:0.3}div.loaded.svelte-j0kwcy{opacity:1}img.svelte-j0kwcy{width:100%;height:100%}");
}

// (39:2) {:else}
function create_else_block$2(ctx) {
	let loading;
	let current;
	loading = new Loading({});

	return {
		c() {
			create_component(loading.$$.fragment);
		},
		m(target, anchor) {
			mount_component(loading, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(loading, detaching);
		}
	};
}

// (37:2) {#if loaded}
function create_if_block$8(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr(img, "src", img_src_value);
			attr(img, "alt", "");
			attr(img, "class", "svelte-j0kwcy");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*src*/ 1 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) {
				attr(img, "src", img_src_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function create_fragment$a(ctx) {
	let div;
	let current_block_type_index;
	let if_block;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$8, create_else_block$2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*loaded*/ ctx[2]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "style", /*style*/ ctx[1]);
			attr(div, "class", "svelte-j0kwcy");
			toggle_class(div, "loaded", /*loaded*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			current = true;

			if (!mounted) {
				dispose = listen(div, "click", /*click_handler*/ ctx[3]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(div, null);
			}

			if (!current || dirty & /*style*/ 2) {
				attr(div, "style", /*style*/ ctx[1]);
			}

			if (dirty & /*loaded*/ 4) {
				toggle_class(div, "loaded", /*loaded*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { src } = $$props;
	let { style } = $$props;
	let loaded = false;

	onMount(() => {
		const image = new Image();

		image.addEventListener('load', () => {
			$$invalidate(2, loaded = true);
		});

		image.src = src;
	});

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('src' in $$props) $$invalidate(0, src = $$props.src);
		if ('style' in $$props) $$invalidate(1, style = $$props.style);
	};

	return [src, style, loaded, click_handler];
}

class Preview extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, { src: 0, style: 1 }, add_css$8);
	}
}

/* src/rack/Shelf.svelte generated by Svelte v3.44.2 */

const { document: document_1$1 } = globals;

function add_css$7(target) {
	append_styles(target, "svelte-1jk7er6", "main.svelte-1jk7er6.svelte-1jk7er6{position:fixed;display:flex;top:0px;left:0px;right:0px;bottom:0px;background:var(--color-ui-bg-secondary);z-index:var(--zindex-modal)}aside.svelte-1jk7er6.svelte-1jk7er6{flex:0 1 300px;background:var(--color-ui-bg)}button.close.svelte-1jk7er6.svelte-1jk7er6{display:flex;justify-content:center;align-items:center;width:48px;height:48px}nav.svelte-1jk7er6 button.svelte-1jk7er6{justify-content:space-between;padding:12px 16px;min-width:200px;text-align:left;width:100%;text-transform:capitalize}button.svelte-1jk7er6 span.svelte-1jk7er6{display:inline-block;text-align:center;width:12px}span.tag.svelte-1jk7er6.svelte-1jk7er6{color:var(--color-2)}span.author.svelte-1jk7er6.svelte-1jk7er6{color:var(--color-5)}nav.svelte-1jk7er6 button.svelte-1jk7er6:hover,button.active.svelte-1jk7er6.svelte-1jk7er6{background:var(--color-ui-hover)}section.svelte-1jk7er6.svelte-1jk7er6{display:block;width:100%;height:100%;padding:40px 16px;overflow-y:scroll;overflow-x:hidden}");
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[15] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	return child_ctx;
}

// (113:0) {#if visible && library}
function create_if_block$7(ctx) {
	let main;
	let aside;
	let button0;
	let t0;
	let hr0;
	let t1;
	let nav;
	let button1;
	let t3;
	let hr1;
	let t4;
	let t5;
	let hr2;
	let t6;
	let t7;
	let section;
	let each_blocks = [];
	let each2_lookup = new Map();
	let current;
	let mounted;
	let dispose;
	let each_value_2 = /*tags*/ ctx[7];
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let each_value_1 = /*authors*/ ctx[6];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	let each_value = /*items*/ ctx[5];
	const get_key = ctx => /*module*/ ctx[15].name;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$2(ctx, each_value, i);
		let key = get_key(child_ctx);
		each2_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
	}

	return {
		c() {
			main = element("main");
			aside = element("aside");
			button0 = element("button");

			button0.innerHTML = `<svg width="17" height="17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.793 8.5L.646 15.646l.708.708L8.5 9.207l7.146 7.147.708-.707L9.207 8.5l7.147-7.146-.707-.708L8.5 7.793
						1.354.646l-.708.708L7.793 8.5z" fill="#C4C4C4"></path></svg>`;

			t0 = space();
			hr0 = element("hr");
			t1 = space();
			nav = element("nav");
			button1 = element("button");

			button1.innerHTML = `<span class="svelte-1jk7er6"></span>
          All`;

			t3 = space();
			hr1 = element("hr");
			t4 = space();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t5 = space();
			hr2 = element("hr");
			t6 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t7 = space();
			section = element("section");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(button0, "aria-label", "Close");
			attr(button0, "class", "close svelte-1jk7er6");
			attr(button1, "class", "svelte-1jk7er6");
			toggle_class(button1, "active", !/*tag*/ ctx[2] && !/*author*/ ctx[3]);
			attr(nav, "class", "svelte-1jk7er6");
			attr(aside, "class", "svelte-1jk7er6");
			attr(section, "class", "svelte-1jk7er6");
			attr(main, "class", "svelte-1jk7er6");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, aside);
			append(aside, button0);
			append(aside, t0);
			append(aside, hr0);
			append(aside, t1);
			append(aside, nav);
			append(nav, button1);
			append(nav, t3);
			append(nav, hr1);
			append(nav, t4);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].m(nav, null);
			}

			append(nav, t5);
			append(nav, hr2);
			append(nav, t6);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(nav, null);
			}

			append(main, t7);
			append(main, section);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(section, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[10]),
					listen(button1, "click", /*click_handler_1*/ ctx[11])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*tag, author*/ 12) {
				toggle_class(button1, "active", !/*tag*/ ctx[2] && !/*author*/ ctx[3]);
			}

			if (dirty & /*tags, tag*/ 132) {
				each_value_2 = /*tags*/ ctx[7];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_2(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(nav, t5);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_2.length;
			}

			if (dirty & /*authors, author*/ 72) {
				each_value_1 = /*authors*/ ctx[6];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(nav, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*items, safeName, HP, onAdd*/ 288) {
				each_value = /*items*/ ctx[5];
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each2_lookup, section, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(main);
			destroy_each(each_blocks_2, detaching);
			destroy_each(each_blocks_1, detaching);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (137:8) {#each tags as item}
function create_each_block_2(ctx) {
	let button;
	let span;
	let t1;
	let t2_value = /*item*/ ctx[18] + "";
	let t2;
	let mounted;
	let dispose;

	function click_handler_2() {
		return /*click_handler_2*/ ctx[12](/*item*/ ctx[18]);
	}

	return {
		c() {
			button = element("button");
			span = element("span");
			span.textContent = "#";
			t1 = space();
			t2 = text(t2_value);
			attr(span, "class", "tag svelte-1jk7er6");
			attr(button, "class", "svelte-1jk7er6");
			toggle_class(button, "active", /*item*/ ctx[18] === /*tag*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			append(button, t1);
			append(button, t2);

			if (!mounted) {
				dispose = listen(button, "click", click_handler_2);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*tags*/ 128 && t2_value !== (t2_value = /*item*/ ctx[18] + "")) set_data(t2, t2_value);

			if (dirty & /*tags, tag*/ 132) {
				toggle_class(button, "active", /*item*/ ctx[18] === /*tag*/ ctx[2]);
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (144:8) {#each authors as item}
function create_each_block_1(ctx) {
	let button;
	let span;
	let t1;
	let t2_value = /*item*/ ctx[18] + "";
	let t2;
	let t3;
	let mounted;
	let dispose;

	function click_handler_3() {
		return /*click_handler_3*/ ctx[13](/*item*/ ctx[18]);
	}

	return {
		c() {
			button = element("button");
			span = element("span");
			span.textContent = "@";
			t1 = space();
			t2 = text(t2_value);
			t3 = space();
			attr(span, "class", "author svelte-1jk7er6");
			attr(button, "class", "svelte-1jk7er6");
			toggle_class(button, "active", /*item*/ ctx[18] === /*author*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			append(button, t1);
			append(button, t2);
			append(button, t3);

			if (!mounted) {
				dispose = listen(button, "click", click_handler_3);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*authors*/ 64 && t2_value !== (t2_value = /*item*/ ctx[18] + "")) set_data(t2, t2_value);

			if (dirty & /*authors, author*/ 72) {
				toggle_class(button, "active", /*item*/ ctx[18] === /*author*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (153:6) {#each items as module (module.name)}
function create_each_block$2(key_1, ctx) {
	let first;
	let preview;
	let current;

	function click_handler_4() {
		return /*click_handler_4*/ ctx[14](/*module*/ ctx[15]);
	}

	preview = new Preview({
			props: {
				src: "/patchcab/modules/" + /*module*/ ctx[15].set + "/" + safeName(/*module*/ ctx[15].name) + ".png",
				style: "width: " + /*module*/ ctx[15].size.w * HP.w + "px; height: " + /*module*/ ctx[15].size.h * HP.h + "px;"
			}
		});

	preview.$on("click", click_handler_4);

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(preview.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(preview, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const preview_changes = {};
			if (dirty & /*items*/ 32) preview_changes.src = "/patchcab/modules/" + /*module*/ ctx[15].set + "/" + safeName(/*module*/ ctx[15].name) + ".png";
			if (dirty & /*items*/ 32) preview_changes.style = "width: " + /*module*/ ctx[15].size.w * HP.w + "px; height: " + /*module*/ ctx[15].size.h * HP.h + "px;";
			preview.$set(preview_changes);
		},
		i(local) {
			if (current) return;
			transition_in(preview.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(preview.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(first);
			destroy_component(preview, detaching);
		}
	};
}

function create_fragment$9(ctx) {
	let t;
	let if_block_anchor;
	let current;
	let mounted;
	let dispose;
	let if_block = /*visible*/ ctx[4] && /*library*/ ctx[1] && create_if_block$7(ctx);

	return {
		c() {
			t = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			insert(target, t, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(document_1$1.body, "keydown", /*onKey*/ ctx[9]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*visible*/ ctx[4] && /*library*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*visible, library*/ 18) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$7(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
			mounted = false;
			dispose();
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let visible;
	let tags;
	let authors;
	let items;
	let { view } = $$props;
	let { library } = $$props;
	let tag = null;
	let author = null;

	const onAdd = module => {
		modules.add({
			type: `${module.set}/${safeName(module.name)}`,
			size: module.size,
			libs: module.libs,
			state: undefined
		});

		$$invalidate(0, view = 'rack');
	};

	const onKey = e => {
		if (isShortcut(e) && e.key === ' ') {
			e.preventDefault();
			$$invalidate(0, view = visible ? 'rack' : 'shelf');
		}
	};

	const click_handler = () => $$invalidate(0, view = 'rack');

	const click_handler_1 = () => {
		$$invalidate(2, tag = null);
		$$invalidate(3, author = null);
	};

	const click_handler_2 = item => $$invalidate(2, tag = tag !== item ? item : null);
	const click_handler_3 = item => $$invalidate(3, author = author !== item ? item : null);
	const click_handler_4 = module => onAdd(module);

	$$self.$$set = $$props => {
		if ('view' in $$props) $$invalidate(0, view = $$props.view);
		if ('library' in $$props) $$invalidate(1, library = $$props.library);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*view*/ 1) {
			$$invalidate(4, visible = view === 'shelf');
		}

		if ($$self.$$.dirty & /*visible*/ 16) {
			{
				if (visible) {
					document.body.classList.add('overlay');
				} else {
					document.body.classList.remove('overlay');
				}
			}
		}

		if ($$self.$$.dirty & /*library*/ 2) {
			$$invalidate(7, tags = library
			? [...new Set(library.map(item => item.tags).flat())].sort()
			: []);
		}

		if ($$self.$$.dirty & /*library*/ 2) {
			$$invalidate(6, authors = library
			? [...new Set(library.map(item => item.author.name))].sort()
			: []);
		}

		if ($$self.$$.dirty & /*library, tag, author*/ 14) {
			$$invalidate(5, items = library
			? library.filter(item => {
					let show = true;

					if (tag && item.tags.indexOf(tag) < 0) {
						show = false;
					}

					if (author && item.author.name !== author) {
						show = false;
					}

					return show;
				})
			: []);
		}
	};

	return [
		view,
		library,
		tag,
		author,
		visible,
		items,
		authors,
		tags,
		onAdd,
		onKey,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4
	];
}

class Shelf extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { view: 0, library: 1 }, add_css$7);
	}
}

/* src/rack/Help.svelte generated by Svelte v3.44.2 */

const { document: document_1 } = globals;

function add_css$6(target) {
	append_styles(target, "svelte-1yek3ug", "main.svelte-1yek3ug.svelte-1yek3ug{position:fixed;display:flex;align-items:center;justify-content:center;top:0px;left:0px;right:0px;bottom:0px;background:var(--color-ui-bg);z-index:var(--zindex-modal)}button.close.svelte-1yek3ug.svelte-1yek3ug{position:absolute;top:0px;left:0px;display:flex;justify-content:center;align-items:center;width:48px;height:48px}ul.svelte-1yek3ug.svelte-1yek3ug{width:100%;max-width:420px}li.svelte-1yek3ug.svelte-1yek3ug{display:flex;justify-content:space-between;list-style:none;font-size:13px;font-weight:300;margin:0 12px;padding:12px}hr.svelte-1yek3ug.svelte-1yek3ug{border-bottom:dashed 1px var(--color-dark-highlight);margin:0 6px;flex:1}li.svelte-1yek3ug:hover hr.svelte-1yek3ug{border-color:var(--color-light-shadow)}");
}

// (72:0) {#if visible}
function create_if_block$6(ctx) {
	let main;
	let button;
	let t0;
	let ul;
	let mounted;
	let dispose;

	return {
		c() {
			main = element("main");
			button = element("button");

			button.innerHTML = `<svg width="17" height="17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.793 8.5L.646 15.646l.708.708L8.5 9.207l7.146 7.147.708-.707L9.207 8.5l7.147-7.146-.707-.708L8.5 7.793
                          1.354.646l-.708.708L7.793 8.5z" fill="#C4C4C4"></path></svg>`;

			t0 = space();
			ul = element("ul");

			ul.innerHTML = `<li class="svelte-1yek3ug">Open/Close module library
        <hr class="svelte-1yek3ug"/> 
        <strong>SPACE</strong></li> 
      <li class="svelte-1yek3ug">Remove a module (click it first)
        <hr class="svelte-1yek3ug"/> 
        <strong>BACKSPACE</strong></li> 
      <li class="svelte-1yek3ug">Connect more than one patch cable
        <hr class="svelte-1yek3ug"/> 
        <strong>SHIFT+CLICK</strong></li> 
      <li class="svelte-1yek3ug">Duplicate a module
        <hr class="svelte-1yek3ug"/> 
        <strong>RIGHT CLICK</strong></li> 
      <li class="svelte-1yek3ug">Mute/Unmute all outputs
        <hr class="svelte-1yek3ug"/> 
        <strong>ENTER</strong></li> 
      <li class="svelte-1yek3ug">Open synth from a file
        <hr class="svelte-1yek3ug"/> 
        <strong>CTRL + O</strong></li> 
      <li class="svelte-1yek3ug">Save synth to a file
        <hr class="svelte-1yek3ug"/> 
        <strong>CTRL + S</strong></li>`;

			attr(button, "aria-label", "Close");
			attr(button, "class", "close svelte-1yek3ug");
			attr(ul, "class", "svelte-1yek3ug");
			attr(main, "class", "svelte-1yek3ug");
		},
		m(target, anchor) {
			insert(target, main, anchor);
			append(main, button);
			append(main, t0);
			append(main, ul);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[3]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(main);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$8(ctx) {
	let t;
	let if_block_anchor;
	let mounted;
	let dispose;
	let if_block = /*visible*/ ctx[1] && create_if_block$6(ctx);

	return {
		c() {
			t = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			insert(target, t, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);

			if (!mounted) {
				dispose = listen(document_1.body, "keydown", /*onKey*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*visible*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$6(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
			mounted = false;
			dispose();
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let visible;
	let { view } = $$props;

	const onKey = e => {
		if (isShortcut(e) && visible && e.key === 'Escape') {
			e.preventDefault();
			$$invalidate(0, view = 'rack');
		}
	};

	const click_handler = () => $$invalidate(0, view = 'rack');

	$$self.$$set = $$props => {
		if ('view' in $$props) $$invalidate(0, view = $$props.view);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*view*/ 1) {
			$$invalidate(1, visible = view === 'help');
		}

		if ($$self.$$.dirty & /*visible*/ 2) {
			{
				if (visible) {
					document.body.classList.add('overlay');
				} else {
					document.body.classList.remove('overlay');
				}
			}
		}
	};

	return [view, visible, onKey, click_handler];
}

class Help extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { view: 0 }, add_css$6);
	}
}

/* src/Patchcab.svelte generated by Svelte v3.44.2 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[12] = list[i];
	return child_ctx;
}

// (49:0) {:else}
function create_else_block$1(ctx) {
	let bar;
	let updating_title;
	let updating_view;
	let t0;
	let shelf;
	let updating_view_1;
	let t1;
	let help;
	let updating_view_2;
	let t2;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t3;
	let cables;
	let current;

	function bar_title_binding(value) {
		/*bar_title_binding*/ ctx[8](value);
	}

	function bar_view_binding(value) {
		/*bar_view_binding*/ ctx[9](value);
	}

	let bar_props = {
		library: /*library*/ ctx[2],
		api: /*api*/ ctx[0]
	};

	if (/*title*/ ctx[4] !== void 0) {
		bar_props.title = /*title*/ ctx[4];
	}

	if (/*view*/ ctx[1] !== void 0) {
		bar_props.view = /*view*/ ctx[1];
	}

	bar = new Bar({ props: bar_props });
	binding_callbacks.push(() => bind(bar, 'title', bar_title_binding));
	binding_callbacks.push(() => bind(bar, 'view', bar_view_binding));

	function shelf_view_binding(value) {
		/*shelf_view_binding*/ ctx[10](value);
	}

	let shelf_props = { library: /*library*/ ctx[2] };

	if (/*view*/ ctx[1] !== void 0) {
		shelf_props.view = /*view*/ ctx[1];
	}

	shelf = new Shelf({ props: shelf_props });
	binding_callbacks.push(() => bind(shelf, 'view', shelf_view_binding));

	function help_view_binding(value) {
		/*help_view_binding*/ ctx[11](value);
	}

	let help_props = {};

	if (/*view*/ ctx[1] !== void 0) {
		help_props.view = /*view*/ ctx[1];
	}

	help = new Help({ props: help_props });
	binding_callbacks.push(() => bind(help, 'view', help_view_binding));
	let each_value = /*$modulesAll*/ ctx[5];
	const get_key = ctx => /*module*/ ctx[12].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$1(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
	}

	cables = new Cables({});

	return {
		c() {
			create_component(bar.$$.fragment);
			t0 = space();
			create_component(shelf.$$.fragment);
			t1 = space();
			create_component(help.$$.fragment);
			t2 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t3 = space();
			create_component(cables.$$.fragment);
		},
		m(target, anchor) {
			mount_component(bar, target, anchor);
			insert(target, t0, anchor);
			mount_component(shelf, target, anchor);
			insert(target, t1, anchor);
			mount_component(help, target, anchor);
			insert(target, t2, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, t3, anchor);
			mount_component(cables, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const bar_changes = {};
			if (dirty & /*library*/ 4) bar_changes.library = /*library*/ ctx[2];
			if (dirty & /*api*/ 1) bar_changes.api = /*api*/ ctx[0];

			if (!updating_title && dirty & /*title*/ 16) {
				updating_title = true;
				bar_changes.title = /*title*/ ctx[4];
				add_flush_callback(() => updating_title = false);
			}

			if (!updating_view && dirty & /*view*/ 2) {
				updating_view = true;
				bar_changes.view = /*view*/ ctx[1];
				add_flush_callback(() => updating_view = false);
			}

			bar.$set(bar_changes);
			const shelf_changes = {};
			if (dirty & /*library*/ 4) shelf_changes.library = /*library*/ ctx[2];

			if (!updating_view_1 && dirty & /*view*/ 2) {
				updating_view_1 = true;
				shelf_changes.view = /*view*/ ctx[1];
				add_flush_callback(() => updating_view_1 = false);
			}

			shelf.$set(shelf_changes);
			const help_changes = {};

			if (!updating_view_2 && dirty & /*view*/ 2) {
				updating_view_2 = true;
				help_changes.view = /*view*/ ctx[1];
				add_flush_callback(() => updating_view_2 = false);
			}

			help.$set(help_changes);

			if (dirty & /*$modulesAll*/ 32) {
				each_value = /*$modulesAll*/ ctx[5];
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, t3.parentNode, outro_and_destroy_block, create_each_block$1, t3, get_each_context$1);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(bar.$$.fragment, local);
			transition_in(shelf.$$.fragment, local);
			transition_in(help.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(cables.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(bar.$$.fragment, local);
			transition_out(shelf.$$.fragment, local);
			transition_out(help.$$.fragment, local);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(cables.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(bar, detaching);
			if (detaching) detach(t0);
			destroy_component(shelf, detaching);
			if (detaching) detach(t1);
			destroy_component(help, detaching);
			if (detaching) detach(t2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d(detaching);
			}

			if (detaching) detach(t3);
			destroy_component(cables, detaching);
		}
	};
}

// (47:0) {#if loading}
function create_if_block$5(ctx) {
	let loading_1;
	let current;
	loading_1 = new Loading({});

	return {
		c() {
			create_component(loading_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(loading_1, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(loading_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(loading_1, detaching);
		}
	};
}

// (54:2) {#each $modulesAll as module (module.id)}
function create_each_block$1(key_1, ctx) {
	let first;
	let container;
	let current;
	container = new Container({ props: { module: /*module*/ ctx[12] } });

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(container.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(container, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const container_changes = {};
			if (dirty & /*$modulesAll*/ 32) container_changes.module = /*module*/ ctx[12];
			container.$set(container_changes);
		},
		i(local) {
			if (current) return;
			transition_in(container.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(container.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(first);
			destroy_component(container, detaching);
		}
	};
}

function create_fragment$7(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$5, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*loading*/ ctx[3]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $modulesAll;
	let { api } = $$props;
	let { rack } = $$props;
	let view = 'rack';
	let library;
	let modulesAll = modules.store;
	component_subscribe($$self, modulesAll, value => $$invalidate(5, $modulesAll = value));
	let loading = false;
	let title = '';

	onMount(async () => {
		const response = await fetch('/patchcab/modules.json');

		try {
			$$invalidate(2, library = await response.json());
		} catch(error) {
			console.error(error);
			$$invalidate(2, library = []);
		}

		$$invalidate(4, title = 'My untiled synth');

		if (api) {
			const path = location.pathname;

			if (path.length === 9) {
				$$invalidate(3, loading = true);
				$$invalidate(4, title = '');

				try {
					const response = await fetch(`${api}?url=${path.substr(1)}`);
					const data = await response.json();
					stateImport(data.rack, library);
					$$invalidate(4, title = data.rack.title);
					$$invalidate(3, loading = false);
					return;
				} catch(err) {
					console.log(err);
				}

				$$invalidate(3, loading = false);
			}
		}

		if (rack) {
			stateImport(rack, library);
		}
	});

	function bar_title_binding(value) {
		title = value;
		$$invalidate(4, title);
	}

	function bar_view_binding(value) {
		view = value;
		$$invalidate(1, view);
	}

	function shelf_view_binding(value) {
		view = value;
		$$invalidate(1, view);
	}

	function help_view_binding(value) {
		view = value;
		$$invalidate(1, view);
	}

	$$self.$$set = $$props => {
		if ('api' in $$props) $$invalidate(0, api = $$props.api);
		if ('rack' in $$props) $$invalidate(7, rack = $$props.rack);
	};

	return [
		api,
		view,
		library,
		loading,
		title,
		$modulesAll,
		modulesAll,
		rack,
		bar_title_binding,
		bar_view_binding,
		shelf_view_binding,
		help_view_binding
	];
}

class Patchcab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { api: 0, rack: 7 });
	}
}

/* src/components/Faceplate.svelte generated by Svelte v3.44.2 */

function add_css$5(target) {
	append_styles(target, "svelte-1ugmpjz", "div.svelte-1ugmpjz{display:block;width:100%;height:100%;position:relative}h1.svelte-1ugmpjz,svg.svelte-1ugmpjz{pointer-events:none}h1.svelte-1ugmpjz{font-family:'Routed Gothic Wide';font-size:14px;line-height:14px;position:absolute;text-align:center;top:24px;width:100%}svg.svelte-1ugmpjz{position:absolute;opacity:0.4}.screw-1.svelte-1ugmpjz,.screw-2.svelte-1ugmpjz{top:2px}.screw-3.svelte-1ugmpjz,.screw-4.svelte-1ugmpjz{bottom:3px}.screw-1.svelte-1ugmpjz,.screw-3.svelte-1ugmpjz{left:2px}.screw-2.svelte-1ugmpjz,.screw-4.svelte-1ugmpjz{right:2px}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

// (56:2) {#if title}
function create_if_block$4(ctx) {
	let h1;
	let t;

	return {
		c() {
			h1 = element("h1");
			t = text(/*title*/ ctx[0]);
			attr(h1, "class", "svelte-1ugmpjz");
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			append(h1, t);
		},
		p(ctx, dirty) {
			if (dirty & /*title*/ 1) set_data(t, /*title*/ ctx[0]);
		},
		d(detaching) {
			if (detaching) detach(h1);
		}
	};
}

// (60:2) {#each [1, 2, 3, 4] as index}
function create_each_block(ctx) {
	let svg;
	let path;
	let svg_class_value;

	return {
		c() {
			svg = svg_element("svg");
			path = svg_element("path");
			attr(path, "d", "M6 12A6 6 0 106 0a6 6 0 000 12zm5-6A5 5 0 111 6a5 5 0 0110 0zM4 4.667L4.667 4 6 5.333 7.333 4 8 4.667 6.667 6\n\t\t\t\t8 7.333 7.333 8 6 6.667 4.667 8 4 7.333 5.333 6 4 4.667z");
			attr(path, "fill", "currentColor");
			attr(svg, "class", svg_class_value = "" + (null_to_empty(`screw-${/*index*/ ctx[5]}`) + " svelte-1ugmpjz"));
			attr(svg, "width", "12");
			attr(svg, "height", "12");
			attr(svg, "fill", "none");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, path);
		},
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

function create_fragment$6(ctx) {
	let div;
	let t0;
	let t1;
	let current;
	let if_block = /*title*/ ctx[0] && create_if_block$4(ctx);
	const default_slot_template = /*#slots*/ ctx[4].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
	let each_value = [1, 2, 3, 4];
	let each_blocks = [];

	for (let i = 0; i < 4; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			t0 = space();
			if (default_slot) default_slot.c();
			t1 = space();

			for (let i = 0; i < 4; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "draggable", "");
			set_style(div, "background-color", /*color*/ ctx[1]);
			set_style(div, "color", "var(--color-" + (/*light*/ ctx[2] ? 'dark' : 'light') + ")");
			attr(div, "class", "svelte-1ugmpjz");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			append(div, t0);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(div, t1);

			for (let i = 0; i < 4; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (/*title*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					if_block.m(div, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*color*/ 2) {
				set_style(div, "background-color", /*color*/ ctx[1]);
			}

			if (!current || dirty & /*light*/ 4) {
				set_style(div, "color", "var(--color-" + (/*light*/ ctx[2] ? 'dark' : 'light') + ")");
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			if (default_slot) default_slot.d(detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { title } = $$props;
	let { color = 'var(--color-dark)' } = $$props;
	let { light = false } = $$props;

	$$self.$$set = $$props => {
		if ('title' in $$props) $$invalidate(0, title = $$props.title);
		if ('color' in $$props) $$invalidate(1, color = $$props.color);
		if ('light' in $$props) $$invalidate(2, light = $$props.light);
		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
	};

	return [title, color, light, $$scope, slots];
}

class Faceplate extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { title: 0, color: 1, light: 2 }, add_css$5);
	}
}

/* src/components/Label.svelte generated by Svelte v3.44.2 */

function add_css$4(target) {
	append_styles(target, "svelte-1tqe9w8", "div.svelte-1tqe9w8{top:100%;left:50%;position:absolute;pointer-events:none;font-family:'Routed Gothic';font-size:11px;color:inherit;white-space:nowrap}");
}

function create_fragment$5(ctx) {
	let div;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			set_style(div, "transform", "translate(-50%, " + /*top*/ ctx[0] + "px)");
			attr(div, "class", "svelte-1tqe9w8");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*top*/ 1) {
				set_style(div, "transform", "translate(-50%, " + /*top*/ ctx[0] + "px)");
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { top = 1 } = $$props;

	$$self.$$set = $$props => {
		if ('top' in $$props) $$invalidate(0, top = $$props.top);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [top, $$scope, slots];
}

class Label extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { top: 0 }, add_css$4);
	}
}

/* src/components/Knob.svelte generated by Svelte v3.44.2 */

function add_css$3(target) {
	append_styles(target, "svelte-1fxs2wq", "div.svelte-1fxs2wq{display:block;position:absolute;width:56px;height:56px;cursor:row-resize}div.small.svelte-1fxs2wq{width:42px;height:42px}svg.svelte-1fxs2wq{position:absolute;top:0px;left:0px;transform-origin:center}.shadow-l.svelte-1fxs2wq{top:4px;left:2px}.shadow-s.svelte-1fxs2wq{top:3px;left:3px}");
}

// (90:2) {:else}
function create_else_block(ctx) {
	let svg0;
	let path0;
	let t0;
	let svg1;
	let path1;
	let circle0;
	let circle1;
	let circle2;
	let t1;
	let if_block_anchor;
	let current;
	let if_block = /*label*/ ctx[2] && create_if_block_2(ctx);

	return {
		c() {
			svg0 = svg_element("svg");
			path0 = svg_element("path");
			t0 = space();
			svg1 = svg_element("svg");
			path1 = svg_element("path");
			circle0 = svg_element("circle");
			circle1 = svg_element("circle");
			circle2 = svg_element("circle");
			t1 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(path0, "d", "M56 29.649c-1.653-1.825-2.876-4.088-3.307-6.57-.503-2.555-.36-5.037.431-7.446a25.97 25.97 0\n\t\t\t\t00-6.613-8.686c-2.372.146-4.888-.292-7.189-1.46-2.3-1.168-4.17-2.92-5.535-4.89-3.666-.73-7.333-.804-10.783-.147a13.958\n\t\t\t\t13.958 0 01-5.607 4.818c-2.3 1.095-4.817 1.533-7.26 1.241-2.733 2.263-5.105 5.183-6.83 8.467.647 2.336.79\n\t\t\t\t4.891.287 7.446-.647 2.555-1.869 4.745-3.594 6.497.072 3.722.79 7.372 2.228 10.657 2.229.876 4.242 2.336 5.895\n\t\t\t\t4.526 1.582 2.044 2.516 4.525 2.876 6.861 2.875 2.19 6.038 3.87 9.704 4.891 2.085-1.168 4.53-1.898 7.117-1.898\n\t\t\t\t2.588 0 4.96.73 7.117 2.044 3.45-.803 6.83-2.409 9.777-4.672.431-2.409 1.366-4.744 3.019-6.788 1.653-2.044\n\t\t\t\t3.738-3.431 6.039-4.307.718-1.606 1.365-3.358 1.797-5.183.215-1.606.36-3.576.431-5.401z");
			attr(path0, "fill", "var(--color-dark-shadow)");
			set_style(svg0, "transform", "rotate(" + (-135 + /*rotation*/ ctx[4]) + "deg)");
			attr(svg0, "class", "shadow-l svelte-1fxs2wq");
			attr(svg0, "width", "56");
			attr(svg0, "height", "56");
			attr(svg0, "fill", "none");
			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
			attr(path1, "d", "M56 29.649c-1.653-1.825-2.876-4.088-3.307-6.57-.503-2.555-.36-5.037.431-7.446a25.97 25.97 0\n\t\t\t\t00-6.613-8.686c-2.372.146-4.888-.292-7.189-1.46-2.3-1.168-4.17-2.92-5.535-4.89-3.666-.73-7.333-.804-10.783-.147a13.958\n\t\t\t\t13.958 0 01-5.607 4.818c-2.3 1.095-4.817 1.533-7.26 1.241-2.733 2.263-5.105 5.183-6.83 8.467.647 2.336.79\n\t\t\t\t4.891.287 7.446-.647 2.555-1.869 4.745-3.594 6.497.072 3.722.79 7.372 2.228 10.657 2.229.876 4.242 2.336 5.895\n\t\t\t\t4.526 1.582 2.044 2.516 4.525 2.876 6.861 2.875 2.19 6.038 3.87 9.704 4.891 2.085-1.168 4.53-1.898 7.117-1.898\n\t\t\t\t2.588 0 4.96.73 7.117 2.044 3.45-.803 6.83-2.409 9.777-4.672.431-2.409 1.366-4.744 3.019-6.788 1.653-2.044\n\t\t\t\t3.738-3.431 6.039-4.307.718-1.606 1.365-3.358 1.797-5.183.215-1.606.36-3.576.431-5.401z");
			attr(path1, "fill", "var(--color-6)");
			attr(circle0, "cx", "28");
			attr(circle0, "cy", "28");
			attr(circle0, "r", "17");
			attr(circle0, "fill", "var(--color-light-shadow)");
			attr(circle1, "cx", "28");
			attr(circle1, "cy", "28");
			attr(circle1, "r", "14");
			attr(circle1, "fill", "var(--color-light)");
			attr(circle2, "cx", "28");
			attr(circle2, "cy", "5");
			attr(circle2, "fill", "var(--color-light)");
			attr(circle2, "r", "2");
			set_style(svg1, "transform", "rotate(" + (-135 + /*rotation*/ ctx[4]) + "deg)");
			attr(svg1, "width", "56");
			attr(svg1, "height", "56");
			attr(svg1, "fill", "none");
			attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg1, "class", "svelte-1fxs2wq");
		},
		m(target, anchor) {
			insert(target, svg0, anchor);
			append(svg0, path0);
			insert(target, t0, anchor);
			insert(target, svg1, anchor);
			append(svg1, path1);
			append(svg1, circle0);
			append(svg1, circle1);
			append(svg1, circle2);
			insert(target, t1, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (!current || dirty & /*rotation*/ 16) {
				set_style(svg0, "transform", "rotate(" + (-135 + /*rotation*/ ctx[4]) + "deg)");
			}

			if (!current || dirty & /*rotation*/ 16) {
				set_style(svg1, "transform", "rotate(" + (-135 + /*rotation*/ ctx[4]) + "deg)");
			}

			if (/*label*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*label*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(svg0);
			if (detaching) detach(t0);
			if (detaching) detach(svg1);
			if (detaching) detach(t1);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (52:2) {#if size === 's'}
function create_if_block$3(ctx) {
	let svg0;
	let circle0;
	let t0;
	let svg1;
	let circle1;
	let circle2;
	let circle3;
	let t1;
	let svg2;
	let path;
	let t2;
	let if_block_anchor;
	let current;
	let if_block = /*label*/ ctx[2] && create_if_block_1(ctx);

	return {
		c() {
			svg0 = svg_element("svg");
			circle0 = svg_element("circle");
			t0 = space();
			svg1 = svg_element("svg");
			circle1 = svg_element("circle");
			circle2 = svg_element("circle");
			circle3 = svg_element("circle");
			t1 = space();
			svg2 = svg_element("svg");
			path = svg_element("path");
			t2 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(circle0, "cx", "21");
			attr(circle0, "cy", "21");
			attr(circle0, "r", "13");
			attr(circle0, "fill", "rgba(0,0,0,0.16)");
			attr(svg0, "class", "shadow-s svelte-1fxs2wq");
			attr(svg0, "width", "42");
			attr(svg0, "height", "42");
			attr(svg0, "fill", "none");
			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
			attr(circle1, "cx", "21");
			attr(circle1, "cy", "21");
			attr(circle1, "r", "13");
			attr(circle1, "fill", "var(--color-light-shadow)");
			attr(circle2, "cx", "21");
			attr(circle2, "cy", "21");
			attr(circle2, "r", "11");
			attr(circle2, "fill", "var(--color-light)");
			attr(circle3, "cx", "21");
			attr(circle3, "cy", "12");
			attr(circle3, "r", "2");
			attr(circle3, "fill", "var(--color-6)");
			set_style(svg1, "transform", "rotate(" + (-135 + /*rotation*/ ctx[4]) + "deg)");
			attr(svg1, "width", "42");
			attr(svg1, "height", "42");
			attr(svg1, "fill", "none");
			attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg1, "class", "svelte-1fxs2wq");
			attr(path, "d", "M41.993 21.551l-3-.077a18.203 18.203 0 000-.948l3-.077a21.497 21.497 0 010\n\t\t\t\t1.102zm-.853-6.518l-2.877.851c-.089-.301-.186-.6-.29-.895l2.828-1.001c.122.344.235.693.34\n\t\t\t\t1.045zm-2.832-5.928a21.009 21.009 0 00-.647-.89l-2.378\n\t\t\t\t1.829c.191.249.376.503.554.762l2.471-1.701zm-4.523-4.766l-1.828\n\t\t\t\t2.378c-.25-.191-.504-.376-.763-.555l1.701-2.47c.303.208.599.423.89.647zm-5.773-3.14l-1.001 2.828a17.8 17.8 0\n\t\t\t\t00-.895-.29l.85-2.877c.353.104.702.217 1.046.34zM21.552.007l-.078 3a18.382 18.382 0 00-.948 0l-.077-3a21.4 21.4\n\t\t\t\t0 011.102 0zM15.032.86l.851 2.877c-.301.089-.6.186-.895.29L13.988 1.2a20.83 20.83 0 011.045-.34zM9.105\n\t\t\t\t3.692l1.701 2.47c-.26.179-.513.364-.762.555L8.216 4.34c.29-.224.586-.44.889-.647zM4.339 8.216l2.378\n\t\t\t\t1.828c-.191.249-.376.503-.555.762l-2.47-1.701c.208-.303.423-.599.647-.89zm-3.14 5.772l2.828 1.001a17.8 17.8 0\n\t\t\t\t00-.29.895l-2.877-.85c.104-.353.217-.702.34-1.046zm-1.192 6.46a21.401 21.401 0 000 1.103l3-.077a18.382 18.382 0\n\t\t\t\t010-.948l-3-.077zm.853 6.519l2.877-.851c.089.301.186.6.29.895L1.2 28.012a20.83 20.83 0 01-.34-1.045zm2.832\n\t\t\t\t5.928l2.47-1.701c.179.26.364.513.555.762L4.34\n\t\t\t\t33.785c-.224-.291-.44-.587-.647-.89zm33.97.89l-2.38-1.828c.192-.25.377-.504.556-.763l2.47\n\t\t\t\t1.701c-.208.303-.423.599-.647.89zm3.139-5.773l-2.828-1.001c.104-.295.201-.594.29-.895l2.877.85c-.104.353-.217.702-.34\n\t\t\t\t1.046z");
			attr(path, "fill", "currentColor");
			attr(svg2, "width", "42");
			attr(svg2, "height", "35");
			attr(svg2, "fill", "none");
			attr(svg2, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg2, "class", "svelte-1fxs2wq");
		},
		m(target, anchor) {
			insert(target, svg0, anchor);
			append(svg0, circle0);
			insert(target, t0, anchor);
			insert(target, svg1, anchor);
			append(svg1, circle1);
			append(svg1, circle2);
			append(svg1, circle3);
			insert(target, t1, anchor);
			insert(target, svg2, anchor);
			append(svg2, path);
			insert(target, t2, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (!current || dirty & /*rotation*/ 16) {
				set_style(svg1, "transform", "rotate(" + (-135 + /*rotation*/ ctx[4]) + "deg)");
			}

			if (/*label*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*label*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(svg0);
			if (detaching) detach(t0);
			if (detaching) detach(svg1);
			if (detaching) detach(t1);
			if (detaching) detach(svg2);
			if (detaching) detach(t2);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (129:4) {#if label}
function create_if_block_2(ctx) {
	let label_1;
	let current;

	label_1 = new Label({
			props: {
				top: 3,
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(label_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(label_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const label_1_changes = {};

			if (dirty & /*$$scope, label*/ 2052) {
				label_1_changes.$$scope = { dirty, ctx };
			}

			label_1.$set(label_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(label_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(label_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(label_1, detaching);
		}
	};
}

// (130:6) <Label top={3}>
function create_default_slot_1(ctx) {
	let t;

	return {
		c() {
			t = text(/*label*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 4) set_data(t, /*label*/ ctx[2]);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (87:4) {#if label}
function create_if_block_1(ctx) {
	let label_1;
	let current;

	label_1 = new Label({
			props: {
				top: -4,
				$$slots: { default: [create_default_slot$3] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(label_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(label_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const label_1_changes = {};

			if (dirty & /*$$scope, label*/ 2052) {
				label_1_changes.$$scope = { dirty, ctx };
			}

			label_1.$set(label_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(label_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(label_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(label_1, detaching);
		}
	};
}

// (88:6) <Label top={-4}>
function create_default_slot$3(ctx) {
	let t;

	return {
		c() {
			t = text(/*label*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 4) set_data(t, /*label*/ ctx[2]);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$4(ctx) {
	let div;
	let current_block_type_index;
	let if_block;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$3, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*size*/ ctx[3] === 's') return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			set_style(div, "left", /*x*/ ctx[0] + "px");
			set_style(div, "top", /*y*/ ctx[1] + "px");
			attr(div, "class", "svelte-1fxs2wq");
			toggle_class(div, "small", /*size*/ ctx[3] === 's');
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			current = true;

			if (!mounted) {
				dispose = action_destroyer(usePan.call(null, div, /*onPan*/ ctx[5]));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(div, null);
			}

			if (!current || dirty & /*x*/ 1) {
				set_style(div, "left", /*x*/ ctx[0] + "px");
			}

			if (!current || dirty & /*y*/ 2) {
				set_style(div, "top", /*y*/ ctx[1] + "px");
			}

			if (dirty & /*size*/ 8) {
				toggle_class(div, "small", /*size*/ ctx[3] === 's');
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let rotation;
	let { x } = $$props;
	let { y } = $$props;
	let { min } = $$props;
	let { max } = $$props;
	let { value } = $$props;
	let { label } = $$props;
	let { steps = 200 } = $$props;
	let { precision = 0 } = $$props;
	let { size = 'l' } = $$props;

	const onPan = ({ dy }) => {
		if (dy !== 0) {
			const interval = (max - min) / steps;
			const change = round(value - dy * interval, precision);
			$$invalidate(6, value = Math.max(Math.min(change, max), min));
		}
	};

	$$self.$$set = $$props => {
		if ('x' in $$props) $$invalidate(0, x = $$props.x);
		if ('y' in $$props) $$invalidate(1, y = $$props.y);
		if ('min' in $$props) $$invalidate(7, min = $$props.min);
		if ('max' in $$props) $$invalidate(8, max = $$props.max);
		if ('value' in $$props) $$invalidate(6, value = $$props.value);
		if ('label' in $$props) $$invalidate(2, label = $$props.label);
		if ('steps' in $$props) $$invalidate(9, steps = $$props.steps);
		if ('precision' in $$props) $$invalidate(10, precision = $$props.precision);
		if ('size' in $$props) $$invalidate(3, size = $$props.size);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value, min, max*/ 448) {
			$$invalidate(4, rotation = scale(value, [min, max], [0, 270], 0));
		}
	};

	return [x, y, label, size, rotation, onPan, value, min, max, steps, precision];
}

class Knob extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$4,
			create_fragment$4,
			safe_not_equal,
			{
				x: 0,
				y: 1,
				min: 7,
				max: 8,
				value: 6,
				label: 2,
				steps: 9,
				precision: 10,
				size: 3
			},
			add_css$3
		);
	}
}

/* src/components/Logo.svelte generated by Svelte v3.44.2 */

function create_fragment$3(ctx) {
	let svg;
	let path;
	let circle;

	return {
		c() {
			svg = svg_element("svg");
			path = svg_element("path");
			circle = svg_element("circle");
			attr(path, "fill-rule", "evenodd");
			attr(path, "clip-rule", "evenodd");
			attr(path, "d", "M5 0h12l5 10-5 10H5L0 10 5 0zm6 19a9 9 0 100-18 9 9 0 000 18z");
			attr(path, "fill", "currentColor");
			attr(circle, "cx", "11");
			attr(circle, "cy", "10");
			attr(circle, "r", "6");
			attr(circle, "fill", "currentColor");
			set_style(svg, "width", /*size*/ ctx[0] + "px");
			attr(svg, "viewBox", "0 0 22 20");
			attr(svg, "fill", "none");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, path);
			append(svg, circle);
		},
		p(ctx, [dirty]) {
			if (dirty & /*size*/ 1) {
				set_style(svg, "width", /*size*/ ctx[0] + "px");
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { size = 22 } = $$props;

	$$self.$$set = $$props => {
		if ('size' in $$props) $$invalidate(0, size = $$props.size);
	};

	return [size];
}

class Logo extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 0 });
	}
}

/* src/components/Patch.svelte generated by Svelte v3.44.2 */

function add_css$2(target) {
	append_styles(target, "svelte-pgcfw2", "patch.svelte-pgcfw2{display:block;position:absolute;cursor:pointer;width:18px;height:18px}svg.svelte-pgcfw2{position:absolute;border-radius:18px;box-shadow:2px 2px 0px rgba(0, 0, 0, 0.16);pointer-events:none}.ring.svelte-pgcfw2{opacity:0.15}");
}

// (152:2) {#if label}
function create_if_block$2(ctx) {
	let label_1;
	let current;

	label_1 = new Label({
			props: {
				top: -1,
				$$slots: { default: [create_default_slot$2] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(label_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(label_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const label_1_changes = {};

			if (dirty & /*$$scope, label*/ 8196) {
				label_1_changes.$$scope = { dirty, ctx };
			}

			label_1.$set(label_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(label_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(label_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(label_1, detaching);
		}
	};
}

// (153:4) <Label top={-1}>
function create_default_slot$2(ctx) {
	let t;

	return {
		c() {
			t = text(/*label*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 4) set_data(t, /*label*/ ctx[2]);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$2(ctx) {
	let patch;
	let svg;
	let circle0;
	let circle1;
	let circle2;
	let t;
	let current;
	let mounted;
	let dispose;
	let if_block = /*label*/ ctx[2] && create_if_block$2(ctx);

	return {
		c() {
			patch = element("patch");
			svg = svg_element("svg");
			circle0 = svg_element("circle");
			circle1 = svg_element("circle");
			circle2 = svg_element("circle");
			t = space();
			if (if_block) if_block.c();
			attr(circle0, "cx", "9");
			attr(circle0, "cy", "9");
			attr(circle0, "r", "9");
			attr(circle0, "fill", "var(--color-6)");
			attr(circle0, "class", "ring svelte-pgcfw2");
			attr(circle1, "cx", "9");
			attr(circle1, "cy", "9");
			attr(circle1, "r", "8");
			attr(circle1, "fill", "var(--color-light)");
			attr(circle2, "cx", "9");
			attr(circle2, "cy", "9");
			attr(circle2, "r", "5");
			attr(circle2, "fill", "#222");
			attr(svg, "width", "18");
			attr(svg, "height", "18");
			attr(svg, "fill", "none");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "class", "svelte-pgcfw2");
			attr(patch, "id", /*patchID*/ ctx[3]);
			set_style(patch, "left", /*x*/ ctx[0] + "px");
			set_style(patch, "top", /*y*/ ctx[1] + "px");
			attr(patch, "class", "svelte-pgcfw2");
		},
		m(target, anchor) {
			insert(target, patch, anchor);
			append(patch, svg);
			append(svg, circle0);
			append(svg, circle1);
			append(svg, circle2);
			append(patch, t);
			if (if_block) if_block.m(patch, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(patch, "mousedown", /*onPatchClick*/ ctx[4]),
					listen(patch, "touchstart", /*onPatchClick*/ ctx[4], { passive: true }),
					listen(patch, "mouseup", /*onPatchRelease*/ ctx[5]),
					listen(patch, "touchend", /*onPatchRelease*/ ctx[5], { passive: true })
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*label*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*label*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(patch, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty & /*x*/ 1) {
				set_style(patch, "left", /*x*/ ctx[0] + "px");
			}

			if (!current || dirty & /*y*/ 2) {
				set_style(patch, "top", /*y*/ ctx[1] + "px");
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(patch);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { x = 0 } = $$props;
	let { y = 0 } = $$props;
	let { label = undefined } = $$props;
	let { onConnect } = $$props;
	let { input } = $$props;
	let { output } = $$props;
	let { name } = $$props;
	const { id } = getContext('module');
	const patchID = `${id}://${name}`;
	let connections = [];

	patches.store.subscribe($patches => {
		const $connections = $patches.filter(item => item[input ? 'input' : 'output'] === patchID).map(item => ({
			id: input ? item.output : item.input,
			node: item.node
		}));

		if (typeof onConnect === 'function' && connections.length !== $connections.length) {
			onConnect($connections.length);
		}

		connections.forEach(item => {
			if ($connections.findIndex(patch => patch.id === item.id) < 0) {
				if (item.node) {
					if (output) {
						if ('toDestination' in output) {
							output.disconnect(item.node);
						} else {
							output.disconnect(item.node);
						}
					}
				}
			}
		});

		$connections.forEach(item => {
			if (input && !item.node) {
				patches.update(item.id, patchID, { node: input });
			}

			if (connections.findIndex(connection => connection.id === item.id && connection.node) < 0) {
				if (item.node) {
					if (output) {
						if ('toDestination' in output) {
							output.connect(item.node);
						} else {
							output.connect(item.node);
						}
					}
				}
			}
		});

		connections = $connections;
	});

	const onPatchClick = event => {
		// error for touch; passive by default
		// event.preventDefault();
		const $patch = patches.state.find(item => item.input === patchID || item.output === patchID);

		if (!event.shiftKey && $patch) {
			patches.update($patch.output, $patch.input, { selected: patchID });
		} else {
			patches.add({
				input: input ? patchID : null,
				output: output ? patchID : null,
				node: input ? input : null,
				selected: patchID
			});
		}

		window.addEventListener('mouseup', onGlobalUp, { passive: true });
		(window.addEventListener('touchend', onGlobalUp));
	};

	const onPatchRelease = () => {
		const $patch = patches.state.find(item => item.selected);

		if (!$patch) {
			return;
		}

		if ($patch[output ? 'input' : 'output'] && $patch[output ? 'input' : 'output'].indexOf(`${id}://`) !== 0 && (input && $patch.output || output && $patch.input)) {
			patches.update($patch.output, $patch.input, {
				output: output ? patchID : $patch.output,
				input: input ? patchID : $patch.input,
				node: input ? input : $patch.node,
				color: $patch.color,
				selected: null
			});
		} else {
			patches.remove($patch.output, $patch.input);
		}
	};

	const onGlobalUp = event => {
		window.removeEventListener('mouseup', onGlobalUp);
		window.removeEventListener('touchend', onGlobalUp);
		const target = event.target;

		if (target.tagName.toLowerCase() === 'patch') {
			return;
		}

		const $patch = patches.state.find(item => item.selected);

		if ($patch) {
			patches.remove($patch.output, $patch.input);
		}
	};

	onMount(() => {
		return () => {
			if (input && 'toDestination' in input) {
				input.dispose();
			}

			if (output && 'toDestination' in output) {
				output.dispose();
			}
		};
	});

	$$self.$$set = $$props => {
		if ('x' in $$props) $$invalidate(0, x = $$props.x);
		if ('y' in $$props) $$invalidate(1, y = $$props.y);
		if ('label' in $$props) $$invalidate(2, label = $$props.label);
		if ('onConnect' in $$props) $$invalidate(6, onConnect = $$props.onConnect);
		if ('input' in $$props) $$invalidate(7, input = $$props.input);
		if ('output' in $$props) $$invalidate(8, output = $$props.output);
		if ('name' in $$props) $$invalidate(9, name = $$props.name);
	};

	return [
		x,
		y,
		label,
		patchID,
		onPatchClick,
		onPatchRelease,
		onConnect,
		input,
		output,
		name
	];
}

class Patch extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				x: 0,
				y: 1,
				label: 2,
				onConnect: 6,
				input: 7,
				output: 8,
				name: 9
			},
			add_css$2
		);
	}
}

/* src/components/Switch.svelte generated by Svelte v3.44.2 */

function add_css$1(target) {
	append_styles(target, "svelte-1pbj6ch", "button.svelte-1pbj6ch{position:absolute;width:18px;height:18px;border-radius:18px;background:var(--color-dark);border:1px solid rgba(0, 0, 0, 0.32);box-shadow:inset 2px 2px 0px rgba(255, 255, 255, 0.08), 0px 0px 0px 2px rgba(0, 0, 0, 0.12);cursor:pointer;color:inherit}button.high.svelte-1pbj6ch{background:var(--color-dark-highlight)}button.square.svelte-1pbj6ch{width:20px;height:20px;border-radius:3px}button.on.svelte-1pbj6ch{background:var(--color-on);box-shadow:inset 2px 2px 0px rgba(255, 255, 255, 0.24), 0px 0px 0px 2px rgba(0, 0, 0, 0.12)}button.on.high.svelte-1pbj6ch{background:var(--color-on-highlight)}");
}

// (63:2) {#if label}
function create_if_block$1(ctx) {
	let label_1;
	let current;

	label_1 = new Label({
			props: {
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(label_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(label_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const label_1_changes = {};

			if (dirty & /*$$scope, label*/ 516) {
				label_1_changes.$$scope = { dirty, ctx };
			}

			label_1.$set(label_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(label_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(label_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(label_1, detaching);
		}
	};
}

// (64:4) <Label>
function create_default_slot$1(ctx) {
	let t;

	return {
		c() {
			t = text(/*label*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 4) set_data(t, /*label*/ ctx[2]);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$1(ctx) {
	let button;
	let current;
	let mounted;
	let dispose;
	let if_block = /*label*/ ctx[2] && create_if_block$1(ctx);

	return {
		c() {
			button = element("button");
			if (if_block) if_block.c();
			attr(button, "aria-label", "switch");
			set_style(button, "left", /*x*/ ctx[5] + "px");
			set_style(button, "top", /*y*/ ctx[6] + "px");
			attr(button, "class", "svelte-1pbj6ch");
			toggle_class(button, "on", /*value*/ ctx[0] === /*set*/ ctx[1] || /*value*/ ctx[0] && typeof /*value*/ ctx[0] === 'boolean');
			toggle_class(button, "square", /*square*/ ctx[3]);
			toggle_class(button, "high", /*high*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			if (if_block) if_block.m(button, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*onClick*/ ctx[7]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*label*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*label*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(button, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty & /*x*/ 32) {
				set_style(button, "left", /*x*/ ctx[5] + "px");
			}

			if (!current || dirty & /*y*/ 64) {
				set_style(button, "top", /*y*/ ctx[6] + "px");
			}

			if (dirty & /*value, set*/ 3) {
				toggle_class(button, "on", /*value*/ ctx[0] === /*set*/ ctx[1] || /*value*/ ctx[0] && typeof /*value*/ ctx[0] === 'boolean');
			}

			if (dirty & /*square*/ 8) {
				toggle_class(button, "square", /*square*/ ctx[3]);
			}

			if (dirty & /*high*/ 16) {
				toggle_class(button, "high", /*high*/ ctx[4]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { value } = $$props;
	let { set } = $$props;
	let { label } = $$props;
	let { onToggle } = $$props;
	let { square } = $$props;
	let { high } = $$props;
	let { x = 0 } = $$props;
	let { y = 0 } = $$props;

	const onClick = () => {
		if (typeof onToggle === 'function') {
			onToggle();
		} else if (!set && typeof value == 'boolean') {
			$$invalidate(0, value = !value);
		} else {
			$$invalidate(0, value = set);
		}
	};

	$$self.$$set = $$props => {
		if ('value' in $$props) $$invalidate(0, value = $$props.value);
		if ('set' in $$props) $$invalidate(1, set = $$props.set);
		if ('label' in $$props) $$invalidate(2, label = $$props.label);
		if ('onToggle' in $$props) $$invalidate(8, onToggle = $$props.onToggle);
		if ('square' in $$props) $$invalidate(3, square = $$props.square);
		if ('high' in $$props) $$invalidate(4, high = $$props.high);
		if ('x' in $$props) $$invalidate(5, x = $$props.x);
		if ('y' in $$props) $$invalidate(6, y = $$props.y);
	};

	return [value, set, label, square, high, x, y, onClick, onToggle];
}

class Switch extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$1,
			create_fragment$1,
			safe_not_equal,
			{
				value: 0,
				set: 1,
				label: 2,
				onToggle: 8,
				square: 3,
				high: 4,
				x: 5,
				y: 6
			},
			add_css$1
		);
	}
}

/* src/components/Volume.svelte generated by Svelte v3.44.2 */

function add_css(target) {
	append_styles(target, "svelte-1smucvy", ".slider.svelte-1smucvy.svelte-1smucvy{display:block;position:absolute;width:48px;cursor:row-resize;background:#2c2929}.slider.disabled.svelte-1smucvy svg.svelte-1smucvy{opacity:0.25}.bar.svelte-1smucvy.svelte-1smucvy,svg.svelte-1smucvy.svelte-1smucvy{position:absolute;bottom:0px;height:100%;width:100%;pointer-events:none}.bar.svelte-1smucvy.svelte-1smucvy{top:0px;background:#2c2929}");
}

// (63:2) {#if label}
function create_if_block(ctx) {
	let label_1;
	let current;

	label_1 = new Label({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(label_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(label_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const label_1_changes = {};

			if (dirty & /*$$scope, label*/ 1032) {
				label_1_changes.$$scope = { dirty, ctx };
			}

			label_1.$set(label_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(label_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(label_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(label_1, detaching);
		}
	};
}

// (64:4) <Label>
function create_default_slot(ctx) {
	let t;

	return {
		c() {
			t = text(/*label*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 8) set_data(t, /*label*/ ctx[3]);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment(ctx) {
	let div1;
	let svg;
	let path0;
	let path1;
	let path2;
	let path3;
	let path4;
	let t0;
	let div0;
	let t1;
	let current;
	let mounted;
	let dispose;
	let if_block = /*label*/ ctx[3] && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			svg = svg_element("svg");
			path0 = svg_element("path");
			path1 = svg_element("path");
			path2 = svg_element("path");
			path3 = svg_element("path");
			path4 = svg_element("path");
			t0 = space();
			div0 = element("div");
			t1 = space();
			if (if_block) if_block.c();
			attr(path0, "fill", "#D84A4B");
			attr(path0, "d", "M8 8h32v4H8zM8 16h32v4H8zM8 24h32v4H8z");
			attr(path1, "fill", "#EC8657");
			attr(path1, "d", "M8 32h32v4H8zM8 40h32v4H8zM8 48h32v4H8z");
			attr(path2, "fill", "#FFC263");
			attr(path2, "d", "M8 56h32v4H8zM8 64h32v4H8zM8 72h32v4H8z");
			attr(path3, "fill", "#86B057");
			attr(path3, "d", "M8 80h32v4H8zM8 88h32v4H8zM8 96h32v4H8z");
			attr(path4, "fill", "#0D9F4C");
			attr(path4, "d", "M8 104h32v4H8zM8 136h32v4H8zM8 168h32v4H8zM8 120h32v4H8zM8 152h32v4H8zM8 184h32v4H8zM8 112h32v4H8zM8\n\t\t\t144h32v4H8zM8 176h32v4H8zM8 128h32v4H8zM8 160h32v4H8zM8 192h32v4H8z");
			attr(svg, "viewBox", "0 0 48 204");
			attr(svg, "fill", "none");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "class", "svelte-1smucvy");
			attr(div0, "class", "bar svelte-1smucvy");
			set_style(div0, "height", 100 - /*level*/ ctx[5] + "%");
			attr(div1, "class", "slider svelte-1smucvy");
			set_style(div1, "left", /*x*/ ctx[0] + "px");
			set_style(div1, "top", /*y*/ ctx[1] + "px");
			set_style(div1, "height", /*h*/ ctx[2] + "px");
			toggle_class(div1, "disabled", /*disabled*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, svg);
			append(svg, path0);
			append(svg, path1);
			append(svg, path2);
			append(svg, path3);
			append(svg, path4);
			append(div1, t0);
			append(div1, div0);
			append(div1, t1);
			if (if_block) if_block.m(div1, null);
			current = true;

			if (!mounted) {
				dispose = action_destroyer(usePan.call(null, div1, /*onPan*/ ctx[6]));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*level*/ 32) {
				set_style(div0, "height", 100 - /*level*/ ctx[5] + "%");
			}

			if (/*label*/ ctx[3]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*label*/ 8) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div1, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty & /*x*/ 1) {
				set_style(div1, "left", /*x*/ ctx[0] + "px");
			}

			if (!current || dirty & /*y*/ 2) {
				set_style(div1, "top", /*y*/ ctx[1] + "px");
			}

			if (!current || dirty & /*h*/ 4) {
				set_style(div1, "height", /*h*/ ctx[2] + "px");
			}

			if (dirty & /*disabled*/ 16) {
				toggle_class(div1, "disabled", /*disabled*/ ctx[4]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let level;
	let { x } = $$props;
	let { y } = $$props;
	let { h } = $$props;
	let { min } = $$props;
	let { max } = $$props;
	let { value } = $$props;
	let { label } = $$props;
	let { disabled } = $$props;

	const onPan = ({ dy }) => {
		if (dy !== 0 && !disabled) {
			const interval = (max - min) / 200;
			const change = value - dy * interval;
			$$invalidate(7, value = round(Math.max(Math.min(change, max), min), 2));
		}
	};

	$$self.$$set = $$props => {
		if ('x' in $$props) $$invalidate(0, x = $$props.x);
		if ('y' in $$props) $$invalidate(1, y = $$props.y);
		if ('h' in $$props) $$invalidate(2, h = $$props.h);
		if ('min' in $$props) $$invalidate(8, min = $$props.min);
		if ('max' in $$props) $$invalidate(9, max = $$props.max);
		if ('value' in $$props) $$invalidate(7, value = $$props.value);
		if ('label' in $$props) $$invalidate(3, label = $$props.label);
		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value, min, max*/ 896) {
			$$invalidate(5, level = scale(value, [min, max], [0, 100], 0));
		}
	};

	return [x, y, h, label, disabled, level, onPan, value, min, max];
}

class Volume extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				x: 0,
				y: 1,
				h: 2,
				min: 8,
				max: 9,
				value: 7,
				label: 3,
				disabled: 4
			},
			add_css
		);
	}
}

class Bang {
    constructor(output) {
        this.bangs = [];
        this.output = output;
    }
    connect(bang) {
        this.bangs = [...this.bangs, bang];
    }
    disconnect(bang) {
        this.bangs = this.bangs.filter((item) => item !== bang);
    }
    bang(time, attack = false, release = false) {
        this.bangs.forEach((item) => {
            item.trigger(time, attack, release);
        });
    }
    trigger(time, attack = false, release = false) {
        this.output(time, attack, release);
    }
}

window['__sv'] = svelte;

export { BAR_HEIGHT, Bang, Container, Faceplate, HP, Knob, Label, Logo, Patch, Point, Switch, Volume, Patchcab as default, getCatenaryPath, getEnergy, isShortcut, onMount, randomColor, round, safeName, scale, useClickOutside, useDrag, usePan };
//# sourceMappingURL=core.js.map
