// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { RerangeTypes } from "../libraries/RerangeTypes.sol";

interface IOrderReader {
    function getOrder(bytes32 orderKey) external view returns (RerangeTypes.Order memory);
}
