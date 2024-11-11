/*
 * === GSA - Active satellites and dilution of precision ===
 *
 * NMEA 0183 V3.01 format:
 * 
 * $<TalkerID>GSA,<Mode>,<FixMode>{,<SatID>},<PDOP>,<HDOP>,<VDOP>*<Checksum><CR><LF>
 *
 *  NMEA 0183 V4.10 format (default):
 * $<TalkerID>GSA,<Mode>,<FixMode>{,<SatID>},<PDOP>,<HDOP>,<VDOP><SystemID>*<Checksum><CR><LF>
 * 
*/

import { initStubFields } from "../packet_stub";
import { parseFloatSafe, parseIntSafe } from "../helpers";

export const sentenceId = "GSA";
export const sentenceName = "Active satellites and precision";

const ThreeDFixTypes = ["unknown", "none", "2D", "3D"];

export function decodeSentence(stub, fields) {
    const sats = [];

    for (let i = 3; i < 15; i++) {
        if (fields[i]) {
            sats.push(+fields[i]);
        }
    }

    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        result: "OK",
        selectionMode: fields[1] === "A" ? "automatic" : "manual",
        __fixMode: parseIntSafe(fields[2]),
        fixMode: ThreeDFixTypes[parseIntSafe(fields[2])],
        satellites: sats,
        PDOP: parseFloatSafe(fields[15]),
        HDOP: parseFloatSafe(fields[16]),
        VDOP: parseFloatSafe(fields[17]),
        SystemID: parseIntSafe(fields[18])
    };
}