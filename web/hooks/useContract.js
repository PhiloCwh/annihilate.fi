/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2023-12-31 02:17:20
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-18 18:11:38
 * @FilePath: /Swap/hooks/useContract.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useNetwork } from "wagmi"

export const useContracts = (address, abi) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    const signer = provider.getSigner();
    const contract = new ethers.Contract(address, abi, signer)
    return contract

}