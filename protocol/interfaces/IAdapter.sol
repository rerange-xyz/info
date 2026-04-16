// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { RerangeTypes } from "../libraries/RerangeTypes.sol";

interface IAdapter {
    function version() external pure returns (uint256);
    function venue() external pure returns (bytes32);

    function initializeAdapterData(
        bytes calldata adapterConfig
    ) external pure returns (bytes memory normalizedAdapterData);

    function prepareExecution(
        address vault,
        RerangeTypes.Order calldata order,
        RerangeTypes.ExecutionPlan calldata plan
    ) external view returns (RerangeTypes.PreparedExecution memory prepared);

    function decodeExecuteResult(
        bytes calldata adapterData,
        RerangeTypes.AdapterResult[] calldata results
    ) external pure returns (RerangeTypes.ExecutionResult memory result, bytes memory nextAdapterData);

    function getPoolState(
        address token0,
        address token1,
        bytes calldata adapterData
    ) external view returns (RerangeTypes.PoolState memory);

    function getTickSpacing(
        address token0,
        address token1,
        bytes calldata adapterData
    ) external view returns (int24 tickSpacing);

    function getMaxTwapDeviation(bytes calldata adapterData) external pure returns (uint24 maxTwapDeviation);

    function getPosition(
        address vault,
        bytes32 orderKey,
        bytes calldata adapterData
    ) external view returns (RerangeTypes.PositionView memory);

    //function getDecodedAdapterData(address vault, bytes32 orderKey) external view returns (AdapterData memory adapterData);
}
