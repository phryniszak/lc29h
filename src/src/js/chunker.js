// https://github.com/serialport/node-serialport/blob/master/packages/parser-delimiter/lib/index.ts
// https://github.com/serialport/node-serialport/blob/master/packages/parser-readline/lib/index.ts
import { CONFIG } from "./config";
import { Utils } from "./utils";
import { checkRtcmCrc24 } from "./crc24";

import debugModule from "debug";
const debug = new debugModule("ph:chunker");

export class Chunker {

    #delimiterNMEA = new Uint8Array([0x0D, 0x0A]);
    #uint8array;
    // #utf8EncodeText = new TextEncoder();
    #utf8DecodeText = new TextDecoder();
    #arrMaxSize = 1024 + 20; // RTCM max length is 10 bit 1024

    /**
     * 
     * @param {*} size 
     */
    constructor() {
        this.init_buffer();
    }

    /**
     * 
     */
    init_buffer() {
        this.#uint8array = new Uint8Array(0);
    }

    /**
     * 
     * @param {*} chunk 
     */
    parseData(chunk) {

        // add chunk to 
        let mergedArray = new Uint8Array(this.#uint8array.length + chunk.length);
        mergedArray.set(this.#uint8array);
        mergedArray.set(chunk, this.#uint8array.length);

        // reduce max size 
        if (mergedArray.length > this.#arrMaxSize) {
            mergedArray = mergedArray.slice(-this.#arrMaxSize);
        }


        // repeat until we have NMEA or RTCM3 candidate
        let candidateNMEA, candidateRTCM3;
        do {
            candidateNMEA = this.findNMEA(mergedArray);
            candidateRTCM3 = this.findRTCM3(mergedArray);

            // 1. if only found NMEA
            if ((candidateNMEA.start > -1) && (candidateRTCM3.start == -1)) {
                globalThis._my_.dispatchEvent(CONFIG.EV_NMEA,
                    this.#utf8DecodeText.decode(mergedArray.slice(candidateNMEA.start, candidateNMEA.stop)));
                mergedArray = mergedArray.slice(candidateNMEA.stop + this.#delimiterNMEA.length);
            }
            // 2. if only found RTCM3
            if ((candidateNMEA.start == -1) && (candidateRTCM3.start > -1)) {
                globalThis._my_.dispatchEvent(CONFIG.EV_RTCM3,
                    { array: mergedArray.slice(candidateRTCM3.start, candidateRTCM3.stop), type: candidateRTCM3.msg });
                mergedArray = mergedArray.slice(candidateRTCM3.stop);
            }

            // 3. found RTCM3 and NMEA
            if ((candidateNMEA.start > -1) && (candidateRTCM3.start > -1)) {

                if (candidateNMEA.start < candidateRTCM3.start) {
                    // NMEA is first
                    globalThis._my_.dispatchEvent(CONFIG.EV_NMEA,
                        this.#utf8DecodeText.decode(mergedArray.slice(candidateNMEA.start, candidateNMEA.stop)));
                    mergedArray = mergedArray.slice(candidateNMEA.stop + this.#delimiterNMEA.length);
                } else {
                    // RTCM3 is first
                    globalThis._my_.dispatchEvent(CONFIG.EV_RTCM3,
                        { array: mergedArray.slice(candidateRTCM3.start, candidateRTCM3.stop), type: candidateRTCM3.msg });
                    mergedArray = mergedArray.slice(candidateRTCM3.stop);
                }
                // What about the case when candidateNMEA.start === candidateRTCM3.start
                // is it possible?
            }

            // 4. not fount RTCM3 or NMEA - covered by while(.......) logic
            // if ((candidateNMEA.start == -1) && (candidateRTCM3.start == -1)) {
            //     debug("parseData - no RTCM3 or NMEA");
            // }

        } while ((candidateNMEA.start > -1) || (candidateRTCM3.start > -1));

        // let position;
        // while () {
        //     globalThis._my_.dispatchEvent(CONFIG.MESSAGE_SERIAL_RX_LINE,
        //         this.#utf8DecodeText.decode(mergedArray.slice(0,
        //             position + (this.#includeDelimiter ? this.#delimiter.length : 0))));
        //     mergedArray = mergedArray.slice(position + this.#delimiter.length);
        // }

        this.#uint8array = mergedArray;
    }

    /**
     * 
     * @param {Uint8Array} array 
     * @returns {}
     */
    findNMEA(array) {

        // find ending
        const stop_index = Utils.findArray(array, this.#delimiterNMEA);
        // no start - return
        if (stop_index < 0)
            return { start: -1 };

        // find start, starting from end position
        const start_index = array.findLastIndex((element, index) => {
            return (index < stop_index) && (element === 0x24);
        });

        // no start - return
        if (start_index < 0)
            return { start: -1 };


        // start and stop in reverse order
        if (start_index > stop_index)
            return { start: -1 };

        // to short
        // $ + adress + * + checksum + <CR><LF>
        // 1 + 5      + 1 + 1
        if ((stop_index - start_index) < 8) {
            return { start: -1 };
        }

        // find CRC position (*)
        const crc_index = array.findLastIndex((element, index) => {
            return (index < stop_index) && (element === 0x2A);
        });

        // no CRC - return
        if (crc_index < 0)
            return { start: -1 };

        // CRC should be at the end
        const crc_position = stop_index - crc_index;
        if ((crc_position < 2) || (crc_position > 3))
            return { start: -1 };

        // good chance that we have it
        return {
            start: start_index,
            stop: stop_index
        };
    }

    /**
     *
     * rtcm3 message format:
     *   +----------+--------+-----------+--------------------+----------+
     *   | preamble | 000000 |  length   |    data message    |  parity  |
     *   +----------+--------+-----------+--------------------+----------+
     *   |<-- 8 --->|<- 6 -->|<-- 10 --->|<--- length x 8 --->|<-- 24 -->|
     *   |   0xD3   |
     * @param {Uint8Array} array 
     * @returns 
     */
    findRTCM3(array) {

        // find start
        const start_index = array.findIndex((element) => {
            return (element === 0xD3);
        });

        // no start - return
        if (start_index < 0)
            return { start: -1 };

        // array to short
        if (array.length - start_index < 6) {
            return { start: -1 };
        }

        // 6 bits after start should be equal to 0
        if ((array[start_index + 1] & 0xFC) !== 0) {
            return { start: -1 };
        }

        const rtcmLen = ((array[1] << 8) + array[2]) & 0x03ff;
        const rtcmFullLen = rtcmLen + 6;
        if (array.length < (rtcmFullLen + start_index)) {
            return { start: -1 };
        }

        const msg = (array[3] << 4) + (array[4] >> 4); // 12-bit (0..4095)
        // debug(`RTCM3 length: ${rtcmFullLen} message: ${msg}`);

        const rtcmData = array.slice(start_index, start_index + rtcmFullLen);

        // check rtcm crc24
        if (!checkRtcmCrc24(rtcmData)) {
            return { start: -1 };
        }

        return { start: start_index, stop: start_index + rtcmFullLen, msg: msg };
    }
}