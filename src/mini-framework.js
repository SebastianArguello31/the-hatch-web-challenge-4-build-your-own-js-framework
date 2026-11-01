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

export function createElement(type, props, ...children) {
    if (typeof type !== "string" || type.trim() === "") {
        throw new TypeError("El tipo del elemento debe ser una etiqueta HTML no vacía.");
    }

    return {
        type,
        props: { ...(props ?? {}) },
        children: normalizeChildren(children)
    };
}

function setProperty(element, name, value) {
    if (name === "key") {
        return;
    }

    if (name.startsWith("on")) {
        if (value === null || value === undefined) {
            return;
        }

        if (typeof value !== "function") {
            throw new TypeError(`La propiedad ${name} debe contener una función.`);
        }

        const eventName = name.slice(2).toLowerCase();

        element.addEventListener(eventName, value);
        return;
    }

    if (value === null || value === undefined) {
        return;
    }

    if (name === "className") {
        element.setAttribute("class", String(value));
        return;
    }

    if (name === "htmlFor") {
        element.setAttribute("for", String(value));
        return;
    }

    if (name === "value") {
        element.value = String(value);
        return;
    }

    if (name === "checked" || name === "disabled" || name === "selected" || name === "multiple" || name === "required" || name === "readOnly") {
        element[name] = Boolean(value);
        return;
    }

    element.setAttribute(name, String(value));
}

function createDomNode(virtualNode) {
    if (typeof virtualNode === "string") {
        return document.createTextNode(virtualNode);
    }

    const element = document.createElement(virtualNode.type);

    for (const [name, value] of Object.entries(virtualNode.props)) {
        setProperty(element, name, value);
    }

    for (const child of virtualNode.children) {
        element.appendChild(createDomNode(child));
    }

    return element;
}

export function render(virtualNode, container) {
    if (!(container instanceof Element)) {
        throw new TypeError("El contenedor debe ser un elemento del DOM.");
    }

    if (container.hasChildNodes()) {
        throw new Error("En esta etapa, render necesita un contenedor vacío.");
    }

    const domNode = createDomNode(virtualNode);

    container.appendChild(domNode);
}