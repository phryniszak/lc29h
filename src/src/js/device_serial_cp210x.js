import debugModule from "debug";
const debug = new debugModule("ph:cp210x_dev");

import { CONFIG, SERIAL_DEVICES } from "./config";
import { Utils } from "./utils";
import { Chunker } from "./chunker";

const kDefaultUsbTransferInterfaceClass = 0xFF;
const transferInSize = 1024 * 2;

// registers
const CP210x_SET_BAUDRATE = 0x1e;
const CP210x_IFC_ENABLE = 0x00;
const CP210x_SET_LINE_CTL = 0x03;
const CP210x_SET_MHS = 0x07;
const CP210x_PURGE = 0x12;
// const CP210x_GET_BAUDRATE = 0x1d;

// values
// 8n0
const CP210x_LINE_CTL_DEFAULT = 0x0800;
// no DTR and RTS
const CP210x_MHS_DEFAULT = 0x0000;
const CP210x_UART_ENABLE = 0x0001;
const CP210x_UART_DISABLE = 0x0000;
const CP210x_PURGE_ALL = 0x000f;

/**
 * Utility function to get the interface implementing a desired class.
 * @param {USBDevice} device The USB device.
 * @param {number} classCode The desired interface class.
 * @return {USBInterface} The first interface found that implements the desired
 * class.
 * @throws TypeError if no interface is found.
 */
function findInterface(device, classCode) {
    const configuration = device.configurations[0];
    for (const iface of configuration.interfaces) {
        const alternate = iface.alternates[0];
        if (alternate.interfaceClass === classCode) {
            return iface;
        }
    }
    throw new TypeError(`Unable to find interface with class ${classCode}.`);
}

/**
 * Utility function to get an endpoint with a particular direction.
 * @param {USBInterface} iface The interface to search.
 * @param {USBDirection} direction The desired transfer direction.
 * @return {USBEndpoint} The first endpoint with the desired transfer direction.
 * @throws TypeError if no endpoint is found.
 */
function findEndpoint(iface, type, direction) {
    const alternate = iface.alternates[0];
    for (const endpoint of alternate.endpoints) {
        if ((endpoint.direction == direction) && (endpoint.type === type)) {
            return endpoint;
        }
    }
    throw new TypeError(`Interface ${iface.interfaceNumber} does not have an ` +
        `${direction} endpoint.`);
}

/**
 *
 */
export class SerialDeviceCP210x {

    #encoder = new TextEncoder();
    #chunker = new Chunker();

    #device = null;

    #outEndpoint = null;
    #inEndpoint = null;
    #transferInterface = null;
    // #interfaceNumber = null;
    #baudRate = 115200;
    #disconnecting = false;

    constructor() {
    }

    async request() {
        // Request access to the CP210x device using WebUSB
        try {
            this.#device = await navigator.usb.requestDevice({
                filters: SERIAL_DEVICES // Vendor ID for CP210x
            });

            this.#transferInterface = findInterface(this.#device, kDefaultUsbTransferInterfaceClass);
            this.#inEndpoint = findEndpoint(this.#transferInterface, "bulk", "in");
            this.#outEndpoint = findEndpoint(this.#transferInterface, "bulk", "out");

            return true;

        } catch (error) {
            debug("Failed to request CP210x device:", error);
            return false;
        }
    }

    /**
     *
     */
    async open() {

        this.#disconnecting = false;
        // connecting
        globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_CONNECTING);

        try {
            await this.#device.open();

            // 1: we set an configuration (configuration descriptor in the USB standard)
            if (this.#device.configuration === null) {
                await this.#device.selectConfiguration(1);
            }

            // 3: we claim this interface and select the alternative interface
            await this.#device.claimInterface(this.#transferInterface.interfaceNumber);
            // await this.#device.selectAlternateInterface(this.#interfaceNumber, 0);

            // 4.
            await this._out_vendor_interface_control_transfer(CP210x_IFC_ENABLE, CP210x_UART_ENABLE);
            const buffer = new ArrayBuffer(4);
            let data = new Uint8Array(buffer);
            data[0] = this.#baudRate & 0xff;
            data[1] = this.#baudRate >> 8 & 0xff;
            data[2] = this.#baudRate >> 16 & 0xff;
            data[3] = this.#baudRate >> 24 & 0xff;
            await this._out_vendor_interface_control_transfer(CP210x_SET_BAUDRATE, 0, 0, data);
            // let result = await this._in_vendor_interface_control_transfer(CP210x_GET_BAUDRATE, 0, 0, 4);
            // console.log(result);
            await this._out_vendor_interface_control_transfer(CP210x_SET_LINE_CTL, CP210x_LINE_CTL_DEFAULT);
            await this._out_vendor_interface_control_transfer(CP210x_SET_MHS, CP210x_MHS_DEFAULT);
        }
        catch (error) {
            debug(error.toString());
            this.onError();
            return;
        }

        // connected
        globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_CONNECTED);
    }

    /**
     *
     */
    read_loop = async () => {

        while ((this.#disconnecting == false) && (this.#device?.opened)) {

            // is it needed to prevent saturating main thread?
            await Utils.later(CONFIG.SERIAL_LOOP_TIME_TICK);

            try {
                const result = await this.#device.transferIn(this.#inEndpoint.endpointNumber, transferInSize);
                if (result.status != "ok") {
                    debug(`USB error: ${result.status}`);
                    this.onError();
                }
                if (result.data?.buffer) {
                    const chunk = new Uint8Array(result.data.buffer);

                    // send data
                    globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_RX, chunk);

                    // send data to parser
                    this.#chunker.parseData(chunk);
                }
            }
            catch (error) {
                debug(error.toString());
                this.onError();
            }
        }
    };

    /**
    * Closes the currently active connection.
    */
    disconnect = async () => {

        this.#disconnecting = true;

        // only when connected to device
        if (this.#device?.opened)
            try {
                await this._out_vendor_interface_control_transfer(CP210x_PURGE, CP210x_PURGE_ALL);
                await this._out_vendor_interface_control_transfer(CP210x_IFC_ENABLE, CP210x_UART_DISABLE,);
            } catch (e) {
                debug("disconnect error");
                if (e instanceof Error) {
                    debug(e.message);
                }
            }

        // only when we have handle to device
        if (this.#device != null) {
            // Move |port| into a local variable so that connectToPort() doesn't try to
            // close it on exit.

            const device = this.#device;
            this.#device = null;

            try {
                await device.releaseInterface(0);
                await device.close();
            } catch (e) {
                debug("disconnect error");
                if (e instanceof Error) {
                    debug(e.message);
                }
            }
        }

        // disconnected
        globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_DISCONNECTED);
        debug("disconnected");
    };

    /**
    * Chunks written to this stream must be instances of ArrayBuffer, TypedArray, DataView or string
    * @param {} data
    */
    write = async (data) => {

        // if passed string
        if (typeof data === "string") data = this.#encoder.encode(data);

        try {
            const result = await this.#device.transferOut(this.#outEndpoint.endpointNumber, data);
            if (result.status != "ok") {
                debug("transferOut status not OK");
                this.onError();
            }
        }
        catch (error) {
            debug(error.toString());
            this.onError();
        }
    };

    /**
     *
     */
    onError() {
        this.disconnect();
    }

    /**
    *
    * @returns
    */
    isConnected = () => {
        return (this.#device != null);
    };

    /**
     *
     * @param {*} request
     * @param {*} value
     * @param {*} index
     * @param {*} data
     * @returns
     */
    async _out_vendor_interface_control_transfer(request, value, index = 0, data = null) {
        const parameters = {
            requestType: "vendor",
            recipient: "interface",
            request: request,
            value: value,
            index: index
        };

        if (data != null) {
            return await this.#device.controlTransferOut(parameters, data);
        }

        return await this.#device.controlTransferOut(parameters);
    }

    /**
     *
     * @param {*} request
     * @param {*} value
     * @param {*} index
     * @param {*} length
     * @returns
     */
    async _in_vendor_interface_control_transfer(request, value, index, length) {
        const parameters = {
            requestType: "vendor",
            recipient: "interface",
            request: request,
            value: value,
            index: index
        };
        return await this.#device.controlTransferIn(parameters, length);
    }
}