import { enableFetchMocks, FetchMock } from "jest-fetch-mock";

enableFetchMocks();

import { ChainId } from "../types";
import {
  denominateAs,
  fetchFromGraphQL,
  fetchFromIPFS,
  getChainVerbose,
  getGraphQLEndpoint,
  getPriceForToken,
  getStartAndEndTokenPrices,
} from "../utils";

const fetchMock = fetch as FetchMock;

describe("getGraphQLEndpoint", () => {
  it("returns the right graphQL endpoint based on chainID", () => {
    expect(getGraphQLEndpoint(ChainId.OPTIMISM_MAINNET)).toEqual(
      "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-optimism-mainnet"
    );

    expect(getGraphQLEndpoint(ChainId.FANTOM_MAINNET)).toEqual(
      "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-fantom-mainnet"
    );

    expect(getGraphQLEndpoint(ChainId.FANTOM_TESTNET)).toEqual(
      "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-fantom-testnet"
    );

    expect(getGraphQLEndpoint(ChainId.GOERLI)).toEqual(
      "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-goerli-testnet"
    );
  });

  it("returns the default graphQL endpoint for invalid chainID", () => {
    expect(getGraphQLEndpoint("999" as ChainId)).toEqual(
      "https://api.thegraph.com/subgraphs/name/thelostone-mc/round-labs"
    );
  });
});

describe("getChainVerbose", () => {
  it("returns the right chain name chainID", () => {
    expect(getChainVerbose(ChainId.OPTIMISM_MAINNET)).toEqual(
      "OPTIMISM_MAINNET"
    );
    expect(getChainVerbose(ChainId.FANTOM_MAINNET)).toEqual("FANTOM_MAINNET");
    expect(getChainVerbose(ChainId.FANTOM_TESTNET)).toEqual("FANTOM_TESTNET");
    expect(getChainVerbose(ChainId.GOERLI)).toEqual("GOERLI");
  });

  it("returns the default chain name for invalid chainID", () => {
    expect(getChainVerbose("999" as ChainId)).toEqual("LOCAL_ROUND_LAB");
  });
});

describe("fetchFromIPFS", () => {
  const REACT_APP_PINATA_GATEWAY = "gitcoin.mypinata.cloud";

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return data from IPFS", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ name: "My First Metadata" }));

    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4";

    const res = await fetchFromIPFS(cid);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://${REACT_APP_PINATA_GATEWAY}/ipfs/${cid}`
    );
    expect(res).toEqual({ name: "My First Metadata" });
  });

  it("should throw on invalid CID", async () => {
    const cid = "invalidcid";

    fetchMock.mockResponseOnce("", {
      status: 404,
    });

    await expect(fetchFromIPFS(cid)).rejects.toHaveProperty("status", 404);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://${REACT_APP_PINATA_GATEWAY}/ipfs/${cid}`
    );
  });
});

describe("fetchFromGraphQL", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should return data from a graphql endpoint", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {
          programs: [
            { id: "0x123456789544fe81379e2951623f008d200e1d18" },
            { id: "0x123456789567fe81379e2951623f008d200e1d20" },
          ],
        },
      })
    );

    const query = `
      programs {
        id
      }
    `;

    const res = await fetchFromGraphQL(ChainId.GOERLI, query);

    const params = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {},
      }),
    };

    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.REACT_APP_SUBGRAPH_GOERLI_API}`,
      params
    );
    expect(res.data.programs[0]).toEqual({
      id: "0x123456789544fe81379e2951623f008d200e1d18",
    });
  });

  it("should reject on non-200 status code", async () => {
    fetchMock.mockResponseOnce("", {
      status: 400,
    });

    const query = `
      programs {
        id
      }
    `;

    await expect(
      fetchFromGraphQL(ChainId.GOERLI, query)
    ).rejects.toHaveProperty("status", 400);

    const params = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {},
      }),
    };

    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.REACT_APP_SUBGRAPH_GOERLI_API}`,
      params
    );
  });

  it("should fetch data from the correct graphql endpoint for optimism network", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {},
      })
    );

    await fetchFromGraphQL(ChainId.OPTIMISM_MAINNET, `programs { id }`);

    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.REACT_APP_SUBGRAPH_OPTIMISM_MAINNET_API}`,
      expect.anything()
    );
  });
});

describe("fetch prices for token", function () {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should fetch prices for a certain token on a chain", async function () {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        market_data: {
          current_price: "123.0",
        },
      })
    );

    await getPriceForToken(
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "ethereum"
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/0x6b175474e89094c44da98b954eedeac495271d0f`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
  });
});

describe("fetchRoundMetadata", () => {
  // TODO:
});

describe("handleResponse", () => {
  // TODO:
});

describe("getStartAndEndTokenPrices", () => {
  it("should fetch start and end token price", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        prices: [
          [1622567980899, 0.9954632411776787],
          [1622570866727, 1.0037974623619168],
          [1622574275142, 1.0022713676604735],
        ],
        market_caps: [
          [1622567980899, 22561032089.438694],
          [1622570866727, 22759226878.52222],
          [1622574275142, 22772493358.633835],
        ],
        total_volumes: [
          [1622567980899, 2645486073.0251384],
          [1622570866727, 2636577392.7841797],
          [1622574275142, 2776326393.6250405],
        ],
      })
    );
    const { startPrice, endPrice } = await getStartAndEndTokenPrices(
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ChainId.MAINNET,
      1622567232,
      1622577232
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.coingecko.com/api/v3/coins/ethereum/contract/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/market_chart/range?vs_currency=usd&from=1622567232&to=1622577232",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    expect(startPrice).toEqual(0.9954632411776787);
    expect(endPrice).toEqual(1.0022713676604735);
  });
});

describe("denominateAs", () => {
  it("should convert an amount of one token to another", async () => {
    // in this case, test usdc to usdc 1:1 conversion
    const token = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const amount = 69;
    const convertedAmount = await denominateAs(
      token,
      token,
      amount,
      1612577232,
      1622577232,
      ChainId.MAINNET
    );
    expect(convertedAmount.amount).toEqual(69);
  });

  it("should not convert if the chain is not supported", async () => {
    const token = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const amount = 69;
    const convertedAmount = await denominateAs(
      token,
      token,
      amount,
      0,
      0,
      ChainId.FANTOM_TESTNET
    );
    expect(convertedAmount.amount).toEqual(amount);
  });

  it("should return the same amount if token contract is not available on the selected chain", async () => {
    const token = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const amount = 69;
    const convertedAmount = await denominateAs(
      token,
      token,
      amount,
      0,
      0,
      ChainId.OPTIMISM_MAINNET
    );
    expect(convertedAmount.amount).toEqual(amount);
  });
});
