const path = require("path");
const tester = require("circom").tester;

const babyJub = require("../src/babyjub.js");


describe("Point 2 bits test", function() {
    let circuit;
    this.timeout(100000);
    before( async() => {
        circuit = await tester(path.join(__dirname, "circuits", "pointbits_loopback.circom"));
    });
    it("Should do the both convertions for 8Base", async () => {
        const w = await circuit.calculateWitness({ in: babyJub.Base8}, true);

        await circuit.checkConstraints(w);
    });
    it("Should do the both convertions for Zero point", async () => {
        const w = await circuit.calculateWitness({ in: [0, 1]}, true);

        await circuit.checkConstraints(w);
    });
});
