/**
 * 
 * @param {string | number} value 
 * @param {number} length 
 * @param {string} paddingCharacter 
 * @returns {string}
 */
export function padLeft(value, length, paddingCharacter) {
    let result = typeof value === "string" ? value : value.toFixed(0);

    while (result.length < length) {
        result = paddingCharacter + result;
    }

    return result;
}

// =========================================
// checksum related functions
// =========================================

/**
 * Checks that the given NMEA sentence has a valid checksum.
 */
export function validNmeaChecksum(nmeaSentence) {
    const [sentenceWithoutChecksum, checksumString] = nmeaSentence.split("*");

    const correctChecksum = computeNmeaChecksum(sentenceWithoutChecksum);

    // checksum is a 2 digit hex value
    const actualChecksum = parseInt(checksumString, 16);

    return correctChecksum === actualChecksum;
}

/**
 * Generate a checksum for an NMEA sentence without the trailing "*xx".
 */
export function computeNmeaChecksum(sentenceWithoutChecksum) {
    // init to first character value after the $
    let checksum = sentenceWithoutChecksum.charCodeAt(1);

    // process rest of characters, zero delimited
    for (let i = 2; i < sentenceWithoutChecksum.length; i += 1) {
        checksum = checksum ^ sentenceWithoutChecksum.charCodeAt(i);
    }

    // checksum is between 0x00 and 0xff
    checksum = checksum & 0xff;

    return checksum;
}

/**
 * Generate the correct trailing "*xx" footer for an NMEA sentence.
 * @param {string} sentenceWithoutChecksum 
 * @returns {string}
 */
export function createNmeaChecksumFooter(sentenceWithoutChecksum) {
    return "*" + (computeNmeaChecksum(sentenceWithoutChecksum)).toString(16).toUpperCase().padStart(2, "0");
}

/**
 * Append the correct trailing "*xx" footer for an NMEA string and return the result.
 * @param {string} sentenceWithoutChecksum 
 * @returns {string}
 */
export function appendChecksumFooter(sentenceWithoutChecksum) {
    return sentenceWithoutChecksum + createNmeaChecksumFooter(sentenceWithoutChecksum);
}

// =========================================
// field encoders
// =========================================

/**
 * 
 * @param {number | undefined} value 
 * @param {number} decimalPlaces 
 * @returns {string}
 */
export function encodeFixed(value, decimalPlaces) {
    if (value === undefined) {
        return "";
    }

    return value.toFixed(decimalPlaces);
}

/**
 * Encodes the latitude in the standard NMEA format "ddmm.mmmmmm".
 * @param {number} latitude 
 * @returns {string}
 */
export function encodeLatitude(latitude) {
    if (latitude === undefined) {
        return ",";
    }

    let hemisphere;
    if (latitude < 0) {
        hemisphere = "S";
        latitude = -latitude;
    } else {
        hemisphere = "N";
    }

    // get integer degrees
    const d = Math.floor(latitude);
    // latitude degrees are always 2 digits
    let s = padLeft(d, 2, "0");

    // get fractional degrees
    const f = latitude - d;
    // convert to fractional minutes
    const m = (f * 60.0);
    // format the fixed point fractional minutes "mm.mmmmmm"
    const t = padLeft(m.toFixed(6), 9, "0");

    s = s + t + "," + hemisphere;
    return s;
}

/**
 * Encodes the longitude in the standard NMEA format "dddmm.mmmmmm".
 * @param {number} longitude 
 * @returns {string}
 */
export function encodeLongitude(longitude) {
    if (longitude === undefined) {
        return ",";
    }

    let hemisphere;
    if (longitude < 0) {
        hemisphere = "W";
        longitude = -longitude;
    } else {
        hemisphere = "E";
    }

    // get integer degrees
    const d = Math.floor(longitude);
    // longitude degrees are always 3 digits
    let s = padLeft(d, 3, "0");

    // get fractional degrees
    const f = longitude - d;
    // convert to fractional minutes and round up to the specified precision
    const m = (f * 60.0);
    // format the fixed point fractional minutes "mm.mmmmmm"
    const t = padLeft(m.toFixed(6), 9, "0");

    s = s + t + "," + hemisphere;
    return s;
}

/**
 * 1 decimal, always meters
 * @param {number} alt 
 * @returns {string}
 */
export function encodeAltitude(alt) {
    if (alt === undefined) {
        return ",";
    }

    return alt.toFixed(1) + ",M";
}

/**
 * Some encodings don't want the unit
 * @param {number} alt 
 * @returns {string}
 */
export function encodeAltitudeNoUnits(alt) {
    if (alt === undefined) {
        return "";
    }

    return alt.toFixed(1);
}

/**
 * degrees
 * @param {number} degrees 
 * @returns {string}
 */
export function encodeDegrees(degrees) {
    if (degrees === undefined) {
        return "";
    }

    return padLeft(degrees.toFixed(2), 6, "0");
}

/**
 * 
 * @param {Data} date 
 * @returns {string}
 */
export function encodeDate(date) {
    if (date === undefined) {
        return "";
    }

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    return padLeft(day, 2, "0") + padLeft(month, 2, "0") + year.toFixed(0).substr(2);
}

/**
 * 
 * @param {Date} date 
 * @returns {string}
 */
export function encodeTime(date) {
    if (date === undefined) {
        return "";
    }

    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    return padLeft(hours, 2, "0") + padLeft(minutes, 2, "0") + padLeft(seconds, 2, "0");
}

/**
 * 
 * @param {any} value 
 * @returns {string}
 */
export function encodeValue(value) {
    if (value === undefined) {
        return "";
    }

    return value.toString();
}

// =========================================
// field decoders
// =========================================

/**
 * Parse the given string to a float, returning 0 for an empty string.
 * @param {string} str 
 * @returns {number}
 */
export function parseFloatSafe(str) {
    if (str === "") {
        return 0.0;
    }
    return parseFloat(str);
}

/**
 * Parse the given string to a integer, returning 0 for an empty string.
 * @param {string} i 
 * @returns {number}
 */
export function parseIntSafe(i) {
    if (i === "") {
        return 0;
    }

    return parseInt(i, 10);
}


/**
 * Parse the given string to a float if possible, returning 0 for an undefined
 * value and a string the the given string cannot be parsed.
 */

/**
 * 
 * @param {string} str 
 * @returns {number | string}
 */
export function parseNumberOrString(str) {
    if (str === undefined) {
        return "";
    }

    const num = parseFloat(str);

    return isNaN(num) ? str : num;
}

/**
 * Parses coordinate given as "dddmm.mm", "ddmm.mm", "dmm.mm" or "mm.mm"
 * @param {string} coordinate 
 * @returns {number}
 */
export function parseDmCoordinate(coordinate) {

    const dotIdx = coordinate.indexOf(".");

    if (dotIdx < 0) {
        return 0;
    }

    let degrees, minutes;

    if (dotIdx >= 3) {
        degrees = coordinate.substring(0, dotIdx - 2);
        minutes = coordinate.substring(dotIdx - 2);
    } else {
        // no degrees, just minutes (nonstandard but a buggy unit might do this)
        degrees = "0";
        minutes = coordinate;
    }

    return (parseFloat(degrees) + (parseFloat(minutes) / 60.0));
}

/**
 * Parses latitude given as "ddmm.mm", "dmm.mm" or "mm.mm" (assuming zero
 * degrees) along with a given hemisphere of "N" or "S" into decimal degrees,
 * where north is positive and south is negative.
 * @param {string} lat 
 * @param {string} hemi 
 * @returns {number}
 */
export function parseLatitude(lat, hemi) {
    const hemisphere = (hemi === "N") ? 1.0 : -1.0;

    return parseDmCoordinate(lat) * hemisphere;
}


/**
 */

/**
 * Parses latitude given as "dddmm.mm", "ddmm.mm", "dmm.mm" or "mm.mm" (assuming
 * zero degrees) along with a given hemisphere of "E" or "W" into decimal
 * degrees, where east is positive and west is negative.
 * @param {string} lon 
 * @param {string} hemi 
 * @returns {number}
 */
export function parseLongitude(lon, hemi) {
    const hemisphere = (hemi === "E") ? 1.0 : -1.0;

    return parseDmCoordinate(lon) * hemisphere;
}

/**
 * 
 * @param {string} yearString 
 * @param {boolean} rmcCompatible 
 * @returns {number}
 */
function getYearFromString(yearString, rmcCompatible) {
    if (yearString.length === 4) {
        return Number(yearString);
    } else if (yearString.length === 2) {
        if (rmcCompatible) {
            // GPRMC date doesn't specify century. GPS came out in 1973 so if the year
            // is less than 73, assume it's 20xx, otherwise assume it is 19xx.
            let year = Number(yearString);

            if (year < 73) {
                year = 2000 + year;
            }
            else {
                year = 1900 + year;
            }

            return year;
        }
        else {
            return Number("20" + yearString);
        }
    }
    else {
        throw Error(`Unexpected year string: ${yearString}`);
    }
}

/**
 * Parses a UTC time and optionally a date and returns a Date
 * object.
 * @param {String} time Time the format "hhmmss" or "hhmmss.ss"
 * @param {String=} date Optional date in format the ddmmyyyy or ddmmyy
 * @returns {Date}
 */
export function parseTime(time, date, rmcCompatible = false) {

    if (time === "") {
        return new Date(0);
    }

    const ret = new Date();

    if (date) {

        const year = date.slice(4);
        const month = parseInt(date.slice(2, 4), 10) - 1;
        const day = date.slice(0, 2);

        ret.setUTCFullYear(getYearFromString(year, rmcCompatible), Number(month), Number(day));
    }

    ret.setUTCHours(Number(time.slice(0, 2)));
    ret.setUTCMinutes(Number(time.slice(2, 4)));
    ret.setUTCSeconds(Number(time.slice(4, 6)));

    // Extract the milliseconds, since they can be not present, be 3 decimal place, or 2 decimal places, or other?
    const msStr = time.slice(7);
    const msExp = msStr.length;
    let ms = 0;
    if (msExp !== 0) {
        ms = parseFloat(msStr) * Math.pow(10, 3 - msExp);
    }
    ret.setUTCMilliseconds(Number(ms));

    return ret;
}
