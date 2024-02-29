pragma circom 2.0.0;
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

/*** This component checks from a given timestamp and for a yymmdd if the user reached the majority ***/
/*** Note taht the cehck is %100 so user will have to wait between it's 100 and 100 + majority ***/
/*** This circuit works only with an actual timestamp between 2000 (because of unix timestamp)  and 2100 (gapped by the max of 4 bytes) ***/

// TODO: remove n parameter and determine it inside the code
template IsMajor(n) {

    signal input majority;
    // starts at position 62 of mrz
    signal input yymmdd[6];
    // current timestamp sliced in 4 bytes shoud be m
    signal input current_timestamp[4];
    // output 0 or 1
    signal output out;


    //TODO: deprecate this with using bitstonum template in loop of length  m
    signal Y1 <== yymmdd[0] - 48;
    signal Y2 <== yymmdd[1] - 48;
    signal M1 <== yymmdd[2] - 48;
    signal M2 <== yymmdd[3] - 48;
    signal D1 <== yymmdd[4] - 48;
    signal D2 <== yymmdd[5] - 48;

    //log("YYMMDD: ",Y1, Y2, M1, M2, D1, D2);

    var secInYear = 31557600; // average
    var secInMonth = 2629800; // average
    var secInDay = 86400;

    // Add 100 years to the guy
    signal age_from_1900 <== 100*secInYear + (Y1*10 + Y2)*secInYear + (M1*10 +M2)*secInMonth + (D1*10 +D2)*secInDay;

    // current timestamp since unix creation 
    // TODO: should implement BitstoNums template with a loop
    signal current_time_num <== current_timestamp[0] * 2**24 + current_timestamp[1] * 2**16 + current_timestamp[2] * 2**8 + current_timestamp[3];
    // current timestamp since 1900
    signal current_time_1900 <== current_time_num + 70 * secInYear;
    //log(1900 + current_time_1900 \ secInYear);

    // check whether the guy is born in the futur
    component check_century = LessThan(n);
    check_century.in[0] <== current_time_1900;
    check_century.in[1] <== age_from_1900;

    //log("born in the futur ? 1 = yes :", check_century.out);
    //log("age: ",(current_time_1900 + check_century.out*100*secInYear - age_from_1900)\secInYear);

    // adapt the age according to if the guy is not born yet
    signal age <== (current_time_1900 + check_century.out*100*secInYear - age_from_1900);

    component check_age = LessThan(n);
    check_age.in[0] <== majority * secInYear;
    check_age.in[1] <== age;
    out <== check_age.out;
}

//component main {public [ current_timestamp ] } = IsMajor(18,40);

/* INPUT = {
    "yymmdd": [57,55,48,50,50,51],
    "current_timestamp": [255,207,143,44]
} */
