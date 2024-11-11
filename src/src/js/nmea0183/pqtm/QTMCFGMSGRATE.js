import { createNmeaChecksumFooter, parseIntSafe } from "../helpers";
import { initStubFields } from "../packet_stub";

export const sentenceId = "QTMCFGMSGRATE";
export const sentenceName = "Message output";

export function decodeSentence(stub, fields) {
    if (fields.length === 5)
        return {
            ...initStubFields(stub, sentenceId, sentenceName),
            result: fields[1],
            msgName: fields[2],
            rate: parseIntSafe(fields[3]),
            msgVer: parseIntSafe(fields[4])
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

    if ((packet.msgName !== "PQTMSVINSTATUS") &&
        (packet.msgName !== "PQTMGEOFENCESTATUS") &&
        (packet.msgName !== "PQTMEPE") &&
        (packet.msgName !== "PQTMPVT") &&
        (packet.msgName !== "PQTMPL") &&
        (packet.msgName !== "PQTMDOP") &&
        (packet.msgName !== "PQTMVEL") &&
        (packet.msgName !== "PQTMODO")
    ) {
        throw Error(`Invalid packet name: "${packet.msgName}".`);
    }

    const result = ["$" + talker + sentenceId];
    result.push(packet.rw.toUpperCase() === "W" ? "W" : "R");
    result.push(packet.msgName);

    // message rate
    if (packet.rw.toUpperCase() === "W") {
        result.push(packet.rate);
    }

    // message version
    switch (packet.msgName) {
        case "PQTMEPE":
            result.push("2");
            break;
        default:
            result.push("1");
            break;
    }

    const resultWithoutChecksum = result.join(",");
    return resultWithoutChecksum + createNmeaChecksumFooter(resultWithoutChecksum) + "\r\n";
}