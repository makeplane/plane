import { $$, ajax, replaceToolbarState, debounce } from "./utils.js";

function onKeyDown(event) {
    if (event.keyCode === 27) {
        djdt.hideOneLevel();
    }
}

function getDebugElement() {
    // Fetch the debug element from the DOM.
    // This is used to avoid writing the element's id
    // everywhere the element is being selected. A fixed reference
    // to the element should be avoided because the entire DOM could
    // be reloaded such as via HTMX boosting.
    return document.getElementById("djDebug");
}

const djdt = {
    handleDragged: false,
    needUpdateOnFetch: false,
    init() {
        const djDebug = getDebugElement();
        djdt.needUpdateOnFetch = djDebug.dataset.updateOnFetch === "True";
        $$.on(djDebug, "click", "#djDebugPanelList li a", function (event) {
            event.preventDefault();
            if (!this.className) {
                return;
            }
            const panelId = this.className;
            const current = document.getElementById(panelId);
            if ($$.visible(current)) {
                djdt.hidePanels();
            } else {
                djdt.hidePanels();

                $$.show(current);
                this.parentElement.classList.add("djdt-active");

                const inner = current.querySelector(
                        ".djDebugPanelContent .djdt-scroll"
                    ),
                    storeId = djDebug.dataset.storeId;
                if (storeId && inner.children.length === 0) {
                    const url = new URL(
                        djDebug.dataset.renderPanelUrl,
                        window.location
                    );
                    url.searchParams.append("store_id", storeId);
                    url.searchParams.append("panel_id", panelId);
                    ajax(url).then(function (data) {
                        inner.previousElementSibling.remove(); // Remove AJAX loader
                        inner.innerHTML = data.content;
                        $$.executeScripts(data.scripts);
                        $$.applyStyles(inner);
                        djDebug.dispatchEvent(
                            new CustomEvent("djdt.panel.render", {
                                detail: { panelId: panelId },
                            })
                        );
                    });
                } else {
                    djDebug.dispatchEvent(
                        new CustomEvent("djdt.panel.render", {
                            detail: { panelId: panelId },
                        })
                    );
                }
            }
        });
        $$.on(djDebug, "click", ".djDebugClose", function () {
            djdt.hideOneLevel();
        });
        $$.on(
            djDebug,
            "click",
            ".djDebugPanelButton input[type=checkbox]",
            function () {
                djdt.cookie.set(
                    this.dataset.cookie,
                    this.checked ? "on" : "off",
                    {
                        path: "/",
                        expires: 10,
                    }
                );
            }
        );

        // Used by the SQL and template panels
        $$.on(djDebug, "click", ".remoteCall", function (event) {
            event.preventDefault();

            let url;
            const ajaxData = {};

            if (this.tagName === "BUTTON") {
                const form = this.closest("form");
                url = this.formAction;
                ajaxData.method = form.method.toUpperCase();
                ajaxData.body = new FormData(form);
            } else if (this.tagName === "A") {
                url = this.href;
            }

            ajax(url, ajaxData).then(function (data) {
                const win = document.getElementById("djDebugWindow");
                win.innerHTML = data.content;
                $$.show(win);
            });
        });

        // Used by the cache, profiling and SQL panels
        $$.on(djDebug, "click", ".djToggleSwitch", function () {
            const id = this.dataset.toggleId;
            const toggleOpen = "+";
            const toggleClose = "-";
            const openMe = this.textContent === toggleOpen;
            const name = this.dataset.toggleName;
            const container = document.getElementById(name + "_" + id);
            container
                .querySelectorAll(".djDebugCollapsed")
                .forEach(function (e) {
                    $$.toggle(e, openMe);
                });
            container
                .querySelectorAll(".djDebugUncollapsed")
                .forEach(function (e) {
                    $$.toggle(e, !openMe);
                });
            const self = this;
            this.closest(".djDebugPanelContent")
                .querySelectorAll(".djToggleDetails_" + id)
                .forEach(function (e) {
                    if (openMe) {
                        e.classList.add("djSelected");
                        e.classList.remove("djUnselected");
                        self.textContent = toggleClose;
                    } else {
                        e.classList.remove("djSelected");
                        e.classList.add("djUnselected");
                        self.textContent = toggleOpen;
                    }
                    const switch_ = e.querySelector(".djToggleSwitch");
                    if (switch_) {
                        switch_.textContent = self.textContent;
                    }
                });
        });

        $$.on(djDebug, "click", "#djHideToolBarButton", function (event) {
            event.preventDefault();
            djdt.hideToolbar();
        });

        $$.on(djDebug, "click", "#djShowToolBarButton", function () {
            if (!djdt.handleDragged) {
                djdt.showToolbar();
            }
        });
        let startPageY, baseY;
        const handle = document.getElementById("djDebugToolbarHandle");
        function onHandleMove(event) {
            // Chrome can send spurious mousemove events, so don't do anything unless the
            // cursor really moved.  Otherwise, it will be impossible to expand the toolbar
            // due to djdt.handleDragged being set to true.
            if (djdt.handleDragged || event.pageY !== startPageY) {
                let top = baseY + event.pageY;

                if (top < 0) {
                    top = 0;
                } else if (top + handle.offsetHeight > window.innerHeight) {
                    top = window.innerHeight - handle.offsetHeight;
                }

                handle.style.top = top + "px";
                djdt.handleDragged = true;
            }
        }
        $$.on(djDebug, "mousedown", "#djShowToolBarButton", function (event) {
            event.preventDefault();
            startPageY = event.pageY;
            baseY = handle.offsetTop - startPageY;
            document.addEventListener("mousemove", onHandleMove);

            document.addEventListener(
                "mouseup",
                function (event) {
                    document.removeEventListener("mousemove", onHandleMove);
                    if (djdt.handleDragged) {
                        event.preventDefault();
                        localStorage.setItem("djdt.top", handle.offsetTop);
                        requestAnimationFrame(function () {
                            djdt.handleDragged = false;
                        });
                        djdt.ensureHandleVisibility();
                    }
                },
                { once: true }
            );
        });

        // Make sure the debug element is rendered at least once.
        // showToolbar will continue to show it in the future if the
        // entire DOM is reloaded.
        $$.show(djDebug);
        const show =
            localStorage.getItem("djdt.show") || djDebug.dataset.defaultShow;
        if (show === "true") {
            djdt.showToolbar();
        } else {
            djdt.hideToolbar();
        }
        if (djDebug.dataset.sidebarUrl !== undefined) {
            djdt.updateOnAjax();
        }
    },
    hidePanels() {
        const djDebug = getDebugElement();
        $$.hide(document.getElementById("djDebugWindow"));
        djDebug.querySelectorAll(".djdt-panelContent").forEach(function (e) {
            $$.hide(e);
        });
        document.querySelectorAll("#djDebugToolbar li").forEach(function (e) {
            e.classList.remove("djdt-active");
        });
    },
    ensureHandleVisibility() {
        const handle = document.getElementById("djDebugToolbarHandle");
        // set handle position
        const handleTop = Math.min(
            localStorage.getItem("djdt.top") || 265,
            window.innerHeight - handle.offsetWidth
        );
        handle.style.top = handleTop + "px";
    },
    hideToolbar() {
        djdt.hidePanels();

        $$.hide(document.getElementById("djDebugToolbar"));

        const handle = document.getElementById("djDebugToolbarHandle");
        $$.show(handle);
        djdt.ensureHandleVisibility();
        window.addEventListener("resize", djdt.ensureHandleVisibility);
        document.removeEventListener("keydown", onKeyDown);

        localStorage.setItem("djdt.show", "false");
    },
    hideOneLevel() {
        const win = document.getElementById("djDebugWindow");
        if ($$.visible(win)) {
            $$.hide(win);
        } else {
            const toolbar = document.getElementById("djDebugToolbar");
            if (toolbar.querySelector("li.djdt-active")) {
                djdt.hidePanels();
            } else {
                djdt.hideToolbar();
            }
        }
    },
    showToolbar() {
        document.addEventListener("keydown", onKeyDown);
        $$.show(document.getElementById("djDebug"));
        $$.hide(document.getElementById("djDebugToolbarHandle"));
        $$.show(document.getElementById("djDebugToolbar"));
        localStorage.setItem("djdt.show", "true");
        window.removeEventListener("resize", djdt.ensureHandleVisibility);
    },
    updateOnAjax() {
        const sidebarUrl =
            document.getElementById("djDebug").dataset.sidebarUrl;
        const slowjax = debounce(ajax, 200);

        function handleAjaxResponse(storeId) {
            storeId = encodeURIComponent(storeId);
            const dest = `${sidebarUrl}?store_id=${storeId}`;
            slowjax(dest).then(function (data) {
                if (djdt.needUpdateOnFetch){
                    replaceToolbarState(storeId, data);
                }
            });
        }

        // Patch XHR / traditional AJAX requests
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
            this.addEventListener("load", function () {
                // Chromium emits a "Refused to get unsafe header" uncatchable warning
                // when the header can't be fetched. While it doesn't impede execution
                // it's worrisome to developers.
                if (
                    this.getAllResponseHeaders().indexOf("djdt-store-id") >= 0
                ) {
                    handleAjaxResponse(this.getResponseHeader("djdt-store-id"));
                }
            });
            origOpen.apply(this, arguments);
        };

        const origFetch = window.fetch;
        window.fetch = function () {
            const promise = origFetch.apply(this, arguments);
            promise.then(function (response) {
                if (response.headers.get("djdt-store-id") !== null) {
                    handleAjaxResponse(response.headers.get("djdt-store-id"));
                }
                // Don't resolve the response via .json(). Instead
                // continue to return it to allow the caller to consume as needed.
                return response;
            });
            return promise;
        };
    },
    cookie: {
        get(key) {
            if (!document.cookie.includes(key)) {
                return null;
            }

            const cookieArray = document.cookie.split("; "),
                cookies = {};

            cookieArray.forEach(function (e) {
                const parts = e.split("=");
                cookies[parts[0]] = parts[1];
            });

            return cookies[key];
        },
        set(key, value, options) {
            options = options || {};

            if (typeof options.expires === "number") {
                const days = options.expires,
                    t = (options.expires = new Date());
                t.setDate(t.getDate() + days);
            }

            document.cookie = [
                encodeURIComponent(key) + "=" + String(value),
                options.expires
                    ? "; expires=" + options.expires.toUTCString()
                    : "",
                options.path ? "; path=" + options.path : "",
                options.domain ? "; domain=" + options.domain : "",
                options.secure ? "; secure" : "",
                "samesite" in options
                    ? "; samesite=" + options.samesite
                    : "; samesite=lax",
            ].join("");

            return value;
        },
    },
};
window.djdt = {
    show_toolbar: djdt.showToolbar,
    hide_toolbar: djdt.hideToolbar,
    init: djdt.init,
    close: djdt.hideOneLevel,
    cookie: djdt.cookie,
};

if (document.readyState !== "loading") {
    djdt.init();
} else {
    document.addEventListener("DOMContentLoaded", djdt.init);
}
