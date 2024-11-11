import debugModule from "debug";
const debug = new debugModule("ph:serial_device");

import { CONFIG, WEB_SERIAL_DEVICES } from "./config";
import { Utils } from "./utils";
import { Chunker } from "./chunker";

export class SerialDevice {

    #port;
    #reader;
    #read_value;
    #encoder = new TextEncoder();
    #chunker = new Chunker();

    constructor() {
    }

    /**
     * 
     */
    async request() {
        try {
            this.#port = await navigator.serial.requestPort({ filters: WEB_SERIAL_DEVICES });
        } catch (e) {
            debug(e);
        }
    }

    /**
     * 
     */
    async open() {

        // connecting
        globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_CONNECTING);

        const options = {
            baudRate: 115200,
        };

        debug(`connecting with speed: ${options.baudRate}`);

        try {
            await this.#port.open(options);
        } catch (e) {
            debug("failed to open serial port");
            if (e instanceof Error) {
                debug(e.message);
            }

            // disconnected
            globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_DISCONNECTED);
            return;
        }


        // connected
        globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_CONNECTED);
    }

    /**
     * 
     */
    read_loop = async () => {

        while (this.#port && this.#port.readable) {

            // is it needed to prevent saturating main thread?
            await Utils.later(CONFIG.SERIAL_LOOP_TIME_TICK);

            try {
                try {
                    this.#reader = this.#port.readable.getReader({ mode: "byob" });
                } catch {
                    this.#reader = this.#port.readable.getReader();
                }

                let buffer = null;
                for (; ;) {
                    const { value, done } = await (async () => {
                        // eslint-disable-next-line no-undef
                        if (this.#reader instanceof ReadableStreamBYOBReader) {
                            if (!buffer) {
                                buffer = new ArrayBuffer(CONFIG.SERIAL_BUFFER_SIZE);
                            }
                            const { value, done } =
                                await this.#reader.read(new Uint8Array(buffer, 0, CONFIG.SERIAL_BUFFER_SIZE));
                            buffer = value?.buffer;
                            return { value, done };
                        } else {
                            return await this.#reader.read();
                        }
                    })();

                    if (value) {
                        // eslint-disable-next-line no-undef
                        if (this.#reader instanceof ReadableStreamBYOBReader)
                            // we have to make a copy in case "byob" 
                            this.#read_value = value.slice(0);
                        else
                            this.#read_value = value;

                        // send data
                        globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_RX, this.#read_value);

                        // send data to parser
                        this.#chunker.parseData(this.#read_value);
                    }

                    if (done) {
                        break;
                    }
                }
            } catch (e) {
                debug("readSerialLoop error");
                if (e instanceof Error) {
                    debug(e.message);
                }
            } finally {
                if (this.#reader) {
                    this.#reader.releaseLock();
                    this.#reader = undefined;
                }
            }
        }

        if (this.#port) {
            try {
                await this.#port.close();
            } catch (e) {
                debug("readSerialLoop close error");
                if (e instanceof Error) {
                    debug(e.message);
                }
            }

            // disconnected
            globalThis._my_.dispatchEvent(CONFIG.EV_DEVICE_STATE, CONFIG.DEVICE_STATE_DISCONNECTED);
        }
    };

    /**
    * Closes the currently active connection.
    */
    disconnect = async () => {
        // Move |port| into a local variable so that connectToPort() doesn't try to
        // close it on exit.
        const localPort = this.#port;
        this.#port = undefined;

        if (this.#reader) {
            await this.#reader.cancel();
        }

        if (localPort) {
            try {
                await localPort.close();
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
    * Chunks written to this stream must be instances of ArrayBuffer, TypedArray, or DataView.
    * @param {} data 
    */
    write = async (data) => {

        // if passed string
        if (typeof data === "string") data = this.#encoder.encode(data);

        if (this.#port && this.#port.writable) {
            const writer = this.#port.writable.getWriter();
            try {
                // const bytes = new Uint8Array([ch]);
                await writer.write(data);
            } catch (error) {
                // Handle |error|...
                debug("writeByte error");
                if (error instanceof Error) {
                    debug(error.message);
                }
            } finally {
                writer.releaseLock();
            }
        }
    };

    /**
    * 
    * @returns 
    */
    isConnected = () => {
        return (this.#port && this.#port.readable);
    };
}