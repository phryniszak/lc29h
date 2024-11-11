import { Utils } from "../utils";

export class UiPane {

    #activeCallback;

    /**
     * 
     * @param {*} el_id 
     */
    constructor(el_id) {
        this.el = document.getElementById(el_id);
        if (!this.el) {
            throw Error(`Base class element not found for id:"${el_id}"`);
        }

        const _this = this;
        Utils.onClassChange(this.el, () => {
            const active = _this.el.classList.contains("active");
            const show = _this.el.classList.contains("show");

            // active
            if (active && !show && _this.#activeCallback) _this.#activeCallback.call();
            // show
            // if (active && show && _this.#showCallback) _this.#showCallback.call();
        });
    }

    /**
     * 
     * @returns 
     */
    isActive() {
        // first is added active class the show
        return this.el.classList.contains("active") && !this.el.classList.contains("show");
    }

    /**
     * 
     * @param {*} cb 
     */
    setActiveCallback(cb) {
        this.#activeCallback = cb;
    }
}
