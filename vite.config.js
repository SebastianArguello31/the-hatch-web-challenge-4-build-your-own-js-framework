import { defineConfig } from "vite";

export default defineConfig({
    // Las rutas del navegador parten de esta carpeta; /tests/ carga su subcarpeta tests.
    root: "examples/basic-example",

    // El modo clásico traduce JSX a llamadas a createElement, importada por cada módulo JSX.
    oxc: {
        jsx: {
            runtime: "classic",
            pragma: "createElement"
        }
    },

    // La ruta de salida es relativa a la raíz del ejemplo y apunta a dist en el repositorio.
    build: {
        outDir: "../../dist"
    }
});