pragma circom  2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "./dateIsLess.circom";

template IsMajor() {

    signal input majority;
    signal input currDate[6];
    signal input birthDateASCII[6];
    

    signal birthdateNum[6];
    signal ASCII_rotation <== 48;
    
    for (var i=0; i<6; i++) {
        birthdateNum[i] <== birthDateASCII[i] - ASCII_rotation;
    }

    signal TEN <== 10;
    signal CENTURY <== 100;

    signal currDateYear <== currDate[0] * TEN + currDate[1];
    signal birthYear <== birthdateNum[0] * TEN + birthdateNum[1];

    component isPrevCentury = LessThan(8);

    isPrevCentury.in[0] <== currDateYear;
    isPrevCentury.in[1] <== birthYear;

    signal currDateYearNormalized <== currDateYear + isPrevCentury.out * CENTURY;

    component is_major = DateIsLess();

    is_major.firstYear  <== birthYear + majority;
    is_major.firstMonth <== birthdateNum[2] * TEN + birthdateNum[3];
    is_major.firstDay   <== birthdateNum[4] * TEN + birthdateNum[5];

    is_major.secondYear <== currDateYearNormalized;
    is_major.secondMonth <== currDate[2] * TEN + currDate[3];
    is_major.secondDay <== currDate[4] * TEN + currDate[5];

    signal output out <== is_major.out;
}
