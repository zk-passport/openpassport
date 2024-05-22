import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Deploy_Registry", (m) => {
    const verifier_disclose_address = "0x214007909475A4Eed3f0a8C827E86de55EcFc340"
    const formatter_address = "0x24c919Dc3E5BA89c0898778D71435D566B05B4c5"
    const register_address = "0xFd84F23Be557133DCa47Fc9aa22031AcCE557335"

    const gitcoinSBT = m.contract(
        "GitcoinProofOfPassportSBT",
        [
            "GitcoinProofOfPassportSBT",
            "GPOP",
            2,
            verifier_disclose_address,
            formatter_address,
            register_address
        ]
    );

    return { gitcoinSBT };
});

