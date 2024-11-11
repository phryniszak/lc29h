// 2.4.42. Packet Type: 437 PAIR_RTCM_GET_OUTPUT_EPHEMERIS
// Queries the status of satellite ephemeris in RTCM format.
// Type:
// Get
// Synopsis
// $PAIR437*<Checksum><CR><LF>
// Parameter:
// None
// Result:
// Returns $PAIR001 message and the query result.
// Query result message format:
// $PAIR437,<Enable>*<Checksum><CR><LF></LF>

import { initStubFields } from "../packet_stub";
import { parseIntSafe, createNmeaChecksumFooter } from "../helpers";

export const sentenceId = "AIR437";
export const sentenceName = "Queries the status of ephemeris in RTCM";

const ModeTypes = ["disabled", "enabled"];

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        enable: parseIntSafe(fields[1]),
        enableTxt: ModeTypes[parseIntSafe(fields[1])]
    };
}

/**
 * 
 * @param {DBTPacket} packet 
 * @param {string} talker 
 * @returns {string}
 */
export function encodePacket(packet, talker) {
    const result = ["$" + talker + sentenceId];
    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}