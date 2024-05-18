/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-22 07:46:15
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-11 01:51:51
 * @FilePath: /Swap/assets/utils.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers, BigNumber } from 'ethers'
export const calculateCountdown = (targetMilliseconds) => {
    const currentDateTime = new Date();
    // 将当前时间加上倒计时的毫秒数
    const targetDateTime = new Date(currentDateTime.getTime() + targetMilliseconds * 1000);

    // 获取年月日时分秒
    const year = targetDateTime.getFullYear();
    const month = (targetDateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDateTime.getDate().toString().padStart(2, '0');
    const hours = targetDateTime.getHours().toString().padStart(2, '0');
    const minutes = targetDateTime.getMinutes().toString().padStart(2, '0');
    const seconds = targetDateTime.getSeconds().toString().padStart(2, '0');

    // 格式化日期和时间
    const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
}

export const secondsToDHHMMSS = (seconds) => {
    const second = Number(seconds)
    const days = Math.floor(second / (24 * 3600));
    const hours = Math.floor((second % (24 * 3600)) / 3600);
    const minutes = Math.floor((second % 3600) / 60);
    const remainingSeconds = second % 60;

    return `${days}d ${hours}h`;
}

export const timestampToDateTime = (timestamp) => {

    const targetDateTime = new Date(timestamp * 1000);

    // 获取年月日时分秒
    const year = targetDateTime.getFullYear();
    const month = (targetDateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDateTime.getDate().toString().padStart(2, '0');
    const hours = targetDateTime.getHours().toString().padStart(2, '0');
    const minutes = targetDateTime.getMinutes().toString().padStart(2, '0');
    const seconds = targetDateTime.getSeconds().toString().padStart(2, '0');

    // 格式化日期和时间
    const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
}

// 将以太坊单位转为 Wei
export const convertToWei = (ethValue) => {
    const weiValue = ethers.utils.parseUnits(ethValue, 'ether');
    return weiValue.toString();
}

export const weiToEth = (wei) => {
    const weiBigNumber = BigNumber.from(wei || '0');
    return parseFloat(ethers.utils.formatUnits(weiBigNumber, 'ether'));
}

export const getImageUrl = (base64Str) => {
    // 1. 去掉开头的 data:application/json;base64
    const jsonBase64 = base64Str.substr(base64Str.indexOf(',') + 1)
    // 2. base64解码  
    const jsonStr = atob(jsonBase64);
    // 3. 把解码后的json字符串转成对象
    const data = JSON.parse(jsonStr)
    return data.image
}
