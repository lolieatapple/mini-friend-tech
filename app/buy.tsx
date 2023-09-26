import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { SC_ABIS, SC_ADDR } from "./config";
import { useLocalStorage } from 'usehooks-ts'

export default function BuyDialog(props: any) {
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("loading...");
  const [history, setHistory] = useLocalStorage<any>('buyHistory', [])
  

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
                // call buyFriend
                let tx = await contract.buyShares(props.selected, quantity, {
                  value: ethers.utils.parseEther(price),
                });
                console.log("tx", tx);
                setHistory([...history, {
                  share: props.selected,
                  buyPrice: price,
                  quantity: quantity,
                  time: Date.now(),
                }]);
                alert("Transaction sent, please wait for confirmation");
              } catch (error) {
                console.error(error);
                alert("Failed: " + (error as any).message);
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
