import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent,
} from '@wagmi/core/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RerangeHub
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const rerangeHubAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'owner_', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AdapterNotAllowed' },
  { type: 'error', inputs: [], name: 'FailedDeployment' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'InvalidConfig' },
  { type: 'error', inputs: [], name: 'InvalidConfig' },
  { type: 'error', inputs: [], name: 'InvalidConfig' },
  { type: 'error', inputs: [], name: 'InvalidDirection' },
  { type: 'error', inputs: [], name: 'InvalidNativeValue' },
  { type: 'error', inputs: [], name: 'InvalidOwner' },
  { type: 'error', inputs: [], name: 'InvalidPermit' },
  { type: 'error', inputs: [], name: 'InvalidVault' },
  { type: 'error', inputs: [], name: 'NotOwner' },
  { type: 'error', inputs: [], name: 'OrderLocked' },
  { type: 'error', inputs: [], name: 'ProtocolPaused' },
  { type: 'error', inputs: [], name: 'ToxicPrice' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  { type: 'error', inputs: [], name: 'UnknownOrder' },
  { type: 'error', inputs: [], name: 'ZeroCapital' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'adapter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'allowed', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'AdapterAllowedUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'permit2',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'treasury',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'weth', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'resolverShareBps',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
      {
        name: 'referrerShareBps',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
      {
        name: 'rerangeCooldown',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
      {
        name: 'completionThresholdBps',
        internalType: 'uint16',
        type: 'uint16',
        indexed: false,
      },
      { name: 'paused', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'HubConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderKey',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'resolver',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'referrer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'accruedFee0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'accruedFee1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'OrderClosed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderKey',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'vault',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'orderIndex',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'adapter',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'isSell', internalType: 'bool', type: 'bool', indexed: false },
      {
        name: 'targetTick',
        internalType: 'int24',
        type: 'int24',
        indexed: false,
      },
    ],
    name: 'OrderOpened',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderKey',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'lowerTick',
        internalType: 'int24',
        type: 'int24',
        indexed: false,
      },
      {
        name: 'upperTick',
        internalType: 'int24',
        type: 'int24',
        indexed: false,
      },
      {
        name: 'sourceBalance',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'rerangeCount',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
    ],
    name: 'OrderReranged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'vaultIndex',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'vault',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'VaultCreated',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'adapters',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'orderKeys', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'batchRerange',
    outputs: [
      { name: 'success', internalType: 'bool[]', type: 'bool[]' },
      { name: 'results', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'close',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'createVault',
    outputs: [{ name: 'vault', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getOrder',
    outputs: [
      {
        name: '',
        internalType: 'struct RerangeTypes.Order',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
          { name: 'closed', internalType: 'bool', type: 'bool' },
          { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
          { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
          { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
          { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
          { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
          { name: 'idle0', internalType: 'uint256', type: 'uint256' },
          { name: 'idle1', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'vault', internalType: 'address', type: 'address' },
      { name: 'orderIndex', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getOrderByIndex',
    outputs: [
      {
        name: '',
        internalType: 'struct RerangeTypes.Order',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
          { name: 'closed', internalType: 'bool', type: 'bool' },
          { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
          { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
          { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
          { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
          { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
          { name: 'idle0', internalType: 'uint256', type: 'uint256' },
          { name: 'idle1', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'vault', internalType: 'address', type: 'address' },
      { name: 'orderIndex', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getOrderKey',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getOrderState',
    outputs: [
      {
        name: '',
        internalType: 'struct RerangeTypes.OrderStateView',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'status',
            internalType: 'enum RerangeTypes.OrderStatus',
            type: 'uint8',
          },
          { name: 'lowerTick', internalType: 'int24', type: 'int24' },
          { name: 'upperTick', internalType: 'int24', type: 'int24' },
          { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
          { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
          { name: 'progressBps', internalType: 'uint256', type: 'uint256' },
          { name: 'remainingSource', internalType: 'uint256', type: 'uint256' },
          { name: 'convertedTarget', internalType: 'uint256', type: 'uint256' },
          { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
          { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'hubConfig',
    outputs: [
      { name: 'permit2', internalType: 'address', type: 'address' },
      { name: 'treasury', internalType: 'address', type: 'address' },
      { name: 'weth', internalType: 'address', type: 'address' },
      { name: 'resolverShareBps', internalType: 'uint16', type: 'uint16' },
      { name: 'referrerShareBps', internalType: 'uint16', type: 'uint16' },
      { name: 'rerangeCooldown', internalType: 'uint32', type: 'uint32' },
      {
        name: 'completionThresholdBps',
        internalType: 'uint16',
        type: 'uint16',
      },
      { name: 'paused', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'isOrderClosed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes[]', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ name: 'results', internalType: 'bytes[]', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct RerangeTypes.CreateOrderParams',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterConfig', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    name: 'open',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct RerangeTypes.CreateOrderParams',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterConfig', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
        ],
      },
      {
        name: 'permit',
        internalType: 'struct ISignatureTransfer.PermitTransferFrom',
        type: 'tuple',
        components: [
          {
            name: 'permitted',
            internalType: 'struct ISignatureTransfer.TokenPermissions',
            type: 'tuple',
            components: [
              { name: 'token', internalType: 'address', type: 'address' },
              { name: 'amount', internalType: 'uint256', type: 'uint256' },
            ],
          },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'deadline', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'open2',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'orders',
    outputs: [
      {
        name: '',
        internalType: 'struct RerangeTypes.Order',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
          { name: 'closed', internalType: 'bool', type: 'bool' },
          { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
          { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
          { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
          { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
          { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
          { name: 'idle0', internalType: 'uint256', type: 'uint256' },
          { name: 'idle1', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner_', internalType: 'address', type: 'address' },
      { name: 'vaultIndex', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'predictVault',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'previewClose',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner_', internalType: 'address', type: 'address' },
      {
        name: 'params',
        internalType: 'struct RerangeTypes.CreateOrderParams',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterConfig', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    name: 'previewOpen',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OpenPreview',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'vaultExists', internalType: 'bool', type: 'bool' },
          { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'lowerTick', internalType: 'int24', type: 'int24' },
          { name: 'upperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'activationPlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'orderKey', internalType: 'bytes32', type: 'bytes32' },
      { name: 'targetTick', internalType: 'int24', type: 'int24' },
      { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
    ],
    name: 'previewRerange',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'previewRerange',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'rerange',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'orderKey', internalType: 'bytes32', type: 'bytes32' },
      { name: 'targetTick', internalType: 'int24', type: 'int24' },
      { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
    ],
    name: 'rerange',
    outputs: [
      {
        name: 'preview',
        internalType: 'struct RerangeTypes.OrderActionPreview',
        type: 'tuple',
        components: [
          {
            name: 'order',
            internalType: 'struct RerangeTypes.Order',
            type: 'tuple',
            components: [
              { name: 'vault', internalType: 'address', type: 'address' },
              { name: 'adapter', internalType: 'address', type: 'address' },
              { name: 'token0', internalType: 'address', type: 'address' },
              { name: 'token1', internalType: 'address', type: 'address' },
              { name: 'capital', internalType: 'uint256', type: 'uint256' },
              { name: 'isSell', internalType: 'bool', type: 'bool' },
              { name: 'targetTick', internalType: 'int24', type: 'int24' },
              { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
              { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
              { name: 'referrer', internalType: 'address', type: 'address' },
              {
                name: 'keepBalancesInVault',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
              { name: 'closed', internalType: 'bool', type: 'bool' },
              { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
              { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
              { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
              { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'idle0', internalType: 'uint256', type: 'uint256' },
              { name: 'idle1', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'market',
            internalType: 'struct RerangeTypes.PoolState',
            type: 'tuple',
            components: [
              { name: 'currentTick', internalType: 'int24', type: 'int24' },
              { name: 'twapTick', internalType: 'int24', type: 'int24' },
              {
                name: 'sqrtPriceX96',
                internalType: 'uint160',
                type: 'uint160',
              },
              {
                name: 'poolLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'position',
            internalType: 'struct RerangeTypes.PositionView',
            type: 'tuple',
            components: [
              { name: 'active', internalType: 'bool', type: 'bool' },
              { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
              {
                name: 'sourceBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'targetBalance',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'pendingFee0', internalType: 'uint256', type: 'uint256' },
              { name: 'pendingFee1', internalType: 'uint256', type: 'uint256' },
              { name: 'lowerTick', internalType: 'int24', type: 'int24' },
              { name: 'upperTick', internalType: 'int24', type: 'int24' },
            ],
          },
          { name: 'reward0', internalType: 'uint256', type: 'uint256' },
          { name: 'reward1', internalType: 'uint256', type: 'uint256' },
          { name: 'sourceBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'willClose', internalType: 'bool', type: 'bool' },
          { name: 'nextLowerTick', internalType: 'int24', type: 'int24' },
          { name: 'nextUpperTick', internalType: 'int24', type: 'int24' },
          {
            name: 'removePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
          {
            name: 'activatePlan',
            internalType: 'struct RerangeTypes.ExecutionPlan',
            type: 'tuple',
            components: [
              { name: 'collectFees', internalType: 'bool', type: 'bool' },
              { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
              { name: 'activateOrder', internalType: 'bool', type: 'bool' },
              { name: 'closeOrder', internalType: 'bool', type: 'bool' },
              { name: 'expectedTick', internalType: 'int24', type: 'int24' },
              {
                name: 'activateTickLower',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'activateTickUpper',
                internalType: 'int24',
                type: 'int24',
              },
              {
                name: 'deployAmount0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'deployAmount1',
                internalType: 'uint256',
                type: 'uint256',
              },
              { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
              { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
              {
                name: 'minActivate0',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivate1',
                internalType: 'uint256',
                type: 'uint256',
              },
              {
                name: 'minActivateLiquidity',
                internalType: 'uint128',
                type: 'uint128',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'adapter', internalType: 'address', type: 'address' },
      { name: 'allowed', internalType: 'bool', type: 'bool' },
    ],
    name: 'setAdapterAllowed',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'config_',
        internalType: 'struct RerangeTypes.HubConfig',
        type: 'tuple',
        components: [
          { name: 'permit2', internalType: 'address', type: 'address' },
          { name: 'treasury', internalType: 'address', type: 'address' },
          { name: 'weth', internalType: 'address', type: 'address' },
          { name: 'resolverShareBps', internalType: 'uint16', type: 'uint16' },
          { name: 'referrerShareBps', internalType: 'uint16', type: 'uint16' },
          { name: 'rerangeCooldown', internalType: 'uint32', type: 'uint32' },
          {
            name: 'completionThresholdBps',
            internalType: 'uint16',
            type: 'uint16',
          },
          { name: 'paused', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    name: 'setConfig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'vaultImplementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'vaultOrderCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'vaults',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const rerangeHubAddress = {
  1: '0x8880b95E1a056d537FA7469D1a26C3875e85f0e7',
  8453: '0x8880b95E1a056d537FA7469D1a26C3875e85f0e7',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const rerangeHubConfig = {
  address: rerangeHubAddress,
  abi: rerangeHubAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RerangeVault
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const rerangeVaultAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'CallFailed' },
  { type: 'error', inputs: [], name: 'InvalidBatchLength' },
  { type: 'error', inputs: [], name: 'InvalidExecution' },
  { type: 'error', inputs: [], name: 'InvalidPayoutAmount' },
  { type: 'error', inputs: [], name: 'InvalidWeth' },
  { type: 'error', inputs: [], name: 'NotHub' },
  { type: 'error', inputs: [], name: 'NotManager' },
  { type: 'error', inputs: [], name: 'NotOwner' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
  { type: 'error', inputs: [], name: 'UnknownOrder' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'agent',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'accessExpiresAt',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AgentUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'target',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
      { name: 'result', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'CallExecuted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderKey',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'liquidity',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'fee0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'fee1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'returned0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'returned1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'OrderExecuted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderKey',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TokenPayout',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TokenWithdraw',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'agents',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'call',
    outputs: [{ name: 'result', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'orderKey', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'plan',
        internalType: 'struct RerangeTypes.ExecutionPlan',
        type: 'tuple',
        components: [
          { name: 'collectFees', internalType: 'bool', type: 'bool' },
          { name: 'removeLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'activateOrder', internalType: 'bool', type: 'bool' },
          { name: 'closeOrder', internalType: 'bool', type: 'bool' },
          { name: 'expectedTick', internalType: 'int24', type: 'int24' },
          { name: 'activateTickLower', internalType: 'int24', type: 'int24' },
          { name: 'activateTickUpper', internalType: 'int24', type: 'int24' },
          { name: 'deployAmount0', internalType: 'uint256', type: 'uint256' },
          { name: 'deployAmount1', internalType: 'uint256', type: 'uint256' },
          { name: 'minRemove0', internalType: 'uint256', type: 'uint256' },
          { name: 'minRemove1', internalType: 'uint256', type: 'uint256' },
          { name: 'minActivate0', internalType: 'uint256', type: 'uint256' },
          { name: 'minActivate1', internalType: 'uint256', type: 'uint256' },
          {
            name: 'minActivateLiquidity',
            internalType: 'uint128',
            type: 'uint128',
          },
        ],
      },
    ],
    name: 'execute',
    outputs: [
      {
        name: 'result',
        internalType: 'struct RerangeTypes.ExecutionResult',
        type: 'tuple',
        components: [
          { name: 'fee0', internalType: 'uint256', type: 'uint256' },
          { name: 'fee1', internalType: 'uint256', type: 'uint256' },
          { name: 'returned0', internalType: 'uint256', type: 'uint256' },
          { name: 'returned1', internalType: 'uint256', type: 'uint256' },
          { name: 'used0', internalType: 'uint256', type: 'uint256' },
          { name: 'used1', internalType: 'uint256', type: 'uint256' },
          { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
        ],
      },
      { name: 'nextAdapterData', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'orderKey', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getOrder',
    outputs: [
      {
        name: 'order',
        internalType: 'struct RerangeTypes.Order',
        type: 'tuple',
        components: [
          { name: 'vault', internalType: 'address', type: 'address' },
          { name: 'adapter', internalType: 'address', type: 'address' },
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'capital', internalType: 'uint256', type: 'uint256' },
          { name: 'isSell', internalType: 'bool', type: 'bool' },
          { name: 'targetTick', internalType: 'int24', type: 'int24' },
          { name: 'triggerTicks', internalType: 'uint24', type: 'uint24' },
          { name: 'adapterData', internalType: 'bytes', type: 'bytes' },
          { name: 'referrer', internalType: 'address', type: 'address' },
          { name: 'keepBalancesInVault', internalType: 'bool', type: 'bool' },
          { name: 'unwrapOut', internalType: 'bool', type: 'bool' },
          { name: 'closed', internalType: 'bool', type: 'bool' },
          { name: 'rerangeCount', internalType: 'uint32', type: 'uint32' },
          { name: 'createdAt', internalType: 'uint40', type: 'uint40' },
          { name: 'lastRerangeAt', internalType: 'uint40', type: 'uint40' },
          { name: 'accruedFee0', internalType: 'uint256', type: 'uint256' },
          { name: 'accruedFee1', internalType: 'uint256', type: 'uint256' },
          { name: 'idle0', internalType: 'uint256', type: 'uint256' },
          { name: 'idle1', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'hub',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'index',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner_', internalType: 'address', type: 'address' },
      { name: 'hub_', internalType: 'address', type: 'address' },
      { name: 'index_', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'isManager',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'data', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    name: 'multicall',
    outputs: [{ name: 'results', internalType: 'bytes[]', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'orderKey', internalType: 'bytes32', type: 'bytes32' },
      { name: 'isToken0', internalType: 'bool', type: 'bool' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'payout',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'agent', internalType: 'address', type: 'address' },
      { name: 'accessExpiresAt', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setAgent',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'weth', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawNative',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'weth', internalType: 'address', type: 'address' }],
    name: 'wrapNative',
    outputs: [],
    stateMutability: 'payable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHub = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"adapters"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubAdapters = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'adapters',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"getOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubGetOrder = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'getOrder',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"getOrderByIndex"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubGetOrderByIndex = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'getOrderByIndex',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"getOrderKey"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubGetOrderKey = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'getOrderKey',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"getOrderState"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubGetOrderState = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'getOrderState',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"hubConfig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubHubConfig = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'hubConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"isOrderClosed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubIsOrderClosed = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'isOrderClosed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"orders"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubOrders = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'orders',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubOwner = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"predictVault"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubPredictVault = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'predictVault',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"previewClose"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubPreviewClose = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'previewClose',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"previewOpen"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubPreviewOpen = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'previewOpen',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"previewRerange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubPreviewRerange = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'previewRerange',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"vaultImplementation"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubVaultImplementation =
  /*#__PURE__*/ createReadContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'vaultImplementation',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"vaultOrderCount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubVaultOrderCount = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'vaultOrderCount',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"vaults"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const readRerangeHubVaults = /*#__PURE__*/ createReadContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'vaults',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHub = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"batchRerange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubBatchRerange = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'batchRerange',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"close"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubClose = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'close',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"createVault"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubCreateVault = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'createVault',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"multicall"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubMulticall = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'multicall',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"open"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubOpen = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'open',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"open2"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubOpen2 = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'open2',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"rerange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubRerange = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'rerange',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"setAdapterAllowed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubSetAdapterAllowed =
  /*#__PURE__*/ createWriteContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'setAdapterAllowed',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"setConfig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubSetConfig = /*#__PURE__*/ createWriteContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'setConfig',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const writeRerangeHubTransferOwnership =
  /*#__PURE__*/ createWriteContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHub = /*#__PURE__*/ createSimulateContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"batchRerange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubBatchRerange =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'batchRerange',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"close"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubClose = /*#__PURE__*/ createSimulateContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'close',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"createVault"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubCreateVault =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'createVault',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"multicall"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubMulticall = /*#__PURE__*/ createSimulateContract(
  { abi: rerangeHubAbi, address: rerangeHubAddress, functionName: 'multicall' },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"open"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubOpen = /*#__PURE__*/ createSimulateContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'open',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"open2"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubOpen2 = /*#__PURE__*/ createSimulateContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'open2',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"rerange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubRerange = /*#__PURE__*/ createSimulateContract({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
  functionName: 'rerange',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"setAdapterAllowed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubSetAdapterAllowed =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'setAdapterAllowed',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"setConfig"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubSetConfig = /*#__PURE__*/ createSimulateContract(
  { abi: rerangeHubAbi, address: rerangeHubAddress, functionName: 'setConfig' },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeHubAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const simulateRerangeHubTransferOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: rerangeHubAbi,
  address: rerangeHubAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"AdapterAllowedUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubAdapterAllowedUpdatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'AdapterAllowedUpdated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"HubConfigUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubHubConfigUpdatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'HubConfigUpdated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"OrderClosed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubOrderClosedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'OrderClosed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"OrderOpened"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubOrderOpenedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'OrderOpened',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"OrderReranged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubOrderRerangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'OrderReranged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeHubAbi}__ and `eventName` set to `"VaultCreated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x8880b95E1a056d537FA7469D1a26C3875e85f0e7)
 */
export const watchRerangeHubVaultCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeHubAbi,
    address: rerangeHubAddress,
    eventName: 'VaultCreated',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__
 */
export const readRerangeVault = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"agents"`
 */
export const readRerangeVaultAgents = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
  functionName: 'agents',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"getOrder"`
 */
export const readRerangeVaultGetOrder = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
  functionName: 'getOrder',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"hub"`
 */
export const readRerangeVaultHub = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
  functionName: 'hub',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"index"`
 */
export const readRerangeVaultIndex = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
  functionName: 'index',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"isManager"`
 */
export const readRerangeVaultIsManager = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
  functionName: 'isManager',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"onERC721Received"`
 */
export const readRerangeVaultOnErc721Received =
  /*#__PURE__*/ createReadContract({
    abi: rerangeVaultAbi,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"owner"`
 */
export const readRerangeVaultOwner = /*#__PURE__*/ createReadContract({
  abi: rerangeVaultAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__
 */
export const writeRerangeVault = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"call"`
 */
export const writeRerangeVaultCall = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'call',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"execute"`
 */
export const writeRerangeVaultExecute = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'execute',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"initialize"`
 */
export const writeRerangeVaultInitialize = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"multicall"`
 */
export const writeRerangeVaultMulticall = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'multicall',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"payout"`
 */
export const writeRerangeVaultPayout = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'payout',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"setAgent"`
 */
export const writeRerangeVaultSetAgent = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'setAgent',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"withdraw"`
 */
export const writeRerangeVaultWithdraw = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"withdrawNative"`
 */
export const writeRerangeVaultWithdrawNative =
  /*#__PURE__*/ createWriteContract({
    abi: rerangeVaultAbi,
    functionName: 'withdrawNative',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"wrapNative"`
 */
export const writeRerangeVaultWrapNative = /*#__PURE__*/ createWriteContract({
  abi: rerangeVaultAbi,
  functionName: 'wrapNative',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__
 */
export const simulateRerangeVault = /*#__PURE__*/ createSimulateContract({
  abi: rerangeVaultAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"call"`
 */
export const simulateRerangeVaultCall = /*#__PURE__*/ createSimulateContract({
  abi: rerangeVaultAbi,
  functionName: 'call',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"execute"`
 */
export const simulateRerangeVaultExecute = /*#__PURE__*/ createSimulateContract(
  { abi: rerangeVaultAbi, functionName: 'execute' },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"initialize"`
 */
export const simulateRerangeVaultInitialize =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeVaultAbi,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"multicall"`
 */
export const simulateRerangeVaultMulticall =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeVaultAbi,
    functionName: 'multicall',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"payout"`
 */
export const simulateRerangeVaultPayout = /*#__PURE__*/ createSimulateContract({
  abi: rerangeVaultAbi,
  functionName: 'payout',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"setAgent"`
 */
export const simulateRerangeVaultSetAgent =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeVaultAbi,
    functionName: 'setAgent',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"withdraw"`
 */
export const simulateRerangeVaultWithdraw =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeVaultAbi,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"withdrawNative"`
 */
export const simulateRerangeVaultWithdrawNative =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeVaultAbi,
    functionName: 'withdrawNative',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link rerangeVaultAbi}__ and `functionName` set to `"wrapNative"`
 */
export const simulateRerangeVaultWrapNative =
  /*#__PURE__*/ createSimulateContract({
    abi: rerangeVaultAbi,
    functionName: 'wrapNative',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeVaultAbi}__
 */
export const watchRerangeVaultEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: rerangeVaultAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeVaultAbi}__ and `eventName` set to `"AgentUpdated"`
 */
export const watchRerangeVaultAgentUpdatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeVaultAbi,
    eventName: 'AgentUpdated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeVaultAbi}__ and `eventName` set to `"CallExecuted"`
 */
export const watchRerangeVaultCallExecutedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeVaultAbi,
    eventName: 'CallExecuted',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeVaultAbi}__ and `eventName` set to `"OrderExecuted"`
 */
export const watchRerangeVaultOrderExecutedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeVaultAbi,
    eventName: 'OrderExecuted',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeVaultAbi}__ and `eventName` set to `"TokenPayout"`
 */
export const watchRerangeVaultTokenPayoutEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeVaultAbi,
    eventName: 'TokenPayout',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link rerangeVaultAbi}__ and `eventName` set to `"TokenWithdraw"`
 */
export const watchRerangeVaultTokenWithdrawEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: rerangeVaultAbi,
    eventName: 'TokenWithdraw',
  })
