import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts'
import {ethers} from 'ethers';
import { SC_ABIS, SC_ADDR } from "./config";
import { subgraphGet } from './page';


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
        const provider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        const contract = new ethers.Contract(SC_ADDR, SC_ABIS, provider);
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
    <td className="p-2">{props.item.time ? new Date(props.item.time).toLocaleString() : new Date().toLocaleString()}</td>
    <td className="p-2 cursor-pointer" onClick={async ()=>{
      props.setChartLoading(true);
      const ret = await subgraphGet("chart", 0, props.item.share);
      console.log("chart", ret.data.data.trades);
      props.setChart(ret.data.data.trades);
      props.setSelected(props.item.share);
      props.setChartLoading(false);
    }}>{props.item.share}
    &nbsp;
    <a
      href={`https://basescan.org/address/${props.item.subject}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      🔗
    </a>
    
    </td>
    <td className="p-2">{supply}</td>
    <td className="p-2">{holding}</td>
    <td className="p-2">{props.item.buyPrice}</td>
    <td className="p-2">{currentPrice}</td>
    <td className="p-2">
    <button
      className="bg-blue-500 text-white px-2 py-1 rounded"
      onClick={async () => {
        if (!window.ethereum) {
          alert("Please install MetaMask first");
          return;
        }

        try {
          // get accounts
          await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x2105" }],
          });
          // switch to base mainnet
          // get signer
          const provider = new ethers.providers.Web3Provider(
            window.ethereum
          );
          const signer = provider.getSigner();
          // get contract
          const contract = new ethers.Contract(SC_ADDR, SC_ABIS, signer);
          // call buyFriend
          let tx = await contract.sellShares(props.item.share, holding);
          console.log("tx", tx);

          // remove from history
          let _history = history.filter((item) => {
            return item.share !== props.item.share;
          });
          setHistory(_history);
          
          alert("Transaction sent, please wait for confirmation");
        } catch (error) {
          console.error(error);
        }
      }}
    >
      Sell
    </button>
    </td>
  </tr>
}

export default function Assets(props) {
  const [history, setHistory] = useLocalStorage('buyHistory', []);
  
  return <div className="p-4 border rounded shadow mb-4">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">My Assets</h2>
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
                setSelected={props.setSelected} />
            })
          }
        </tbody>
      </table>
    </div>
  </div>
}
