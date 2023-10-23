# Viem & Paymaster: A Minimal Example

This repository is a proof-of-concept on how to use Viem to interact with ZkSync chain.

Currenlty Viem doesn't support EIP 712 Meta signing, so more complex code need to be written to use Viem 
and ZkSync.

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
});
```

## Getting Started

### Prerequisites

1. Ensure you have `bun` and `yarn` or `pnpm` installed.

1. Download `support_zksync` branch from https://github.com/eigerco/viem.

1. Link with `bun link`, this will allow the example to use this code.
Go to the `src/chains` and run again `bun link`. This will contain 
the `ZkSyncLocalnet` for local testing.

1. Deploy `Greeter` and `GaslessPaymaster` contract in you local env. Update the 
contract address in `write-contract-example` folder: `greeter-contract.ts` and `paymaster-contract.ts`.

### Run example

1. Change directories:

```bash
cd write-contract-example 
```

2. Install the required dependencies:

```bash
pnpm install
```

3. Link updated `viem` and `viem/chains` dependencies from `eiger/viem`

```bash
bun link viem_zksync
bun link viem_zksync_chain
```

4. Run development server:

```bash
pnpm dev
```

5. Go to `http://localhost:5173` and click in `Connect wallet` and then `Read Greet`. It should read the current greet, then you can set greeting with paymaster. Then click on `Set greeting with paymaster longer version` and 
sign the transaction. After that click `Read Greet` and should display `Hi David4`.

## Debugging 

It can help get the https://github.com/matter-labs/paymaster-examples to check the expected behaviour.