// 2.4.39. Packet Type: 434 PAIR_RTCM_SET_OUTPUT_ANT_PNT
// Enables/disables outputting stationary antenna reference point in RTCM format.
// Type: Set
// Synopsis
// $PAIR434,<Enable>*<Checksum><CR><LF>
// Parameter:
// Field Format Unit Description
// <Enable> Numeric -
// Enable/disable outputting outputting stationary antenna reference
// point (message type 1005).
// 0 = Disable
// 1 = Enable
// Result:
// Returns $PAIR001 message.

import { createNmeaChecksumFooter } from "../helpers";

export const sentenceId = "AIR434";
export const sentenceName = "Enables/disables RTCM stationary antenna reference point";

/**
 * 
 * @param {DBTPacket} packet 
 * @param {string} talker 
 * @returns {string}
 */
export function encodePacket(packet, talker) {
    const result = ["$" + talker + sentenceId];
    result.push(packet.enable);
    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}