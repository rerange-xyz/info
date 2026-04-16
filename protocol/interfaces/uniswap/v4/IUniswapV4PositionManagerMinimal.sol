// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { UniswapV4Types } from "../../../libraries/uniswap/v4/UniswapV4Types.sol";

interface IUniswapV4PositionManagerMinimal {
    function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable;

    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);

    function nextTokenId() external view returns (uint256);

    function getPoolAndPositionInfo(
        uint256 tokenId
    ) external view returns (UniswapV4Types.PoolKey memory poolKey, UniswapV4Types.PositionInfo info);

    function getPositionLiquidity(uint256 tokenId) external view returns (uint128 liquidity);

    function poolManager() external view returns (address);
}
