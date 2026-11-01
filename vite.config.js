import { defineConfig } from "vite";

export default defineConfig({
    root: "examples/basic-example",

    oxc: {
        jsx: {
            runtime: "classic",
            pragma: "createElement"
        }
    },

    build: {
        outDir: "../../dist"
    }
});