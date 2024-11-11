// 2.4.38. Packet Type: 433 PAIR_RTCM_GET_OUTPUT_MODE
// Queries RTCM output mode.
// Type:
// Get
// Synopsis
// $PAIR433*<Checksum><CR><LF>
// Parameter:
// None
// Result:
// Returns $PAIR001 message and the query result.
// Query result message format:
// $PAIR433,<Mode>*<Checksum><CR><LF>
// Parameter included in the result:
// Field Format Unit Description
// <Mode> Numeric -
// RTCM output mode setting.
// -1 = Outputting RTCM disabled
// 0 = Outputting RTCM3 with message type MSM4 enabled
// 1 = Outputting RTCM3 with message type MSM7 enabled

import { initStubFields } from "../packet_stub";
import { parseIntSafe, createNmeaChecksumFooter } from "../helpers";

export const sentenceId = "AIR433";
export const sentenceName = "Queries RTCM output mode";

const ModeTypes = ["RTCM disabled", "RTCM3 with MSM4", "RTCM3 with MSM7"];

export function decodeSentence(stub, fields) {
    return {
        ...initStubFields(stub, sentenceId, sentenceName),
        mode: parseIntSafe(fields[1]),
        modeTxt: ModeTypes[parseIntSafe(fields[1]) + 1],
        result: "OK"
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