'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

import { createChart } from 'lightweight-charts';



// 示例数据
const data = [
  { name: 'Jan', price: 4.000 },
  { name: 'Feb', price: 3.000 },
  { name: 'Mar', price: 2.000 },
  { name: 'Apr', price: 2.780 },
  { name: 'May', price: 1.890 },
  { name: 'Jun', price: 2.390 },
  { name: 'Jul', price: 3.490 },
];

const TradingViewChart = (props: any) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (chartContainerRef.current) {
      // 创建图表
      const chart = createChart(chartContainerRef.current, { width: 400, height: 300 });
      const candlestickSeries = chart.addCandlestickSeries();

      // 假设原始数据存储在变量 rawData 中
      const rawData = props.chart;
      if (rawData.length === 0) {
        return;
      }

      // 将原始数据按天分组
      const groupedByDay = rawData.reduce((acc: any, trade: any) => {
        const date = new Date(trade.blockTimestamp * 1000).toDateString(); // 将时间戳转换为日期字符串，忽略时间部分
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(trade);
        return acc;
      }, {});

      // 计算每天的蜡烛图数据
      const candlestickData = Object.entries(groupedByDay).map(([date, trades]:[any, any]) => {
        const prices = trades.map((trade: any) => Number(trade.ethAmount / 1e18)); // 计算每笔交易的价格
        return {
          time: new Date(date).getTime() / 1000, // 将日期字符串转回时间戳
          open: prices[0],
          close: prices[prices.length - 1],
          high: Math.max(...prices),
          low: Math.min(...prices),
        };
      });

      console.log(candlestickData);

      // candlestickSeries.setData(candlestickData as any);
      // candlestickSeries.setData(props.chart as any);
      // console.log('chart', props.chart);
      const _data = props.chart.map((item: any) => ({
        time: (new Date(item.blockTimestamp * 1000)).toISOString().split('T')[0],
        value: Number((item.ethAmount / 1e18).toFixed(8)),
      }));
      console.log('_data', _data);
      candlestickSeries.setData(_data as any);
    }
  }, [props.chart]);

  return <div ref={chartContainerRef} />;
};

// Header Component
const Header = () => (
  <div className="flex justify-between items-center p-4 bg-blue-500 text-white">
    <div className="flex items-center">
      <img src="logo.png" alt="Logo" className="h-8 w-8 mr-2" />
      <span>Friend.tech Analytics</span>
    </div>
    <button className="bg-white text-blue-500 px-4 py-2 rounded">Connect Wallet</button>
  </div>
);

// Top Users Component
const TopUsers = (props: any) => (
  <div className="p-4 border rounded shadow">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">Top 50 Users</h2>
      <span className="text-gray-500 text-sm self-center">(Click for Chart)</span>
    </div>
    <div style={{maxHeight: '350px', overflowY: 'auto'}}>
    <table className="min-w-full border rounded shadow text-xs">
      <thead>
        <tr className="border-gray-300 border-b">
          <th className="p-1 text-center">Address</th>
          <th className="p-1 text-center">Price (ETH)</th>
          <th className="p-1 text-center">Operation</th>
        </tr>
      </thead>
      <tbody>
        {
          props.top.map((item: any, index: number) => (
            <tr className="h-8 border-gray-300 border-b cursor-pointer hover:bg-gray-200"
                onClick={async () => {
                  props.setChartLoading(true);
                  console.log('Row clicked', item.subject);
                  const ret = await subgraphGet('chart', 0, item.subject);
                  console.log('chart', ret.data.data.trades);
                  props.setChart(ret.data.data.trades);
                  props.setSelected(item.subject);
                  props.setChartLoading(false);
                }}
                key={item.id}>
              <td className="p-1 text-center">
              {item.subject.slice(0,6) + '...' + item.subject.slice(-4)}&nbsp; 
                <a href={`https://basescan.org/address/${item.subject}`} target="_blank" rel="noopener noreferrer">
                 🔗
                </a>
              </td>
              <td className="p-1 text-center">{Number((item.ethAmount / 1e18).toFixed(8))}</td>
              <td className="p-1 text-center">
                <button 
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Buy button clicked', item.subject);
                  }}
                >
                  Buy
                </button>
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
    </div>
    
  </div>
);

// Price Chart Component
const PriceChart = (props: any) => (
  <div className="p-4 border rounded shadow relative">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">Price Chart</h2>
      <span className="text-gray-500 text-sm self-center">{props.selected}</span>
    </div>
    {props.loading && (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        border: '16px solid #100f0f',
        borderTop: '16px solid #3498db',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 2s linear infinite'
      }}/>
    )}
    {/* <TradingViewChart chart={props.chart} /> */}
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={props.chart.length > 0 ? props.chart.map((item: any) => ({
          name: new Date(item.blockTimestamp * 1000).toLocaleString().split(',')[0].trim(),
          price: Number((item.ethAmount / 1e18).toFixed(8)),
        })).reverse() : data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
    <style jsx>{`
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `}</style>
  </div>
);

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
        {
          props.newers.map((item: any, index: number) => (
            <tr className="h-8 border-gray-300 border-b cursor-pointer hover:bg-gray-200"
                onClick={() => console.log('Row clicked')}
                key={item.id}>
              <td className="p-1 text-center">
                {item.subject.slice(0,6) + '...' + item.subject.slice(-4)}&nbsp; 

                <a href={`https://basescan.org/address/${item.subject}`} target="_blank" rel="noopener noreferrer">
                  🔗
                </a>
              </td>
              <td className="p-1 text-center">
                <button 
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Buy button clicked');
                  }}
                >
                  Buy
                </button>
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

// Trade History Component
const TradeHistory = (props: any) => (
  <div className="p-4 border rounded shadow">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">Trade History</h2>
      <span className="text-gray-500 text-sm self-center">(Click address for Chart)</span>
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
          {
            props.history.map((item: any, index: number) => (
              <tr 
                className={`border-gray-300 border-b md:table-row hover:bg-gray-200 ${item.isBuy ? 'bg-green-100' : 'bg-red-100'}`}  
                key={item.id}>
                <td className="p-2 md:table-cell text-left">
                  <div>{new Date(item.blockTimestamp * 1000).toLocaleString()}</div>
                </td>
                <td className="p-2 md:table-cell text-left">
                  <div>{item.isBuy ? 'Buy' : 'Sell'}</div>
                </td>
                <td className="p-2 md:table-cell text-left cursor-pointer" 
                  onClick={async () => {
                    props.setChartLoading(true);
                    console.log('Row clicked', item.subject);
                    const ret = await subgraphGet('chart', 0, item.subject);
                    console.log('chart', ret.data.data.trades);
                    props.setChart(ret.data.data.trades);
                    props.setSelected(item.subject);
                    props.setChartLoading(false);
                  }}
                >
                {item.subject.slice(0,6) + '...' + item.subject.slice(-4)}
                  &nbsp;
                  <a href={`https://basescan.org/address/${item.subject}`} target="_blank" rel="noopener noreferrer">
                    🔗
                  </a>
                </td>
                <td className="p-2 md:table-cell text-left cursor-pointer" 
                  onClick={async () => {
                    props.setChartLoading(true);
                    console.log('Row clicked', item.trader);
                    const ret = await subgraphGet('chart', 0, item.trader);
                    console.log('chart', ret.data.data.trades);
                    props.setChart(ret.data.data.trades);
                    props.setSelected(item.trader);
                    props.setChartLoading(false);
                  }}
                >
                {item.trader.slice(0,6) + '...' + item.trader.slice(-4)}
                  &nbsp;
                  <a href={`https://basescan.org/address/${item.trader}`} target="_blank" rel="noopener noreferrer">
                    🔗
                  </a>
                </td>
                <td className="p-2 md:table-cell text-left">
                  <div>{Number((item.ethAmount / 1e18).toFixed(8))}</div>
                </td>
                <td className="p-2 md:table-cell text-left">
                  <a href={`https://basescan.org/tx/${item.transactionHash}`} target="_blank" rel="noopener noreferrer">
                    {item.transactionHash.slice(0,12) + '...' + item.transactionHash.slice(-8)} 🔗
                  </a>
                </td>
                <td className="p-2 md:table-cell text-left">
                  <button 
                    className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                    onClick={() => console.log('Operation button clicked')}
                  >
                    Buy Owner
                  </button>
                  <button 
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => console.log('Operation button clicked')}
                  >
                    Buy Trader
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  </div>
);



// Main Home Component
const Home = () => {
  const [history, setHistory] = useState([]);
  const [top, setTop] = useState([]);
  const [newers, setNewers] = useState([]);
  const [chart, setChart] = useState([]);
  const [selected, setSelected] = useState('');
  const [chartLoading, setChartLoading] = useState(false);
  useEffect(() => {
    // 定义一个获取数据的函数
    const fetchData = () => {
      // 替换为实际的subgraphGet函数调用
      subgraphGet('history', 0).then((ret) => {
        console.log('flush history', ret.data.data.trades.length);
        setHistory(ret.data.data.trades);
      }).catch(console.error);

      subgraphGet('top', 0).then((ret) => {
        console.log('flush top', ret.data.data.trades.length);
        setTop(ret.data.data.trades);
      }).catch(console.error);

      subgraphGet('newers', 0).then((ret) => {
        console.log('flush newers', ret.data.data.trades.length);
        setNewers(ret.data.data.trades);
      }).catch(console.error);
    };
    
    // 首次渲染时立即获取数据
    fetchData();
    
    // 设置一个每隔10秒调用fetchData的定时器
    const intervalId = setInterval(fetchData, 10000); // 10000毫秒 = 10秒
    
    // 当组件卸载时，清除定时器
    return () => clearInterval(intervalId);
  }, []);
  return <div className="min-h-screen bg-gray-100">
    <Header />
    <div className="container mx-auto p-4">
      <div className="grid md:grid-cols-[1fr,2fr,1fr] gap-4 mb-4">
        <TopUsers top={top} setChart={setChart} setChartLoading={setChartLoading} setSelected={setSelected} />
        <PriceChart chart={chart} loading={chartLoading} selected={selected} />
        <Newers newers={newers} />
      </div>
      <TradeHistory history={history} setChartLoading={setChartLoading} setChart={setChart} setSelected={setSelected}  />
    </div>
  </div>
}

async function subgraphGet(name: string, page: number, addr: string = '') {
  // 定义查询URL
  const url = 'https://api.studio.thegraph.com/query/20058/friend-tech/v0.0.1';

  let query = '';
  switch(name) {
    case 'history':
      query = `
      {
        trades(orderBy: blockNumber, orderDirection: desc, first: 50, skip: ${page * 50}) {
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
    case 'top':
      query = `
      {
        trades(orderBy: ethAmount, orderDirection: desc, first: 100) {
          id
          subject
          ethAmount
        }
      }
      `
      break;
    case 'newers':
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
      `
      break;
    case 'chart':
      query = `
      {
        trades(orderBy: blockTimestamp, orderDirection: desc, first: 50, where: {subject: "${addr}"}) {
          ethAmount
          blockTimestamp
        }
      }
      `
      break;
    default:
      break;
  }
  // 定义查询字符串


  // 使用axios.post发送查询
  return await axios.post(url, { query });
}


export default Home;
