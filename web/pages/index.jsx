/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-02 22:05:01
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-18 17:06:32
 * @FilePath: /TheLastOneGame/pages/winner.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useContracts } from '@/hooks/useContract';
import { useAccount, useNetwork } from 'wagmi'
import ammDataABI from 'Abi/ammData.json'
import ammABI from 'Abi/amm.json'
import tokenABI from 'Abi/token.json'
import Image from 'next/image'
import { Input, Modal } from 'antd';
import styles from '../styles/home.module.css'
import toast from 'react-hot-toast'
import { convertToWei, calculateCountdown, weiToEth } from '@/assets/utils'

const Home = () => {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [isDisabled, setIsDisabled] = useState(true)
  const [amountIn, setamountIn] = useState(0)
  const [amountOut, setOutAmount] = useState(0)

  const [TokenInAddress, setTokenInAdress] = useState('')
  const [TokenInName, setTokenInName] = useState('')
  const [TokenOutAddress, setTokenOutAdress] = useState('')
  const [TokenOutName, setTokenOutName] = useState('')

  const [tokenInbanlance, setTokenInbanlance] = useState(0)
  const [tokenOutbanlance, setTokenOutbanlance] = useState(0)

  const [tokenInReserve, setTokenInReserve] = useState(0)
  const [tokenInBorrowed, setTokenInBorrowed] = useState(0)
  const [tokenInBorrowedRate, setTokenInBorrowedRate] = useState(0)
  const [lpTokenInApr, setLpTokenInApr] = useState(0)
  const [borrowederTokenInApr, setBorrowederTokenInApr] = useState(0)

  const [tokenOutReserve, setTokenOutReserve] = useState(0)
  const [tokenOutBorrowed, setTokenOutBorrowed] = useState(0)
  const [tokenOutBorrowedRate, setTokenOutBorrowedRate] = useState(0)
  const [lpTokenOutApr, setLpTokenOutApr] = useState(0)
  const [borrowederTokenOutApr, setBorrowederTokenOutApr] = useState(0)

  const [OpenTokenIn, setOpenTokenIn] = useState(false);
  const [OpenTokenOut, setOpenTokenOut] = useState(false);

  const ammContract = useContracts('0x83f4E08CFEc67b6777097A0FAeca1d37Faab922E', ammABI)
  const ammDataContract = useContracts('0x9A8CA7C2372117dFF2709bC000df0c2cfA8D852e', ammDataABI)

  const getData = async () => {
    let res = await ammContract.getLpInfo(TokenInAddress, TokenOutAddress).catch(e => {
      console.log(e);
    })
    if (res) {
      setTokenInReserve(weiToEth(res[0]?.toString()))
      setTokenOutReserve(weiToEth(res[1]?.toString()))
      setTokenInBorrowed(weiToEth(res[2]?.toString()))
      setTokenOutBorrowed(weiToEth(res[3]?.toString()))
      setTokenInBorrowedRate(Number(weiToEth(res[4]?.toString())))
      setTokenOutBorrowedRate(Number(weiToEth(res[5]?.toString())))
      setLpTokenInApr(res[6]?.toString())
      setLpTokenOutApr(res[7]?.toString())
      setBorrowederTokenInApr(res[8]?.toString())
      setBorrowederTokenOutApr(res[9]?.toString())
    }

  }
  useEffect(() => {
    getData()
    cacal()
    getTokenInBanlance()
    getTokenOutBanlance()
  }, [address])

  useEffect(() => {
    getData()
    cacal()
    getTokenInBanlance()
  }, [TokenInAddress])

  useEffect(() => {
    getData()
    cacal()
    getTokenOutBanlance()
  }, [TokenOutAddress])

  useEffect(() => {
    cacal()
  }, [amountIn])

  const getTokenInBanlance = async () => {
    if (address === undefined) {
      return
    }
    let tokenInContract = useContracts(TokenInAddress, tokenABI)
    let res = await tokenInContract.balanceOf(address).catch(e => {
      console.log(e);
    })
    let token = Number(weiToEth(res?.toString()))
    setTokenInbanlance(token)
  }

  const getTokenOutBanlance = async () => {
    if (address === undefined) {
      return
    }
    let tokenOutContract = useContracts(TokenOutAddress, tokenABI)
    let res = await tokenOutContract.balanceOf(address).catch(e => {
      console.log(e);
    })
    let token = Number(weiToEth(res?.toString()))
    setTokenOutbanlance(token)
  }

  const onChange = (e) => {
    setamountIn(e.target.value);
    setIsDisabled(false)
  }

  const onAmountOutChange = (e) => {
    setOutAmount(e.target.value);
    setIsDisabled(false)
  }

  const tokenInChange = (e) => {
    setTokenInAdress(e.target.value)
    setTokenInName(e.target.value)
    setOpenTokenIn(false);
  }

  const tokenOutChange = async (e) => {
    setTokenOutAdress(e.target.value)
    setTokenOutName(e.target.value)
    setOpenTokenOut(false);
  }

  const swap = async () => {
    if (address === undefined) {
      toast.error("Please connect wallet first!")
      return
    }

    if (!amountIn) {
      return
    }

    if (tokenInbanlance == 0 || !tokenInbanlance || tokenInbanlance < amountIn) {
      toast.error('Not enough token!')
      return
    }
    let tokenInContract = useContracts(TokenInAddress, tokenABI)
    let res = await tokenInContract.allowance(address, '0x83f4E08CFEc67b6777097A0FAeca1d37Faab922E').catch(e => {
      console.log(e);
    })
    let allowanceNum = Number(weiToEth(res.toString()))
    console.log(allowanceNum);
    if (amountIn > allowanceNum) {
      tokenInApprove()
    } else {
      setSwap()
    }
  }

  const tokenInApprove = async () => {
    let tokenInContract = useContracts(TokenInAddress, tokenABI)
    const maxValue = ethers.constants.MaxUint256;
    await tokenInContract.approve('0x83f4E08CFEc67b6777097A0FAeca1d37Faab922E', maxValue).then(res => {
      setSwap()
    }).catch(e => {
      console.log('bv', e);

    })
  }

  const setSwap = async () => {
    const params = convertToWei(amountIn + '');
    await ammContract.swap(TokenInAddress, TokenOutAddress, params).then(res => {
      toast.success('Successfully!')
      getTokenInBanlance()
      getTokenOutBanlance()
    }).catch(e => {
      console.log('xc', e);
      toast.error("ERROR!")
    })
  }

  const handleCancelTokenIn = () => {
    setOpenTokenIn(false);
  }

  const handleCancelTokenOut = () => {
    setOpenTokenOut(false);
  }

  const selectNetworkToken = () => {
    setOpenTokenIn(true);
  }

  const selectToken = () => {
    setOpenTokenOut(true);
  }

  const cacal = async () => {
    if (!amountIn || !TokenInAddress || !TokenOutAddress) {
      return
    }
    let res = await ammDataContract.cacalTokenOutAmount(TokenInAddress, TokenOutAddress, amountIn).catch(e => {
      console.log(e);
    })
    setOutAmount(res?.toString())
  }

  const changeToken = () => {
    if (!TokenInAddress || !TokenOutAddress) {
      return
    }
    const newamountOut = JSON.parse(JSON.stringify(amountOut));
    const newamountIn = JSON.parse(JSON.stringify(amountIn));
    const newTokenInAddress = JSON.parse(JSON.stringify(TokenInAddress));
    const newTokenOutAddress = JSON.parse(JSON.stringify(TokenOutAddress));
    const newtokenOutbanlance = JSON.parse(JSON.stringify(tokenOutbanlance));
    const newtokenInbanlance = JSON.parse(JSON.stringify(tokenInbanlance));
    const newTokenInName = JSON.parse(JSON.stringify(TokenInName));
    const newTokenOutName = JSON.parse(JSON.stringify(TokenOutName));

    console.log(newamountOut, newamountIn, newTokenInAddress, newTokenOutAddress, newtokenOutbanlance, newtokenInbanlance);
    setamountIn(newamountOut)
    setOutAmount(newamountIn)
    setTokenInAdress(newTokenOutAddress)
    setTokenOutAdress(newTokenInAddress)
    setTokenInbanlance(newtokenOutbanlance)
    setTokenInbanlance(newtokenInbanlance)
    setTokenInName(newTokenOutName)
    setTokenOutName(newTokenInName)
  }

  return (
    <div className={styles.outBox}>
      <div className={styles.cardBox}>
        <div className={styles.title}>Swap</div>
        <div className={styles.cardContent}>
          <div className={styles.inputTitle}>You'll Pay</div>
          <div className='flex justify-between'>
            <Input className={styles.customInput} size="large" value={amountIn} onChange={onChange} type="number" />
            {TokenInName ? <div className={styles.selectBtToken} onClick={() => { selectNetworkToken() }}>
              <div className={`${styles.rightText} + ${styles.rightBtText}`}>{TokenInName}</div>
              <span className={styles.rightText}>
                <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
              </span>
            </div> :
              <div className={styles.rightContainer} onClick={() => { selectNetworkToken() }}>
                <div className={styles.ethImg}><Image width={22} src="data:image/png;base64,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" alt='image' width={24} height={24} /></div>
                <span className={styles.rightText}>ETH</span>
                <span className={styles.rightText}>
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
                </span>
              </div>}
          </div>

          <div className='flex justify-between'>
            <div className={styles.inputFoot}></div>
            {TokenInName && address ? <div className={styles.rightText}>Balance: {tokenInbanlance}<span style={{ color: '#0E76FD', cursor: 'pointer' }}>MAX</span>  </div> : ''}
          </div>
        </div>
        <div className='flex justify-center'>
          <div className={styles.arrowDown} onClick={() => { changeToken() }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          </div>
        </div>
        <div className={styles.cardContent} style={{ marginTop: '-40px' }}>
          <div className={styles.inputTitle}>You'll Receive</div>
          <div className='flex justify-between'>
            <div style={{ width: '55%' }}>
              <Input className={styles.customInput} size="large" value={amountOut} onChange={onAmountOutChange} type="number" />
            </div>
            {TokenOutName ?
              <div className={styles.selectBtToken} onClick={() => { selectToken() }}>
                <div className={`${styles.rightText} + ${styles.rightBtText}`}>{TokenOutName}</div>
                <span className={styles.rightText}>
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
                </span>
              </div> :
              <div className={`${styles.rightContainer} + ${styles.rightBtContainer}`} onClick={() => { selectToken() }}><div style={{ height: '30px', display: 'flex', alignItems: 'center', }}></div>
                <span className={styles.rightText}>Select A Token</span>
              </div>}
          </div>
          <div className='flex justify-between'>
            <div className={styles.inputFoot}></div>
            {TokenOutName && address ? <div className={styles.rightText}>Balance: {tokenOutbanlance} </div> : ''}
          </div>
        </div>
        <button className={styles.requestBtn} disabled={isDisabled || (TokenInAddress == '') || (TokenOutAddress == '') || !address} onClick={swap}>{!address ? 'Connect Wallet' : isDisabled ? 'Input Pay' : !TokenOutName ? 'Select A Token' : 'Swap'}</button>
      </div>
      <div className={styles.cardBox}>
        <div className={styles.title}>Information</div>
        <div className='flex justify-between'>
          <div className={styles.subCard}>
            <div className={styles.formOutItem}>
              <div>Token In Reserve</div>
              <div className={styles.ModelnumOut}>{tokenInReserve}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token In Borrowed</div>
              <div className={styles.ModelnumOut}>{tokenInBorrowed}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token In Borrowed Rate</div>
              <div className={styles.ModelnumOut}>{tokenInBorrowedRate * 100}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Lp Token In Apr</div>
              <div className={styles.ModelnumOut}>{lpTokenInApr / 10000}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borroweder Token In Apr</div>
              <div className={styles.ModelnumOut}>{borrowederTokenInApr / 10000}%</div>
            </div>
          </div>
          <div className={styles.subCard}>
            <div className={styles.formOutItem}>
              <div>Token Out Reserve</div>
              <div className={styles.ModelnumOut}>{tokenOutReserve}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token Out Borrowed</div>
              <div className={styles.ModelnumOut}>{tokenOutBorrowed}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token Out Borrowed Rate</div>
              <div className={styles.ModelnumOut}>{tokenOutBorrowedRate * 100}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Lp Token Out Apr</div>
              <div className={styles.ModelnumOut}>{lpTokenOutApr / 10000}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borroweder Token Out Apr</div>
              <div className={styles.ModelnumOut}>{borrowederTokenOutApr / 10000}%</div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={OpenTokenIn}
        title="Select A Token"
        onCancel={handleCancelTokenIn}
        footer={[
        ]}
      >
        <div className={styles.xbody}>
          <div className='flex justify-between'>
            <Input className={styles.customTokenInput} value={TokenInAddress} onChange={tokenInChange} />
            <div className={styles.selectToken}>{TokenInName ? TokenInName : '?'}</div>
          </div>
        </div>
      </Modal>
      <Modal
        open={OpenTokenOut}
        title="Select a token"
        onCancel={handleCancelTokenOut}
        footer={[

        ]}
      >
        <div className={styles.xbody}>
          <div className='flex justify-between'>
            <Input className={styles.customTokenInput} value={TokenOutAddress} onChange={tokenOutChange} />
            <div className={styles.selectToken}>{TokenOutName ? TokenOutName : '?'}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Home