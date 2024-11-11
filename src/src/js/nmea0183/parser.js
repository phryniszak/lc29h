import debugModule from "debug";
const debug = new debugModule("ph:nmea0183:parser");

// standard messages
import { validNmeaChecksum } from "./helpers";
import { parseStub } from "./packet_stub";
import { decodeSentence as decodeGGA } from "./codecs/GGA";
import { decodeSentence as decodeGLL } from "./codecs/GLL";
import { decodeSentence as decodeRMC } from "./codecs/RMC";
import { decodeSentence as decodeVTG } from "./codecs/VTG";
import { decodeSentence as decodeGSA } from "./codecs/GSA";
import { decodeSentence as decodeGSV } from "./codecs/GSV";
// pair messages
import { decodeSentence as decodeAIR001 } from "./pair/AIR001";
import { encodePacket as encodeAIR432 } from "./pair/AIR432";
import { decodeSentence as decodeAIR433, encodePacket as encodeAIR433 } from "./pair/AIR433";
import { encodePacket as encodeAIR434 } from "./pair/AIR434";
import { encodePacket as encodeAIR435 } from "./pair/AIR435";

//
import { decodeSentence as decodeQTMVERNO, encodePacket as encodeQTMVERNO } from "./pqtm/QTMVERNO";
import { decodeSentence as decodeQTMSAVEPAR, encodePacket as encodeQTMSAVEPAR } from "./pqtm/QTMSAVEPAR";
import { decodeSentence as decodeQTMRESTOREPAR, encodePacket as encodeQTMRESTOREPAR } from "./pqtm/QTMRESTOREPAR";
import { decodeSentence as decodeQTMSVINSTATUS } from "./pqtm/QPQTMSVINSTATUS";
import { decodeSentence as decodeQTMCFGMSGRATE, encodePacket as encodeQTMCFGMSGRATE } from "./pqtm/QTMCFGMSGRATE";
import { decodeSentence as decodeQTMCFGSVIN, encodePacket as encodeQTMCFGSVIN } from "./pqtm/QTMCFGSVIN";
import { decodeSentence as decodeQTMEPE } from "./pqtm/QTMEPE";
import { decodeSentence as decodeQTMDOP } from "./pqtm/QTMDOP";
import { decodeSentence as decodeQTMCFGNMEADP, encodePacket as encodeQTMCFGNMEADP } from "./pqtm/QTMCFGNMEADP";


const decoders = {
    RMC: decodeRMC,
    GGA: decodeGGA,
    GSV: decodeGSV,
    GSA: decodeGSA,
    VTG: decodeVTG,
    GLL: decodeGLL,
    // ZDA, GRS, GST are not supported on LC29H (BA, CA, DA, EA)
    AIR001: decodeAIR001,
    AIR433: decodeAIR433,
    //
    QTMVERNO: decodeQTMVERNO,
    QTMSAVEPAR: decodeQTMSAVEPAR,
    QTMRESTOREPAR: decodeQTMRESTOREPAR,
    QTMSVINSTATUS: decodeQTMSVINSTATUS,
    QTMCFGMSGRATE: decodeQTMCFGMSGRATE,
    QTMCFGSVIN: decodeQTMCFGSVIN,
    QTMEPE: decodeQTMEPE,
    QTMDOP: decodeQTMDOP,
    QTMCFGNMEADP: decodeQTMCFGNMEADP
};

const encoders = {
    AIR432: encodeAIR432,
    AIR433: encodeAIR433,
    AIR434: encodeAIR434,
    AIR435: encodeAIR435,
    //
    QTMVERNO: encodeQTMVERNO,
    QTMSAVEPAR: encodeQTMSAVEPAR,
    QTMRESTOREPAR: encodeQTMRESTOREPAR,
    QTMCFGMSGRATE: encodeQTMCFGMSGRATE,
    QTMCFGSVIN: encodeQTMCFGSVIN,
    QTMCFGNMEADP: encodeQTMCFGNMEADP
};

/**
 *
 * @param {PacketStub} stub
 * @returns {Decoder}
 */
function getParser(stub) {

    // Override for $PMTK314 and similar sentences
    // if (stub.sentenceId.substr(0, 3) === "MTK") {
    //     return decodeMTK;
    // }

    return decoders[stub.sentenceId];
}

/**
 *
 * @param {PacketStub} stub
 * @param {string[]} fields
 * @returns {CustomPacketType | null}
 */
// eslint-disable-next-line no-unused-vars
function assembleCustomPacket(stub, fields) {
    return null;
}

/**
 *
 * @param {PacketStub} stub
 * @param {string[]} fields
 * @returns {Packet | CustomPacketType | null}
 */
function assemble(stub, fields) {
    const parser = getParser(stub);

    if (parser) {
        return parser(stub, fields);
    }
    else {
        return assembleCustomPacket(stub, fields);
    }
}

/**
 *
 */
export class Parser {
    constructor() { }

    /**
     *
     * @param {*} sentence
     * @param {*} ableToParseBadChecksum
     * @returns
     */
    parse(sentence, ableToParseBadChecksum = false) {

        // debug(`parse sentence: ${sentence}`);

        let chxOk = true;

        // check crc
        if (!validNmeaChecksum(sentence)) {
            if (!ableToParseBadChecksum) {
                throw Error(`Invalid sentence: "${sentence}".`);
            }
            chxOk = false;
        }

        const fields = sentence.split("*")[0].split(",");
        const stub = parseStub(fields[0], chxOk);
        const packet = assemble(stub, fields);

        if (!packet) {
            throw Error(`No known parser for sentence ID "${stub.sentenceId}".`);
        }

        return packet;
    }

    /**
     *
     * @param {Packet} packet
     * @param {string} talker
     * @returns {string}
     */
    encode(packet, talker = "P") {
        if (packet === undefined) {
            throw new Error("Packet must be given.");
        }

        const encoder = encoders[packet.sentenceId];
        let str;

        if (encoder) {
            str = encoder(packet, talker);
        } else {
            throw Error(`No known encoder for sentence ID "${packet.sentenceId}"`);
        }

        debug(`encoded sentence: ${str}`);
        return str;
    }
}