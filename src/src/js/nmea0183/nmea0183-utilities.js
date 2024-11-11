const utils = {};

utils.RATIOS = {
    // DISTANCE
    NM_IN_KM: 1.852,
    KM_IN_NM: 0.539956803,
    // SPEED
    // Knots
    KNOTS_IN_MS: 0.514444,
    KNOTS_IN_MPH: 1.150779,
    KNOTS_IN_KPH: 1.852,
    // MPH
    MPH_IN_MS: 0.44704,
    MPH_IN_KPH: 1.609344,
    MPH_IN_KNOTS: 0.868976,
    // KPH
    KPH_IN_MS: 0.277778,
    KPH_IN_MPH: 0.621371,
    KPH_IN_KNOTS: 0.539957,
    // MS
    MS_IN_KPH: 3.6,
    MS_IN_MPH: 2.236936,
    MS_IN_KNOTS: 1.943844,
    // DEGREE
    DEG_IN_RAD: 0.0174532925,
    RAD_IN_DEG: 57.2957795,
    // TEMPERATURES
    // Celcius
    CELCIUS_IN_KELVIN: 273.15,
};

function checksum(sentencePart) {
    let check = 0;
    for (let i = 1; i < sentencePart.length; i++) {
        check = check ^ sentencePart.charCodeAt(i);
    }
    return check;
}

exports.valid = function (sentence, validateChecksum) {
    sentence = String(sentence).trim();

    if (sentence === "") {
        return false;
    }

    var validateChecksum = typeof validateChecksum === "undefined" || validateChecksum;

    if ((sentence.charAt(0) == "$" || sentence.charAt(0) == "!") && (validateChecksum == false || sentence.charAt(sentence.length - 3) == "*")) {
        if (validateChecksum) {
            let split = sentence.split("*");
            return (parseInt(split[1], 16) == checksum(split[0]));
        } else {
            return true;
        }
    }
    return false;
};

exports.appendChecksum = function (sentence) {
    let split = String(sentence).trim().split("*");
    if (split.length === 1) {
        if (split[0].charAt(0) == "$" || split[0].charAt(0) == "!") {
            return split[0].concat("*").concat(checksum(split[0]).toString(16).padStart(2, "0").toUpperCase());
        }
    }
    return sentence;
};

exports.source = function (sentence) {
    return {
        type: "NMEA0183",
        label: "signalk-parser-nmea0183",
        sentence: sentence || ""
    };
};

exports.transform = function (value, inputFormat, outputFormat) {
    value = exports.float(value);

    inputFormat = inputFormat.toLowerCase();
    outputFormat = outputFormat.toLowerCase();

    if (inputFormat === outputFormat) {
        return value;
    }

    // KM
    if (inputFormat == "km") {
        if (outputFormat == "nm") return value / utils.RATIOS.NM_IN_KM;
    }

    // NM
    if (inputFormat == "nm") {
        if (outputFormat == "km") return value / utils.RATIOS.KM_IN_NM;
        if (outputFormat == "m") return value * 1000 / utils.RATIOS.KM_IN_NM;
    }

    // KNOTS
    if (inputFormat == "knots") {
        if (outputFormat == "kph") return value / utils.RATIOS.KPH_IN_KNOTS;
        if (outputFormat == "ms") return value / utils.RATIOS.MS_IN_KNOTS;
        if (outputFormat == "mph") return value / utils.RATIOS.MPH_IN_KNOTS;
    }

    // KPH
    if (inputFormat == "kph") {
        if (outputFormat == "knots") return value / utils.RATIOS.KNOTS_IN_KPH;
        if (outputFormat == "ms") return value / utils.RATIOS.MS_IN_KPH;
        if (outputFormat == "mph") return value / utils.RATIOS.MPH_IN_KPH;
    }

    // MPH
    if (inputFormat == "mph") {
        if (outputFormat == "knots") return value / utils.RATIOS.KNOTS_IN_MPH;
        if (outputFormat == "ms") return value / utils.RATIOS.MS_IN_MPH;
        if (outputFormat == "kph") return value / utils.RATIOS.KPH_IN_MPH;
    }

    // MS
    if (inputFormat == "ms") {
        if (outputFormat == "knots") return value / utils.RATIOS.KNOTS_IN_MS;
        if (outputFormat == "mph") return value / utils.RATIOS.MPH_IN_MS;
        if (outputFormat == "kph") return value / utils.RATIOS.KPH_IN_MS;
    }

    // ANGLES
    if (inputFormat == "deg") {
        if (outputFormat == "rad") return value / utils.RATIOS.RAD_IN_DEG;
    }

    if (inputFormat == "rad") {
        if (outputFormat == "deg") return value / utils.RATIOS.DEG_IN_RAD;
    }

    if (inputFormat == "c") {
        if (outputFormat == "k") return value + utils.RATIOS.CELCIUS_IN_KELVIN;
    }

    if (inputFormat == "k") {
        if (outputFormat == "c") return value - utils.RATIOS.CELCIUS_IN_KELVIN;
    }

    // Just return input if input/output formats are not recognised.
    return value;
};

exports.magneticVariaton = function (degrees, pole) {
    pole = pole.toUpperCase();
    degrees = this.float(degrees);

    if (pole == "S" || pole == "W") {
        degrees *= -1;
    }

    return degrees;
};

exports.timestamp = function (time, date) {
    /* TIME (UTC) */
    var hours, minutes, seconds, year, month, day;

    if (time) {
        hours = this.int(time.slice(0, 2), true);
        minutes = this.int(time.slice(2, 4), true);
        seconds = this.int(time.slice(4, 6), true);
    } else {
        var dt = new Date();
        hours = dt.getUTCHours();
        minutes = dt.getUTCMinutes();
        seconds = dt.getUTCSeconds();
    }

    /* DATE (UTC) */
    if (date) {
        var year, month, day;
        day = this.int(date.slice(0, 2), true);
        month = this.int(date.slice(2, 4), true);
        year = this.int(date.slice(-2));
        year = 2000 + year;
    } else {
        var dt = new Date();
        year = dt.getUTCFullYear();
        month = dt.getUTCMonth();
        day = dt.getUTCDate();
    }

    /* construct */
    var d = new Date(Date.UTC(year, (month - 1), day, hours, minutes, seconds));
    return d.toISOString();
};

exports.coordinate = function (value, pole) {
    // N 5222.3277 should be read as 52°22.3277'
    // E 454.5824 should be read as 4°54.5824'
    //
    // 1. split at .
    // 2. last two characters of split[0] (.slice(-2)) + everything after . (split[1]) are the minutes
    // 3. degrees: split[0][a]
    // 4. minutes: split[0][b] + '.' + split[1]
    //
    // 52°22'19.662'' N -> 52.372128333
    // 4°54'34.944'' E -> 4.909706667
    // S & W should be negative.

    pole = pole.toUpperCase();

    var split = value.split(".");
    var degrees = this.float(split[0].slice(0, -2));
    var minsec = this.float(split[0].slice(-2) + "." + split[1]);
    var decimal = this.float(degrees + (minsec / 60));

    if (pole == "S" || pole == "W") {
        decimal *= -1;
    }

    return exports.float(decimal);
};

exports.zero = function (n) {
    if (this.float(n) < 10) {
        return "0" + n;
    } else {
        return "" + n;
    }
};

exports.int = function (n) {
    if (("" + n).trim() === "") {
        return 0;
    } else {
        return parseInt(n, 10);
    }
};

exports.integer = function (n) {
    return exports.int(n);
};

exports.float = function (n) {
    if (("" + n).trim() === "") {
        return 0.0;
    } else {
        return parseFloat(n);
    }
};

exports.double = function (n) {
    return exports.float(n);
};
