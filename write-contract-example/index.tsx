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
} from "viem";
import { zkSyncTestnet } from "viem/chains";
import "viem/window";
import { greeterContract } from "./greeter-contract";
import { gaslessPaymasterContract } from "./paymaster-contract";
import { utils } from "zksync-web3";

// create clients
const publicClient = createPublicClient({
  chain: zkSyncTestnet,
  transport: http(),
});
// explore custom transport?
const walletClient = createWalletClient({
  chain: zkSyncTestnet,
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
  };

  // setGreeting message using paymaster
  // does not work as intended
  const setGreetingWithPaymaster = async () => {
    console.log("GASLESS PAYMASTER ADDRESS::: ", gaslessPaymasterContract.address);

    const balanceBefore = await publicClient.getBalance({ 
      address: '0x42baB21bB7c1E236D67B264685E28fbbeF49C19F',
    })
    console.log("BALANCE BEFORE::: ", balanceBefore);

    const beforeWrite = await publicClient.readContract({
      ...greeterContract,
      functionName: "greet",
    });
    console.log("GREET beforeWrite::: ", beforeWrite);

    const params = await usePaymasterHelper();

    if (!account) return;
    const { request } = await publicClient.simulateContract({
      ...greeterContract,
      functionName: "setGreeting",
      args: ["Friends"],
      ...params,
      account,
    });
    const hash = await walletClient.writeContract(request);
    setHash(hash);

    const balanceAfter = await publicClient.getBalance({ 
      address: '0x42baB21bB7c1E236D67B264685E28fbbeF49C19F',
    })
    // Using paymaster the balance should remain the same
    console.log("BALANCE AFTER::: ", balanceAfter);
  };

  const usePaymasterHelper = async () => {
    const gasPrice = await publicClient.getGasPrice();

    const paymasterParams = utils.getPaymasterParams(
      gaslessPaymasterContract.address,
      {
        type: "General",
        innerInput: new Uint8Array(),
      }
    );

    return {
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: paymasterParams,
      },
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
        <button onClick={setGreetingWithPaymaster}>SetGreeting</button>
        {receipt && (
          <>
            <div>
              Receipt:{" "}
              <pre>
                <code>{stringify(receipt, null, 2)}</code>
              </pre>
            </div>
          </>
        )}
        <button onClick={readGreet}>Greet</button>
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
