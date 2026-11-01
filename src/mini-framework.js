const roots = new WeakMap();

const booleanProperties = new Set(["checked", "disabled", "selected", "multiple", "required", "readOnly"]);

function normalizeChildren(children) {
    const normalizedChildren = [];

    for (const child of children) {
        if (Array.isArray(child)) {
            normalizedChildren.push(...normalizeChildren(child));
            continue;
        }

        if (child === null || child === undefined || typeof child === "boolean") {
            continue;
        }

        if (typeof child === "string" || typeof child === "number") {
            normalizedChildren.push(String(child));
            continue;
        }

        if (typeof child === "object" && typeof child.type === "string") {
            normalizedChildren.push(child);
            continue;
        }

        throw new TypeError("Un hijo debe ser un elemento virtual, texto, número o un array de estos valores.");
    }

    return normalizedChildren;
}

function getKey(virtualNode) {
    if (typeof virtualNode === "string") {
        return null;
    }

    return virtualNode.props.key ?? null;
}

function validateKeys(children) {
    const keys = new Set();
    let keyedChildren = 0;

    for (const child of children) {
        const key = getKey(child);

        if (key === null) {
            continue;
        }

        if (typeof key !== "string" && !(typeof key === "number" && Number.isFinite(key))) {
            throw new TypeError("Cada key debe ser un string o un número finito.");
        }

        if (keys.has(key)) {
            throw new Error(`La key "${key}" está repetida entre elementos hermanos.`);
        }

        keys.add(key);
        keyedChildren += 1;
    }

    if (keyedChildren > 0 && keyedChildren !== children.length) {
        throw new Error("Los hijos de un mismo elemento deben tener todos key o ninguno.");
    }
}

export function createElement(type, props, ...children) {
    const elementProps = { ...(props ?? {}) };
    const normalizedChildren = normalizeChildren(children);

    if (typeof type === "function") {
        const result = type({...elementProps, children: normalizedChildren});

        if (result === null || typeof result !== "object" || typeof result.type !== "string" || result.props === null || typeof result.props !== "object" || !Array.isArray(result.children)) {
            throw new TypeError("Un componente debe devolver un elemento virtual creado con createElement o JSX.");
        }

        if (elementProps.key !== null && elementProps.key !== undefined) {
            return {
                ...result,
                props: {
                    ...result.props,
                    key: elementProps.key
                }
            };
        }

        return result;
    }

    if (typeof type !== "string" || type.trim() === "") {
        throw new TypeError("El tipo debe ser una etiqueta HTML no vacía o un componente funcional.");
    }

    validateKeys(normalizedChildren);

    return {
        type,
        props: elementProps,
        children: normalizedChildren
    };
}

function isEventProperty(name) {
    return name.startsWith("on");
}

function getEventName(name) {
    return name.slice(2).toLowerCase();
}

function getAttributeName(name) {
    if (name === "className") {
        return "class";
    }

    if (name === "htmlFor") {
        return "for";
    }

    return name;
}

function setProperty(element, name, value) {
    if (name === "key" || value === null || value === undefined) {
        return;
    }

    if (isEventProperty(name)) {
        if (typeof value !== "function") {
            throw new TypeError(`La propiedad ${name} debe contener una función.`);
        }

        element.addEventListener(getEventName(name), value);
        return;
    }

    if (name === "value") {
        const nextValue = String(value);

        if (element.value !== nextValue) {
            element.value = nextValue;
        }

        return;
    }

    if (booleanProperties.has(name)) {
        element[name] = Boolean(value);
        return;
    }

    element.setAttribute(getAttributeName(name), String(value));
}

function removeProperty(element, name, previousValue) {
    if (name === "key") {
        return;
    }

    if (isEventProperty(name)) {
        if (typeof previousValue === "function") {
            element.removeEventListener(getEventName(name), previousValue);
        }

        return;
    }

    if (name === "value") {
        element.value = "";
        element.removeAttribute("value");
        return;
    }

    if (booleanProperties.has(name)) {
        element[name] = false;
        return;
    }

    element.removeAttribute(getAttributeName(name));
}

function updateProperties(element, previousProps, nextProps) {
    for (const [name, previousValue] of Object.entries(previousProps)) {
        const nextValue = nextProps[name];

        if (nextValue === null || nextValue === undefined) {
            removeProperty(element, name, previousValue);
        }
    }

    for (const [name, nextValue] of Object.entries(nextProps)) {
        if (nextValue === null || nextValue === undefined) {
            continue;
        }

        const previousValue = previousProps[name];

        if (isEventProperty(name)) {
            if (previousValue !== nextValue) {
                removeProperty(element, name, previousValue);
                setProperty(element, name, nextValue);
            }

            continue;
        }

        const isFormProperty = name === "value" || booleanProperties.has(name);

        if (previousValue !== nextValue || isFormProperty) {
            setProperty(element, name, nextValue);
        }
    }
}

function createDomNode(virtualNode) {
    if (typeof virtualNode === "string") {
        return document.createTextNode(virtualNode);
    }

    const element = document.createElement(virtualNode.type);

    for (const child of virtualNode.children) {
        element.appendChild(createDomNode(child));
    }

    updateProperties(element, {}, virtualNode.props);

    return element;
}

function hasKeys(children) {
    return children.some((child) => getKey(child) !== null);
}

function updateChildrenByPosition(element, previousChildren, nextChildren) {
    const previousDomNodes = Array.from(element.childNodes);

    for (let index = 0; index < nextChildren.length; index += 1) {
        patch(element, previousDomNodes[index] ?? null, previousChildren[index] ?? null, nextChildren[index]);
    }

    for (let index = nextChildren.length; index < previousChildren.length; index += 1) {
        element.removeChild(previousDomNodes[index]);
    }
}

function updateChildrenByKey(element, previousChildren, nextChildren) {
    const previousDomNodes = Array.from(element.childNodes);
    const previousByKey = new Map();

    previousChildren.forEach((child, index) => {
        previousByKey.set(getKey(child), {
            virtualNode: child,
            domNode: previousDomNodes[index]
        });
    });

    nextChildren.forEach((child, index) => {
        const key = getKey(child);
        const previousEntry = previousByKey.get(key);

        let domNode;

        if (previousEntry) {
            domNode = patch(element, previousEntry.domNode, previousEntry.virtualNode, child);

            previousByKey.delete(key);
        } else {
            domNode = createDomNode(child);
        }

        const nodeAtPosition = element.childNodes[index] ?? null;

        if (domNode !== nodeAtPosition) {
            element.insertBefore(domNode, nodeAtPosition);
        }
    });

    for (const { domNode } of previousByKey.values()) {
        element.removeChild(domNode);
    }
}

function updateChildren(element, previousChildren, nextChildren) {
    const previousHasKeys = hasKeys(previousChildren);
    const nextHasKeys = hasKeys(nextChildren);

    if (previousChildren.length > 0 && nextChildren.length > 0 && previousHasKeys !== nextHasKeys) {
        const nextDomNodes = nextChildren.map(createDomNode);

        element.replaceChildren(...nextDomNodes);
        return;
    }

    if (previousHasKeys || nextHasKeys) {
        updateChildrenByKey(element, previousChildren, nextChildren);
        return;
    }

    updateChildrenByPosition(element, previousChildren, nextChildren);
}

function patch(parent, domNode, previousNode, nextNode) {
    if (previousNode === null) {
        const newDomNode = createDomNode(nextNode);

        parent.appendChild(newDomNode);
        return newDomNode;
    }

    const previousIsText = typeof previousNode === "string";
    const nextIsText = typeof nextNode === "string";

    const changedType = previousIsText !== nextIsText || ( !previousIsText && !nextIsText && previousNode.type !== nextNode.type);

    const changedKey = getKey(previousNode) !== getKey(nextNode);

    if (changedType || changedKey) {
        const newDomNode = createDomNode(nextNode);

        parent.replaceChild(newDomNode, domNode);
        return newDomNode;
    }

    if (nextIsText) {
        if (previousNode !== nextNode) {
            domNode.nodeValue = nextNode;
        }

        return domNode;
    }

    updateChildren(domNode, previousNode.children, nextNode.children);

    updateProperties(domNode, previousNode.props, nextNode.props);

    return domNode;
}

export function render(virtualNode, container) {
    if (!(container instanceof Element)) {
        throw new TypeError("El contenedor debe ser un elemento del DOM.");
    }

    if (!roots.has(container)) {
        if (container.hasChildNodes()) {
            throw new Error("El contenedor debe estar vacío antes del primer renderizado.");
        }

        container.appendChild(createDomNode(virtualNode));
        roots.set(container, virtualNode);
        return;
    }

    const previousNode = roots.get(container);

    patch(container, container.firstChild, previousNode, virtualNode);

    roots.set(container, virtualNode);
}

export function createStore(reducer, initialState) {
    if (typeof reducer !== "function") {
        throw new TypeError("El reducer debe ser una función.");
    }

    if (initialState === undefined) {
        throw new TypeError("Debes proporcionar un estado inicial.");
    }

    let state = initialState;
    let isReducing = false;

    const listeners = new Set();

    function getState() {
        return state;
    }

    function dispatch(action) {
        if (action === null || typeof action !== "object" || Array.isArray(action) || typeof action.type !== "string" || action.type.trim() === "") {
            throw new TypeError("La acción debe ser un objeto con un type de texto no vacío.");
        }

        if (isReducing) {
            throw new Error("No puedes despachar acciones desde el reducer.");
        }

        let nextState;

        try {
            isReducing = true;
            nextState = reducer(state, action);

            if (nextState === undefined) {
                throw new TypeError("El reducer debe devolver un estado.");
            }
        } finally {
            isReducing = false;
        }

        if (Object.is(state, nextState)) {
            return action;
        }

        state = nextState;

        const currentListeners = [...listeners];

        for (const listener of currentListeners) {
            listener();
        }

        return action;
    }

    function subscribe(listener) {
        if (typeof listener !== "function") {
            throw new TypeError("El suscriptor debe ser una función.");
        }

        listeners.add(listener);

        return function unsubscribe() {
            listeners.delete(listener);
        };
    }

    return {
        getState,
        dispatch,
        subscribe
    };
}