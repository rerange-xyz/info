import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      forking: {
        url: "https://ethereum-rpc.publicnode.com",
      },
    },
  },
});
