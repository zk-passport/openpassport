// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 21404760270186141828369668155414587703319180096908482557536747665924603562412;
    uint256 constant deltax2 = 7777219575000831901511189928177343599113667482283872190197717669777371482106;
    uint256 constant deltay1 = 21733515311415010066947993431764771493175650723251508620155230845211777925729;
    uint256 constant deltay2 = 10962971181821894146585518718465174687712313519856713505030725439665503913685;

    
    uint256 constant IC0x = 7852804675739435080613574359345950493934607864658134208078950900296399510066;
    uint256 constant IC0y = 12915991616765259776890847906738069731113101185005149290509277588458372567121;
    
    uint256 constant IC1x = 6456754501754353917982164533992335407790924732338531665280568970071677855097;
    uint256 constant IC1y = 14964138475320460361011352500483168013663922925169057960714795891874990185955;
    
    uint256 constant IC2x = 15846291159741284113341049477464429770646048316064674614409689533510543856649;
    uint256 constant IC2y = 847845775582437853351991887524990723923804079553156029801683322094094877218;
    
    uint256 constant IC3x = 6579289602469462058481381332054023111566296158810418339719341000384056237474;
    uint256 constant IC3y = 16226899659496429968944901894983626222525244848425433097706255566347243212084;
    
    uint256 constant IC4x = 20348808498434177834348996539538137613048213456066958453278565368897973438124;
    uint256 constant IC4y = 9804712648452365832392331821113513591836557636271590573188250529246263246352;
    
    uint256 constant IC5x = 9924638239496382447312366979562548124290667004610303622194067223903361729329;
    uint256 constant IC5y = 20692234911246779703759587113817825019889699313658121008752222944235696068886;
    
    uint256 constant IC6x = 1778102105792871853272786426865890478393932964628315382368985777871632132823;
    uint256 constant IC6y = 14332953770056130535442292479480080110119115201006719742602998550640670070609;
    
    uint256 constant IC7x = 17182036972932116974740937171991445808974893390757552107953903149087019575436;
    uint256 constant IC7y = 10985386754016777836484942668647206125934009389232779240866111920951725270904;
    
    uint256 constant IC8x = 6480504880855843936295188500746740421545675556366691550628379266958759665487;
    uint256 constant IC8y = 17040091941764722586301743771583054168286989506655584713321050060129279647761;
    
    uint256 constant IC9x = 9049904487846310385095423519041787160252871316551437655364329709017452833010;
    uint256 constant IC9y = 17712954881087211006365594180918931323297191311027193492156372406695038348091;
    
    uint256 constant IC10x = 2712828705516054028973367075471428864143205385981467001751052458700843177780;
    uint256 constant IC10y = 8249602049472788806380126646976702656036709871288635364967693810592278827836;
    
    uint256 constant IC11x = 2543708135626565226586732827357552218471059107110422559288645325715818152998;
    uint256 constant IC11y = 4532117885740241839793024360427257513092833722319478514919158291335204752242;
    
    uint256 constant IC12x = 2743581681345671978244460949892998724108035016746901325729914478870234010484;
    uint256 constant IC12y = 13620038291651140415067114298062424642643763613605449329370891268866227669849;
    
    uint256 constant IC13x = 8439894897220676897894679317315671235011366478899646401371164039702061671677;
    uint256 constant IC13y = 21834508688118831454091454200437659234212766871804597394774219030638826392353;
    
    uint256 constant IC14x = 19244733479107721165490950452513214256976569381125200507680085017970839743008;
    uint256 constant IC14y = 4371574598912400172271726047933982865115265782172334131086797489305398119046;
    
    uint256 constant IC15x = 8292795803922864762260453102918866016857408224451192094869934608100288859798;
    uint256 constant IC15y = 7750966358877811493594215787326958092036122490472457052234912431144686243380;
    
    uint256 constant IC16x = 15906754791466643727708347365176556560277266360185558491095898599089875457610;
    uint256 constant IC16y = 11403250707392323507932474613239028264435324878772127084387739949598415700214;
    
    uint256 constant IC17x = 9666676744443376491053509608060828328023402531510330791501264740945418061781;
    uint256 constant IC17y = 8413779508124043866279953945369021824179012429461489867610039023305403503162;
    
    uint256 constant IC18x = 3827574302870777265953189068119043178794222509052791825500158671028024208192;
    uint256 constant IC18y = 2777821645439488672972326466977902187965805932948704402536060091821508474488;
    
    uint256 constant IC19x = 12514353552895060742295562165157895395517460019453803109782602746647566660072;
    uint256 constant IC19y = 9107174746843369319711072682855083049586753790174049217801318698386811363830;
    
    uint256 constant IC20x = 6436902457973964539045460624664235859865877940969051766825640794264783947227;
    uint256 constant IC20y = 18162154229129125405836156740975576699138180682848701142910439493798202693348;
    
    uint256 constant IC21x = 20942584565730016508395618034584421429533967874439242172724907351549641344121;
    uint256 constant IC21y = 9767605410034871836456730970767762396024014476556201279299576028367353989864;
    
    uint256 constant IC22x = 9642660667854863055725420047466438231992086427972458171075427852904705349775;
    uint256 constant IC22y = 10269993552620335423825183362579225571225990674081674321160900994313571006048;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[22] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, q)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
