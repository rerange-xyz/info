// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { RerangeTypes } from "../libraries/RerangeTypes.sol";

interface IRerangeVault {
    error NotOwner();
    error NotHub();
    error NotManager();
    error UnknownOrder();
    error AlreadyInitialized();
    error InvalidExecution();
    error InvalidPayoutAmount();
    error InvalidBatchLength();
    error InvalidWeth();
    error TransferFailed();
    error CallFailed();

    event AgentUpdated(address indexed agent, uint256 accessExpiresAt);
    event OrderExecuted(
        bytes32 indexed orderKey,
        uint128 liquidity,
        uint256 fee0,
        uint256 fee1,
        uint256 returned0,
        uint256 returned1
    );
    event TokenPayout(bytes32 indexed orderKey, address indexed token, address indexed to, uint256 amount);
    event TokenWithdraw(address indexed token, address indexed to, uint256 amount);
    event CallExecuted(address indexed target, uint256 value, bytes data, bytes result);

    function owner() external view returns (address);

    function hub() external view returns (address);

    function index() external view returns (uint256);

    function agents(address agent) external view returns (uint256);

    function initialize(address owner_, address hub_, uint256 index_) external;

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4);

    function setAgent(address agent, uint256 accessExpiresAt) external;

    function isManager(address account) external view returns (bool);

    function getOrder(bytes32 orderKey) external view returns (RerangeTypes.Order memory order);

    function execute(
        bytes32 orderKey,
        RerangeTypes.ExecutionPlan calldata plan
    ) external returns (RerangeTypes.ExecutionResult memory result, bytes memory nextAdapterData);

    function payout(bytes32 orderKey, bool isToken0, address to, uint256 amount) external;

    function wrapNative(address weth) external payable;

    function withdraw(address token, uint256 amount) external;

    function withdrawNative(address weth, uint256 amount) external;

    function withdraw(address token, address to, uint256 amount) external;

    function call(address target, uint256 value, bytes calldata data) external returns (bytes memory result);

    function multicall(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata data
    ) external returns (bytes[] memory results);
}