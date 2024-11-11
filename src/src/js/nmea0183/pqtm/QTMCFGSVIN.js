import { createNmeaChecksumFooter, parseIntSafe, parseFloatSafe } from "../helpers";
import { initStubFields } from "../packet_stub";

export const sentenceId = "QTMCFGSVIN";
export const sentenceName = "Survey-in feature";

const modeName = ["disabled", "survey-in mode", "fixed mode"];

export function decodeSentence(stub, fields) {
    if (fields.length === 8)
        return {
            ...initStubFields(stub, sentenceId, sentenceName),
            result: fields[1],
            mode: parseIntSafe(fields[2]),
            modeName: modeName[parseIntSafe(fields[2])],
            minDur: parseIntSafe(fields[3]),
            accLimit3d: parseFloatSafe(fields[4]),
            ECEF_X: parseFloatSafe(fields[5]),
            ECEF_Y: parseFloatSafe(fields[6]),
            ECEF_Z: parseFloatSafe(fields[7])
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
        result.push((packet.mode === undefined) ? 0 : packet.mode.toString());
        result.push((packet.minDur === undefined) ? 0 : packet.minDur.toString());
        result.push((packet.accLimit3d === undefined) ? 0 : packet.accLimit3d.toString());
        result.push((packet.ECEF_X === undefined) ? 0 : packet.ECEF_X.toString());
        result.push((packet.ECEF_Y === undefined) ? 0 : packet.ECEF_Y.toString());
        result.push((packet.ECEF_Z === undefined) ? 0 : packet.ECEF_Z.toString());
    } else {
        // read
        result.push("R");
    }

    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}