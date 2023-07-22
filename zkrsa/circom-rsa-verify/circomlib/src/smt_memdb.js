
const Scalar = require("ffjavascript").Scalar;
const ZqField = require("ffjavascript").ZqField;

// Prime 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));

class SMTMemDb {
    constructor() {
        this.nodes = {};
        this.root = F.zero;
    }

    async getRoot() {
        return this.root;
    }

    _key2str(k) {
        // const keyS = bigInt(key).leInt2Buff(32).toString("hex");
        const keyS = k.toString();
        return keyS;
    }

    _normalize(n) {
        for (let i=0; i<n.length; i++) {
            n[i] = F.e(n[i]);
        }
    }

    async get(key) {
        const keyS = this._key2str(key);
        return this.nodes[keyS];
    }

    async multiGet(keys) {
        const promises = [];
        for (let i=0; i<keys.length; i++) {
            promises.push(this.get(keys[i]));
        }
        return await Promise.all(promises);
    }

    async setRoot(rt) {
        this.root = rt;
    }

    async multiIns(inserts) {
        for (let i=0; i<inserts.length; i++) {
            const keyS = this._key2str(inserts[i][0]);
            this._normalize(inserts[i][1]);
            this.nodes[keyS] = inserts[i][1];
        }
    }

    async multiDel(dels) {
        for (let i=0; i<dels.length; i++) {
            const keyS = this._key2str(dels[i]);
            delete this.nodes[keyS];
        }
    }
}

module.exports = SMTMemDb;
