import { createElement, createStore, render } from "../../src/mini-framework.js";

const container = document.getElementById("app");

const initialState = {
    count: 0,
    showDescription: true,
    useAlternativeTitle: false,
    nextTaskId: 3,
    tasks: [
        { id: 1, title: "Estudiar el Virtual DOM" },
        { id: 2, title: "Practicar eventos" }
    ]
};

function reducer(state, action) {
    switch (action.type) {
        case "counter/increment":
            return {
                ...state,
                count: state.count + 1
            };

        case "description/toggle":
            return {
                ...state,
                showDescription: !state.showDescription
            };

        case "title/toggle":
            return {
                ...state,
                useAlternativeTitle: !state.useAlternativeTitle
            };

        case "tasks/reverse":
            if (state.tasks.length < 2) {
                return state;
            }

            return {
                ...state,
                tasks: [...state.tasks].reverse()
            };

        case "task/add": {
            const task = {
                id: state.nextTaskId,
                title: `Tarea de ejemplo ${state.nextTaskId}`
            };

            return {
                ...state,
                nextTaskId: state.nextTaskId + 1,
                tasks: [...state.tasks, task]
            };
        }

        case "task/remove": {
            const remainingTasks = state.tasks.filter(
                (task) => task.id !== action.payload
            );

            if (remainingTasks.length === state.tasks.length) {
                return state;
            }

            return {
                ...state,
                tasks: remainingTasks
            };
        }

        default:
            return state;
    }
}

const store = createStore(reducer, initialState);

const actions = {
    increment() {
        store.dispatch({ type: "counter/increment" });
    },

    toggleDescription() {
        store.dispatch({ type: "description/toggle" });
    },

    toggleTitleType() {
        store.dispatch({ type: "title/toggle" });
    },

    reverseTasks() {
        store.dispatch({ type: "tasks/reverse" });
    },

    addTask() {
        store.dispatch({ type: "task/add" });
    },

    removeTask(id) {
        store.dispatch({
            type: "task/remove",
            payload: id
        });
    }
};

function ActionButton({ id, onClick, children }) {
    return (
        <button id={id} type="button" onClick={onClick}>
            {children}
        </button>
    );
}

function PageTitle({ alternative }) {
    if (alternative) {
        return <h2 id="page-title">Estado y arquitectura FLUX</h2>;
    }

    return <h1 id="page-title">Estado y arquitectura FLUX</h1>;
}

function Counter({ value, onIncrement }) {
    return (
        <section>
            <p id="counter" title={value === 0 ? "Todavía no hubo clics" : null}>
                Clics: {value}
            </p>

            <ActionButton id="increment" onClick={onIncrement}>
                Incrementar
            </ActionButton>
        </section>
    );
}

function TaskItem({ task, onRemove }) {
    return (
        <li data-task-id={task.id}>
            <span>{task.title}</span>

            <ActionButton onClick={() => onRemove(task.id)}>
                Eliminar
            </ActionButton>
        </li>
    );
}

function TaskList({ items, onRemove }) {
    return (
        <ul id="task-list">
            {items.map((task) => (<TaskItem key={task.id} task={task} onRemove={onRemove}/>))}
        </ul>
    );
}

function App({ state }) {
    return (
        <main className="app">
            <PageTitle alternative={state.useAlternativeTitle} />

            <Counter value={state.count} onIncrement={actions.increment}/>

            <ActionButton onClick={actions.toggleTitleType}>
                Cambiar etiqueta del título
            </ActionButton>

            <ActionButton onClick={actions.toggleDescription}>
                {state.showDescription
                ? "Ocultar descripción"
                : "Mostrar descripción"}
            </ActionButton>

            <section id="description">
                {state.showDescription && (
                    <p>Las acciones actualizan el store y sus suscriptores actualizan la interfaz.</p>
                )}
            </section>

            <label htmlFor="preserved-input">
                Escribe aquí y después incrementa el contador:
            </label>

            <input id="preserved-input" type="text" placeholder="El texto debe conservarse"/>

            <ActionButton onClick={actions.reverseTasks}>
                Invertir tareas
            </ActionButton>

            <ActionButton onClick={actions.addTask}>
                Añadir tarea de ejemplo
            </ActionButton>

            <TaskList items={state.tasks} onRemove={actions.removeTask}/>
        </main>
    );
}

function updateView() {
    render(
        <App state={store.getState()} />,
        container
    );
}

store.subscribe(updateView);

updateView();