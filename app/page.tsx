"use client";

import React, { useEffect, useState, useRef } from "react";
import { useMediaQuery } from "react-responsive";
import {
  LineChart,
  AreaChart,
  Area,
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
import Script from "next/script";

import dynamic from "next/dynamic";
import {
  formatCurrentDate,
  getTwitterByAddress,
  subgraphGet,
  toShortAddress,
} from "./utils";
import Twitter from "./twitter";

const Assets = dynamic(() => import("./assets"), {
  ssr: false, // This will make the component only be rendered on client side
});

const BuyDialog = dynamic(() => import("./buy"), {
  ssr: false, // This will make the component only be rendered on client side
});

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

  useEffect(() => {
    (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    });
    // get account
    (window as any).ethereum
      .request({
        method: "eth_accounts",
      })
      .then((accounts: any) => {
        setAddress(accounts[0]);
      });
  }, []);

  return (
    <div className="flex flex-wrap justify-between items-center p-4 bg-blue-500 text-white">
      <div className="flex items-center justify-between mb-2 md:mb-0">
        <div className="flex items-center">
          <img src="logo.png" alt="Logo" className="h-8 w-8 mr-2 rotate-logo" />
          <span>Friend.tech Analytics</span>
        </div>
        &nbsp;
        <a href="https://github.com/lolieatapple/mini-friend-tech.git" target="_blank" rel="noopener noreferrer" className="text-black hover:text-pink-400 transition duration-300">
          <svg className="w-6 h-6" fill="currentColor" aria-hidden="true" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.775.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.905-.015 3.3 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
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
      <h2 className="text-lg font-semibold">Top 100 Users (24hrs)</h2>
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
  const [holder, setHolder] = useState<any>(0);
  const [supply, setSupply] = useState<any>(0);
  const [price, setPrice] = useState<any>(0);
  useEffect(() => {
    if (!props.selected) {
      return;
    }
    getTwitterByAddress(props.selected)
      .then((ret) => {
        setHolder(ret.holderCount);
        setSupply(ret.shareSupply);
        setPrice(ret.displayPrice / 1e18);
      })
      .catch(console.error);
  }, [props.selected]);

  return (
    <div className={`p-4 border rounded shadow relative md:p-2 p-4`}>
      <div className="flex justify-between items-center mb-2 flex-col md:flex-row">
        <h2 className={`text-lg font-semibold md:text-base text-lg`}>
          Account Detail & Price Chart
        </h2>
        <span className="text-gray-500 text-sm self-center">
          (Click on Address to See Detail Information)
        </span>
      </div>
      {props.selected && (
        <div className="flex flex-col items-center p-4 border rounded-md shadow-md ml-4 mr-4 mb-2">
          <div
            className={`flex ${
              isMobile ? "flex-col" : "flex-row"
            } justify-between w-full mb-3`}
          >
            <div className="flex items-center">
              <span className="mr-2">Address:</span>
              {isMobile ? toShortAddress(props.selected) : props.selected}&nbsp;
              <a
                href={`https://basescan.org/address/${props.selected}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗
              </a>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Twitter:</span>
              {props.selected && <Twitter address={props.selected} />}
            </div>
          </div>

          <div
            className={`flex ${
              isMobile ? "flex-col" : "flex-row"
            } justify-between w-full mb-3`}
          >
            <div className="flex items-center">
              <span className="mr-2">Holder Count:</span>
              <span>{holder}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Share Supply:</span>
              <span>{supply}</span>
            </div>
          </div>

          <div className="flex flex-row justify-between w-full mb-0">
            <div className="flex items-center">
              <span className="mr-2">Price:</span>
              <span>{price}</span>
            </div>
            {props.selected && (
              <div>
                <button
                  className={`bg-blue-500 pl-5 pr-5 text-white rounded ${
                    isMobile ? "px-3 py-2" : "px-2 py-1"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.setShowDialog(true);
                  }}
                >
                  Buy
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            width: isMobile ? "30px" : "50px",
            height: isMobile ? "30px" : "50px",
            animation: "spin 2s linear infinite",
            zIndex: 100,
          }}
        />
      )}
      <ResponsiveContainer width={isMobile ? 350 : "100%"} height={props.selected ? 250 : 350}>
        <AreaChart
          data={
            props.chart.length > 0
              ? props.chart
                  .map((item: any) => ({
                    name: formatCurrentDate(
                      new Date(item.blockTimestamp * 1000)
                    ),
                    price: Number((item.ethAmount / 1e18).toFixed(8)),
                  }))
                  .reverse()
              : data
          }
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6e1f7" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id="gradientFill2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84d8d7" />
              <stop offset="100%" stopColor="#d1f5f4" />
            </linearGradient>
          </defs>
          <CartesianGrid
            fill="url(#gradientFill)"
            horizontal={false}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tickCount={3}
            fontSize={10}
          />
          <YAxis
            domain={["auto", (dataMax: any) => dataMax + 0.1 * dataMax]}
            tickCount={3}
            fontSize={10}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#84d8d7"
            fill="url(#gradientFill2)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
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

// Trade History Component
const TradeHistory = (props: any) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<any>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 当元素进入视窗时，设置 isVisible 为 true
        setIsVisible(entry.isIntersecting);
      },
      {
        // 当元素与视窗相交至 50% 时，触发回调
        threshold: 0.5,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // 清理函数，在组件卸载时取消观察
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return (
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
              <th className="p-2 text-left">Supply</th>
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
                <td className="p-2 md:table-cell text-left min-w-[160px]">
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
                  {toShortAddress(item.subject)}
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
                  <div>{item.supply}</div>
                </td>
                <td className="p-2 md:table-cell text-left min-w-[200px]">
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
                <td className="p-2 md:table-cell text-left min-w-[220px]">
                  <button
                    className="bg-blue-400 text-white px-2 py-1 rounded mr-2"
                    onClick={() => {
                      props.setSelected(item.subject);
                      props.setShowDialog(true);
                    }}
                  >
                    Buy Owner
                  </button>
                  <button
                    className="bg-green-400 text-white px-2 py-1 rounded"
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
        <div className="grid md:grid-cols-[1fr,2fr] gap-4 mb-4">
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
        </div>
        <Assets
          setChartLoading={setChartLoading}
          setChart={setChart}
          setSelected={setSelected}
        />
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

export default Home;
