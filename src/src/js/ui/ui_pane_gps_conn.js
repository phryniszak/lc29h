import debugModule from "debug";
const debug = new debugModule("ph:uiPaneGpsConn");
import { CONFIG, STATE, TRANSITION } from "../config";
import { SerialDeviceCP210x } from "../device_serial_cp210x.js";
import { SerialDevice } from "../device_serial.js";
import { UiPane } from "./ui_pane";

export class UiPaneGpsConn extends UiPane {

    constructor() {
        super("pane-gps-connection");

        /**
         * WebUSB
         */
        this.inWebUSB = this.el.querySelector("#inWebUSB");
        this.inWebUSB.onclick = async () => {
            debug("open WebUSB device");
            if (globalThis._my_.device?.isConnected()) {
                debug("device already opened");
            }

            await globalThis._my_.device?.disconnect();

            globalThis._my_.device = new SerialDeviceCP210x();

            await globalThis._my_.device.request();
            await globalThis._my_.device.open();
            globalThis._my_.device.read_loop();
        };

        /**
         * WebSerial
         */
        this.inWebSerial = this.el.querySelector("#inWebSerial");
        this.inWebSerial.onclick = async () => {
            debug("open WebUSB device");
            if (globalThis._my_.device?.isConnected()) {
                debug("device already opened");
            }

            await globalThis._my_.device?.disconnect();

            globalThis._my_.device = new SerialDevice();

            await globalThis._my_.device.request();
            await globalThis._my_.device.open();
            globalThis._my_.device.read_loop();
        };

        /**
         * Close
         */
        this.btnCloseDevice = this.el.querySelector("#btnCloseDevice");
        this.btnCloseDevice.onclick = async () => {
            debug("close device");
            await globalThis._my_.device.disconnect();
        };

        /**
         * Configure
         */
        this.btnConfigureDevice = this.el.querySelector("#btnConfigDevice");

        /**
         * Modal configure
         */
        this.btnConfirmModuleConfig = this.el.querySelector("#btnConfirmModuleConfig");
        this.btnConfirmModuleConfig.onclick = async () => {

            if (globalThis._my_.controller.isBase()) {
                globalThis._my_.controller.transition(TRANSITION.base_config);
            } else if (globalThis._my_.controller.isRover()) {
                globalThis._my_.controller.transition(TRANSITION.rover_config);
            }
        };

        /**
         * Survey time
         */
        this.divBaseConfig = this.el.querySelector("#divBaseConfig");

        // listen for serial port state change
        globalThis._my_.events.addEventListener(CONFIG.STATE, (ev) => {
            switch (ev.detail) {
                case STATE.connected:
                    this.inWebSerial.disabled = true;
                    this.inWebUSB.disabled = true;
                    this.btnCloseDevice.disabled = false;
                    this.btnConfigureDevice.disabled = false;
                    break;
                case STATE.disconnected:
                    this.inWebSerial.disabled = false;
                    this.inWebUSB.disabled = false;
                    this.btnCloseDevice.disabled = true;
                    this.btnConfigureDevice.disabled = true;
                    this.divBaseConfig.hidden = true;
                    break;
                case STATE.rover:
                    this.el.querySelector("#confirmModuleConfigLabel").innerText = "Configure Rover";
                    break;
                case STATE.base:
                    this.el.querySelector("#confirmModuleConfigLabel").innerText = "Configure Base";
                    this.divBaseConfig.hidden = false;
                    break;
            }
        });
    }

    /**
     * 
     * @returns 
     */
    useWebUsb() {
        return this.inWebUSB.checked;
    }

    /**
     * 
     * @returns 
     */
    useWebSerial() {
        return this.inWebSerial.checked;
    }
}
