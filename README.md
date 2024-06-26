# annihilate.fi

# 基于LP借贷降低门槛发行做空资产的平台

## 概述

本项目旨在创建一个基于流动性提供者（LP）借贷的去中心化交易所（DEX），用户可以在该平台上进行做空操作。增加lp的资金利用率，降低普通用户的使用门槛。这种DEX结合了LP借贷和做空机制，增加了市场操作的灵活性。
降低用户使用金融衍生品的门槛，大大规模的用户带入链上衍生品市场。
实现mass adoption。

## 核心功能
用户只需要在兑换的时候把兑换的token的地址前面加个负号，就可以实现购买做空该token的资产。

<img width="1411" alt="image" src="https://github.com/PhiloCwh/annihilate.fi/assets/105807963/e69d3698-89f2-4f75-aeff-ba42c0343ea1">


## 主要功能

1. **流动性提供者借贷**：用户可以将资产存入流动性池，并以此作为抵押物借贷其他资产，大大提高lp的资金利用率。
2. **自动发行做空资产**：用户可以借入资产并进行卖出操作，待价格下跌后再买入资产偿还借贷，实现做空获利。
3. **去中心化治理**：通过治理代币，社区成员可以参与平台的决策和管理。


## 工作原理
<img width="563" alt="image" src="https://github.com/PhiloCwh/annihilate.fi/assets/105807963/a465af34-d8c1-444d-812f-481fd4fabf32">

### 杠杠原理

<img width="742" alt="image" src="https://github.com/PhiloCwh/annihilate.fi/assets/105807963/bad93b64-dfb3-42f2-9615-14347c189250">

### 杠杠倍数和做空逻辑 

用户抵押 A eth 贷出 B tokenA,再把 B tokenA换成 C eth，

### 流动性提供与借贷

1. **流动性提供**：用户将资产存入平台的流动性池，成为流动性提供者（LP），并获得LP代币作为回报。
2. **借贷机制**：用户可以使用LP代币作为抵押物，从流动性池中借出其他资产。借贷利率根据供需关系动态调整。（当前为固定利率）

### 做空操作

1. **借入资产**：用户使用LP代币作为抵押物，借入他们希望做空的资产。
2. **卖出资产**：将借入的资产在市场上卖出，获得另一种资产（例如，稳定币）。
3. **价格下跌**：如果借入资产的价格下跌，用户可以以更低的价格买回相同数量的资产。
4. **偿还借贷**：用户将买回的资产归还流动性池，并赎回抵押的LP代币。

## 智能合约

平台的核心功能由一系列智能合约实现，包括但不限于：

- **流动性池合约**：管理资产存入和借出的操作。
- **借贷合约**：处理借贷申请、利率计算及清算操作。
- **做空合约**：执行借入、卖出、买回和归还资产的操作。
- **治理合约**：支持治理代币的投票和提案。
- **清算合约**：根据healthyFactor清算资不抵债用户，当前为70%



## 未来计划

- **memelaunchPad**：memelanchPad 的bonding curve，发射完成后来annihilate.fi添加流动性


## 结论

基于LP借贷发现做空资产token，同时AMM实现全部自动化，旨在为用户打造降低用户使用门槛的金融衍生品平台。

## 代码相关
https://github.com/PhiloCwh/annihilate.fi

