const constants = {
    STORAGE_KEY: 'yt-extension-train-lengths',
};

const defaultTrains = {
    // DE
    ICE1: 358,
    ICE2: 205,
    ICE3: 201,
    ICE4_7: 202,
    ICE4_12: 346,
    ICE4_13: 374,
    ICE_D: 201,
    ICE_NEO: 201,
    ICE_T_7: 184,
    ICE_T_5: 133,
    ICE_TD: 107,
    Talet2_2: 40,
    Talet2_3: 56,
    Talet2_4: 72,
    Talet2_5: 88,
    Talet2_6: 105,
    DesiroHC_4: 105,
    DesiroHC_5: 131,
    DesiroHC_6: 158,
    Twindex_3: 26 + 26.8 + 26,
    Twindex_4: 26 + 2 * 26.8 + 26,
    Twindex_5: 26 + 3 * 26.8 + 26,
    Twindex_6: 26 + 4 * 26.8 + 26,
    KISS_3: 80,
    KISS_4: 105, // different lengths
    KISS_6: 150, // different lengths
    Flirt_3: 57, // different lengths // GoAhead BW
    Flirt_3XL: 68,
    Flirt_4: 75, // different lengths // GoAhead BW
    Flirt_5: 91, // GoAhead BW
    Flirt_5XL: 106,
    Flirt_6: 106, // GoAhead BW
    Flirt_5: 107,
    Mireo_2: 47,
    Mireo_3: 70,
    Mireo_4: 90,
    LINT27: 27,
    LINT41: 41,
    LINT54: 54,
    LINT81: 81,
    PesaLink_1: 28.6,
    PesaLink_2: 44,
    PesaLink_3: 57,
    PesaLink_4: 71,
    Talent_2: 36, // different lengths
    Talent_3: 50, // different lengths
    Talent_4: 67,
    GTW1_2: 39,
    BR420: 67,
    BR423: 67,
    BR425: 67,
    BR426: 36,
    BR430: 68,
    BR440_3: 56, // different lengths
    BR440_4: 72, // different lengths
    BR440_5: 87,
    BR1440_3: 57,
    BR1440_4: 75, // different lengths
    BR1440_5: 90,
    BR610: 52,
    BR611: 52,
    BR612: 52,
    BR628: 45, // different lengths
    BR641: 28.1, // Walfisch
    BR650: 25.5,
    DB_Dosto: 26.8,
    DB_Dosto_3_LOK: 27.3 + 2 * 26.8 + 18.9,
    DB_Dosto_4_LOK: 27.3 + 3 * 26.8 + 18.9,
    DB_Dosto_5_LOK: 27.3 + 4 * 26.8 + 18.9,
    DB_Dosto_6_LOK: 27.3 + 5 * 26.8 + 18.9,
    MNX: 177,
    Vectron: 19,
    TRAXX: 18.9,
    Ludmilla: 20.6,
    BR101: 19.1,
    BR103: 19.5,
    BR110: 16.5,
    BR111: 16.8,
    BR112: 16.6,
    BR114: 16.6,
    BR120: 19.2,
    BR139: 16.5,
    BR140: 16.5,
    BR143: 16.6,
    BR180: 16.8,
    BR181: 18,
    BR218: 16.4,
    BR229: 19.5,
    // AT
    RailJet: 205,
    DesiroML: 75,
    DesiroClassic: 42,
    GTW4_2: 41,
    GTW4_3: 56,
    RH4020: 69,
    OEBB_IC: 26.4,
    OEBB_IC_4_LOK: 4 * 26.4 + 18,
    OEBB_IC_5_LOK: 5 * 26.4 + 18,
    OEBB_IC_6_LOK: 6 * 26.4 + 18,
    OEBB_IC_7_LOK: 7 * 26.4 + 18,
    OEBB_IC_8_LOK: 8 * 26.4 + 18,
    OEBB_IC_9_LOK: 9 * 26.4 + 18,
    CityShuttle: 26.4,
    CityShuttle_2_LOK: 2 * 26.4 + 18,
    CityShuttle_3_LOK: 3 * 26.4 + 18,
    CityShuttle_4_LOK: 4 * 26.4 + 18,
    CityShuttle_5_LOK: 5 * 26.4 + 18,
    CityShuttle_6_LOK: 6 * 26.4 + 18,
    OEBB_Dosto: 26.8,
    OEBB_Dosto_2_LOK: 27.1 + 26.8 + 18,
    OEBB_Dosto_3_LOK: 27.1 + 2 * 26.8 + 18,
    OEBB_Dosto_4_LOK: 27.1 + 3 * 26.8 + 18,
    OEBB_Dosto_5_LOK: 27.1 + 4 * 26.8 + 18,
    OEBB_Dosto_6_LOK: 27.1 + 5 * 26.8 + 18,
    Taurus: 19.3,
    Taurus3: 19.6,
    RH1142: 16.2,
    RH1144: 16.1,
    RH2016: 19.3,
    // CH
    ICN: 189,
    Giruno: 202,
    TWINDEXX_Swiss: 201,
    ETR610: 187,
    RABe514: 100,
    // Generic
    GenericLOK: 18,
    GenericWaggon: 26.4,
};

export default class SpeedMeasurer {
    constructor() {
        this._startTime = null;
        this.loadTrains();
    }

    loadTrains() {
        const json = localStorage.getItem(constants.STORAGE_KEY);
        this.trains = json ? JSON.parse(json) : defaultTrains;
    }

    saveTrains() {
        localStorage.setItem(constants.STORAGE_KEY, JSON.stringify(this.trains));
    }

    static getCurrentVideoTime() {
        return document.querySelector('video').currentTime;
    }

    start() {
        this._startTime = SpeedMeasurer.getCurrentVideoTime();
    }

    /**
     * Measures the speed of the train.
     * @param {number} trainLength Length of train in meters
     * @returns Speed of train in km/h
     */
    measure(trainLength) {
        const end = SpeedMeasurer.getCurrentVideoTime();
        return trainLength / (end - this._startTime) * 3.6;
    }

    setTrain(name, trainLength) {
        this.trains[name] = trainLength;
        this.saveTrains();
    }

    removeTrain(name) {
        delete this.trains[name];
        this.saveTrains();
    }
}
