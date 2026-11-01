// Cada contenedor recuerda su último árbol virtual; WeakMap permite liberar el registro cuando el contenedor deja de usarse.
const roots = new WeakMap();

const booleanProperties = new Set(["checked", "disabled", "selected", "multiple", "required", "readOnly"]);

// JSX puede producir listas anidadas y condiciones falsas. El renderizador trabaja con una lista plana de elementos y textos.
function normalizeChildren(children) {
    const normalizedChildren = [];

    for (const child of children) {
        if (Array.isArray(child)) {
            // Una lista creada con map puede aparecer dentro de otros hijos. El spread incorpora sus elementos al mismo nivel.
            normalizedChildren.push(...normalizeChildren(child));
            continue;
        }

        // En JSX, una condición falsa como visible && <p /> deja un booleano. El número 0 sí debe mostrarse.
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

    // Una clave numérica 0 también identifica un elemento. Solo null o undefined indican que falta la clave.
    return virtualNode.props.key ?? null;
}

// Las claves identifican hermanos. Mezclar hijos con y sin clave haría ambigua la comparación al cambiar el orden.
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

// JSX llama a esta función tanto para etiquetas como para componentes. Los componentes se resuelven antes de tocar el DOM.
export function createElement(type, props, ...children) {
    const elementProps = { ...(props ?? {}) };
    const normalizedChildren = normalizeChildren(children);

    if (typeof type === "function") {
        const result = type({...elementProps, children: normalizedChildren});

        if (result === null || typeof result !== "object" || typeof result.type !== "string" || result.props === null || typeof result.props !== "object" || !Array.isArray(result.children)) {
            throw new TypeError("Un componente debe devolver un elemento virtual creado con createElement o JSX.");
        }

        // Si <TaskItem key={id} /> devuelve un <li>, el padre compara ese <li>. Por eso copiamos allí la clave.
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
    // Por ejemplo, onClick se convierte en click, el nombre que espera addEventListener.
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

// Los eventos se registran con funciones y los controles tienen propiedades vivas, como value y checked.
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

        // Evitar una escritura idéntica ayuda a conservar la posición del cursor mientras el usuario escribe.
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
            // Para retirar el manejador hace falta la misma función que se registró en el render anterior.
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

// Compara las props anteriores con las nuevas para retirar atributos y sustituir manejadores que ya no corresponden.
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

        // El usuario puede cambiar una casilla directamente en el DOM aunque sus props virtuales sigan iguales.
        const isFormProperty = name === "value" || booleanProperties.has(name);

        if (previousValue !== nextValue || isFormProperty) {
            setProperty(element, name, nextValue);
        }
    }
}

// Construye el subárbol real de forma recursiva antes de insertarlo en su contenedor.
function createDomNode(virtualNode) {
    if (typeof virtualNode === "string") {
        return document.createTextNode(virtualNode);
    }

    const element = document.createElement(virtualNode.type);

    for (const child of virtualNode.children) {
        element.appendChild(createDomNode(child));
    }

    // Aplicamos las props después de crear los hijos para que un select ya tenga sus opciones al asignarle value.
    updateProperties(element, {}, virtualNode.props);

    return element;
}

function hasKeys(children) {
    return children.some((child) => getKey(child) !== null);
}

// childNodes cambia al modificar el DOM. La copia inicial permite seguir localizando los hijos originales por posición.
function updateChildrenByPosition(element, previousChildren, nextChildren) {
    const previousDomNodes = Array.from(element.childNodes);

    for (let index = 0; index < nextChildren.length; index += 1) {
        patch(element, previousDomNodes[index] ?? null, previousChildren[index] ?? null, nextChildren[index]);
    }

    for (let index = nextChildren.length; index < previousChildren.length; index += 1) {
        element.removeChild(previousDomNodes[index]);
    }
}

// El mapa relaciona cada clave anterior con su nodo real para poder moverlo sin perder su identidad.
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
            // Si [A, B] cambia a [B, A], insertar B delante de A mueve el mismo nodo. Con null se coloca al final.
            element.insertBefore(domNode, nodeAtPosition);
        }
    });

    // Las entradas reutilizadas ya se quitaron del mapa; las restantes pertenecen a hijos que desaparecieron.
    for (const { domNode } of previousByKey.values()) {
        element.removeChild(domNode);
    }
}

function updateChildren(element, previousChildren, nextChildren) {
    const previousHasKeys = hasKeys(previousChildren);
    const nextHasKeys = hasKeys(nextChildren);

    if (previousChildren.length > 0 && nextChildren.length > 0 && previousHasKeys !== nextHasKeys) {
        const nextDomNodes = nextChildren.map(createDomNode);

        // Al pasar de hijos con claves a hijos sin claves, o al revés, se reconstruyen solo los hijos de este padre.
        element.replaceChildren(...nextDomNodes);
        return;
    }

    if (previousHasKeys || nextHasKeys) {
        updateChildrenByKey(element, previousChildren, nextChildren);
        return;
    }

    updateChildrenByPosition(element, previousChildren, nextChildren);
}

// Devuelve el nodo que queda en el DOM, incluso si hubo que reemplazarlo al cambiar su etiqueta o su clave.
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
            // Cambiar el contenido del nodo de texto conserva tanto el nodo como su elemento padre.
            domNode.nodeValue = nextNode;
        }

        return domNode;
    }

    updateChildren(domNode, previousNode.children, nextNode.children);

    updateProperties(domNode, previousNode.props, nextNode.props);

    return domNode;
}

// La primera llamada monta la raíz; las siguientes comparan contra el último árbol del mismo contenedor.
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

// El estado y los suscriptores quedan en el cierre de este store. La vista se conecta mediante subscribe.
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

    // Devuelve la referencia actual. Los cambios deben pasar por dispatch para que la vista reciba la notificación.
    function getState() {
        return state;
    }

    function dispatch(action) {
        if (action === null || typeof action !== "object" || Array.isArray(action) || typeof action.type !== "string" || action.type.trim() === "") {
            throw new TypeError("La acción debe ser un objeto con un type de texto no vacío.");
        }

        // Un dispatch dentro del reducer intentaría calcular otro cambio antes de terminar el primero.
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
        // La marca se restablece incluso si el reducer falla, para permitir el siguiente dispatch.
        } finally {
            isReducing = false;
        }

        // Devolver la misma referencia desde el reducer indica que la acción no requiere avisar a la vista.
        if (Object.is(state, nextState)) {
            return action;
        }

        state = nextState;

        // La copia fija quién recibe esta notificación aunque un suscriptor cancele su registro durante el recorrido.
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

        // La función devuelta recuerda qué suscriptor retirar cuando la vista deja de observar el store.
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