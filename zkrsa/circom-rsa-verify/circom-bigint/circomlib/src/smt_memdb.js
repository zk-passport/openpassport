const bigInt = require("snarkjs").bigInt;

class SMTMemDb {
    constructor() {
        this.nodes = {};
        this.root = bigInt(0);
    }

    async getRoot() {
        return this.root;
    }

    _key2str(k) {
        // const keyS = bigInt(key).leInt2Buff(32).toString("hex");
        const keyS = bigInt(k).toString();
        return keyS;
    }

    _normalize(n) {
        for (let i=0; i<n.length; i++) {
            n[i] = bigInt(n[i]);
        }
    }

    async get(key) {
        const keyS = this._key2str(key);
        return this.nodes[keyS];
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
