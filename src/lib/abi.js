// ABI for ConfessionWall.sol — matches the deployed contract exactly
export const CONFESSION_WALL_ABI = [
  {
    type: 'function',
    name: 'confess',
    inputs: [{ name: '_text', type: 'string', internalType: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'total',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getConfessions',
    inputs: [
      { name: 'startIndex', type: 'uint256', internalType: 'uint256' },
      { name: 'limit',      type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct ConfessionWall.Confession[]',
        components: [
          { name: 'id',        type: 'uint256', internalType: 'uint256' },
          { name: 'author',    type: 'address', internalType: 'address' },
          { name: 'text',      type: 'string',  internalType: 'string'  },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRange',
    inputs: [
      { name: 'start', type: 'uint256', internalType: 'uint256' },
      { name: 'count', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct ConfessionWall.Confession[]',
        components: [
          { name: 'id', type: 'uint256', internalType: 'uint256' },
          { name: 'author', type: 'address', internalType: 'address' },
          { name: 'text', type: 'string', internalType: 'string' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_LENGTH',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'NewConfession',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'author', type: 'address', indexed: true, internalType: 'address' },
      { name: 'text', type: 'string', indexed: false, internalType: 'string' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
]
