# Viem & Paymaster: A Minimal Example

This repository provides a concise example to highlight the challenges faced when integrating paymasters with `viem`. While `ethers.js` has supported paymasters (as discussed [here](https://github.com/ethers-io/ethers.js/issues/1761) and completed [here](https://github.com/ethers-io/ethers.js/commit/68095a48ae19ed06cbcf2f415f1fcbda90d4b2ae)), we should be advocating for similar improvements to be made in the `viem` framework.

## Comparing Ethers.js and Viem

In `ethers.js`, using paymasters is used similarly as:

```javascript
const tx = await contract.myFunction(
    ...args,    // regular arguments for the contract method
    {
        gasLimit: 30000,    // standard override
        custom: { customField: "abacaba" }  // custom override
    }
);
```

While the desired implementation in `viem` would ideally look like this:

```javascript
const data = await walletClient.writeContract({
      address: "0xbe9bcf56654fd81a921b6Bd07965Dd67Afbb0B69",
      abi: ContractArtifact.abi,
      functionName: "setGreeting",
      account,
      args: ["Hello World!"],
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      },
      gasPrice: gasPrice,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: parseGwei("0"),
      gasLimit: gasLimit,
});
```

## Getting Started

### Prerequisites

Ensure you have `yarn` installed.

### Installation

Install the required dependencies:

```bash
yarn install
```

### Execution

Run the main script:

```bash
node index.js
```

**Note:** There's no requirement to compile or deploy contracts for this example. The script utilizes contracts previously deployed on the zkSync Era testnet.

## Debugging 

For improved debugging I suggest using a local copy of viem so you may add console logs etc. For example,

```
"dependencies": {
    "viem": "file:<PATH TO LOCAL COPY>",
    "vite": "^4.4.9"
  }
```