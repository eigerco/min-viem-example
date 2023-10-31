import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  http,
  Address,
  Hash,
  TransactionReceipt,
  createPublicClient,
  createWalletClient,
  custom,
  stringify,
//} from "viem"
} from "viem_zksync";
// This is needed because `viem_zksync/chains` doesn't work
import { zkSyncTestnet } from "viem_zksync_chains";
import "viem/window";
import { greeterContract } from "./greeter-contract";
import { gaslessPaymasterContract } from "./paymaster-contract";
import { utils } from "zksync-web3";

// This way we can the serializers without defining a new chain in Viem.
/*const zkSyncLocalnet = {
  ...zkSyncTestnet,
  id: 270,
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:3050'],
      webSocket: ['ws://127.0.0.1:3051/ws'],
    },
    public: {
      http: ['http://127.0.0.1:3050'],
      webSocket: ['ws://127.0.0.1:3051/ws'],
    },
  },
}*/

const chain = zkSyncTestnet // zkSyncLocalnet

console.log(zkSyncTestnet)
// create clients
const publicClient = createPublicClient({
  chain: chain,
  transport: http(),
});
// explore custom transport?
const walletClient = createWalletClient({
  chain: chain,
  transport: custom(window.ethereum),
});

function Example() {
  const [account, setAccount] = useState<Address>();
  const [hash, setHash] = useState<Hash>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [greet, setGreet] = useState<string>();

  const connect = async () => {
    const [address] = await walletClient.requestAddresses();
    setAccount(address);
    console.log("SetAccount: " + address)
  };

  // setGreeting message without using paymaster
  // works as intended
  const setGreeting = async () => {
    const gasPrice = await publicClient.getGasPrice();

    const beforeWrite = await publicClient.readContract({
      ...greeterContract,
      functionName: "greet",
    });
    console.log("GREET beforeWrite::: ", beforeWrite);

    if (!account) return;
    const { request } = await publicClient.simulateContract({
      ...greeterContract,
      functionName: "setGreeting",
      args: ["Viem is awesome!"],
      account,
      gasPrice: gasPrice,
    });
    // Change message
    const hash = await walletClient.writeContract(request);
    setHash(hash);
    console.log(`Hash: ${hash}`)
  };

  // setGreeting message using paymaster
  // does not work as intended
  const setGreetingWithPaymaster = async () => {
    const user_address = window.web3.currentProvider.selectedAddress;
    console.log("GASLESS PAYMASTER ADDRESS::: ", gaslessPaymasterContract.address);

    const balanceBefore = await publicClient.getBalance({ 
      address: user_address,
    })
    console.log("BALANCE BEFORE::: ", balanceBefore);

    const beforeWrite = await publicClient.readContract({
      ...greeterContract,
      functionName: "greet",
    });
    console.log("GREET beforeWrite::: ", beforeWrite);

    const params = await usePaymasterHelper();

    if (!account) return;

    // TODO: This is not using the right type (eip712 / 113 / 0x71)
    console.log('simulateContract')
    const { request } = await publicClient.simulateContract({
      ...greeterContract,
      functionName: "setGreeting",
      args: ["Viem ZkSync works!"],
      maxFeePerGas: 250000000n,
      maxPriorityFeePerGas: 0n,
      type: 'eip712',
      ...params,
      account,
    });

    console.log(request)

    // This doesn't work because Viem it not aware of EIP712 Meta signer. 
    // EtherJS works because zksync-web3 provides this logic.
    console.log("APP - writeContract")
    const hash = await walletClient.writeContract(request);
    console.log("Hash: " + hash)
    setHash(hash);

    const balanceAfter = await publicClient.getBalance({ 
      address: user_address,
    })
    // Using paymaster the balance should remain the same
    console.log("BALANCE AFTER::: ", balanceAfter);
  };

  /*
  This longer version show Viem support for ZkSync chain, although that a 
  simple one simple multiple steps need to be done in the client side.

  For the simple example (above) to work, EIP712 signing need to be add to
  Viem, and specifically add the EIP712Meta for ZkSync chain.
  */
  const setGreetingWithPaymasterLongerVersion = async () => {
    const user_address = window.web3.currentProvider.selectedAddress;
    console.log("GASLESS PAYMASTER ADDRESS::: ", gaslessPaymasterContract.address);

    const balanceBefore = await publicClient.getBalance({ 
      address: user_address,
    })
    console.log("BALANCE BEFORE::: ", balanceBefore);

    const beforeWrite = await publicClient.readContract({
      ...greeterContract,
      functionName: "greet",
    });
    console.log("GREET beforeWrite::: ", beforeWrite);

    const params = await usePaymasterHelper();

    if (!account) return;
    
    // 'Hi David4' string
    const transaction_data = '0xa4136862000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000094869204461766964370000000000000000000000000000000000000000000000' as `0x${string}`

    // Step Version of making a transaction for debug stuff.

    // Calculate the Nonce 
    // Calculate the gasLimit (gas?)
    console.log('prepareTransactionRequest')
    const prepareTransactionRequest = await publicClient.prepareTransactionRequest({
      account: account,
      to: greeterContract.address,
      maxFeePerGas: 250000000n,
      maxPriorityFeePerGas: 0n,
      gasPerPubdata: params.gasPerPubdata,
      data: transaction_data,
      paymaster: params.paymaster,
      paymasterInput: params.paymasterInput
    })

    console.log(prepareTransactionRequest)
    //
    // Sign transaction, generate CustomSignature
    //
    
    const transactionToSign = {
      txType: 113n,
      from: BigInt(account),
      to: prepareTransactionRequest.to ? BigInt(prepareTransactionRequest.to) : 0n,
      gasLimit: prepareTransactionRequest.gas ? BigInt(prepareTransactionRequest.gas) : 0n,
      gasPerPubdataByteLimit: 50000n,
      maxFeePerGas: prepareTransactionRequest.maxFeePerGas ?? 0n,
      maxPriorityFeePerGas: 0n,
      paymaster: BigInt(params.paymaster),
      nonce: prepareTransactionRequest.nonce ? BigInt(prepareTransactionRequest.nonce) : 0n,
      value: 0n,
      data: transaction_data,
      factoryDeps: [],
      paymasterInput: params.paymasterInput
    }
    console.log(transactionToSign)

    console.log("signTypedData")
    const customSignature = await walletClient.signTypedData({
      account, 
      domain: {
        name: 'zkSync',
        version: '2',
        chainId: chain.id
      },
      types: {
        Transaction: [
          { name: 'txType', type: 'uint256' },
          { name: 'from', type: 'uint256' },
          { name: 'to', type: 'uint256' },
          { name: 'gasLimit', type: 'uint256' },
          { name: 'gasPerPubdataByteLimit', type: 'uint256' },
          { name: 'maxFeePerGas', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', type: 'uint256' },
          { name: 'paymaster', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'factoryDeps', type: 'bytes32[]' },
          { name: 'paymasterInput', type: 'bytes' }
        ],
      },
      primaryType: 'Transaction',
      message: transactionToSign,
    })

    console.log(customSignature)
    console.log("signTransaction")
    const signTransaction = await walletClient.signTransaction({...prepareTransactionRequest, customSignature: customSignature})
    console.log(signTransaction)

    console.log("sendRawTransaction")
    const transaction_hash = await walletClient.sendRawTransaction({serializedTransaction: signTransaction})
    console.log("hash")
    console.log(transaction_hash)
    setHash(transaction_hash)

    const balanceAfter = await publicClient.getBalance({ 
      address: user_address,
    })
    // Using paymaster the balance should remain the same
    console.log("BALANCE AFTER::: ", balanceAfter);
  };

  const usePaymasterHelper = async () => {
    const paymasterParams = utils.getPaymasterParams(
      gaslessPaymasterContract.address,
      {
        type: "General",
        innerInput: new Uint8Array(),
      }
    );

    console.log('paymasterParams')
    console.log(paymasterParams)

    return {
      gasPerPubdata: BigInt(utils.DEFAULT_GAS_PER_PUBDATA_LIMIT),
      paymaster: paymasterParams.paymaster as `0x${string}`,
      paymasterInput: paymasterParams.paymasterInput as `0x${string}`
    }
  };

  const readGreet = async () => {
    const value = await publicClient.readContract({
      ...greeterContract,
      functionName: "greet",
    });
    setGreet(value);
  };

  useEffect(() => {
    (async () => {
      if (hash) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setReceipt(receipt);
      }
    })();
  }, [hash, publicClient]);

  if (account)
    return (
      <>
        <div>Connected: {account}</div>
        <button onClick={setGreetingWithPaymaster}>Set greeting with paymaster (writeContract)</button>
        <button onClick={setGreeting}>Set greeting</button>
        <button onClick={readGreet}>Read Greet</button>
        
        {greet && (
          <>
            <div>
              Message:{" "}
              <pre>
                <code>{stringify(greet, null, 2)}</code>
              </pre>
            </div>
          </>
        )}

      </>
    );
  return <button onClick={connect}>Connect Wallet</button>;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Example />
);
