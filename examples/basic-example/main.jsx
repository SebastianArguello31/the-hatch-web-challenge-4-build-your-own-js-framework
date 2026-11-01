import { createElement, render } from "../../src/mini-framework.js";

const container = document.getElementById("app");

let count = 0;
let showDescription = true;
let useAlternativeTitle = false;
let nextTaskId = 3;

let tasks = [
    { id: 1, title: "Estudiar el Virtual DOM" },
    { id: 2, title: "Practicar eventos" }
];

function increment() {
    count += 1;
    updateView();
}

function toggleDescription() {
    showDescription = !showDescription;
    updateView();
}

function toggleTitleType() {
    useAlternativeTitle = !useAlternativeTitle;
    updateView();
}

function reverseTasks() {
    tasks = [...tasks].reverse();
    updateView();
}

function addTask() {
    const task = {
        id: nextTaskId,
        title: `Tarea de ejemplo ${nextTaskId}`
    };

    nextTaskId += 1;
    tasks = [...tasks, task];

    updateView();
}

function removeTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    updateView();
}

function ActionButton({ id, onClick, children }) {
    return (
        <button id={id} type="button" onClick={onClick}>
            {children}
        </button>
    );
}

function PageTitle({ alternative }) {
    if (alternative) {
        return <h2 id="page-title">Componentes y JSX</h2>;
    }

    return <h1 id="page-title">Componentes y JSX</h1>;
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

function App() {
    return (
        <main className="app">
            <PageTitle alternative={useAlternativeTitle} />

            <Counter value={count} onIncrement={increment} />

            <ActionButton onClick={toggleTitleType}>
                Cambiar etiqueta del título
            </ActionButton>

            <ActionButton onClick={toggleDescription}>
                {showDescription
                ? "Ocultar descripción"
                : "Mostrar descripción"}
            </ActionButton>

            <section id="description">
                {showDescription && (<p>Esta interfaz utiliza componentes de nuestro framework.</p>)}
            </section>

            <label htmlFor="preserved-input">
                Escribe aquí y después incrementa el contador:
            </label>

            <input id="preserved-input" type="text" placeholder="El texto debe conservarse"/>

            <ActionButton onClick={reverseTasks}>
                Invertir tareas
            </ActionButton>

            <ActionButton onClick={addTask}>
                Añadir tarea de ejemplo
            </ActionButton>

            <TaskList items={tasks} onRemove={removeTask} />
        </main>
    );
}

function updateView() {
    render(<App />, container);
}

updateView();