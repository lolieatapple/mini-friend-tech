import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts'
import {ethers} from 'ethers';
import { SC_ABIS, SC_ADDR } from "./config";
import { httpProvider, subgraphGet, toShortAddress } from './utils';
import SellDialog from './sell';
import Twitter from './twitter';


function Row(props) {
  const [currentPrice, setCurrentPrice] = useState('loading');
  const [supply, setSupply] = useState('loading');
  const [holding, setHolding] = useState('loading');
  const [history, setHistory] = useLocalStorage('buyHistory', []);




  useEffect(() => {
    const func = async () => {
      try {
        if (!window.ethereum) {
          console.log("Please install MetaMask first.");
          return;
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const contract = new ethers.Contract(SC_ADDR, SC_ABIS, httpProvider);
        let _price = await contract.getSellPriceAfterFee(props.item.share, 1);
        let _supply = await contract.sharesSupply(props.item.share);
        let _holding = await contract.sharesBalance(props.item.share, accounts[0]);
        setSupply(_supply.toString());
        setHolding(_holding.toString());
        setCurrentPrice(_price / 1e18);
      } catch (error) {
        console.error(error);
      }
    }

    func();

    let timer = setInterval(func, 30000);

    return () => {
      clearInterval(timer);
    }
  }, []);

  return <tr className={`border-b border-gray-300 ${Number(props.item.buyPrice) < Number(currentPrice) ? "bg-green-100" : "bg-red-100"}`}>
    <td className="p-2 min-w-[160px]">{props.item.time ? new Date(props.item.time).toLocaleString() : new Date().toLocaleString()}</td>
    <td className="p-2 cursor-pointer min-w-[260px]" onClick={async ()=>{
      props.setChartLoading(true);
      const ret = await subgraphGet("chart", 0, props.item.share);
      console.log("chart", ret.data.data.trades);
      props.setChart(ret.data.data.trades);
      props.setSelected(props.item.share);
      props.setChartLoading(false);
    }}>
      <div className='flex items-center'>
      {toShortAddress(props.item.share)}
    &nbsp;
    <a
      href={`https://basescan.org/address/${props.item.subject}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      🔗
    </a>
    <Twitter address={props.item.share} />
    </div>
    </td>
    <td className="p-2">{supply}</td>
    <td className="p-2">{holding}</td>
    <td className="p-2">{props.item.buyPrice}</td>
    <td className="p-2">{currentPrice}</td>
    <td className="p-2 min-w-[120px]">
    <button
      className="bg-blue-500 text-white px-2 py-1 rounded"
      onClick={async () => {
        props.setSell(props.item.share)
        props.setShowDialog(true);
      }}
    >
      Sell
    </button>
    &nbsp;&nbsp;
    <button
      className="bg-red-400 text-white px-2 py-1 rounded"
      onClick={()=>{
        if (!confirm("Are you sure to remove this record?")) {
          return;
        }
        console.log('remove', props.item.time);
        let _history = history.filter((item) => {
          return item.time !== props.item.time;
        });
        setHistory(_history);
      }}
    >Del</button>
    </td>
  </tr>
}

export default function Assets(props) {
  const [history, setHistory] = useLocalStorage('buyHistory', []);
  const [showDialog, setShowDialog] = useState(false);
  const [sell, setSell] = useState('');
  
  return <div className="p-4 border rounded shadow mb-4">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">My Assets
      <button className="bg-green-500 text-white rounded-full w-8 h-8 ml-2"
        onClick={()=>{
        let addr = prompt("Please input address");
        let price = prompt("Please input buy price");
        let time = Date.now();
        if (addr && price) {
          // add to history 
          setHistory([...history, {share: addr, buyPrice: price, time}]);
        }
      }}>+</button>
      </h2>
      <span className="text-gray-500 text-sm self-center">
        (Click address for Chart)
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded shadow text-xs md:table">
        <thead className="md:table-header-group">
          <tr className="border-gray-300 border-b">
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Share</th>
            <th className="p-2 text-left">Supply</th>
            <th className="p-2 text-left">Holding</th>
            <th className="p-2 text-left">BuyPrice (ETH)</th>
            <th className="p-2 text-left">Current Price (ETH)</th>
            <th className="p-2 text-left">Operation</th>
          </tr>
        </thead>
        <tbody>
          {
            history.map((item, index) => {
              return <Row key={index} item={item}
                setChartLoading={props.setChartLoading}
                setChart={props.setChart}
                setSelected={props.setSelected}
                setShowDialog={setShowDialog}
                setSell={setSell}
              />
            })
          }
        </tbody>
      </table>
    </div>
    {showDialog && (
        <SellDialog setShowDialog={setShowDialog} selected={sell} />
      )}
  </div>
}
