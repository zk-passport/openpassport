// Copyright (c) 2018 Jordi Baylina
// License: LGPL-3.0+
//

const Contract = require("./evmasm");
const G2 = require("snarkjs").bn128.G2;


function toHex256(a) {
    let S = a.toString(16);
    while (S.length < 64) S="0"+S;
    return "0x" + S;
}

function createCode(P, w) {

    const C = new Contract();

    const NPOINTS = 1 << (w-1);

    const VAR_POS = C.allocMem(32);
    const VAR_POINTS = C.allocMem( (NPOINTS)*4*32);
    const savedP = C.allocMem(32);
    const savedZ3 = C.allocMem(32);

    // Check selector
    C.push("0x0100000000000000000000000000000000000000000000000000000000");
    C.push(0);
    C.calldataload();
    C.div();
    C.push("b65c7c74"); // mulexp(uint256)
    C.eq();
    C.jmpi("start");
    C.invalid();

    C.label("start");

    storeVals();

    C.push( Math.floor(255/w)*w  );                // pos := 255
    C.push(VAR_POS);
    C.mstore();

    C.push("21888242871839275222246405745257275088696311157297823662689037894645226208583");
    C.push(0);
    C.push(0);
    C.push(0);
    C.push(0);
    C.push(0);
    C.push(0);

    C.label("begin_loop");      // ACC_X ACC_Y ACC_Z q

    C.internalCall("double");

    // g = (e>>pos)&MASK
    C.push(4);
    C.calldataload();           // e ACC_X ACC_Y ACC_Z q

    C.push(VAR_POS);
    C.mload();                  // pos e ACC_X ACC_Y ACC_Z q
    C.shr();

    C.push(NPOINTS-1);
    C.and();                    // g ACC_X ACC_Y ACC_Z q

    C.internalCall("add");      // acc_x acc_y acc_z

    C.push(VAR_POS);
    C.mload();                  // pos acc_x acc_y acc_z
    C.dup(0);                   // pos pos acc_x acc_y acc_z
    C.push(0);                  // 0 pos pos acc_x acc_y acc_z
    C.eq();                     // eq pos acc_x acc_y acc_z
    C.jmpi("after_loop");       // pos acc_x acc_y acc_z
    C.push(w);                  // 5 pos acc_x acc_y acc_z
    C.sub();                    // pos acc_x acc_y acc_z
    C.push(VAR_POS);
    C.mstore();                 // acc_x acc_y acc_z
    C.jmp("begin_loop");
    C.label("after_loop");      // pos acc_x acc_y acc_z
    C.pop();                    // acc_x acc_y acc_z

    C.internalCall("affine");   // acc_x acc_y

    C.push(0);
    C.mstore();
    C.push(20);
    C.mstore();
    C.push(40);
    C.mstore();
    C.push(60);
    C.mstore();

    C.push("0x80");
    C.push("0x00");
    C.return();


    double();
    addPoint();
    affine();

    return C.createTxData();

    function add(a,b,q) {
        C.dup(q);
        C.dup(a+1 + 1);
        C.dup(b+1 + 2);
        C.addmod();
        C.dup(q + 1);
        C.dup(a + 2);
        C.dup(b + 3);
        C.addmod();
    }

    function sub(a,b,q) {
        C.dup(q);           // q
        C.dup(a+1 + 1);     // ai q
        C.dub(q + 2);       // q ai q
        C.dup(b+1 + 3);     // bi q ai q
        C.sub();            // -bi ai q
        C.addmod();         // ci
        C.dup(q + 1);       // q ci
        C.dup(a + 2);       // ar q ci
        C.dup(q + 3);       // q ar q ci
        C.dup(b + 4);       // br q ar q ci
        C.sub();            // -br ar q ci
        C.addmod();         // cr ci
    }

    function mul(a, b, q) {
        C.dup(q);           //  q
        C.dup(q + 1);       //  q q
        C.dup(a + 2);       //  ar q q
        C.dup(b+1 + 3);     //  bi ar q q
        C.mulmod();         //  ci1 q
        C.dup(q + 2);       //  q ci1 q
        C.dup(a+1 + 3);     //  ai q ci1 q
        C.dup(b + 4);       //  ar ai q ci1 q
        C.mulmod();         //  ci2 ci1 q
        C.addmod();         //  ci
        C.dup(q + 1);       //  q ci
        C.dup(q + 2);       //  q q ci
        C.dup(q + 3);       //  q q q ci
        C.dup(a+1 + 4);     //  ai q q ci
        C.dup(b+1 + 5);     //  bi ai q q ci
        C.mulmod();         //  cr2 q q ci
        C.sub();            //  -cr2 q ci
        C.dup(q + 3);       //  q -cr2 q ci
        C.dup(a + 4);       //  ar q -cr2 q ci
        C.dup(b + 5);       //  br ar q -cr2 q ci
        C.mulmod();         //  cr1 -cr2 q ci
        C.addmod();         //  cr ci
    }

    function square(a, q) {
        C.dup(q);           //  q
        C.dup(q + 1);       //  q q
        C.dup(a + 2);       //  ar q q
        C.dup(a+1 + 3);     //  ai ar q q
        C.mulmod();         //  arai q
        C.dup(0);           //  arai arai q
        C.addmod();         //  ci
        C.dup(q + 1);       //  q ci
        C.dup(q + 2);       //  q q ci
        C.dup(q + 3);       //  q q q ci
        C.dup(a+1 + 4);     //  ai q q ci
        C.dup(a+1 + 5);     //  ai ai q q ci
        C.mulmod();         //  cr2 q q ci
        C.sub();            //  -cr2 q ci
        C.dup(q + 3);       //  q -cr2 q ci
        C.dup(a + 4);       //  ar q -cr2 q ci
        C.dup(a + 5);       //  br ar q -cr2 q ci
        C.mulmod();         //  cr1 -cr2 q ci
        C.addmod();         //  cr ci
    }

    function add1(a, q) {
        C.dup(a+1);         // im
        C.dup(1 + q);       //  q
        C.dup(2 + a);       //  re q im
        C.push(1);          // 1 re q im
        C.addmod();
    }

    function cmp(a, b) {
        C.dup(a);
        C.dup(b);
        C.eq();
        C.dup(a+1);
        C.dup(a+1);
        C.and();
    }

    function rm(a) {
        if (a>0) C.swap(a);
        C.pop();
        if (a>0) C.swap(a);
        C.pop();
    }

    function double() {
        C.label("double");       // xR, xI,    yR, yI,   zR zI, q

        C.dup(4);
        C.iszero();
        C.dup(6);
        C.iszero();
        C.and();
        C.jumpi("enddouble");   // X Y Z q


        // Z3 = 2*Y*Z // Remove Z
        mul(2, 4, 6);           // yz X Y Z q
        rm(6);                  // X Y yz q

        add(4, 4, 6);           // 2yz X Y yz q
        rm(6);                  // X Y Z3 q

        // A = X^2
        square(0,6);               // A X Y Z3 q

        // B = Y^2  // Remove Y
        square(4,8);              // B A X Y Z3 q
        rm(6);                  // A X B Z3 q

        // C = B^2
        square(4,8);               // C A X B Z3 q

        // D = (X+B)^2-A-C // Remove X, Remove B
        add(4,6, 10);           // X+B C A X B Z3 q
        rm(6);                  // C A X+B B Z3 q
        rm(6);                  // A X+B C Z3 q
        square(2,8);            // (X+B)^2 A X+B C Z3 q
        rm(4);                  // A (X+B)^2 C Z3 q
        sub(2, 0, 8);           // (X+B)^2-A A (X+B)^2 C Z3 q
        rm(4);                  // A (X+B)^2-A C Z3 q
        sub(2, 4, 8);           // (X+B)^2-A-C A (X+B)^2-A C Z3 q
        rm(4);                  // A D C Z3 q

        // D = D+D
        add(2,2, 8);            // D+D A D C Z3 q
        rm(4);                  // A D C Z3 q

        // E=A+A+A
        add(0, 0, 8);           // 2A A D C Z3 q
        add(0, 2, 10);          // 3A 2A A D C Z3 q
        rm(4);                  // 2A 3A D C Z3 q
        rm(0);                  // E D C Z3 q

        // F=E^2
        square(0, 8);           // F E D C Z3 q

        // X3= F - 2*D  // Remove F
        add(4, 4, 10);          // 2D F E D C Z3 q
        sub(2, 0, 12);          // F-2D 2D F E D C Z3 q
        rm(4);                  // 2D X3 E D C Z3 q
        rm(0);                  // X3 E D C Z3 q

        // Y3 = E * (D - X3) - 8 * C  // Remove D C  E

        sub(4, 0, 10);          // D-X3 X3 E D C Z3 q
        rm(6);                  // X3 E D-X3 C Z3 q
        mul(2, 4, 10);          // E*(D-X3) X3 E D-X3 C Z3 q
        rm(6);                  // X3 E E*(D-X3) C Z3 q
        rm(2);                  // X3 E*(D-X3) C Z3 q
        add(4, 4, 8);           // 2C X3 E*(D-X3) C Z3 q
        rm(6);                  // X3 E*(D-X3) 2C Z3 q
        add(4, 4, 8);           // 4C X3 E*(D-X3) 2C Z3 q
        rm(6);                  // X3 E*(D-X3) 4C Z3 q
        add(4, 4, 8);           // 8C X3 E*(D-X3) 4C Z3 q
        rm(6);                  // X3 E*(D-X3) 8C Z3 q
        sub(2, 4, 8);           // E*(D-X3)-8C X3 E*(D-X3) 8C Z3 q
        rm(6);                  // X3 E*(D-X3) Y3 Z3 q
        rm(2);                  // X3 Y3 Z3 q

        C.label("enddouble");
        C.returnCall();
    }

    function addPoint() {     // p, xR, xI,    yR, yI,   zR zI, q


        C.dup(0);           // p p X2 Y2 Z2 q

        C.push(savedP);
        C.mstore();

        C.iszero();         // X2 Y2 Z2 q
        C.jumpi("endpadd");


        C.dup(4);
        C.iszero();
        C.dup(6);
        C.iszero();
        C.and();
        C.jumpi("returnP");   // X2 Y2 Z2 q



        // lastZ3 = (Z2+1)^2 - Z2^2
        add1(4, 6);         // Z2+1 X2 Y2 Z2 q
        square(0, 8);       // (Z2+1)^2 Z2+1 X2 Y2 Z2 q
        rm(2);              // (Z2+1)^2 X2 Y2 Z2 q
        square(6, 8);       // Z2^2 (Z2+1)^2 X2 Y2 Z2 q


        sub(2, 0, 10);      // (Z2+1)^2-Z2^2 Z2^2 (Z2+1)^2 X2 Y2 Z2 q

        saveZ3();           // Z2^2 (Z2+1)^2 X2 Y2 Z2 q
        rm(2);              // Z2^2 X2 Y2 Z2 q

        // U2 = X2
        // S2 = Y2          // Z2^2 U2 S2 Z2 q


        // U1 = X1 * Z2^2
        loadX();            // X1 Z2^2 U2 S2 Z2 q
        mul(0, 2, 10);      // X1*Z2^2 X1 Z2^2 U2 S2 Z2 q
        rm(2);              // X1*Z2^2 Z2^2 U2 S2 Z2 q


        mul(2, 8, 10);      // Z2^3 U1 Z2^2 U2 S2 Z2 q
        rm(4);              // U1 Z2^3 U2 S2 Z2 q
        rm(8);              // Z2^3 U2 S2 U1 q

        // S1 = Y1 * Z1^3
        loadY();            // Y1 Z2^3 U2 S2 U1 q
        mul(0, 2, 10);      // S1 Y1 Z2^3 U2 S2 U1 q
        rm(4);              // Y1 S1 U2 S2 U1 q
        rm(0);              // S1 U2 S2 U1 q

        cmp(0, 4);          // c1 S1 U2 S2 U1 q
        cmp(3, 7);          // c2 c1 S1 U2 S2 U1 q
        C.and();            // c2&c1 S1 U2 S2 U1 q
        C.jumpi("double1"); // S1 U2 S2 U1 q


        // Returns the double

        // H = U2-U1  // Remove U2
        C.sub(4, 8, 10);    // H S1 U2 S2 U1 q
        rm(4);              // S1 H S2 U1 q

        // // r = 2 * (S2-S1)  // Remove S2
        C.sub(4, 4, 8);     // S1-S2 S1 H S2 U1 q
        rm(6);              // S1 H S1-S2 U1 q
        C.add(4, 4, 8);     // 2*(S1-S2) S1 H S1-S2 U1 q
        rm(6);              // S1 H r U1 q

        // I = (2 * H)^2
        C.add(2, 2, 8);     // 2*H S1 H r U1 q
        C.square(0, 10);    // (2*H)^2 2*H S1 H r U1 q
        rm(2);              // I S1 H r U1 q

        // V = U1 * I
        mul(8, 0, 10);      // V I S1 H r U1 q
        rm(10);             // I S1 H r V q

        // J = H * I // Remove I
        mul(4, 0, 10);      // J I S1 H r V q
        rm(2);              // J S1 H r V q

        // X3 = r^2 - J - 2 * V

        // S1J2 = (S1*J)*2  // Remove S1
        mul(2, 0, 10);      // S1*J J S1 H r V q
        rm(4);              // J S1*J H r V q
        add(2,2, 10);       // (S1*J)*2 J S1*J H r V q
        rm(4);              // J S1J2 H r V q

        // X3 = r^2 - J - 2 * V
        square(6, 10);      // r^2 J S1J2 H r V q
        sub(0, 2, 12);      // r^2-J r^2 J S1J2 H r V q
        rm(2);              // r^2-J J S1J2 H r V q
        rm(2);              // r^2-J S1J2 H r V q
        add(8, 8, 10);      // 2*V r^2-J S1J2 H r V q
        sub(2, 0, 12);      // r^2-J-2*V 2*V r^2-J S1J2 H r V q
        rm(4);              // 2*V  X3 S1J2 H r V q
        rm(0);              // X3 S1J2 H r V q

        // Y3 = r * (V-X3)-S1J2

        sub(8, 0, 10);      // V-X3 X3 S1J2 H r V q
        rm(10);             // X3 S1J2 H r V-X3 q
        mul(6, 8, 10);      // r*(V-X3) X3 S1J2 H r V-X3 q
        rm(8);              // X3 S1J2 H r*(V-X3) V-X3 q
        rm(8);              // S1J2 H r*(V-X3) X3 q
        sub(4, 0, 8);       // Y3 S1J2 H r*(V-X3) X3 q
        rm(6);              // S1J2 H Y3 X3 q
        rm(0);              // H Y3 X3 q

        // Z3 = lastZ * H
        loadZ3();           // lastZ3 H Y3 X3 q
        mul(0, 2, 8);       // Z3 lastZ3 H Y3 X3 q
        rm(4);              // lastZ3 Z3 Y3 X3 q
        rm(0);              // Z3 Y3 X3 q

        C.swap(1);
        C.swap(5);
        C.swap(1);
        C.swap(4);          // X3 Y3 Z3 q

        // returns the point in memory
        C.label("returnP"); // X Y Z q
        rm(0);
        rm(0);
        rm(0);
        C.push(0);
        C.push(1);
        loadX();
        loadY();
        C.jump("endpadd");

        C.label("double1"); // S1 U2 S2 U1 q
        rm(0);
        rm(0);
        rm(0);
        rm(0);
        C.push(0);
        C.push(1);
        loadX();
        loadY();
        C.jump("double");

        C.label("endpadd");
        C.returnCall();

        function loadX() {
            C.push(savedP);
            C.mload();                  // p
            C.push(32);
            C.mul();                    // P*32
            C.push(VAR_POINTS+32);
            C.add();                    // P*32+32
            C.dup();                    // P*32+32 P*32+32
            C.mload();                  // im P*32+32
            C.swap(1);                  // P*32+32 im
            C.push(0x20);               // 32 P*32+32 im
            C.sub();                    // P*32 im
            C.mload();                  // re im
        }

        function loadY() {
            C.push(savedP);
            C.mload();                  // p
            C.push(32);
            C.mul();                    // P*32
            C.push(VAR_POINTS+32*3);
            C.add();                    // P*32+32
            C.dup();                    // P*32+32 P*32+32
            C.mload();                  // im P*32+32
            C.swap(1);                  // P*32+32 im
            C.push(0x20);               // 32 P*32+32 im
            C.sub();                    // P*32 im
            C.mload();                  // re im
        }

        function loadZ3() {
            C.push(savedZ3+32);
            C.mload();                  // p
            C.push(savedZ3);
            C.mload();
        }

        function saveZ3() {
            C.push(savedZ3);
            C.mstore();
            C.push(savedZ3+32);
            C.mstore();
        }
    }

    function affine() { // X Y Z q
        // If Z2=0 return 0
        C.label("affine");
        C.dup(4);
        C.dup(5 + 1);
        C.or();
        C.jumpi("notZero");     // X Y Z q
        rm(0);
        rm(0);
        C.push(0);
        C.push(0);

        C.jmp("endAffine");
        C.label("notZero");

        inverse2(4,6);          // Z_inv X Y Z q
        square(2, 8);           // Z2_inv Z_inv X Y Z q
        mul(0, 2, 10);          // Z3_inv Z2_inv Z_inv X Y Z q
        rm(4);                  // Z2_inv Z3_inv X Y Z q
        C.push(1);
        C.push(0);              // 1 Z2_inv Z3_inv X Y Z q
        rm(10);                 // Z2_inv Z3_inv X Y 1 q
        mul(2, 6, 10);          // YI Z2_inv Z3_inv X Y 1 q
        rm(8);                  // Z2_inv Z3_inv X YI 1 q
        mul(0, 4, 10);          // XI Z2_inv Z3_inv X YI 1 q
        rm(6);                  // Z2_inv Z3_inv XI YI 1 q
        rm(0);                  // Z3_inv XI YI 1 q
        rm(0);                  // XI YI 1 q
        C.label("endAffine");
        C.returnCall();
    }

    function inverse2(a, q) {
        C.dup(q);           // q
        C.dup(q + 1);       // q q
        C.push(2);          // 2 q q
        C.sub();            // q-2 q
        C.dup(q + 2);       // q q-2 q
        C.dup(q + 3);       // q q q-2 q
        C.dup(a + 4);       // ar q q q-2 q
        C.dup(a + 5);       // ar ar q q q-2 q
        C.mulmod();         // t0 q q-2 q

        C.dup(q   + 4);     // q t0 q q-2 q
        C.dup(a+1 + 5);     // ai q t0 q q-2 q
        C.dup(a+1 + 6);     // ai ai q t0 q q-2 q
        C.mulmod();         // t1 t0 q q-2 q

        C.addmod();         // t2 q-2 q
        C.expmod();         // t3

        C.dup(q + 1);       // q t3
        C.dup(q + 2);       // q q t3
        C.dup(q + 3);       // q q q t3
        C.dup(1);           // t3 q q q t3
        C.sub();            // -t3 q q t3
        C.dup(a+1 + 3);     // ai -t3 q q t3
        C.mulmod();         // ii q t3
        C.swap(2);          // t3 q ii
        C.dup(a + 3);       // ar t3 q ii
        C.mulmod();         // ir ii
    }

    function storeVals() {
        C.push(VAR_POINTS);                 // p
        for (let i=0; i<NPOINTS; i++) {
            const MP = G2.affine(G2.mulScalar(P, i));
            for (let j=0; j<2; j++) {
                for (let k=0; k<2; k++) {
                    C.push(toHex256(MP[j][k]));     // MP[0][0] p
                    C.dup(1);                       // p MP[0][0] p
                    C.mstore();                     // p
                    C.push(32);                     // 32 p
                    C.add();                        // p+32
                }
            }
        }
    }

}

module.exports.abi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "escalar",
                "type": "uint256"
            }
        ],
        "name": "mulexp",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            },
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    }
];

module.exports.createCode = createCode;
