import { init as initRouter, currentRoute } from "./router.js";
import { init as initDOM } from "./lifecycle.js";

export { navigate } from "./router.js";
export { onDestroy } from "./lifecycle.js";

let pageLoader;

export default async function($root, routes, opts = {}) {
    window.addEventListener("pagechange", async () => {
        try {
            const route = currentRoute(routes, "");
            const [ctrl] = await Promise.all([
                load(route, { ...opts, $root }),
                $root.cleanup(),
            ]);
            if (typeof ctrl !== "function") throw new Error(`Unknown route for ${route}`);
            pageLoader = ctrl(createRender($root));
        } catch(err) {
            window.onerror && window.onerror(err.message);
        }
    });

    await initDOM($root);
    await opts.beforeStart;
    await initRouter($root);
}

async function load(route, opts) {
    const { spinner = "loading ...", spinnerTime = 200, $root } = opts;
    let ctrl;
    if (typeof route === "function") {
        ctrl = route;
    } else if (typeof route === "string") {
        let spinnerID;
        if (pageLoader && typeof pageLoader.then === "function") {
            const pageLoaderCallback = await pageLoader;
            if (typeof pageLoaderCallback !== "function") throw new Error("expected a function as returned value");
            spinnerID = setTimeout(() => pageLoaderCallback(route), spinnerTime);
        } else if (typeof spinner === "string") {
            spinnerID = setTimeout(() => $root.innerHTML = spinner, spinnerTime);
        }
        const module = await import("../.." + route);
        clearTimeout(spinnerID);
        if (typeof module.default !== "function") throw new Error(`missing default export on ${route}`);
        ctrl = module.default;
    }
    return ctrl;
}

export function createElement(str) {
    const $n = window.document.createElement("div");
    $n.innerHTML = str;
    return $n.firstElementChild;
}

export function createRender($parent) {
    return ($view) => {
        if ($view instanceof window.Element) $parent.replaceChildren($view);
        else throw new Error(`Unknown view type: ${typeof $view}`);
    };
}
