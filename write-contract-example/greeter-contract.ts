export const greeterContract = {
  address: '0xbe9bcf56654fd81a921b6Bd07965Dd67Afbb0B69',
  abi: [
    {
      inputs: [
        {
          internalType: "string",
          name: "_greeting",
          type: "string"
        }
      ],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [],
      name: "greet",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_greeting",
          type: "string"
        }
      ],
      name: "setGreeting",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }    
  ],
} as const
