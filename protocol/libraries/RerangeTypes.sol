// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library RerangeTypes {
    uint16 internal constant BPS = 10_000;
    uint8 internal constant ORDER_FLAG_SELL = 1 << 0;
    uint8 internal constant ORDER_FLAG_KEEP_BALANCES = 1 << 1;
    uint8 internal constant ORDER_FLAG_UNWRAP_OUT = 1 << 2;
    uint8 internal constant ORDER_FLAG_CLOSED = 1 << 3;

    struct HubConfig {
        address permit2;
        address treasury;
        address weth;
        uint16 resolverShareBps;
        uint16 referrerShareBps;
        uint32 rerangeCooldown;
        uint16 completionThresholdBps;
        bool paused;
    }

    enum AdapterResultKind {
        None,
        Collect,
        Remove,
        Activate
    }

    enum OrderStatus {
        None,
        Active,
        Completed,
        Closed
    }

    struct PoolState {
        int24 currentTick;
        int24 twapTick;
        uint160 sqrtPriceX96;
        uint128 poolLiquidity;
    }

    struct CreateOrderParams {
        address vault;
        address adapter;
        address token0;
        address token1;
        uint256 capital;
        bool isSell;
        int24 targetTick;
        uint24 triggerTicks;
        bytes adapterConfig;
        address referrer;
        bool keepBalancesInVault;
        bool unwrapOut;
    }

    struct OrderConfigStorage {
        address vault;
        address adapter;
        address token0;
        address token1;
        uint256 capital;
        address referrer;
    }

    struct OrderStateStorage {
        uint256 accruedFee0;
        uint256 accruedFee1;
        uint256 idle0;
        uint256 idle1;
        int24 targetTick;
        uint24 triggerTicks;
        uint40 createdAt;
        uint40 lastRerangeAt;
        uint32 rerangeCount;
        uint8 flags;
    }

    struct Order {
        address vault;
        address adapter;
        address token0;
        address token1;
        uint256 capital;
        bool isSell;
        int24 targetTick;
        uint24 triggerTicks;
        bytes adapterData;
        address referrer;
        bool keepBalancesInVault;
        bool unwrapOut;
        bool closed;
        uint32 rerangeCount;
        uint40 createdAt;
        uint40 lastRerangeAt;
        uint256 accruedFee0;
        uint256 accruedFee1;
        uint256 idle0;
        uint256 idle1;
    }

    struct ExecutionPlan {
        bool collectFees;
        bool removeLiquidity;
        bool activateOrder;
        bool closeOrder;
        int24 expectedTick;
        int24 activateTickLower;
        int24 activateTickUpper;
        uint256 deployAmount0;
        uint256 deployAmount1;
        uint256 minRemove0;
        uint256 minRemove1;
        uint256 minActivate0;
        uint256 minActivate1;
        uint128 minActivateLiquidity;
    }

    struct AdapterCall {
        address target;
        uint256 value;
        bytes data;
        AdapterResultKind resultKind;
    }

    struct PreparedExecution {
        ExecutionPlan plan;
        AdapterCall[] calls;
    }

    struct OpenPreview {
        address vault;
        bool vaultExists;
        bytes adapterData;
        PoolState market;
        int24 tickSpacing;
        int24 lowerTick;
        int24 upperTick;
        ExecutionPlan activationPlan;
    }

    struct AdapterResult {
        AdapterResultKind kind;
        bytes data;
    }

    struct ExecutionResult {
        uint256 fee0;
        uint256 fee1;
        uint256 returned0;
        uint256 returned1;
        uint256 used0;
        uint256 used1;
        uint128 liquidity;
    }

    struct PositionView {
        bool active;
        uint128 liquidity;
        uint256 sourceBalance;
        uint256 targetBalance;
        uint256 pendingFee0;
        uint256 pendingFee1;
        int24 lowerTick;
        int24 upperTick;
    }

    struct OrderActionPreview {
        Order order;
        PoolState market;
        PositionView position;
        uint256 reward0;
        uint256 reward1;
        uint256 sourceBalance;
        bool willClose;
        int24 nextLowerTick;
        int24 nextUpperTick;
        ExecutionPlan removePlan;
        ExecutionPlan activatePlan;
    }

    struct OrderStateView {
        Order order;
        OrderStatus status;
        int24 lowerTick;
        int24 upperTick;
        uint128 liquidity;
        uint32 rerangeCount;
        uint256 progressBps;
        uint256 remainingSource;
        uint256 convertedTarget;
        uint256 accruedFee0;
        uint256 accruedFee1;
        PoolState market;
    }
}
