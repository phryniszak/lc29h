// 2.4.37. Packet Type: 432 PAIR_RTCM_SET_OUTPUT_MODE
// Sets RTCM output mode.
// Type: Set
// Synopsis
// $PAIR432,<Mode>*<Checksum><CR><LF>
// Parameter:
// Field  Format
// <Mode> Numeric
// RTCM output mode setting.
// -1 = Disable outputting RTCM
// 0 = Enable output RTCM3 with message type MSM4
// 1 = Enable output RTCM3 with message type MSM7
// Result:
// Returns $PAIR001 message.

import { createNmeaChecksumFooter } from "../helpers";

export const sentenceId = "AIR432";
export const sentenceName = "Sets RTCM output mode";

/**
 * 
 * @param {DBTPacket} packet 
 * @param {string} talker 
 * @returns {string}
 */
export function encodePacket(packet, talker) {
    const result = ["$" + talker + sentenceId];
    result.push(packet.mode);
    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}