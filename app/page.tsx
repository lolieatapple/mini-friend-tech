"use client";

import React, { useEffect, useState, useRef } from "react";
import { useMediaQuery } from "react-responsive";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { ethers } from "ethers";
import { SC_ABIS, SC_ADDR } from "./config";
import Script from 'next/script';

// 示例数据
const data = [
  { name: "Jan", price: 4.0 },
  { name: "Feb", price: 3.0 },
  { name: "Mar", price: 2.0 },
  { name: "Apr", price: 2.78 },
  { name: "May", price: 1.89 },
  { name: "Jun", price: 2.39 },
  { name: "Jul", price: 3.49 },
];

// Header Component
const Header = (props: any) => {
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");

  const onSearch = async () => {
    if (!ethers.utils.isAddress(search)) {
      alert("Please input a valid address");
      return;
    }
    props.setChartLoading(true);
    const ret = await subgraphGet("chart", 0, search);
    console.log("chart", ret.data.data.trades);
    props.setChart(ret.data.data.trades);
    props.setSelected(search);
    props.setChartLoading(false);
  };

  useEffect(() => {
    if (ethers.utils.isAddress(search)) {
      onSearch();
    }
  }, [search]);

  return (
    <div className="flex flex-wrap justify-between items-center p-4 bg-blue-500 text-white">
      <div className="flex items-center mb-2 md:mb-0">
        <img src="logo.png" alt="Logo" className="h-8 w-8 mr-2" />
        <span>Friend.tech Analytics</span>
      </div>

      {/* 添加搜索框和搜索按钮 */}
      <div className="flex items-center w-full md:w-auto mb-2 md:mb-0 md:mr-4">
        <input
          type="text"
          placeholder="Search by Address"
          className="px-3 py-2 rounded-l bg-white text-blue-500 w-full md:w-auto"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <button
          className="px-4 py-2 rounded-r bg-white text-blue-500"
          onClick={onSearch}
        >
          Search
        </button>
      </div>

      <button
        className="bg-white text-blue-500 px-4 py-2 rounded w-full md:w-auto"
        onClick={async () => {
          if (!(window as any).ethereum) {
            alert("Please install MetaMask first");
            return;
          }
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          });
          setAddress(accounts[0]);
          // switch to Base mainnet
          (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x2105" }],
          });
        }}
      >
        {address
          ? address.slice(0, 6) + "..." + address.slice(-4)
          : "Connect Wallet"}
      </button>
    </div>
  );
};

// Top Users Component
const TopUsers = (props: any) => (
  <div className="p-4 border rounded shadow">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">Top 50 Users (24hrs)</h2>
      <span className="text-gray-500 text-sm self-center">
        (Click for Chart)
      </span>
    </div>
    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
      <table className="min-w-full border rounded shadow text-xs">
        <thead>
          <tr className="border-gray-300 border-b">
            <th className="p-1 text-center">Address</th>
            <th className="p-1 text-center">Price (ETH)</th>
            <th className="p-1 text-center">Operation</th>
          </tr>
        </thead>
        <tbody>
          {props.top.map((item: any, index: number) => (
            <tr
              className="h-8 border-gray-300 border-b cursor-pointer hover:bg-gray-200"
              onClick={async () => {
                props.setChartLoading(true);
                console.log("Row clicked", item.subject);
                const ret = await subgraphGet("chart", 0, item.subject);
                console.log("chart", ret.data.data.trades);
                props.setChart(ret.data.data.trades);
                props.setSelected(item.subject);
                props.setChartLoading(false);
              }}
              key={item.id}
            >
              <td className="p-1 text-center">
                {item.subject.slice(0, 6) + "..." + item.subject.slice(-4)}
                &nbsp;
                <a
                  href={`https://basescan.org/address/${item.subject}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗
                </a>
              </td>
              <td className="p-1 text-center">
                {Number((item.ethAmount / 1e18).toFixed(8))}
              </td>
              <td className="p-1 text-center">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Buy button clicked", item.subject);
                    props.setSelected(item.subject);
                    props.setShowDialog(true);
                  }}
                >
                  Buy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Price Chart Component
const PriceChart = (props: any) => {
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  return (
    <div className="p-4 border rounded shadow relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Price Chart</h2>
        <span className="text-gray-500 text-sm self-center">
          {props.selected}&nbsp;
          {props.selected && (
            <button
              className="bg-blue-500 text-white px-2 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                props.setShowDialog(true);
              }}
            >
              Buy
            </button>
          )}
        </span>
      </div>
      {props.loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            border: "16px solid #100f0f",
            borderTop: "16px solid #3498db",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 2s linear infinite",
          }}
        />
      )}
      <ResponsiveContainer width="100%" height={isMobile ? 200 : 350}>
        <LineChart
          data={
            props.chart.length > 0
              ? props.chart
                  .map((item: any) => ({
                    name: new Date(item.blockTimestamp * 1000)
                      .toLocaleString()
                      .split(",")[0]
                      .trim(),
                    price: Number((item.ethAmount / 1e18).toFixed(8)),
                  }))
                  .reverse()
              : data
          }
          margin={{
            top: 5,
            right: 10,
            left: isMobile ? 0 : 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray={isMobile ? "1 1" : "3 3"} />
          <XAxis
            dataKey="name"
            tickCount={isMobile ? 3 : undefined}
            fontSize={isMobile ? 10 : undefined}
          />
          <YAxis
            tickCount={isMobile ? 3 : undefined}
            fontSize={isMobile ? 10 : undefined}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

// Newers Component
const Newers = (props: any) => (
  <div className="p-4 border rounded shadow">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">New Users</h2>
      {/* <span className="text-gray-500 text-sm self-center">(Click for Chart)</span> */}
    </div>
    <table className="min-w-full border rounded shadow text-xs">
      <thead>
        <tr className="border-gray-300 border-b">
          <th className="p-1 text-center">Address</th>
          <th className="p-1 text-center">Operation</th>
        </tr>
      </thead>
      <tbody>
        {props.newers.map((item: any, index: number) => (
          <tr
            className="h-8 border-gray-300 border-b cursor-pointer hover:bg-gray-200"
            onClick={() => console.log("Row clicked")}
            key={item.id}
          >
            <td className="p-1 text-center">
              {item.subject.slice(0, 6) + "..." + item.subject.slice(-4)}&nbsp;
              <a
                href={`https://basescan.org/address/${item.subject}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗
              </a>
            </td>
            <td className="p-1 text-center">
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Buy button clicked");
                  props.setSelected(item.subject);
                  props.setShowDialog(true);
                }}
              >
                Buy
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Trade History Component
const TradeHistory = (props: any) => (
  <div className="p-4 border rounded shadow">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">Trade History</h2>
      <span className="text-gray-500 text-sm self-center">
        (Click address for Chart)
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded shadow text-xs md:table">
        <thead className="md:table-header-group">
          <tr className="border-gray-300 border-b">
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Owner</th>
            <th className="p-2 text-left">Trader</th>
            <th className="p-2 text-left">Price (ETH)</th>
            <th className="p-2 text-left">TxHash</th>
            <th className="p-2 text-left">Operation</th>
          </tr>
        </thead>
        <tbody>
          {props.history.map((item: any, index: number) => (
            <tr
              className={`border-gray-300 border-b md:table-row hover:bg-gray-200 ${
                item.isBuy ? "bg-green-100" : "bg-red-100"
              }`}
              key={item.id}
            >
              <td className="p-2 md:table-cell text-left">
                <div>
                  {new Date(item.blockTimestamp * 1000).toLocaleString()}
                </div>
              </td>
              <td className="p-2 md:table-cell text-left">
                <div>{item.isBuy ? "Buy" : "Sell"}</div>
              </td>
              <td
                className="p-2 md:table-cell text-left cursor-pointer"
                onClick={async () => {
                  props.setChartLoading(true);
                  console.log("Row clicked", item.subject);
                  const ret = await subgraphGet("chart", 0, item.subject);
                  console.log("chart", ret.data.data.trades);
                  props.setChart(ret.data.data.trades);
                  props.setSelected(item.subject);
                  props.setChartLoading(false);
                }}
              >
                {item.subject.slice(0, 6) + "..." + item.subject.slice(-4)}
                &nbsp;
                <a
                  href={`https://basescan.org/address/${item.subject}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗
                </a>
              </td>
              <td
                className="p-2 md:table-cell text-left cursor-pointer"
                onClick={async () => {
                  props.setChartLoading(true);
                  console.log("Row clicked", item.trader);
                  const ret = await subgraphGet("chart", 0, item.trader);
                  console.log("chart", ret.data.data.trades);
                  props.setChart(ret.data.data.trades);
                  props.setSelected(item.trader);
                  props.setChartLoading(false);
                }}
              >
                {item.trader.slice(0, 6) + "..." + item.trader.slice(-4)}
                &nbsp;
                <a
                  href={`https://basescan.org/address/${item.trader}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔗
                </a>
              </td>
              <td className="p-2 md:table-cell text-left">
                <div>{Number((item.ethAmount / 1e18).toFixed(8))}</div>
              </td>
              <td className="p-2 md:table-cell text-left">
                <a
                  href={`https://basescan.org/tx/${item.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.transactionHash.slice(0, 12) +
                    "..." +
                    item.transactionHash.slice(-8)}{" "}
                  🔗
                </a>
              </td>
              <td className="p-2 md:table-cell text-left">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => {
                    props.setSelected(item.subject);
                    props.setShowDialog(true);
                  }}
                >
                  Buy Owner
                </button>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    props.setSelected(item.trader);
                    props.setShowDialog(true);
                  }}
                >
                  Buy Trader
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const BuyDialog = (props: any) => {
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("loading...");

  useEffect(() => {
    if (ethers.utils.isAddress(props.selected)) {
      // connect wallet
      if (!(window as any).ethereum) {
        alert("Please install MetaMask first");
        return;
      }
      // switch to base mainnet
      (window as any).ethereum
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }],
        })
        .then(() => {
          // get account
          (window as any).ethereum
            .request({ method: "eth_requestAccounts" })
            .then((accounts: string[]) => {
              console.log("accounts", accounts);
              // get balance
              const provider = new ethers.providers.Web3Provider(
                (window as any).ethereum
              );
              const contract = new ethers.Contract(SC_ADDR, SC_ABIS, provider);
              console.log("call", props.selected, quantity);
              contract
                .getBuyPriceAfterFee(props.selected, quantity)
                .then((ret: any) => {
                  setPrice(Number((ret / 1e18).toFixed(8)).toString());
                })
                .catch(console.error);
            })
            .catch(console.error);
        })
        .catch(console.error);
    }
  }, [props.selected, quantity]);

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 bg-opacity-50">
      <div className="bg-white p-4 rounded">
        <h2 className="text-2xl mb-4">Buy Shares</h2>
        <p className="mb-4">Share Address: {props.selected}</p>
        <p className="mb-4">Share Price: {price} ETH</p>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="border mb-4 p-2 rounded"
        />
        <div className="flex justify-end">
          <button
            className="bg-gray-300 px-4 py-2 rounded mr-2"
            onClick={() => props.setShowDialog(false)}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={async () => {
              console.log("Confirmed", quantity);
              props.setShowDialog(false);

              if (!(window as any).ethereum) {
                alert("Please install MetaMask first");
                return;
              }

              try {
                // get accounts
                await (window as any).ethereum.request({
                  method: "eth_requestAccounts",
                });
                await (window as any).ethereum.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: "0x2105" }],
                });
                // switch to base mainnet
                // get signer
                const provider = new ethers.providers.Web3Provider(
                  (window as any).ethereum
                );
                const signer = provider.getSigner();
                // get contract
                const contract = new ethers.Contract(SC_ADDR, SC_ABIS, signer);
                console.log(
                  "price",
                  price,
                  ethers.utils.parseEther(price).toNumber()
                );
                // call buyFriend
                let tx = await contract.buyShares(props.selected, quantity, {
                  value: ethers.utils.parseEther(price),
                });
                console.log("tx", tx);
                alert("Transaction sent, please wait for confirmation");
              } catch (error) {
                console.error(error);
              }
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Home Component
const Home = () => {
  const [history, setHistory] = useState([]);
  const [top, setTop] = useState([]);
  const [newers, setNewers] = useState([]);
  const [chart, setChart] = useState([]);
  const [selected, setSelected] = useState("");
  const [chartLoading, setChartLoading] = useState(false);

  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // 定义一个获取数据的函数
    const fetchData = () => {
      // 替换为实际的subgraphGet函数调用
      subgraphGet("history", 0)
        .then((ret) => {
          console.log("flush history", ret.data.data.trades.length);
          setHistory(ret.data.data.trades);
        })
        .catch(console.error);

      subgraphGet("top", 0)
        .then((ret) => {
          console.log("flush top", ret.data.data.trades.length);
          setTop(ret.data.data.trades);
        })
        .catch(console.error);

      subgraphGet("newers", 0)
        .then((ret) => {
          console.log("flush newers", ret.data.data.trades.length);
          setNewers(ret.data.data.trades);
        })
        .catch(console.error);
    };

    // 首次渲染时立即获取数据
    fetchData();

    // 设置一个每隔10秒调用fetchData的定时器
    const intervalId = setInterval(fetchData, 10000); // 10000毫秒 = 10秒

    // 当组件卸载时，清除定时器
    return () => clearInterval(intervalId);
  }, []);
  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        setChart={setChart}
        setChartLoading={setChartLoading}
        setSelected={setSelected}
      />
      <div className="container mx-auto p-4">
        <div className="grid md:grid-cols-[1fr,2fr,1fr] gap-4 mb-4">
          <TopUsers
            top={top}
            setChart={setChart}
            setChartLoading={setChartLoading}
            setSelected={setSelected}
            setShowDialog={setShowDialog}
          />
          <PriceChart
            chart={chart}
            loading={chartLoading}
            selected={selected}
            setShowDialog={setShowDialog}
          />
          <Newers
            newers={newers}
            setShowDialog={setShowDialog}
            setSelected={setSelected}
          />
        </div>
        <TradeHistory
          history={history}
          setChartLoading={setChartLoading}
          setChart={setChart}
          setSelected={setSelected}
          setShowDialog={setShowDialog}
        />
      </div>
      {showDialog && (
        <BuyDialog setShowDialog={setShowDialog} selected={selected} />
      )}
      <div>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G_WB0CNNCQCM" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-WB0CNNCQCM');
        `}
      </Script>
    </div>
    </div>
  );
};

async function subgraphGet(name: string, page: number, addr: string = "") {
  // 定义查询URL
  const url = "https://api.studio.thegraph.com/query/20058/friend-tech/v0.0.1";

  let query = "";
  switch (name) {
    case "history":
      query = `
      {
        trades(orderBy: blockNumber, orderDirection: desc, first: 50, skip: ${
          page * 50
        }) {
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

export default Home;
