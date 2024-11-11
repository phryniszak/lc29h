import { createNmeaChecksumFooter, parseIntSafe } from "../helpers";
import { initStubFields } from "../packet_stub";

export const sentenceId = "QTMCFGNMEADP";
export const sentenceName = "decimal places of NMEA";

export function decodeSentence(stub, fields) {
    console.log(fields);
    if (fields.length === 8)
        return {
            ...initStubFields(stub, sentenceId, sentenceName),
            result: fields[1],
            UTC_DP: parseIntSafe(fields[2]),
            POS_DP: parseIntSafe(fields[3]),
            ALT_DP: parseIntSafe(fields[4]),
            DOP_DP: parseIntSafe(fields[5]),
            SPD_DP: parseIntSafe(fields[6]),
            COG_DP: parseIntSafe(fields[7]),
        };
    else
        return {
            ...initStubFields(stub, sentenceId, sentenceName),
            result: fields[1],
            errCode: (fields[1] === "ERROR") ? parseIntSafe(fields[2]) : 0,
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
    if (packet.rw.toUpperCase() === "W") {
        // write
        result.push("W");
        result.push((packet.UTC_DP === undefined) ? 3 : packet.UTC_DP.toString());
        result.push((packet.POS_DP === undefined) ? 8 : packet.POS_DP.toString());
        result.push((packet.ALT_DP === undefined) ? 3 : packet.ALT_DP.toString());
        result.push((packet.DOP_DP === undefined) ? 2 : packet.DOP_DP.toString());
        result.push((packet.SPD_DP === undefined) ? 1 : packet.SPD_DP.toString());
        result.push((packet.COG_DP === undefined) ? 1 : packet.COG_DP.toString());
    } else {
        // read
        result.push("R");
    }

    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}