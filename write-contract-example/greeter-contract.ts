export const greeterContract = {
  address: '0x111C3E89Ce80e62EE88318C2804920D4c96f92bb',
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
