// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ISignatureTransfer } from "./ISignatureTransfer.sol";
import { RerangeTypes } from "../libraries/RerangeTypes.sol";

interface IRerangeHub {
    error NotOwner();
    error InvalidOwner();
    error InvalidConfig();
    error UnknownOrder();
    error InvalidPermit();
    error OrderLocked();
    error ProtocolPaused();

    event AdapterAllowedUpdated(address indexed adapter, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event HubConfigUpdated(
        address indexed permit2,
        address indexed treasury,
        address indexed weth,
        uint16 resolverShareBps,
        uint16 referrerShareBps,
        uint32 rerangeCooldown,
        uint16 completionThresholdBps,
        bool paused
    );
    event VaultCreated(address indexed owner, uint256 indexed vaultIndex, address indexed vault);
    event OrderOpened(
        bytes32 indexed orderKey,
        address indexed vault,
        uint256 indexed orderIndex,
        address adapter,
        bool isSell,
        int24 targetTick
    );
    event OrderReranged(
        bytes32 indexed orderKey,
        int24 lowerTick,
        int24 upperTick,
        uint256 sourceBalance,
        uint32 rerangeCount
    );
    event OrderClosed(
        bytes32 indexed orderKey,
        address indexed resolver,
        address indexed referrer,
        uint256 accruedFee0,
        uint256 accruedFee1
    );

    function owner() external view returns (address);

    function vaultImplementation() external view returns (address);

    function hubConfig() external view returns (RerangeTypes.HubConfig memory);

    function adapters(address adapter) external view returns (bool);

    function vaults(address vaultOwner) external view returns (uint256);

    function vaultOrderCount(address vault) external view returns (uint256);

    function setConfig(RerangeTypes.HubConfig calldata config_) external;

    function setAdapterAllowed(address adapter, bool allowed) external;

    function transferOwnership(address newOwner) external;

    function createVault() external returns (address vault);

    function predictVault(address owner_, uint256 vaultIndex) external view returns (address);

    function getOrderKey(address vault, uint256 orderIndex) external pure returns (bytes32);

    function orders(bytes32 orderKey) external view returns (RerangeTypes.Order memory);

    function getOrder(bytes32 orderKey) external view returns (RerangeTypes.Order memory);

    function getOrderByIndex(address vault, uint256 orderIndex) external view returns (RerangeTypes.Order memory);

    function isOrderClosed(bytes32 orderKey) external view returns (bool);

    function getOrderState(bytes32 orderKey) external view returns (RerangeTypes.OrderStateView memory);

    function previewOpen(
        address owner_,
        RerangeTypes.CreateOrderParams calldata params
    ) external view returns (RerangeTypes.OpenPreview memory preview);

    function previewRerange(bytes32 orderKey) external view returns (RerangeTypes.OrderActionPreview memory preview);

    function previewRerange(
        bytes32 orderKey,
        int24 targetTick,
        uint24 triggerTicks
    ) external view returns (RerangeTypes.OrderActionPreview memory preview);

    function previewClose(bytes32 orderKey) external view returns (RerangeTypes.OrderActionPreview memory preview);

    function open(
        RerangeTypes.CreateOrderParams calldata params
    ) external payable returns (RerangeTypes.OrderActionPreview memory preview);

    function open2(
        RerangeTypes.CreateOrderParams calldata params,
        ISignatureTransfer.PermitTransferFrom calldata permit,
        bytes calldata signature
    ) external returns (RerangeTypes.OrderActionPreview memory preview);

    function rerange(bytes32 orderKey) external returns (RerangeTypes.OrderActionPreview memory preview);

    function rerange(
        bytes32 orderKey,
        int24 targetTick,
        uint24 triggerTicks
    ) external returns (RerangeTypes.OrderActionPreview memory preview);

    function close(bytes32 orderKey) external returns (RerangeTypes.OrderActionPreview memory preview);

    function batchRerange(
        bytes32[] calldata orderKeys
    ) external returns (bool[] memory success, bytes[] memory results);

    function multicall(bytes[] calldata data) external returns (bytes[] memory results);
}