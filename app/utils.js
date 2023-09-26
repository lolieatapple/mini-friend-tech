import axios from "axios";

export async function subgraphGet(name, page, addr = "") {
  // 定义查询URL
  const url = "https://api.studio.thegraph.com/query/20058/friend-tech/v0.0.1";

  let query = "";
  switch (name) {
    case "history":
      query = `
      {
        trades(orderBy: blockNumber, orderDirection: desc, first: 300, skip: ${
          page * 50
        }) {
          id
          trader
          subject
          isBuy
          ethAmount
          blockTimestamp
          transactionHash
          supply
        }
      }
      `;
      break;
    case "top":
      query = `
      {
        trades(
          orderBy: ethAmount,
          orderDirection: desc,
          first: 100,
          where: {blockTimestamp_gte: ${parseInt((Date.now()/1000 - 3600*24).toString())}}
        ) {
          id
          subject
          ethAmount
          blockTimestamp
        }
      }
      `;
      break;
    case "newers":
      query = `
      {
        trades(orderBy: blockTimestamp, orderDirection: desc, first: 10, where: {ethAmount: "0"}) {
          id
          trader
          subject
          isBuy
          ethAmount
          blockTimestamp
          transactionHash
        }
      }
      `;
      break;
    case "chart":
      query = `
      {
        trades(orderBy: blockTimestamp, orderDirection: desc, first: 50, where: {subject: "${addr}"}) {
          ethAmount
          blockTimestamp
        }
      }
      `;
      break;
    default:
      break;
  }
  // 定义查询字符串

  // 使用axios.post发送查询
  return await axios.post(url, { query });
}
