// 2.4.40. Packet Type: 435 PAIR_RTCM_GET_OUTPUT_ANT_PNT
// Queries the setting of outputting stationary antenna reference point in RTCM format.
// Type:
// Get
// Synopsis
// $PAIR435*<Checksum><CR><LF>
// Parameter:
// None
// Result:
// Returns $PAIR001 message and the query result.

import { createNmeaChecksumFooter } from "../helpers";

export const sentenceId = "AIR435";
export const sentenceName = "Queries stationary antenna reference point in RTCM";

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