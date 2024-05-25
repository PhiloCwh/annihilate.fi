/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-02 22:05:01
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-23 21:54:53
 * @FilePath: /TheLastOneGame/pages/winner.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useContracts } from '@/hooks/useContract';
import { useAccount, useNetwork } from 'wagmi'
import ammDataABI from 'Abi/ammData.json'
import ammABI from 'Abi/amm.json'
import { Input, Modal } from 'antd';
import styles from '@/assets/styles/pool.module.css'
import toast from 'react-hot-toast'
import { convertToWei, weiToEth } from '@/assets/utils'
import Link from 'next/link';

const pool = () => {
    const { address } = useAccount()
    const [isDisabled, setIsDisabled] = useState(true)
    const [amountIn, setamountIn] = useState(0)
    const [amountOut, setOutAmount] = useState(0)

    const [TokenInAddress, setTokenInAddress] = useState('')
    const [TokenInName, setTokenInName] = useState('')
    const [TokenOutAddress, setTokenOutAddress] = useState('')
    const [showAction, setShowAction] = useState(false)
    const tabs = [{ index: 0, name: 'Borrow' }, { index: 1, name: 'Vault' }]
    const [currentTab, setCurrentTab] = useState(0)
    const [actionText, setActionText] = useState('Borrow')

    const [borrowAddress, setBorrowAddress] = useState('')
    const [borrowAmount, setBorrowAmount] = useState('')

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
    const ammContract = useContracts('0xEEf3f68A1C56b4B923Ee2a163198641445055446', ammABI)

    const getData = async () => {
        console.log(TokenInAddress, TokenOutAddress);
        let res = await ammContract.getLpInfo(TokenInAddress, TokenOutAddress).catch(e => {
            console.log(e);
            toast.error('liquidity not found!')
            setShowAction(false)
            setTokenInReserve(0)
            setTokenOutReserve(0)
            setTokenInBorrowed(0)
            setTokenOutBorrowed(0)
            setTokenInBorrowedRate(0)
            setTokenOutBorrowedRate(0)
            setLpTokenInApr(0)
            setLpTokenOutApr(0)
            setBorrowederTokenInApr(0)
            setBorrowederTokenOutApr(0)
        })
        if (res) {
            setShowAction(true)
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

    const action = async () => {
        if (!borrowAddress || !borrowAmount || !TokenInAdress || !TokenOutAdress) {
            return
        }
        if (currentTab == 0) {
            await ammContract.borrowToken(TokenInAdress, TokenOutAdress, borrowAddress, borrowAmount).then(res => {
                toast.success('Successfully!')
                getData()
            }).catch(e => {
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
                <div className={styles.formOutItem} >
                    <div className={styles.title}>Search Liquidity
                    </div>
                    <Link href={`/pool/createPair`} style={{ width: '40%' }}>
                        <button className={styles.create}>Create a pair</button>
                    </Link>
                </div>

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
                {showAction ?
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
                    </div> :
                    <div className={styles.cardContent}>liquidity not found!<Link href={`/pool/createPair`} style={{ width: '40%' }}>
                        <span className={styles.btnText}>Create a pair</span>
                    </Link></div>}
            </div>
        </div >
    )
}

export default pool