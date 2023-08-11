import { createPublicClient, http, createWalletClient, custom } from "viem";
import { zkSyncTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { utils } from "zksync-web3";
import ContractArtifact from "./artifacts-zk/contracts/Greeter.sol/Greeter.json" assert { type: "json" };
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
const TESTNET_GREETER_CONTRACT = "0xbe9bcf56654fd81a921b6Bd07965Dd67Afbb0B69";
const GASLESS_TESTNET_PAYMASTER = "0xFD9aE5ebB0F6656f4b77a0E99dCbc5138d54b0BA";

const client = createPublicClient({
  chain: zkSyncTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: zkSyncTestnet,
  transport: http(),
});

// Priv key account from .env file
const account = privateKeyToAccount(PRIVATE_KEY);

// Sanity check to make sure we can connect to the testnet
const fetchBlockNumber = async () => {
  const blockNumber = await client.getBlockNumber();
  console.log("Current block number:", blockNumber);
};

fetchBlockNumber();

// Read contract using viem
const readContract = async () => {
  const data = await client.readContract({
    address: TESTNET_GREETER_CONTRACT,
    abi: ContractArtifact.abi,
    functionName: "greet",
    account,
  });

  console.log("readContract data:", data);
};

readContract();

// Write contract without paymaster using viem
const writeContractWithoutPaymaster = async () => {
  const gas = await client.estimateContractGas({
    address: TESTNET_GREETER_CONTRACT,
    abi: ContractArtifact.abi,
    functionName: "setGreeting",
    account,
    args: ["Hello World!"],
  });

  console.log("gas:", gas);

  const data = await walletClient.writeContract({
    address: TESTNET_GREETER_CONTRACT,
    abi: ContractArtifact.abi,
    functionName: "setGreeting",
    account,
    args: ["Hello World!"],
  });
  console.log("writeContract data:", data);

  const readData = await client.readContract({
    address: TESTNET_GREETER_CONTRACT,
    abi: ContractArtifact.abi,
    functionName: "greet",
    account,
  });
  console.log("readContract data:", readData);
};

writeContractWithoutPaymaster();

// Note: this does not work
// Write contract with paymaster using viem
const writeContractWithPaymaster = async () => {
  try {
    const gasPrice = await client.getGasPrice();

    const paymasterParams = utils.getPaymasterParams(GASLESS_TESTNET_PAYMASTER, {
      type: "General",
      innerInput: new Uint8Array(),
    });

    const gasLimit = await client.estimateContractGas({
      address: TESTNET_GREETER_CONTRACT,
      abi: ContractArtifact.abi,
      functionName: "setGreeting",
      account,
      args: [
        "Hello World!",
        {
          customData: {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            paymasterParams: paymasterParams,
          },
        },
      ],
    });

    console.log("gas:", gasLimit);

    const data = await walletClient.writeContract({
      address: "0xbe9bcf56654fd81a921b6Bd07965Dd67Afbb0B69",
      abi: ContractArtifact.abi,
      functionName: "setGreeting",
      account,
      args: ["Hello World!"]
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      },
      gasPrice: gasPrice,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: parseGwei("0"),
      gasLimit: gasLimit,
    });
    console.log("writeContractWithPaymaster data:", data);
  } catch (e) {
    console.log("writeContractWithPaymaster error:", e);
  }
};

writeContractWithPaymaster();
