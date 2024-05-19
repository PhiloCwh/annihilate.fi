/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-02 22:05:01
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-19 07:29:44
 * @FilePath: /TheLastOneGame/pages/winner.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useContracts } from '@/hooks/useContract';
import { useAccount, useNetwork } from 'wagmi'
import ammDataABI from 'Abi/ammData.json'
import ammABI from 'Abi/amm.json'
import { Input, Slider } from 'antd';
import styles from '@/assets/styles/margin.module.css'
import toast from 'react-hot-toast'
import { convertToWei, weiToEth } from '@/assets/utils'

const Home = () => {
  const { address } = useAccount()
  const [isDisabled, setIsDisabled] = useState(true)
  const [amountIn, setamountIn] = useState(0)
  const [amountOut, setOutAmount] = useState(0)
  const [stepsCount, setStepsCount] = useState(0)
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)


  const [TokenInAddress, setTokenInAddress] = useState('')
  const [TokenOutAddress, setTokenOutAddress] = useState('')
  const [TokenOutName, setTokenOutName] = useState('')
  const tabs = [{ index: 0, name: 'Long' }, { index: 1, name: 'Short' }]
  const fillAssetsTabs = [{ index: 0, name: '10%' }, { index: 1, name: '20%' }, { index: 2, name: '50%' }, { index: 3, name: 'Max' }]
  const ab = [{ index: 0, name: 'TokenA' }, { index: 1, name: 'TokenB' }]

  const [currentTab, setCurrentTab] = useState(0)
  const [currentFillAssetsTab, setCurrentFillAssetsTab] = useState(0)
  const [currentAb, setCurrentAb] = useState(0)


  const [actionText, setActionText] = useState('Borrow')

  const [borrowAddress, setBorrowAddress] = useState('')
  const [borrowAmount, setBorrowAmount] = useState('')

  const [tokenInReserve, setTokenInReserve] = useState(0)
  const [tokenInBorrowed, setTokenInBorrowed] = useState(0)
  const [tokenInBorrowedRate, setTokenInBorrowedRate] = useState(0)
  const [lpTokenInApr, setLpTokenInApr] = useState(0)
  const [borrowederTokenInApr, setBorrowederTokenInApr] = useState(0)
  const [showAction, setShowAction] = useState(false)


  const [tokenOutReserve, setTokenOutReserve] = useState(0)
  const [tokenOutBorrowed, setTokenOutBorrowed] = useState(0)
  const [tokenOutBorrowedRate, setTokenOutBorrowedRate] = useState(0)
  const [lpTokenOutApr, setLpTokenOutApr] = useState(0)
  const [borrowederTokenOutApr, setBorrowederTokenOutApr] = useState(0)

  const ammContract = useContracts('0xEEf3f68A1C56b4B923Ee2a163198641445055446', ammABI)

  const getData = async () => {
    console.log(TokenInAddress, TokenOutAddress);
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

  }, [address])

  useEffect(() => {

  }, [TokenInAddress])

  useEffect(() => {

  }, [TokenOutAddress])

  useEffect(() => {

  }, [amountIn])

  const tokenInChange = (e) => {
    setTokenInAddress(e.target.value)
  }

  const tokenOutChange = async (e) => {
    setTokenOutAddress(e.target.value)
  }

  const borrowAddressChange = (e) => {
    setBorrowAddress(e.target.value)
  }

  const borrowAmountChange = (e) => {
    setBorrowAmount(e.target.value)
  }

  const tabClick = (data) => {
    setCurrentTab(data.index)
    if (data.index == 0) {
      setActionText('Borrow')
    } else {
      setActionText('Vault')
    }
  }
  const fillAssetsTabClick = (data) => {
    setCurrentFillAssetsTab(data.index)
  }

  const abTabClick = (data) => {
    setCurrentAb(data.index)
  }


  const action = async () => {
    if (!borrowAddress || !borrowAmount || !TokenInAdress || !TokenOutAdress) {
      return
    }
    if (currentTab == 0) {
      await ammContract.borrowToken(TokenInAdress, TokenOutAdress, borrowAddress, borrowAmount).then(res => {
        toast.success('Successfully!')
        getData()
      }).catch(e => {
        console.log('xc', e);
        toast.error("ERROR!")
      }).catch(e => {
        console.log(e);
      })
    } else {
      await ammContract.borrowToken(TokenInAdress, TokenOutAdress, borrowAddress, borrowAmount).then(res => {
        toast.success('Successfully!')
        getData()
      }).catch(e => {
        console.log('xc', e);
        toast.error("ERROR!")
      }).catch(e => {
        console.log(e);
      })
    }

  }

  return (
    <div className={styles.outBox}>
      <div className={styles.cardBox}>
        <div className={styles.title}>Search Information</div>
        <div className={styles.formOutItem} >
          <div className={styles.tokenAress}>Token A Adress:</div>
          <Input className={styles.customTokenInput} value={TokenInAddress} onChange={tokenInChange} />
        </div>
        <div className={styles.formOutItem} >
          <div className={styles.tokenAress}>Token B Adress:</div>
          <Input className={styles.customTokenInput} value={TokenOutAddress} onChange={tokenOutChange} />
        </div>
        <div className={styles.requestBtnOutBox}>
          <button style={{ width: '50%' }} className={styles.requestBtn} disabled={(TokenInAddress == '') || (TokenOutAddress == '') || !address} onClick={getData}>{!address ? 'Connect wallet' : !TokenInAddress ? 'Input token  a adress' : !TokenOutAddress ? 'Input token  b adress' : 'Search'}</button>
        </div>
        <div className={styles.informationBox}>
          <div className={styles.subCard}>
            <div className={styles.formOutItem}>
              <div>Token A Reserve</div>
              <div className={styles.ModelnumOut}>{tokenInReserve}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token A Borrowed</div>
              <div className={styles.ModelnumOut}>{tokenInBorrowed}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token A Borrowed Rate</div>
              <div className={styles.ModelnumOut}>{tokenInBorrowedRate * 100}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Lp Token A Apr</div>
              <div className={styles.ModelnumOut}>{lpTokenInApr / 10000}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borroweder Token A Apr</div>
              <div className={styles.ModelnumOut}>{borrowederTokenInApr / 10000}%</div>
            </div>
          </div>
          <div className={styles.subCard}>
            <div className={styles.formOutItem}>
              <div>Token B Reserve</div>
              <div className={styles.ModelnumOut}>{tokenOutReserve}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token B Borrowed</div>
              <div className={styles.ModelnumOut}>{tokenOutBorrowed}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token B Borrowed Rate</div>
              <div className={styles.ModelnumOut}>{tokenOutBorrowedRate * 100}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Lp Token B Apr</div>
              <div className={styles.ModelnumOut}>{lpTokenOutApr / 10000}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borroweder Token B Apr</div>
              <div className={styles.ModelnumOut}>{borrowederTokenOutApr / 10000}%</div>
            </div>
          </div>
        </div>
      </div>
      {showAction ? <div className={styles.cardBox}>
        <div className={styles.tabs}>
          {tabs.map(item => {
            return <div className={`${styles.tab} ${item.index == currentTab ? styles.currentTab : ''}`} key={item.index} onClick={() => { tabClick(item) }}>{item.name}</div>
          })}
        </div>
        <div className={styles.marginItem} >
          <div className={styles.itemBox}>Size:</div>
          <div style={{ width: '30%' }}>
            <Input className={styles.customTokenInput} value={borrowAddress} onChange={borrowAddressChange} />
          </div>

          <div className={styles.fillRatioUl} style={{ marginLeft: '20px' }}>
            {ab.map(item => {
              return <div className={`${styles.fillRatioLi} ${item.index == currentAb ? styles.fillRatioLiActive : ''}`} key={item.index} onClick={() => { abTabClick(item) }}><span className='cursor-pointer'>{item.name}</span></div>
            })}
          </div>
        </div>
        <div className={styles.fillSizeAssetRatio}>
          <div className={styles.fillRatioUl}>
            {fillAssetsTabs.map(item => {
              return <div className={`${styles.fillRatioLi} ${item.index == currentFillAssetsTab ? styles.fillRatioLiActive : ''}`} key={item.index} onClick={() => { fillAssetsTabClick(item) }}><span className='cursor-pointer'>{item.name}</span></div>
            })}
          </div>
          <div>
            <div className={styles.formOutItem}>
              <div className={styles.formOutItem}>
                <Input className={styles.customTokenInput} value={borrowAddress} onChange={borrowAddressChange} />
              </div>
              <div className={styles.formOutItem}><span>%</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.marginItem} >
          <div className={styles.itemBox}>Leverage: </div>
          <div className={styles.leverage}>
            <div>{min}</div>
            <div className={styles.silder}>
              <Slider min={min} max={max} value={stepsCount} onChange={setStepsCount} railBg='rgb(0, 0, 0)' />
            </div>

            <div>{max}</div>
          </div>
        </div>
        <div className={styles.requestBtnOutBox}>
          <button style={{ width: '50%' }} className={styles.requestBtn} disabled={(borrowAddress == '') || (borrowAmount == '') || !address} onClick={action}>{!address ? 'Connect wallet' : !borrowAddress ? 'Input borrow adress' : !borrowAmount ? 'Input borrow amount' : actionText}</button>
        </div>
      </div> : ''}


    </div >
  )
}

export default Home