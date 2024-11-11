import { defineConfig } from "vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import path from "path";

// info: https://vitejs.dev/config/

/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [
        ViteEjsPlugin((viteConfig) => {
            // viteConfig is the current viteResolved config.
            return {
                root: viteConfig.root,
                domain: "example.com",
                title: "LC29H"
            };
        }),
    ],
    root: path.resolve(__dirname, "src"),
    base: "./",
    server: {
        port: 8080
    },
    worker: {
        format: "es"
    },
    build: {
        // minify: "terser",
        terserOptions: {
            ecma: "2015"
        },
        target: ["esnext"], // 👈 build.target
        // Specify the desired format in the Rollup options
        rollupOptions: {
            // Change the output format to "es" or "system"
            output: {
                format: "es" // es or 'system'
            }
        },
        sourcemap: true,
        minify: false
    },
});