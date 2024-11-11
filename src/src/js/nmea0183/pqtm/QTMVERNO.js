import { createNmeaChecksumFooter } from "../helpers";
import { initStubFields } from "../packet_stub";


export const sentenceId = "QTMVERNO";
export const sentenceName = "Firmware version";

export function decodeSentence(stub, fields) {
    if (fields[1] == "ERROR")
        return {
            ...initStubFields(stub, sentenceId, sentenceName),
            result: fields[1],
            errCode: fields[2]
        };
    else
        return {
            ...initStubFields(stub, sentenceId, sentenceName),
            result: "OK",
            verStr: fields[1],
            buildDate: fields[2],
            buildTime: fields[3],
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
