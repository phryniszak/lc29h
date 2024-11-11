import { createNmeaChecksumFooter, parseIntSafe } from "../helpers";
import { initStubFields } from "../packet_stub";

export const sentenceId = "QTMRESTOREPAR";
export const sentenceName = "Restores all parameters";

export function decodeSentence(stub, fields) {
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
    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}
