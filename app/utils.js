import axios from "axios";
import { ethers } from "ethers";

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
        trades(orderBy: blockTimestamp, orderDirection: desc, first: 100, where: {subject: "${addr}"}) {
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

export const rpcUrl = 'https://base.publicnode.com';
export const httpProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

export function formatCurrentDate(date) {
  var month = date.getMonth() + 1; // 获取月份并加 1
  var day = date.getDate(); // 获取日期
  var hours = date.getHours(); // 获取小时
  var minutes = date.getMinutes(); // 获取分钟

  // 如果月份、日期、小时或分钟的值小于 10，则在前面添加一个 '0'
  month = (month < 10 ? "0" : "") + month;
  day = (day < 10 ? "0" : "") + day;
  hours = (hours < 10 ? "0" : "") + hours;
  minutes = (minutes < 10 ? "0" : "") + minutes;

  return month + "-" + day + " " + hours + ":" + minutes;
}

let cache = {};

export async function getTwitterByAddress(address) {
  // Check if the data for the address is in the cache
  if (cache[address]) {
    return cache[address];
  }
  // If not in the cache, fetch twitter by address from api 
  let ret = await axios.get('/api/twitter?address=' + address);
  // Store the data in the cache
  cache[address] = ret.data;
  return ret.data;
}


export function toShortAddress(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}