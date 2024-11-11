// 2.4.41. Packet Type: 436 PAIR_RTCM_SET_OUTPUT_EPHEMERIS
// Enables/disables outputting satellite ephemeris in RTCM format.
// Type:
// Set
// Synopsis
// $PAIR436,<Enable>*<Checksum><CR><LF>
// Parameter:
// Field Format Unit Description
// <Enable> Numeric -
// Enable/disable outputting satellite ephemeris.
// 0 = Disable
// 1 = Enable
// Result:
// Returns $PAIR001 message.

import { createNmeaChecksumFooter } from "../helpers";

export const sentenceId = "AIR436";
export const sentenceName = "Enables/disables satellite ephemeris in RTCM";

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