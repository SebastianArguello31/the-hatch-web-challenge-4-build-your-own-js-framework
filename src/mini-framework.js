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