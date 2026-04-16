// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { UniswapV4Types } from "../../../libraries/uniswap/v4/UniswapV4Types.sol";

interface IUniswapV4StateViewMinimal {
    function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24, uint24);

    function getLiquidity(bytes32 poolId) external view returns (uint128 liquidity);

    function getPositionInfo(
        bytes32 poolId,
        address owner,
        int24 tickLower,
        int24 tickUpper,
        bytes32 salt
    ) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128);

    function getFeeGrowthInside(
        bytes32 poolId,
        int24 tickLower,
        int24 tickUpper
    ) external view returns (uint256 feeGrowthInside0X128, uint256 feeGrowthInside1X128);
}
