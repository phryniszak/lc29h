/**
 *
 */
sendBaseConfig() {
    // 1. send survey config
    const selTime = document.getElementById("selSurveyTime");
    const seconds = parseInt(selTime.selectedOptions[0].dataset.seconds);

    const selAccLimit = document.getElementById("selSurveyAccuracy");
    const accLimit = parseFloat(selAccLimit.selectedOptions[0].dataset.accuracy);

    let str = this.#parser.encode({
        sentenceId: "QTMCFGSVIN",
        rw: "W",
        mode: 1,
        minDur: seconds,
        accLimit3d: accLimit
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    str = this.#parser.encode({
        sentenceId: "QTMCFGSVIN",
        rw: "R",
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    // 2. PQTMCFGMSGRATE
    // - PQTMEPE - Outputs the estimated positioning error
    str = this.#parser.encode({
        sentenceId: "QTMCFGMSGRATE",
        rw: "W",
        msgName: "PQTMEPE",
        rate: 1,
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    str = this.#parser.encode({
        sentenceId: "QTMCFGMSGRATE",
        rw: "R",
        msgName: "PQTMEPE",
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    // 3. PQTMCFGMSGRATE
    // - PQTMSVINSTATUS - Outputs the survey-in feature status
    str = this.#parser.encode({
        sentenceId: "QTMCFGMSGRATE",
        rw: "W",
        msgName: "PQTMSVINSTATUS",
        rate: 1,
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    str = this.#parser.encode({
        sentenceId: "QTMCFGMSGRATE",
        rw: "R",
        msgName: "PQTMSVINSTATUS",
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    // 4. Set PAIR_RTCM_SET_OUTPUT_MODE to RTCM-3 MSM7
    // Whereas MSM6 and MSM7 are high precision messages, containing the same fields
    // as MSM4 and MSM5 representatively, but with a higher resolution.
    str = this.#parser.encode({
        sentenceId: "AIR432",
        rw: "W",
        mode: 1,
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    str = this.#parser.encode({
        sentenceId: "AIR433",
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    // 5. Save it
    str = this.#parser.encode({
        sentenceId: "QTMSAVEPAR",
    });
    globalThis._my_.device.write(str);
}

/**
*
*/
sendRoverConfig() {

    // $PQTMCFGRCVRMODE,W,<1 = Rover>*<Checksum><CR><LF>
    // Configures the receiver working mode.
    globalThis._my_.device.write("$PQTMCFGRCVRMODE,W,1*2A\r\n");
    await Utils.later(50);

    // GGA, GLL, GSA, GSV, RMC and VTG messages are output by default.
    // VTG
    // Course Over Ground & Ground Speed. The actual course and speed relative to the ground.
    // can be disabled - PAIR_COMMON_SET_NMEA_OUTPUT_RATE
    globalThis._my_.device.write("$PAIR062,5,0*3B\r\n");
    await Utils.later(50);

    // PQTMCFGMSGRATE
    // - PQTMDOP - Outputs dilution of precision.
    let str = this.#parser.encode({
        sentenceId: "QTMCFGMSGRATE",
        rw: "W",
        msgName: "PQTMDOP",
        rate: 1,
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    str = this.#parser.encode({
        sentenceId: "QTMCFGMSGRATE",
        rw: "R",
        msgName: "PQTMDOP",
    });
    globalThis._my_.device.write(str);
    await Utils.later(50);

    // Save it
    str = this.#parser.encode({
        sentenceId: "QTMSAVEPAR",
    });
    globalThis._my_.device.write(str);
}
