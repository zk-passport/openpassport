const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const bigInt = require("big-integer");

const compiler = require("circom");

const { splitToWords, extractExpr } = require("./util.js");

chai.should();

describe("RabinVerifier2048", () => {
    var circuit;
    var constraints = (w, n) => (2 * n * (1.5*w + Math.ceil(Math.log2(n)) + 5) - 2*w - 7);
    var p = bigInt("159964943931416615577369912019019158766507119279668139689770302515089858651897759755422639322754644946314144496963506091007314204133070017414535137716745802061603555505480122240011754063517628793151777246574164305275840500725001826544822743687229561738601435187059133859724699864240568704332464921206268410503");
    var q = bigInt("168660568160030973654868036651851789140381239095505654315490602844148385243099080183538714953297361726608296166128262432353876749778296569216733359120720108861715866764465627619163550849968245931268140890575790284971106686704922424532091126175189470754194348523245258768389628219297145782623923342002355267303");
    var N = p.times(q);

    before(async () => {
        circuit = new snarkjs.Circuit(await compiler(path.join(__dirname, "circuits", "rabin_2048.circom")));
    });

    it(`should have ${constraints(64, 32)} = ${extractExpr(constraints)} constraints (2048b)`, async () => {
        const bound = constraints(64, 32);
        circuit.nConstraints.should.be.at.most(bound);
    });

    it("should verify pk = ..., sig = 2**32", async () => {
        const sig = bigInt(2 ** 32);
        const msg = sig.times(sig).mod(N);
        const input = Object.assign({},
            splitToWords(msg, 64, 32, "msg"),
            splitToWords(sig, 64, 32, "sig"),
            splitToWords(N, 64, 32, "pk"),
        );
        circuit.calculateWitness(input);
    });

    it("should verify pk = ..., sig = 15", async () => {
        const sig = bigInt(15);
        const msg = sig.times(sig).mod(N);
        const input = Object.assign({},
            splitToWords(msg, 64, 32, "msg"),
            splitToWords(sig, 64, 32, "sig"),
            splitToWords(N, 64, 32, "pk"),
        );
        circuit.calculateWitness(input);
    });

    it("should verify pk = ..., sig = 10 ** 40", async () => {
        const sig = bigInt("10000000000000000000000000000000000000000");
        const msg = sig.times(sig).mod(N);
        const input = Object.assign({},
            splitToWords(msg, 64, 32, "msg"),
            splitToWords(sig, 64, 32, "sig"),
            splitToWords(N, 64, 32, "pk"),
        );
        circuit.calculateWitness(input);
    });

    it("should verify pk = ..., sig = 1024b prime", async () => {
        const sig = bigInt("157642315533984696102772784427831505226936287362016223825522653136553169246615450857550569552195864365466751054520920894357324049838947634414589061335755156237191576410178243427790597755565691120200590850505284464035038405775597023219065037373958342126476491939291377749536982618664333779148427338663295678463");
        const msg = sig.times(sig).mod(N);
        const input = Object.assign({},
            splitToWords(msg, 64, 32, "msg"),
            splitToWords(sig, 64, 32, "sig"),
            splitToWords(N, 64, 32, "pk"),
        );
        circuit.calculateWitness(input);
    });

    it("should verify pk = ..., sig = 2047b prime", async () => {
        const sig = bigInt("12530942368888911498182087353638852516147400100673275930863250463555234477837720716273179246984390936381687944889000026790356452466456864386645180950657463551880168178913840117740137589628357900548412963340383653158723336244487247280164898806504660391737939371520748593776528447266796260835130737838638604502418592388748801503763184358140229377671946112049199790338130219779239359148573235944676677030033797473557609411287357869061843679845035395121919341670828752571268193052051307914537583109687261113776436211108984148988960926855106116517593961499195072088559146395182132113625262211187576525171405598734433228063");
        const msg = sig.times(sig).mod(N);
        const input = Object.assign({},
            splitToWords(msg, 64, 32, "msg"),
            splitToWords(sig, 64, 32, "sig"),
            splitToWords(N, 64, 32, "pk"),
        );
        circuit.calculateWitness(input);
    });

});
